import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { db as prisma } from '@/lib/db';

// Token verification helper
async function verifyToken(token: string): Promise<{ id: string; email: string; name?: string } | null> {
  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return {
      id: session.userId,
      email: session.user.email,
      name: session.user.name || undefined,
    };
  } catch {
    return null;
  }
}

export interface UserPresenceData {
  userId: string;
  userName: string;
  mindMapId: string;
  cursorX?: number;
  cursorY?: number;
  color: string;
}

export interface NodeLockData {
  nodeId: string;
  userId: string;
  userName: string;
  mindMapId: string;
}

export interface NodeEditData {
  nodeId: string;
  mindMapId: string;
  updates: {
    title?: string;
    content?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    color?: string;
    shape?: string;
    isCollapsed?: boolean;
  };
  userId: string;
  userName: string;
}

let io: SocketIOServer | null = null;

export function initializeWebSocket(server: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket',
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const user = await verifyToken(token);
      if (!user) {
        return next(new Error('Invalid token'));
      }

      socket.data.userId = user.id;
      socket.data.userName = user.name || user.email;
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.data.userId);

    // Join a mind map room
    socket.on('join-map', async ({ mindMapId }: { mindMapId: string }) => {
      try {
        // Verify user has access to this mind map
        const mindMap = await prisma.mindMap.findFirst({
          where: {
            id: mindMapId,
            workspace: {
              members: {
                some: {
                  userId: socket.data.userId,
                },
              },
            },
          },
        });

        if (!mindMap) {
          socket.emit('error', { message: 'Access denied to this mind map' });
          return;
        }

        socket.join(`map:${mindMapId}`);
        
        // Update or create user presence
        const userColor = generateUserColor(socket.data.userId);
        await prisma.userPresence.upsert({
          where: {
            userId_mindMapId: {
              userId: socket.data.userId,
              mindMapId,
            },
          },
          create: {
            userId: socket.data.userId,
            mindMapId,
            userName: socket.data.userName,
            color: userColor,
          },
          update: {
            userName: socket.data.userName,
            lastSeenAt: new Date(),
          },
        });

        // Notify other users in the room
        const presence: UserPresenceData = {
          userId: socket.data.userId,
          userName: socket.data.userName,
          mindMapId,
          color: userColor,
        };

        socket.to(`map:${mindMapId}`).emit('user-joined', presence);

        // Send current presence list to new user
        const allPresence = await prisma.userPresence.findMany({
          where: {
            mindMapId,
            lastSeenAt: {
              gte: new Date(Date.now() - 5 * 60 * 1000), // Active in last 5 minutes
            },
          },
        });

        socket.emit('presence-list', allPresence);
      } catch (error) {
        console.error('Error joining map:', error);
        socket.emit('error', { message: 'Failed to join map' });
      }
    });

    // Leave a mind map room
    socket.on('leave-map', async ({ mindMapId }: { mindMapId: string }) => {
      socket.leave(`map:${mindMapId}`);
      
      socket.to(`map:${mindMapId}`).emit('user-left', {
        userId: socket.data.userId,
        mindMapId,
      });
    });

    // Update cursor position
    socket.on('cursor-move', async ({ mindMapId, cursorX, cursorY }: { mindMapId: string; cursorX: number; cursorY: number }) => {
      try {
        await prisma.userPresence.update({
          where: {
            userId_mindMapId: {
              userId: socket.data.userId,
              mindMapId,
            },
          },
          data: {
            cursorX,
            cursorY,
            lastSeenAt: new Date(),
          },
        });

        socket.to(`map:${mindMapId}`).emit('cursor-moved', {
          userId: socket.data.userId,
          userName: socket.data.userName,
          cursorX,
          cursorY,
        });
      } catch (error) {
        console.error('Error updating cursor:', error);
      }
    });

    // Lock a node for editing
    socket.on('lock-node', async ({ mindMapId, nodeId }: { mindMapId: string; nodeId: string }) => {
      try {
        // Check if node is already locked
        const node = await prisma.mapNode.findUnique({
          where: { id: nodeId },
          select: { lockedBy: true, lockedAt: true },
        });

        if (node?.lockedBy && node.lockedBy !== socket.data.userId) {
          // Check if lock is stale (older than 5 minutes)
          const lockAge = node.lockedAt ? Date.now() - node.lockedAt.getTime() : 0;
          if (lockAge < 5 * 60 * 1000) {
            socket.emit('lock-failed', { nodeId, message: 'Node is locked by another user' });
            return;
          }
        }

        // Lock the node
        await prisma.mapNode.update({
          where: { id: nodeId },
          data: {
            lockedBy: socket.data.userId,
            lockedAt: new Date(),
          },
        });

        const lockData: NodeLockData = {
          nodeId,
          userId: socket.data.userId,
          userName: socket.data.userName,
          mindMapId,
        };

        socket.emit('lock-acquired', lockData);
        socket.to(`map:${mindMapId}`).emit('node-locked', lockData);
      } catch (error) {
        console.error('Error locking node:', error);
        socket.emit('lock-failed', { nodeId, message: 'Failed to lock node' });
      }
    });

    // Unlock a node
    socket.on('unlock-node', async ({ mindMapId, nodeId }: { mindMapId: string; nodeId: string }) => {
      try {
        await prisma.mapNode.update({
          where: { id: nodeId },
          data: {
            lockedBy: null,
            lockedAt: null,
          },
        });

        socket.to(`map:${mindMapId}`).emit('node-unlocked', {
          nodeId,
          userId: socket.data.userId,
          mindMapId,
        });
      } catch (error) {
        console.error('Error unlocking node:', error);
      }
    });

    // Edit a node (broadcast to others)
    socket.on('edit-node', async ({ mindMapId, nodeId, updates }: { mindMapId: string; nodeId: string; updates: NodeEditData['updates'] }) => {
      try {
        // Verify lock
        const node = await prisma.mapNode.findUnique({
          where: { id: nodeId },
          select: { lockedBy: true },
        });

        if (node?.lockedBy && node.lockedBy !== socket.data.userId) {
          socket.emit('error', { message: 'Cannot edit locked node' });
          return;
        }

        // Update the node
        await prisma.mapNode.update({
          where: { id: nodeId },
          data: updates,
        });

        const editData: NodeEditData = {
          nodeId,
          mindMapId,
          updates,
          userId: socket.data.userId,
          userName: socket.data.userName,
        };

        // Broadcast to all users in the room (including sender for confirmation)
        io?.to(`map:${mindMapId}`).emit('node-edited', editData);
      } catch (error) {
        console.error('Error editing node:', error);
        socket.emit('error', { message: 'Failed to edit node' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.data.userId);
      
      // Unlock any nodes locked by this user
      try {
        const lockedNodes = await prisma.mapNode.findMany({
          where: {
            lockedBy: socket.data.userId,
          },
        });

        await prisma.mapNode.updateMany({
          where: {
            lockedBy: socket.data.userId,
          },
          data: {
            lockedBy: null,
            lockedAt: null,
          },
        });

        // Notify about unlocked nodes
        for (const node of lockedNodes) {
          io?.to(`map:${node.mindMapId}`).emit('node-unlocked', {
            nodeId: node.id,
            userId: socket.data.userId,
            mindMapId: node.mindMapId,
          });
        }

        // Clean up user presence (or mark as inactive)
        await prisma.userPresence.deleteMany({
          where: {
            userId: socket.data.userId,
          },
        });

      } catch (error) {
        console.error('Error cleaning up on disconnect:', error);
      }
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

// Generate a consistent color for a user based on their ID
function generateUserColor(userId: string): string {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ];

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}
