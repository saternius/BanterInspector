const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class WebSocketManager {
    constructor(server, admin) {
        this.wss = new WebSocket.Server({ server });
        this.admin = admin;
        this.connections = new Map(); // userId -> connection
        this.listeners = new Map();    // listenerId -> { userId, unsubscribe, path, event }

        this.setupConnectionHandler();
        console.log('WebSocket server initialized');
    }

    setupConnectionHandler() {
        this.wss.on('connection', (ws, req) => {
            console.log('New WebSocket connection established');

            let userId = null;
            let authenticated = false;

            // Setup ping-pong for connection health
            ws.isAlive = true;
            ws.on('pong', () => {
                ws.isAlive = true;
            });

            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message.toString());

                    // Handle authentication first
                    if (!authenticated) {
                        if (data.type === 'auth') {
                            const valid = await this.validateUser(data.userName, data.secret);
                            if (valid) {
                                authenticated = true;
                                userId = data.userName;
                                ws.userId = userId;

                                // Store connection
                                if (this.connections.has(userId)) {
                                    // Close existing connection for this user
                                    const existingWs = this.connections.get(userId);
                                    existingWs.close();
                                }
                                this.connections.set(userId, ws);

                                ws.send(JSON.stringify({
                                    type: 'authenticated',
                                    userId: userId
                                }));
                                console.log(`User ${userId} authenticated`);
                            } else {
                                ws.send(JSON.stringify({
                                    type: 'error',
                                    error: 'Invalid credentials'
                                }));
                                ws.close();
                            }
                        } else {
                            ws.send(JSON.stringify({
                                type: 'error',
                                error: 'Authentication required'
                            }));
                            ws.close();
                        }
                        return;
                    }

                    // Handle authenticated messages
                    await this.handleMessage(ws, data);

                } catch (error) {
                    console.error('Error processing message:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        error: error.message
                    }));
                }
            });

            ws.on('close', () => {
                console.log(`WebSocket connection closed for user ${userId}`);
                if (userId) {
                    this.connections.delete(userId);
                    // Clean up listeners for this user
                    this.cleanupUserListeners(userId);
                }
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });

        // Setup heartbeat interval
        setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    return ws.terminate();
                }
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000); // 30 seconds
    }

    async validateUser(userName, secret) {
        try {
            // Check if user exists in Firebase
            const userRef = this.admin.database().ref(`users/${userName}`);
            const snapshot = await userRef.once('value');
            const userData = snapshot.val();

            if (!userData || userData.secret !== secret) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error validating user:', error);
            return false;
        }
    }

    async handleMessage(ws, data) {
        const userId = ws.userId;

        switch (data.type) {
            case 'subscribe':
                await this.handleSubscribe(ws, userId, data);
                break;

            case 'unsubscribe':
                await this.handleUnsubscribe(ws, data);
                break;

            case 'ping':
                ws.send(JSON.stringify({ type: 'pong' }));
                break;

            default:
                ws.send(JSON.stringify({
                    type: 'error',
                    error: `Unknown message type: ${data.type}`
                }));
        }
    }

    async handleSubscribe(ws, userId, data) {
        const { path, event, listenerId } = data;

        // Validate path access
        if (!this.validatePathAccess(userId, path)) {
            ws.send(JSON.stringify({
                type: 'error',
                error: 'Access denied to path',
                listenerId
            }));
            return;
        }

        // Set up Firebase listener
        const firebaseRef = this.admin.database().ref(path);

        let unsubscribe;
        switch (event) {
            case 'value':
                unsubscribe = firebaseRef.on('value', (snapshot) => {
                    this.sendEvent(ws, listenerId, 'value', snapshot);
                });
                break;

            case 'child_added':
                unsubscribe = firebaseRef.on('child_added', (snapshot) => {
                    this.sendEvent(ws, listenerId, 'child_added', snapshot);
                });
                break;

            case 'child_changed':
                unsubscribe = firebaseRef.on('child_changed', (snapshot) => {
                    this.sendEvent(ws, listenerId, 'child_changed', snapshot);
                });
                break;

            case 'child_removed':
                unsubscribe = firebaseRef.on('child_removed', (snapshot) => {
                    this.sendEvent(ws, listenerId, 'child_removed', snapshot);
                });
                break;

            default:
                ws.send(JSON.stringify({
                    type: 'error',
                    error: `Unknown event type: ${event}`,
                    listenerId
                }));
                return;
        }

        // Store listener info for cleanup
        this.listeners.set(listenerId, {
            userId,
            firebaseRef,
            event,
            path
        });

        // Send subscription confirmation
        ws.send(JSON.stringify({
            type: 'subscribed',
            listenerId,
            path,
            event
        }));

        console.log(`User ${userId} subscribed to ${path} with event ${event}`);
    }

    async handleUnsubscribe(ws, data) {
        const { listenerId } = data;

        const listenerInfo = this.listeners.get(listenerId);
        if (listenerInfo) {
            const { firebaseRef, event } = listenerInfo;

            // Remove Firebase listener
            firebaseRef.off(event);

            // Remove from our tracking
            this.listeners.delete(listenerId);

            ws.send(JSON.stringify({
                type: 'unsubscribed',
                listenerId
            }));

            console.log(`Unsubscribed listener ${listenerId}`);
        }
    }

    validatePathAccess(userId, path) {
        // Ensure users can only access their own inventory paths
        if (path.startsWith('inventory/')) {
            const pathParts = path.split('/');
            const pathUser = pathParts[1];
            return pathUser === userId;
        }

        // Add other path validation rules as needed
        return true;
    }

    sendEvent(ws, listenerId, eventType, snapshot) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'event',
                listenerId,
                event: eventType,
                data: snapshot.val(),
                key: snapshot.key
            }));
        }
    }

    cleanupUserListeners(userId) {
        // Remove all listeners for a disconnected user
        for (const [listenerId, listenerInfo] of this.listeners.entries()) {
            if (listenerInfo.userId === userId) {
                const { firebaseRef, event } = listenerInfo;
                firebaseRef.off(event);
                this.listeners.delete(listenerId);
            }
        }
        console.log(`Cleaned up listeners for user ${userId}`);
    }

    // Broadcast to all connected clients (optional, for future use)
    broadcast(message) {
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }

    // Send message to specific user
    sendToUser(userId, message) {
        const ws = this.connections.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
            return true;
        }
        return false;
    }
}

module.exports = WebSocketManager;