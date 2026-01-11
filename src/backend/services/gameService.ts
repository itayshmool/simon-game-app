/**
 * Game Service
 * 
 * Central manager for all game rooms and player state.
 * This is the core of the multiplayer platform infrastructure.
 * 
 * 100% REUSABLE - Do not add game-specific logic here.
 * 
 * PERSISTENCE: Rooms are saved to disk to survive server restarts.
 * Set DATA_DIR env var to a persistent disk path for full persistence.
 */

import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import type { 
  GameRoom, 
  Player, 
  PlayerInfo, 
  RoomStatus,
} from '@shared/types';
import { PLATFORM_CONSTANTS } from '@shared/types';
import { generateGameCode } from '../utils/gameCode';

// =============================================================================
// PERSISTENCE CONFIG
// =============================================================================

// Use DATA_DIR env var for persistent disk, fallback to /tmp (survives restarts, not deploys)
const DATA_DIR = process.env.DATA_DIR || '/tmp';
const ROOMS_FILE = path.join(DATA_DIR, 'simon-rooms.json');

// Debounce save to avoid excessive disk writes
let saveTimeout: NodeJS.Timeout | null = null;
const SAVE_DEBOUNCE_MS = 500;

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class GameService {
  private rooms: Map<string, GameRoom> = new Map();
  
  constructor() {
    this.loadFromDisk();
  }

  // ===========================================================================
  // PERSISTENCE
  // ===========================================================================

  /**
   * Load rooms from disk on startup
   */
  private loadFromDisk(): void {
    try {
      if (fs.existsSync(ROOMS_FILE)) {
        const data = fs.readFileSync(ROOMS_FILE, 'utf-8');
        const roomsArray: GameRoom[] = JSON.parse(data);
        
        // Convert dates back from strings
        for (const room of roomsArray) {
          room.createdAt = new Date(room.createdAt);
          for (const player of room.players) {
            player.lastActivity = new Date(player.lastActivity);
            // Reset connection state on server restart
            player.connected = false;
            player.socketId = null;
          }
          this.rooms.set(room.gameCode, room);
        }
        
        console.log(`📂 Loaded ${roomsArray.length} rooms from disk`);
      } else {
        console.log('📂 No rooms file found, starting fresh');
      }
    } catch (error) {
      console.error('❌ Failed to load rooms from disk:', error);
    }
  }

  /**
   * Save rooms to disk (debounced)
   */
  private saveToDisk(): void {
    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    // Debounce saves
    saveTimeout = setTimeout(() => {
      try {
        const roomsArray = Array.from(this.rooms.values());
        fs.writeFileSync(ROOMS_FILE, JSON.stringify(roomsArray, null, 2));
        console.log(`💾 Saved ${roomsArray.length} rooms to disk`);
      } catch (error) {
        console.error('❌ Failed to save rooms to disk:', error);
      }
    }, SAVE_DEBOUNCE_MS);
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
    this.saveToDisk();
    
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
    if (result) this.saveToDisk();
    return result;
  }

  /**
   * Update room status
   */
  updateRoomStatus(gameCode: string, status: RoomStatus): GameRoom | null {
    const room = this.rooms.get(gameCode);
    if (!room) return null;
    
    room.status = status;
    this.saveToDisk();
    return room;
  }

  /**
   * Update room game state
   */
  updateGameState(gameCode: string, gameState: unknown): GameRoom | null {
    const room = this.rooms.get(gameCode);
    if (!room) return null;
    
    room.gameState = gameState;
    this.saveToDisk();
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
    this.saveToDisk();
    
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
    this.saveToDisk();

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
    this.saveToDisk();
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
    // Don't save to disk for activity updates (too frequent)
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
      this.saveToDisk();
      return true;
    }

    // If removed player was host, transfer host to next player
    if (removedPlayer.isHost && room.players.length > 0) {
      room.players[0].isHost = true;
    }

    this.saveToDisk();
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
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      this.saveToDisk();
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
    this.rooms.clear();
    this.saveToDisk();
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const gameService = new GameService();
