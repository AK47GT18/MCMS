/**
 * MCMS Real-time Client
 * Frontend WebSocket client that connects to the backend WS server,
 * authenticates, subscribes to channels, and dispatches events to listeners.
 */

class RealtimeClient {
    constructor() {
        this.ws = null;
        this.listeners = new Map();   // event -> Set<callback>
        this.channels = new Set();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 2000;
        this.heartbeatInterval = null;
        this.isAuthenticated = false;
        this.connectionId = null;
        this._intentionalClose = false;
    }

    /**
     * Connect to the WebSocket server and authenticate
     */
    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            console.log('[WS] Already connected or connecting');
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;

        try {
            this.ws = new WebSocket(wsUrl);
            this._intentionalClose = false;

            this.ws.onopen = () => {
                console.log('[WS] Connected to real-time server');
                this.reconnectAttempts = 0;
                this._authenticate();
                this._startHeartbeat();
                this._emit('connection:open');
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this._handleMessage(message);
                } catch (e) {
                    console.error('[WS] Failed to parse message:', e);
                }
            };

            this.ws.onclose = (event) => {
                console.log('[WS] Disconnected:', event.code, event.reason);
                this.isAuthenticated = false;
                this._stopHeartbeat();
                this._emit('connection:close');

                if (!this._intentionalClose) {
                    this._scheduleReconnect();
                }
            };

            this.ws.onerror = (error) => {
                console.error('[WS] Error:', error);
                this._emit('connection:error', error);
            };
        } catch (e) {
            console.error('[WS] Connection failed:', e);
            this._scheduleReconnect();
        }
    }

    /**
     * Disconnect intentionally
     */
    disconnect() {
        this._intentionalClose = true;
        this._stopHeartbeat();
        if (this.ws) {
            this.ws.close(1000, 'Client disconnecting');
            this.ws = null;
        }
        this.isAuthenticated = false;
        this.channels.clear();
    }

    /**
     * Send JWT token for authentication
     */
    _authenticate() {
        const token = localStorage.getItem('mcms_auth_token');
        if (token && this.ws?.readyState === WebSocket.OPEN) {
            this._send('authenticate', { token });
        }
    }

    /**
     * Subscribe to a channel (e.g., 'logistics', 'project:5')
     */
    subscribe(channel) {
        this.channels.add(channel);
        if (this.ws?.readyState === WebSocket.OPEN) {
            this._send('subscribe', { channel });
        }
    }

    /**
     * Unsubscribe from a channel
     */
    unsubscribe(channel) {
        this.channels.delete(channel);
        if (this.ws?.readyState === WebSocket.OPEN) {
            this._send('unsubscribe', { channel });
        }
    }

    /**
     * Register an event listener
     * @param {string} eventType - e.g. 'INVENTORY_UPDATED', 'REQUISITION_CREATED'
     * @param {Function} callback
     * @returns {Function} unsubscribe function
     */
    on(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType).add(callback);

        // Return unsubscribe function
        return () => {
            const set = this.listeners.get(eventType);
            if (set) {
                set.delete(callback);
                if (set.size === 0) this.listeners.delete(eventType);
            }
        };
    }

    /**
     * Remove all listeners for a specific event type
     */
    off(eventType) {
        this.listeners.delete(eventType);
    }

    /**
     * Internal: handle incoming messages
     */
    _handleMessage(message) {
        const { type, payload, channel } = message;

        switch (type) {
            case 'connected':
                this.connectionId = message.connectionId;
                console.log('[WS] Connection ID:', this.connectionId);
                break;

            case 'authenticated':
                this.isAuthenticated = true;
                console.log('[WS] Authenticated as', payload?.user || message.user);
                // Re-subscribe to channels after auth
                this.channels.forEach(ch => this._send('subscribe', { channel: ch }));
                this._emit('authenticated', message.user);
                break;

            case 'auth_error':
                console.warn('[WS] Authentication failed:', message.message);
                this._emit('auth_error', message);
                break;

            case 'pong':
                // Heartbeat acknowledged
                break;

            case 'subscribed':
                console.log('[WS] Subscribed to', channel || message.channel);
                break;

            default:
                // Dispatch to registered listeners
                this._emit(type, payload || message);
                break;
        }
    }

    /**
     * Emit an event to all registered listeners
     */
    _emit(eventType, data) {
        const callbacks = this.listeners.get(eventType);
        if (callbacks) {
            callbacks.forEach(cb => {
                try {
                    cb(data);
                } catch (e) {
                    console.error(`[WS] Listener error for '${eventType}':`, e);
                }
            });
        }

        // Also emit a wildcard for any global listeners
        const wildcards = this.listeners.get('*');
        if (wildcards) {
            wildcards.forEach(cb => {
                try {
                    cb({ type: eventType, data });
                } catch (e) {
                    console.error('[WS] Wildcard listener error:', e);
                }
            });
        }
    }

    /**
     * Send a message through the WebSocket
     */
    _send(type, payload) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, payload }));
        }
    }

    /**
     * Start heartbeat to keep connection alive
     */
    _startHeartbeat() {
        this._stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            this._send('ping', {});
        }, 30000); // Every 30s
    }

    _stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Reconnect with exponential backoff
     */
    _scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[WS] Max reconnect attempts reached');
            this._emit('connection:failed');
            return;
        }

        const delay = Math.min(
            this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts),
            30000
        );
        this.reconnectAttempts++;

        console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        setTimeout(() => this.connect(), delay);
    }

    /**
     * Get connection status info
     */
    getStatus() {
        return {
            connected: this.ws?.readyState === WebSocket.OPEN,
            authenticated: this.isAuthenticated,
            connectionId: this.connectionId,
            channels: Array.from(this.channels),
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

// Export singleton instance
export const realtime = new RealtimeClient();
export default realtime;
