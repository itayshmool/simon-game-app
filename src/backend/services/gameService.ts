/**
 * Game Service
 * 
 * Central manager for all game rooms and player state.
 * This is the core of the multiplayer platform infrastructure.
 * 
 * 100% REUSABLE - Do not add game-specific logic here.
 * 
 * PERSISTENCE: Rooms are saved to Redis to survive server restarts AND deploys.
 * Set REDIS_URL env var to connect to Redis (Render Key Value store).
 * Falls back to in-memory storage if Redis is not available.
 */

import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import type { 
  GameRoom, 
  Player, 
  PlayerInfo, 
  RoomStatus,
} from '@shared/types';
import { PLATFORM_CONSTANTS } from '@shared/types';
import { generateGameCode } from '../utils/gameCode';

// =============================================================================
// REDIS CONFIG
// =============================================================================

const REDIS_URL = process.env.REDIS_URL;
const ROOM_PREFIX = 'room:';
const ROOM_TTL_SECONDS = Math.floor(PLATFORM_CONSTANTS.ROOM_MAX_AGE_MS / 1000);

let redis: Redis | null = null;

if (REDIS_URL) {
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 100, 3000);
    },
  });
  
  redis.on('connect', () => {
    console.log('🔴 Redis connected');
  });
  
  redis.on('error', (err) => {
    console.error('❌ Redis error:', err.message);
  });
} else {
  console.log('⚠️ REDIS_URL not set, using in-memory storage (rooms will be lost on restart)');
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class GameService {
  private rooms: Map<string, GameRoom> = new Map();
  private initialized = false;

  // ===========================================================================
  // PERSISTENCE
  // ===========================================================================

  /**
   * Initialize - load rooms from Redis on startup
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    if (redis) {
      try {
        const keys = await redis.keys(`${ROOM_PREFIX}*`);
        for (const key of keys) {
          const data = await redis.get(key);
          if (data) {
            const room = this.deserializeRoom(data);
            if (room) {
              this.rooms.set(room.gameCode, room);
            }
          }
        }
        console.log(`📂 Loaded ${this.rooms.size} rooms from Redis`);
      } catch (error) {
        console.error('❌ Failed to load rooms from Redis:', error);
      }
    }
    
    this.initialized = true;
  }

  /**
   * Serialize room to JSON string
   */
  private serializeRoom(room: GameRoom): string {
    return JSON.stringify(room);
  }

  /**
   * Deserialize room from JSON string
   */
  private deserializeRoom(data: string): GameRoom | null {
    try {
      const room: GameRoom = JSON.parse(data);
      // Convert dates back from strings
      room.createdAt = new Date(room.createdAt);
      for (const player of room.players) {
        player.lastActivity = new Date(player.lastActivity);
        // Reset connection state on server restart
        player.connected = false;
        player.socketId = null;
      }
      return room;
    } catch {
      return null;
    }
  }

  /**
   * Save room to Redis (async, fire-and-forget)
   */
  private async saveRoom(room: GameRoom): Promise<void> {
    if (!redis) return;
    
    try {
      const key = `${ROOM_PREFIX}${room.gameCode}`;
      await redis.setex(key, ROOM_TTL_SECONDS, this.serializeRoom(room));
    } catch (error) {
      console.error('❌ Failed to save room to Redis:', error);
    }
  }

  /**
   * Delete room from Redis (async, fire-and-forget)
   */
  private async deleteRoomFromRedis(gameCode: string): Promise<void> {
    if (!redis) return;
    
    try {
      await redis.del(`${ROOM_PREFIX}${gameCode}`);
    } catch (error) {
      console.error('❌ Failed to delete room from Redis:', error);
    }
  }

  // ===========================================================================
  // ROOM MANAGEMENT
  // ===========================================================================

  /**
   * Create a new game room with the host player
   */
  createRoom(hostInfo: PlayerInfo): GameRoom {
    const existingCodes = new Set(this.rooms.keys());
    const gameCode = generateGameCode(existingCodes);
    
    const host: Player = {
      id: uuidv4(),
      displayName: hostInfo.displayName,
      avatarId: hostInfo.avatarId,
      isHost: true,
      socketId: null,
      connected: false,
      lastActivity: new Date(),
    };

    const room: GameRoom = {
      gameCode,
      players: [host],
      status: 'waiting',
      createdAt: new Date(),
      gameState: null,
    };

    this.rooms.set(gameCode, room);
    this.saveRoom(room);
    
    return room;
  }

  /**
   * Get a room by game code
   */
  getRoom(gameCode: string): GameRoom | null {
    return this.rooms.get(gameCode) ?? null;
  }

  /**
   * Get all rooms (for debugging/admin)
   */
  getAllRooms(): GameRoom[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Delete a room
   */
  deleteRoom(gameCode: string): boolean {
    const result = this.rooms.delete(gameCode);
    if (result) this.deleteRoomFromRedis(gameCode);
    return result;
  }

  /**
   * Update room status
   */
  updateRoomStatus(gameCode: string, status: RoomStatus): GameRoom | null {
    const room = this.rooms.get(gameCode);
    if (!room) return null;
    
    room.status = status;
    this.saveRoom(room);
    return room;
  }

  /**
   * Update room game state
   */
  updateGameState(gameCode: string, gameState: unknown): GameRoom | null {
    const room = this.rooms.get(gameCode);
    if (!room) return null;
    
    room.gameState = gameState;
    this.saveRoom(room);
    return room;
  }

  // ===========================================================================
  // PLAYER MANAGEMENT
  // ===========================================================================

  /**
   * Add a player to a room
   */
  joinRoom(gameCode: string, playerInfo: PlayerInfo): GameRoom {
    const room = this.rooms.get(gameCode);
    
    if (!room) {
      throw new Error('Room not found');
    }
    
    if (room.status !== 'waiting') {
      throw new Error('Game already in progress');
    }
    
    if (room.players.length >= PLATFORM_CONSTANTS.MAX_PLAYERS) {
      throw new Error('Room is full');
    }

    const player: Player = {
      id: uuidv4(),
      displayName: playerInfo.displayName,
      avatarId: playerInfo.avatarId,
      isHost: false,
      socketId: null,
      connected: false,
      lastActivity: new Date(),
    };

    room.players.push(player);
    this.saveRoom(room);
    
    return room;
  }

  /**
   * Get a player from a room
   */
  getPlayer(gameCode: string, playerId: string): Player | null {
    const room = this.rooms.get(gameCode);
    if (!room) return null;
    
    return room.players.find(p => p.id === playerId) ?? null;
  }

  /**
   * Update a player's socket ID (for connection/reconnection)
   */
  updateSocketId(
    gameCode: string, 
    playerId: string, 
    socketId: string
  ): GameRoom | null {
    const room = this.rooms.get(gameCode);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;

    player.socketId = socketId;
    player.connected = true;
    player.lastActivity = new Date();
    this.saveRoom(room);

    return room;
  }

  /**
   * Mark a player as disconnected
   */
  markPlayerDisconnected(gameCode: string, playerId: string): void {
    const room = this.rooms.get(gameCode);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    player.connected = false;
    player.socketId = null;
    this.saveRoom(room);
  }

  /**
   * Remove a player if still disconnected
   */
  removeIfStillDisconnected(gameCode: string, playerId: string): boolean {
    const room = this.rooms.get(gameCode);
    if (!room) return false;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return false;

    // Only remove if still disconnected
    if (!player.connected) {
      return this.removePlayer(gameCode, playerId);
    }

    return false;
  }

  /**
   * Update player's last activity timestamp
   */
  updatePlayerActivity(gameCode: string, playerId: string): void {
    const room = this.rooms.get(gameCode);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    player.lastActivity = new Date();
    // Don't save to Redis for activity updates (too frequent)
  }

  /**
   * Remove a player from a room
   * Returns true if player was removed
   */
  removePlayer(gameCode: string, playerId: string): boolean {
    const room = this.rooms.get(gameCode);
    if (!room) return false;

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return false;

    const removedPlayer = room.players[playerIndex];
    room.players.splice(playerIndex, 1);

    // If room is empty, delete it
    if (room.players.length === 0) {
      this.rooms.delete(gameCode);
      this.deleteRoomFromRedis(gameCode);
      return true;
    }

    // If removed player was host, transfer host to next player
    if (removedPlayer.isHost && room.players.length > 0) {
      room.players[0].isHost = true;
    }

    this.saveRoom(room);
    return true;
  }

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  /**
   * Clean up dead/abandoned rooms
   */
  cleanupDeadRooms(): number {
    const now = new Date();
    let cleaned = 0;

    for (const [gameCode, room] of this.rooms.entries()) {
      // Remove rooms older than max age
      const roomAge = now.getTime() - room.createdAt.getTime();
      if (roomAge > PLATFORM_CONSTANTS.ROOM_MAX_AGE_MS) {
        this.rooms.delete(gameCode);
        this.deleteRoomFromRedis(gameCode);
        cleaned++;
        continue;
      }

      // Remove rooms where all players are disconnected
      const allDisconnected = room.players.every(p => !p.connected);
      if (allDisconnected && room.players.length > 0) {
        // Check if any player has been disconnected for too long
        const oldestActivity = Math.min(
          ...room.players.map(p => p.lastActivity.getTime())
        );
        const disconnectAge = now.getTime() - oldestActivity;
        
        if (disconnectAge > PLATFORM_CONSTANTS.DISCONNECT_GRACE_MS) {
          this.rooms.delete(gameCode);
          this.deleteRoomFromRedis(gameCode);
          cleaned++;
        }
      }
    }

    return cleaned;
  }

  /**
   * Get count of active rooms
   */
  getRoomCount(): number {
    return this.rooms.size;
  }

  /**
   * Clear all rooms (for testing)
   */
  clearAllRooms(): void {
    // Delete all from Redis
    for (const gameCode of this.rooms.keys()) {
      this.deleteRoomFromRedis(gameCode);
    }
    this.rooms.clear();
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const gameService = new GameService();

// Initialize on import (load rooms from Redis)
gameService.initialize().catch(console.error);
