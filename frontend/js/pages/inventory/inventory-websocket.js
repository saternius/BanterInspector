/**
 * WebSocket adapter for Firebase real-time listeners
 * Provides a Firebase-like interface over WebSocket connection
 */
export class InventoryWebSocket {
    constructor(config = {}) {
        this.url = config.url || this._getWebSocketUrl();
        this.ws = null;
        this.listeners = new Map(); // listenerId -> { path, event, callback }
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = config.maxReconnectAttempts || 5;
        this.reconnectDelay = config.reconnectDelay || 1000;
        this.messageQueue = [];
        this.authenticated = false;
        this.userName = config.userName;
        this.secret = config.secret;
        this.debug = config.debug || false;

        // Event callbacks
        this.onConnect = config.onConnect || null;
        this.onDisconnect = config.onDisconnect || null;
        this.onError = config.onError || null;
    }

    _getWebSocketUrl() {
        // Auto-detect environment
        const isLocalhost = window.location.hostname === 'localhost' ||
                           window.location.hostname === '127.0.0.1';

        if (isLocalhost) {
            // Development environment - use local auth server
            return 'ws://localhost:3303';
        } else {
            // Production environment - use auth.tippy.dev with secure WebSocket
            return 'wss://auth.tippy.dev';
        }
    }

    connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.url);
                this.setupEventHandlers(resolve, reject);
            } catch (error) {
                console.error('Failed to create WebSocket:', error);
                reject(error);
            }
        });
    }

    setupEventHandlers(connectResolve, connectReject) {
        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;

            // Authenticate immediately
            if (this.userName && this.secret) {
                this.authenticate(this.userName, this.secret)
                    .then(() => {
                        // Process any queued messages
                        this.processMessageQueue();

                        // Re-establish listeners after reconnection
                        this.reestablishListeners();

                        if (this.onConnect) {
                            this.onConnect();
                        }

                        if (connectResolve) {
                            connectResolve();
                        }
                    })
                    .catch((error) => {
                        console.error('Authentication failed:', error);
                        if (connectReject) {
                            connectReject(error);
                        }
                    });
            } else {
                console.warn('No credentials provided for WebSocket authentication');
                if (connectReject) {
                    connectReject(new Error('No credentials provided'));
                }
            }
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            if (this.onError) {
                this.onError(error);
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            this.authenticated = false;

            if (this.onDisconnect) {
                this.onDisconnect();
            }

            // Attempt to reconnect
            this.attemptReconnect();
        };
    }

    authenticate(userName, secret) {
        this.userName = userName;
        this.secret = secret;

        return new Promise((resolve, reject) => {
            const authTimeout = setTimeout(() => {
                reject(new Error('Authentication timeout'));
            }, 5000);

            // Store the resolve/reject for handling auth response
            this.pendingAuth = { resolve, reject, timeout: authTimeout };

            this.sendMessage({
                type: 'auth',
                userName: userName,
                secret: secret
            });
        });
    }

    handleMessage(message) {
        if (this.debug) {
            console.log('WebSocket message received:', message);
        }

        switch (message.type) {
            case 'authenticated':
                this.authenticated = true;
                if (this.pendingAuth) {
                    clearTimeout(this.pendingAuth.timeout);
                    this.pendingAuth.resolve();
                    this.pendingAuth = null;
                }
                break;

            case 'event':
                this.handleFirebaseEvent(message);
                break;

            case 'subscribed':
                console.log(`Subscribed to ${message.path} with event ${message.event}`);
                break;

            case 'unsubscribed':
                console.log(`Unsubscribed listener ${message.listenerId}`);
                break;

            case 'error':
                console.error('WebSocket error message:', message.error);
                if (message.error === 'Invalid credentials' && this.pendingAuth) {
                    clearTimeout(this.pendingAuth.timeout);
                    this.pendingAuth.reject(new Error(message.error));
                    this.pendingAuth = null;
                }
                break;

            case 'pong':
                // Keepalive response
                break;

            default:
                console.warn('Unknown message type:', message.type);
        }
    }

    handleFirebaseEvent(message) {
        const { listenerId, event, data, key } = message;
        const listener = this.listeners.get(listenerId);

        if (listener && listener.callback) {
            // Create a Firebase-like snapshot object
            const snapshot = {
                val: () => data,
                key: key,
                exists: () => data !== null && data !== undefined
            };

            try {
                listener.callback(snapshot);
            } catch (error) {
                console.error(`Error in listener callback for ${listenerId}:`, error);
            }
        }
    }

    /**
     * Mimics Firebase .on() interface
     * @param {string} path - The database path to listen to
     * @param {string} event - The event type (value, child_added, child_changed, child_removed)
     * @param {function} callback - The callback to invoke when the event occurs
     * @returns {string} - The listener ID for later removal
     */
    on(path, event, callback) {
        const listenerId = this.generateListenerId();

        // Store listener info
        this.listeners.set(listenerId, {
            path,
            event,
            callback
        });

        // Send subscribe message if connected
        if (this.isConnected() && this.authenticated) {
            this.sendMessage({
                type: 'subscribe',
                path,
                event,
                listenerId
            });
        } else {
            // Queue the subscription for when we're connected
            this.messageQueue.push({
                type: 'subscribe',
                path,
                event,
                listenerId
            });
        }

        return listenerId;
    }

    /**
     * Mimics Firebase .off() interface
     * @param {string} listenerId - The listener ID to remove
     */
    off(listenerId) {
        if (this.listeners.has(listenerId)) {
            // Send unsubscribe message if connected
            if (this.isConnected() && this.authenticated) {
                this.sendMessage({
                    type: 'unsubscribe',
                    listenerId
                });
            }

            // Remove from local tracking
            this.listeners.delete(listenerId);
        }
    }

    /**
     * Remove all listeners for a specific path and event
     */
    offPath(path, event = null) {
        const toRemove = [];

        for (const [listenerId, listener] of this.listeners.entries()) {
            if (listener.path === path && (!event || listener.event === event)) {
                toRemove.push(listenerId);
            }
        }

        toRemove.forEach(listenerId => this.off(listenerId));
    }

    /**
     * Remove all listeners
     */
    offAll() {
        const listenerIds = Array.from(this.listeners.keys());
        listenerIds.forEach(listenerId => this.off(listenerId));
    }

    sendMessage(message) {
        if (this.isConnected()) {
            try {
                this.ws.send(JSON.stringify(message));
                return true;
            } catch (error) {
                console.error('Error sending WebSocket message:', error);
                this.messageQueue.push(message);
                return false;
            }
        } else {
            // Queue message for later
            this.messageQueue.push(message);
            return false;
        }
    }

    processMessageQueue() {
        while (this.messageQueue.length > 0 && this.isConnected() && this.authenticated) {
            const message = this.messageQueue.shift();
            this.sendMessage(message);
        }
    }

    reestablishListeners() {
        console.log('Re-establishing listeners after reconnection');

        for (const [listenerId, listener] of this.listeners.entries()) {
            this.sendMessage({
                type: 'subscribe',
                path: listener.path,
                event: listener.event,
                listenerId
            });
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.connect().catch(error => {
                console.error('Reconnection failed:', error);
            });
        }, delay);
    }

    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    disconnect() {
        if (this.ws) {
            // Clear all listeners
            this.offAll();

            // Close WebSocket connection
            this.ws.close();
            this.ws = null;
            this.authenticated = false;
        }
    }

    generateListenerId() {
        return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Utility method to send keepalive
    ping() {
        this.sendMessage({ type: 'ping' });
    }

    // Start keepalive interval
    startKeepalive(interval = 30000) {
        this.stopKeepalive();
        this.keepaliveInterval = setInterval(() => {
            if (this.isConnected()) {
                this.ping();
            }
        }, interval);
    }

    stopKeepalive() {
        if (this.keepaliveInterval) {
            clearInterval(this.keepaliveInterval);
            this.keepaliveInterval = null;
        }
    }
}

// Export as default for convenience
export default InventoryWebSocket;