/**
 * Socket Service
 * 
 * WebSocket client singleton for real-time communication.
 * Stores listeners and re-attaches them on reconnect (critical for mobile).
 */

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

type EventCallback = (...args: any[]) => void;

class SocketService {
  private socket: Socket | null = null;
  // Store all listeners so we can re-attach them on reconnect
  private listeners: Map<string, EventCallback[]> = new Map();

  /**
   * Connect to WebSocket server
   */
  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        withCredentials: true, // CRITICAL: Send cookies with WebSocket
        transports: ['websocket', 'polling'],
        autoConnect: false,
      });

      // On connect, re-attach ALL stored listeners
      // This is critical for mobile when app goes to background and reconnects
      this.socket.on('connect', () => {
        console.log('🔌 Socket connected:', this.socket?.id);
        
        // Re-attach all stored listeners
        this.listeners.forEach((callbacks, event) => {
          callbacks.forEach(cb => {
            this.socket?.on(event, cb);
          });
        });
        console.log(`📡 Re-attached ${this.listeners.size} event listeners`);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
      });

      this.socket.on('error', (error: { message: string }) => {
        console.error('❌ Socket error:', error.message);
      });
    }

    this.socket.connect();
    return this.socket;
  }

  /**
   * Get current socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Manually trigger reconnection
   */
  reconnect(): Socket {
    console.log('🔄 Manually triggering socket reconnect');
    this.socket?.disconnect();
    return this.connect();
  }

  /**
   * Emit an event
   */
  emit(event: string, data: unknown): void {
    if (!this.socket?.connected) {
      console.warn(`⚠️ Socket not connected. Connecting before emitting ${event}`);
      this.connect();
    }
    this.socket?.emit(event, data);
  }

  /**
   * Listen to an event (stores listener for re-attachment on reconnect)
   */
  on(event: string, callback: EventCallback): void {
    // Store the listener
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    const callbacks = this.listeners.get(event)!;
    if (!callbacks.includes(callback)) {
      callbacks.push(callback);
    }

    // Also attach to current socket if connected
    // First remove to prevent duplicates, then add
    this.socket?.off(event, callback);
    this.socket?.on(event, callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: EventCallback): void {
    if (callback) {
      // Remove specific callback
      const callbacks = this.listeners.get(event) || [];
      this.listeners.set(event, callbacks.filter(cb => cb !== callback));
      this.socket?.off(event, callback);
    } else {
      // Remove all callbacks for this event
      this.listeners.delete(event);
      this.socket?.off(event);
    }
  }
}

// Export singleton instance
export const socketService = new SocketService();

// Also export individual functions for backwards compatibility
export const connect = () => socketService.connect();
export const getSocket = () => socketService.getSocket();
export const disconnect = () => socketService.disconnect();
export const emit = (event: string, data: unknown) => socketService.emit(event, data);
export const on = (event: string, callback: EventCallback) => socketService.on(event, callback);
export const off = (event: string, callback?: EventCallback) => socketService.off(event, callback);
