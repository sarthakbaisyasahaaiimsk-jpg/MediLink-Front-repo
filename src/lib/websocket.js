import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

class WebSocketClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = {};
  }

  connect() {
    if (this.connected) return;

    this.socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
      extraHeaders: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connected = true;
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.connected = false;
      this.emit('disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });

    // Attach all listeners
    Object.entries(this.listeners).forEach(([event, callbacks]) => {
      callbacks.forEach(callback => {
        this.socket.on(event, callback);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`WebSocket not connected. Cannot emit ${event}`);
    }
  }

  // ===== CONVERSATION METHODS =====
  joinConversation(conversationId) {
    this.emit('join_conversation', { conversation_id: conversationId });
  }

  leaveConversation(conversationId) {
    this.emit('leave_conversation', { conversation_id: conversationId });
  }

  // ===== TYPING INDICATOR =====
  setTyping(conversationId, isTyping = true) {
    this.emit('typing', {
      conversation_id: conversationId,
      is_typing: isTyping
    });
  }

  // ===== REACTIONS =====
  addReaction(conversationId, messageId, emoji) {
    this.emit('message_reaction', {
      conversation_id: conversationId,
      message_id: messageId,
      emoji,
      action: 'add'
    });
  }

  removeReaction(conversationId, messageId, emoji) {
    this.emit('message_reaction', {
      conversation_id: conversationId,
      message_id: messageId,
      emoji,
      action: 'remove'
    });
  }

  // ===== PINNING =====
  pinMessage(conversationId, messageId) {
    this.emit('message_pinned', {
      conversation_id: conversationId,
      message_id: messageId,
      is_pinned: true
    });
  }

  unpinMessage(conversationId, messageId) {
    this.emit('message_pinned', {
      conversation_id: conversationId,
      message_id: messageId,
      is_pinned: false
    });
  }

  // ===== READ RECEIPTS =====
  markMessageRead(conversationId, messageId) {
    this.emit('message_read', {
      conversation_id: conversationId,
      message_id: messageId
    });
  }

  // ===== QUERIES =====
  getActiveUsers(conversationId) {
    this.emit('get_active_users', { conversation_id: conversationId });
  }

  getTypingUsers(conversationId) {
    this.emit('get_typing_users', { conversation_id: conversationId });
  }
}

// Export singleton instance
export const ws = new WebSocketClient();

export default WebSocketClient;
