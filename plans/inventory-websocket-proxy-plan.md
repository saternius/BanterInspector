# Inventory WebSocket Proxy Implementation Plan

## Executive Summary

This document outlines the plan to implement WebSocket-based proxying for Firebase real-time listeners in the inventory system. This will complete the migration by routing ALL Firebase operations (both read and write) through the auth server, eliminating direct client-Firebase connections.

## Current State

- **Write operations**: ✅ Proxied through REST API
- **Read operations**: ⚠️ Still using direct Firebase listeners
- **Security concern**: Client still requires Firebase credentials for listeners

## Proposed Architecture

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │◄────────┤  Auth Server │◄────────┤   Firebase   │
│              │         │              │         │              │
│ - WebSocket  │   WS    │ - WS Server  │ Firebase│ - Database   │
│   Client     │◄────────┤ - FB Listener│◄────────┤ - Real-time  │
│              │         │   Manager    │ Listener│   Updates    │
│ - No Firebase│         │ - Auth Check │         │              │
│   SDK needed │         │ - Event Relay│         │              │
└──────────────┘         └──────────────┘         └──────────────┘
```

## Implementation Strategy: Minimal Effort Approach

### Phase 1: Core WebSocket Infrastructure (2-3 hours)

#### 1.1 Server-Side WebSocket Setup

**File: `/microservices/auth-server/websocket-manager.js`**
```javascript
const WebSocket = require('ws');

class WebSocketManager {
    constructor(server, admin) {
        this.wss = new WebSocket.Server({ server });
        this.admin = admin;
        this.connections = new Map(); // userId -> connection
        this.listeners = new Map();    // listenerId -> Firebase listener

        this.setupConnectionHandler();
    }

    setupConnectionHandler() {
        this.wss.on('connection', (ws, req) => {
            // Handle authentication
            // Setup message handlers
            // Manage Firebase listeners
        });
    }
}
```

**Required npm packages:**
```json
{
  "ws": "^8.14.0",
  "uuid": "^9.0.0"
}
```

#### 1.2 Client-Side WebSocket Adapter

**File: `/frontend/js/pages/inventory/inventory-websocket.js`**
```javascript
export class InventoryWebSocket {
    constructor(url) {
        this.url = url || this._getWebSocketUrl();
        this.ws = null;
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.messageQueue = [];
    }

    connect() {
        this.ws = new WebSocket(this.url);
        this.setupEventHandlers();
    }

    // Mimics Firebase .on() interface
    on(path, event, callback) {
        const listenerId = this.registerListener(path, event, callback);
        this.sendMessage({
            type: 'subscribe',
            path,
            event,
            listenerId
        });
        return listenerId;
    }

    // Mimics Firebase .off() interface
    off(listenerId) {
        this.sendMessage({
            type: 'unsubscribe',
            listenerId
        });
        this.listeners.delete(listenerId);
    }
}
```

### Phase 2: Message Protocol (1 hour)

#### Message Types

**Client → Server:**
```javascript
// Subscribe to path
{
    type: 'subscribe',
    path: 'inventory/userName/folderName',
    event: 'child_added|child_changed|child_removed|value',
    listenerId: 'uuid-v4',
    auth: { userName, secret }
}

// Unsubscribe
{
    type: 'unsubscribe',
    listenerId: 'uuid-v4'
}

// Keepalive
{
    type: 'ping'
}
```

**Server → Client:**
```javascript
// Firebase event
{
    type: 'event',
    listenerId: 'uuid-v4',
    event: 'child_added',
    data: { /* snapshot data */ },
    key: 'itemKey'
}

// Subscription confirmation
{
    type: 'subscribed',
    listenerId: 'uuid-v4'
}

// Error
{
    type: 'error',
    error: 'Unauthorized',
    listenerId: 'uuid-v4'
}
```

### Phase 3: Minimal Migration Path (2 hours)

#### 3.1 Adapter Pattern in inventory-firebase.js

```javascript
// Add at top of inventory-firebase.js
import { InventoryWebSocket } from './inventory-websocket.js';

class InventoryFirebase {
    constructor() {
        // Existing code...

        // Add WebSocket option
        this.useWebSocket = true; // Feature flag
        if (this.useWebSocket) {
            this.ws = new InventoryWebSocket();
            this.ws.connect();
        }
    }

    // Modified listener setup
    setupFirebaseListeners(userName, folder = null) {
        if (this.useWebSocket) {
            return this.setupWebSocketListeners(userName, folder);
        }
        // Existing Firebase listener code (for rollback)
    }

    setupWebSocketListeners(userName, folder = null) {
        const path = folder
            ? `inventory/${userName}/${folder}`
            : `inventory/${userName}`;

        // Use WebSocket with Firebase-like interface
        this.ws.on(path, 'child_added', (data) => {
            this.handleItemAdded(data);
        });

        this.ws.on(path, 'child_changed', (data) => {
            this.handleItemChanged(data);
        });

        this.ws.on(path, 'child_removed', (data) => {
            this.handleItemRemoved(data);
        });
    }
}
```

### Phase 4: Authentication & Security (1 hour)

#### 4.1 WebSocket Authentication

```javascript
// Server-side connection handler
wss.on('connection', async (ws, req) => {
    // Parse auth from query params or first message
    let authenticated = false;

    ws.on('message', async (message) => {
        const data = JSON.parse(message);

        if (!authenticated) {
            // First message must be auth
            if (data.type === 'auth') {
                const valid = await validateUser(data.userName, data.secret);
                if (valid) {
                    authenticated = true;
                    ws.userId = data.userName;
                    ws.send(JSON.stringify({ type: 'authenticated' }));
                } else {
                    ws.send(JSON.stringify({ type: 'error', error: 'Invalid credentials' }));
                    ws.close();
                }
            } else {
                ws.close();
            }
            return;
        }

        // Handle other messages only if authenticated
        handleMessage(ws, data);
    });
});
```

## Implementation Steps

### Step 1: Install Dependencies (5 min)
```bash
cd /microservices/auth-server
npm install ws uuid
```

### Step 2: Create WebSocket Manager (30 min)
- Create `websocket-manager.js`
- Implement connection handling
- Add Firebase listener management

### Step 3: Update Auth Server (15 min)
- Import WebSocket manager
- Initialize with HTTP server
- Add WebSocket routes

### Step 4: Create Client Adapter (30 min)
- Create `inventory-websocket.js`
- Implement connection management
- Add reconnection logic

### Step 5: Update inventory-firebase.js (30 min)
- Add WebSocket adapter
- Implement fallback logic
- Maintain backward compatibility

### Step 6: Test Implementation (30 min)
- Test real-time updates
- Verify authentication
- Test reconnection

## Minimal Effort Optimizations

### 1. Reuse Existing Code
- Keep current listener callback handlers
- Maintain same data structures
- Use adapter pattern for easy rollback

### 2. Progressive Enhancement
- Start with feature flag for easy toggle
- Keep Firebase SDK as fallback initially
- Gradual rollout per user/feature

### 3. Simple Protocol
- JSON messages (no binary protocol)
- Direct event mapping from Firebase
- Minimal transformation logic

## Performance Considerations

### Connection Management
```javascript
// Share WebSocket connections per user
const connectionPool = new Map();

function getConnection(userId) {
    if (!connectionPool.has(userId)) {
        connectionPool.set(userId, new WebSocket(...));
    }
    return connectionPool.get(userId);
}
```

### Event Batching
```javascript
// Batch multiple events in single message
const eventBuffer = [];
const BATCH_INTERVAL = 50; // ms

setInterval(() => {
    if (eventBuffer.length > 0) {
        ws.send(JSON.stringify({
            type: 'batch',
            events: eventBuffer
        }));
        eventBuffer.length = 0;
    }
}, BATCH_INTERVAL);
```

## Rollback Strategy

### Feature Flags
```javascript
const config = {
    useWebSocketProxy: false, // Easy toggle
    webSocketUrl: process.env.WS_URL || 'ws://localhost:3303',
    fallbackToFirebase: true  // Auto-fallback on error
};
```

### Graceful Degradation
```javascript
async function setupListeners() {
    try {
        if (config.useWebSocketProxy) {
            await setupWebSocketListeners();
        } else {
            await setupFirebaseListeners();
        }
    } catch (error) {
        if (config.fallbackToFirebase) {
            console.warn('WebSocket failed, falling back to Firebase');
            await setupFirebaseListeners();
        }
    }
}
```

## Testing Plan

### Unit Tests
- [ ] WebSocket connection establishment
- [ ] Authentication flow
- [ ] Message parsing and routing
- [ ] Listener registration/deregistration
- [ ] Reconnection logic

### Integration Tests
- [ ] Real-time data synchronization
- [ ] Multiple concurrent listeners
- [ ] User isolation (no data leakage)
- [ ] Performance under load
- [ ] Network interruption recovery

### Manual Tests
- [ ] Open multiple browser tabs
- [ ] Verify real-time updates
- [ ] Test with network throttling
- [ ] Verify memory usage
- [ ] Test cleanup on disconnect

## Security Considerations

1. **Authentication**: Validate user credentials on connection
2. **Authorization**: Check user access for each path subscription
3. **Rate Limiting**: Limit subscriptions per connection
4. **Path Validation**: Sanitize and validate Firebase paths
5. **Message Size**: Limit message size to prevent DoS
6. **Connection Limits**: Max connections per user

## Estimated Timeline

| Task | Time | Priority |
|------|------|----------|
| Core WebSocket setup | 2-3 hours | High |
| Client adapter | 1 hour | High |
| Integration with inventory | 1 hour | High |
| Authentication | 1 hour | High |
| Testing | 1 hour | High |
| Documentation | 30 min | Medium |
| **Total** | **6.5-7.5 hours** | - |

## Advantages of This Approach

1. **Minimal Changes**: Adapter pattern means minimal changes to existing code
2. **Easy Rollback**: Feature flags allow instant rollback
3. **Incremental**: Can be rolled out gradually
4. **Familiar Interface**: Maintains Firebase-like API
5. **Reusable**: WebSocket manager can be used for other real-time features

## Future Enhancements (Phase 2)

1. **Binary Protocol**: Use MessagePack for smaller payloads
2. **Compression**: Enable WebSocket compression
3. **Caching**: Server-side caching of frequently accessed data
4. **GraphQL Subscriptions**: Migrate to GraphQL subscriptions
5. **Horizontal Scaling**: Redis pub/sub for multi-server setup

## Conclusion

This WebSocket implementation provides a minimal-effort path to complete the Firebase proxy migration. By using an adapter pattern and maintaining Firebase-like interfaces, we can achieve full proxying with approximately 6-7 hours of implementation time. The approach prioritizes simplicity, maintainability, and easy rollback while providing a foundation for future enhancements.

## Next Steps

1. Review and approve this plan
2. Install WebSocket dependencies
3. Implement server-side WebSocket manager
4. Create client-side adapter
5. Test with a single listener type
6. Gradually migrate all listeners
7. Remove Firebase SDK dependency

---

**Document Version:** 1.0
**Created:** November 4, 2025
**Status:** 📋 Planning Phase
**Estimated Effort:** 6-7 hours