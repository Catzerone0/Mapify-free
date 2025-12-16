# WebSocket Setup for Real-time Collaboration

## Overview

This application uses Socket.io for real-time collaborative editing. Due to Next.js App Router limitations, WebSocket support requires a custom server setup.

## Setup Options

### Option 1: Custom Next.js Server (Recommended for Production)

Create a custom server file `server.js` in the project root:

```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { initializeWebSocket } = require('./lib/websocket/socket-server');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize WebSocket server
  initializeWebSocket(server);

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server initialized`);
  });
});
```

Update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "NODE_ENV=production node server.js"
  }
}
```

### Option 2: Separate WebSocket Server (Development)

Run a separate Socket.io server on a different port:

```javascript
// ws-server.js
const { createServer } = require('http');
const { initializeWebSocket } = require('./lib/websocket/socket-server');

const server = createServer();
initializeWebSocket(server);

const port = process.env.WS_PORT || 3001;
server.listen(port, () => {
  console.log(`WebSocket server running on port ${port}`);
});
```

Update client connection in `lib/websocket/use-socket.ts`:

```typescript
const socket = io('http://localhost:3001', {
  path: '/socket.io',
  auth: { token },
});
```

## Features

### Real-time Collaboration
- **Presence Indicators**: See who else is viewing the mind map
- **Live Cursors**: See where other users are pointing
- **Node Locking**: Prevent concurrent edits to the same node
- **Real-time Updates**: See changes as they happen

### Events

#### Client → Server
- `join-map`: Join a mind map room
- `leave-map`: Leave a mind map room
- `cursor-move`: Update cursor position
- `lock-node`: Lock a node for editing
- `unlock-node`: Unlock a node
- `edit-node`: Broadcast node changes

#### Server → Client
- `user-joined`: New user joined the room
- `user-left`: User left the room
- `presence-list`: List of active users
- `cursor-moved`: User cursor moved
- `node-locked`: Node locked by user
- `node-unlocked`: Node unlocked
- `node-edited`: Node updated by user

## Database Schema

The following models support collaboration:

```prisma
model MapNode {
  lockedBy    String?
  lockedAt    DateTime?
}

model UserPresence {
  userId      String
  mindMapId   String
  userName    String
  cursorX     Float?
  cursorY     Float?
  color       String
  lastSeenAt  DateTime
}
```

## Security

- Authentication required via JWT token
- User permissions verified before joining map rooms
- Automatic node unlocking on disconnect
- Stale lock cleanup (5-minute timeout)

## Troubleshooting

### WebSocket Connection Issues
1. Ensure the server is running with WebSocket support
2. Check CORS configuration in `socket-server.ts`
3. Verify token is valid and not expired

### Presence Not Showing
1. Check database connection
2. Verify UserPresence table exists
3. Check browser console for errors

### Node Locking Issues
1. Verify MapNode schema has `lockedBy` and `lockedAt` fields
2. Run database migration
3. Check for stale locks (> 5 minutes old)
