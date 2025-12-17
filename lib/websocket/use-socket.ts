'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { UserPresenceData, NodeLockData, NodeEditData } from './socket-server';

interface UseSocketOptions {
  mindMapId: string;
  token: string;
  onUserJoined?: (presence: UserPresenceData) => void;
  onUserLeft?: (data: { userId: string; mindMapId: string }) => void;
  onCursorMoved?: (data: { userId: string; userName: string; cursorX: number; cursorY: number }) => void;
  onNodeLocked?: (data: NodeLockData) => void;
  onNodeUnlocked?: (data: { nodeId: string; userId: string; mindMapId: string }) => void;
  onNodeEdited?: (data: NodeEditData) => void;
  onPresenceList?: (presenceList: UserPresenceData[]) => void;
}

export function useSocket(options: UseSocketOptions) {
  const {
    mindMapId,
    token,
    onUserJoined,
    onUserLeft,
    onCursorMoved,
    onNodeLocked,
    onNodeUnlocked,
    onNodeEdited,
    onPresenceList,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [presenceList, setPresenceList] = useState<UserPresenceData[]>([]);

  useEffect(() => {
    if (!token || !mindMapId) return;

    // Initialize socket connection
    const socket = io({
      path: '/api/socket',
      auth: {
        token,
      },
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      socket.emit('join-map', { mindMapId });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error.message);
    });

    socket.on('user-joined', (presence: UserPresenceData) => {
      setPresenceList((prev) => [...prev, presence]);
      onUserJoined?.(presence);
    });

    socket.on('user-left', (data: { userId: string; mindMapId: string }) => {
      setPresenceList((prev) => prev.filter((p) => p.userId !== data.userId));
      onUserLeft?.(data);
    });

    socket.on('presence-list', (list: UserPresenceData[]) => {
      setPresenceList(list);
      onPresenceList?.(list);
    });

    socket.on('cursor-moved', (data: { userId: string; userName: string; cursorX: number; cursorY: number }) => {
      onCursorMoved?.(data);
    });

    socket.on('node-locked', (data: NodeLockData) => {
      onNodeLocked?.(data);
    });

    socket.on('node-unlocked', (data: { nodeId: string; userId: string; mindMapId: string }) => {
      onNodeUnlocked?.(data);
    });

    socket.on('node-edited', (data: NodeEditData) => {
      onNodeEdited?.(data);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.emit('leave-map', { mindMapId });
        socket.disconnect();
      }
    };
  }, [mindMapId, token, onUserJoined, onUserLeft, onCursorMoved, onNodeLocked, onNodeUnlocked, onNodeEdited, onPresenceList]);

  const moveCursor = useCallback((cursorX: number, cursorY: number) => {
    socketRef.current?.emit('cursor-move', { mindMapId, cursorX, cursorY });
  }, [mindMapId]);

  const lockNode = useCallback((nodeId: string) => {
    socketRef.current?.emit('lock-node', { mindMapId, nodeId });
  }, [mindMapId]);

  const unlockNode = useCallback((nodeId: string) => {
    socketRef.current?.emit('unlock-node', { mindMapId, nodeId });
  }, [mindMapId]);

  const editNode = useCallback((nodeId: string, updates: NodeEditData['updates']) => {
    socketRef.current?.emit('edit-node', { mindMapId, nodeId, updates });
  }, [mindMapId]);

  return {
    isConnected,
    presenceList,
    moveCursor,
    lockNode,
    unlockNode,
    editNode,
  };
}
