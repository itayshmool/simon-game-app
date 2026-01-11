/**
 * WebSocket Game Handler Tests
 * 
 * TDD tests for real-time player sync functionality.
 * Tests the critical join flow and room state broadcasting.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { AddressInfo } from 'net';
import { initializeGameHandlers } from '../../../src/backend/websocket/gameHandler';
import { gameService } from '../../../src/backend/services/gameService';

// ===========================================================================
// TEST SETUP
// ===========================================================================

describe('WebSocket Game Handler', () => {
  let io: Server;
  let httpServer: ReturnType<typeof createServer>;
  let clientSockets: ClientSocket[] = [];
  let port: number;

  beforeEach(async () => {
    // Clear all rooms before each test
    gameService.clearAllRooms();
    
    // Create HTTP server and Socket.io server
    httpServer = createServer();
    io = new Server(httpServer, {
      cors: { origin: '*' },
    });
    
    // Initialize game handlers
    initializeGameHandlers(io);
    
    // Start server on random port
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        port = (httpServer.address() as AddressInfo).port;
        resolve();
      });
    });
  });

  afterEach(async () => {
    // Disconnect all client sockets
    for (const socket of clientSockets) {
      if (socket.connected) {
        socket.disconnect();
      }
    }
    clientSockets = [];
    
    // Close server
    io.close();
    httpServer.close();
  });

  // Helper to create a connected client socket
  function createClientSocket(): Promise<ClientSocket> {
    return new Promise((resolve) => {
      const socket = Client(`http://localhost:${port}`, {
        transports: ['websocket'],
      });
      socket.on('connect', () => {
        clientSockets.push(socket);
        resolve(socket);
      });
    });
  }

  // Helper to wait for an event
  function waitForEvent<T>(socket: ClientSocket, event: string, timeout = 1000): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for event: ${event}`));
      }, timeout);
      
      socket.once(event, (data: T) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  }

  // ===========================================================================
  // JOIN ROOM SOCKET TESTS
  // ===========================================================================

  describe('join_room_socket', () => {
    it('should emit room_state when a player joins', async () => {
      // Create a room first (via gameService - simulating HTTP create-session)
      const room = gameService.createRoom({ displayName: 'Alice', avatarId: '1' });
      const playerId = room.players[0].id;
      
      // Connect socket
      const socket = await createClientSocket();
      
      // Listen for room_state
      const roomStatePromise = waitForEvent<any>(socket, 'room_state');
      
      // Emit join_room_socket
      socket.emit('join_room_socket', { 
        gameCode: room.gameCode, 
        playerId 
      });
      
      // Assert room_state received
      const roomState = await roomStatePromise;
      expect(roomState.gameCode).toBe(room.gameCode);
      expect(roomState.players).toHaveLength(1);
      expect(roomState.players[0].displayName).toBe('Alice');
    });

    it('should emit error when room does not exist', async () => {
      const socket = await createClientSocket();
      
      // Listen for error
      const errorPromise = waitForEvent<any>(socket, 'error');
      
      // Emit join with non-existent room
      socket.emit('join_room_socket', { 
        gameCode: 'NOTFOUND', 
        playerId: 'some-id' 
      });
      
      // Assert error received
      const error = await errorPromise;
      expect(error.message).toBe('Room not found');
    });

    it('should emit error when player is not in room', async () => {
      const room = gameService.createRoom({ displayName: 'Alice', avatarId: '1' });
      const socket = await createClientSocket();
      
      // Listen for error
      const errorPromise = waitForEvent<any>(socket, 'error');
      
      // Emit join with wrong player ID
      socket.emit('join_room_socket', { 
        gameCode: room.gameCode, 
        playerId: 'wrong-player-id' 
      });
      
      // Assert error received
      const error = await errorPromise;
      expect(error.message).toBe('Player not in room');
    });

    it('should mark player as connected after joining', async () => {
      const room = gameService.createRoom({ displayName: 'Alice', avatarId: '1' });
      const playerId = room.players[0].id;
      
      const socket = await createClientSocket();
      
      // Wait for room_state to confirm join
      const roomStatePromise = waitForEvent<any>(socket, 'room_state');
      socket.emit('join_room_socket', { gameCode: room.gameCode, playerId });
      await roomStatePromise;
      
      // Check player is now connected
      const player = gameService.getPlayer(room.gameCode, playerId);
      expect(player?.connected).toBe(true);
      expect(player?.socketId).toBe(socket.id);
    });
  });

  // ===========================================================================
  // ROOM STATE UPDATE BROADCASTING TESTS
  // ===========================================================================

  describe('room_state_update broadcasting', () => {
    it('should broadcast room_state_update to host when guest joins', async () => {
      // Create room with host
      const room = gameService.createRoom({ displayName: 'Alice', avatarId: '1' });
      const hostId = room.players[0].id;
      
      // Host connects and joins socket room
      const hostSocket = await createClientSocket();
      const hostRoomStatePromise = waitForEvent<any>(hostSocket, 'room_state');
      hostSocket.emit('join_room_socket', { gameCode: room.gameCode, playerId: hostId });
      await hostRoomStatePromise;
      
      // Guest joins via HTTP (simulated by gameService)
      const updatedRoom = gameService.joinRoom(room.gameCode, { displayName: 'Bob', avatarId: '2' });
      const guestId = updatedRoom.players[1].id;
      
      // Host listens for room_state_update
      const hostUpdatePromise = waitForEvent<any>(hostSocket, 'room_state_update');
      
      // Guest connects and joins socket room
      const guestSocket = await createClientSocket();
      guestSocket.emit('join_room_socket', { gameCode: room.gameCode, playerId: guestId });
      
      // Assert host receives update with both players
      const hostUpdate = await hostUpdatePromise;
      expect(hostUpdate.players).toHaveLength(2);
      expect(hostUpdate.players.map((p: any) => p.displayName)).toContain('Alice');
      expect(hostUpdate.players.map((p: any) => p.displayName)).toContain('Bob');
    });

    it('should broadcast room_state_update to all players when third player joins', async () => {
      // Create room with host
      const room = gameService.createRoom({ displayName: 'Alice', avatarId: '1' });
      const hostId = room.players[0].id;
      
      // Host connects
      const hostSocket = await createClientSocket();
      hostSocket.emit('join_room_socket', { gameCode: room.gameCode, playerId: hostId });
      await waitForEvent<any>(hostSocket, 'room_state');
      
      // First guest joins
      const room2 = gameService.joinRoom(room.gameCode, { displayName: 'Bob', avatarId: '2' });
      const guest1Id = room2.players[1].id;
      const guest1Socket = await createClientSocket();
      guest1Socket.emit('join_room_socket', { gameCode: room.gameCode, playerId: guest1Id });
      await waitForEvent<any>(guest1Socket, 'room_state');
      
      // Clear any pending events
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Second guest joins via HTTP
      const room3 = gameService.joinRoom(room.gameCode, { displayName: 'Charlie', avatarId: '3' });
      const guest2Id = room3.players[2].id;
      
      // Both host and guest1 listen for updates
      const hostUpdatePromise = waitForEvent<any>(hostSocket, 'room_state_update');
      const guest1UpdatePromise = waitForEvent<any>(guest1Socket, 'room_state_update');
      
      // Second guest connects
      const guest2Socket = await createClientSocket();
      guest2Socket.emit('join_room_socket', { gameCode: room.gameCode, playerId: guest2Id });
      
      // Assert both receive update with 3 players
      const hostUpdate = await hostUpdatePromise;
      const guest1Update = await guest1UpdatePromise;
      
      expect(hostUpdate.players).toHaveLength(3);
      expect(guest1Update.players).toHaveLength(3);
    });

    it('should include avatarId in room_state_update', async () => {
      // Create room with host
      const room = gameService.createRoom({ displayName: 'Alice', avatarId: '5' });
      const hostId = room.players[0].id;
      
      // Host connects
      const hostSocket = await createClientSocket();
      hostSocket.emit('join_room_socket', { gameCode: room.gameCode, playerId: hostId });
      await waitForEvent<any>(hostSocket, 'room_state');
      
      // Guest joins
      const updatedRoom = gameService.joinRoom(room.gameCode, { displayName: 'Bob', avatarId: '7' });
      const guestId = updatedRoom.players[1].id;
      
      // Host listens for update
      const hostUpdatePromise = waitForEvent<any>(hostSocket, 'room_state_update');
      
      // Guest connects
      const guestSocket = await createClientSocket();
      guestSocket.emit('join_room_socket', { gameCode: room.gameCode, playerId: guestId });
      
      // Assert avatarIds are included
      const hostUpdate = await hostUpdatePromise;
      const alice = hostUpdate.players.find((p: any) => p.displayName === 'Alice');
      const bob = hostUpdate.players.find((p: any) => p.displayName === 'Bob');
      
      expect(alice.avatarId).toBe('5');
      expect(bob.avatarId).toBe('7');
    });
  });

  // ===========================================================================
  // PLAYER JOINED EVENT TESTS
  // ===========================================================================

  describe('player_joined event', () => {
    it('should emit player_joined to other players (not to the joining player)', async () => {
      // Create room with host
      const room = gameService.createRoom({ displayName: 'Alice', avatarId: '1' });
      const hostId = room.players[0].id;
      
      // Host connects
      const hostSocket = await createClientSocket();
      hostSocket.emit('join_room_socket', { gameCode: room.gameCode, playerId: hostId });
      await waitForEvent<any>(hostSocket, 'room_state');
      
      // Guest joins via HTTP
      const updatedRoom = gameService.joinRoom(room.gameCode, { displayName: 'Bob', avatarId: '2' });
      const guestId = updatedRoom.players[1].id;
      
      // Host listens for player_joined
      const playerJoinedPromise = waitForEvent<any>(hostSocket, 'player_joined');
      
      // Guest connects
      const guestSocket = await createClientSocket();
      guestSocket.emit('join_room_socket', { gameCode: room.gameCode, playerId: guestId });
      
      // Assert host receives player_joined
      const playerJoined = await playerJoinedPromise;
      expect(playerJoined.displayName).toBe('Bob');
      expect(playerJoined.avatarId).toBe('2');
    });

    it('should NOT emit player_joined to the joining player themselves', async () => {
      // Create room with host
      const room = gameService.createRoom({ displayName: 'Alice', avatarId: '1' });
      const hostId = room.players[0].id;
      
      // Host connects
      const hostSocket = await createClientSocket();
      hostSocket.emit('join_room_socket', { gameCode: room.gameCode, playerId: hostId });
      await waitForEvent<any>(hostSocket, 'room_state');
      
      // Guest joins via HTTP
      const updatedRoom = gameService.joinRoom(room.gameCode, { displayName: 'Bob', avatarId: '2' });
      const guestId = updatedRoom.players[1].id;
      
      // Guest connects
      const guestSocket = await createClientSocket();
      
      // Set up listener BEFORE joining
      let guestReceivedPlayerJoined = false;
      guestSocket.on('player_joined', () => {
        guestReceivedPlayerJoined = true;
      });
      
      guestSocket.emit('join_room_socket', { gameCode: room.gameCode, playerId: guestId });
      await waitForEvent<any>(guestSocket, 'room_state');
      
      // Wait a bit to ensure no player_joined is received
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(guestReceivedPlayerJoined).toBe(false);
    });
  });

  // ===========================================================================
  // LEAVE ROOM TESTS
  // ===========================================================================

  describe('leave_room', () => {
    it('should broadcast room_state_update when player leaves', async () => {
      // Create room with host
      const room = gameService.createRoom({ displayName: 'Alice', avatarId: '1' });
      const hostId = room.players[0].id;
      
      // Host connects
      const hostSocket = await createClientSocket();
      hostSocket.emit('join_room_socket', { gameCode: room.gameCode, playerId: hostId });
      await waitForEvent<any>(hostSocket, 'room_state');
      
      // Guest joins
      const updatedRoom = gameService.joinRoom(room.gameCode, { displayName: 'Bob', avatarId: '2' });
      const guestId = updatedRoom.players[1].id;
      const guestSocket = await createClientSocket();
      guestSocket.emit('join_room_socket', { gameCode: room.gameCode, playerId: guestId });
      await waitForEvent<any>(guestSocket, 'room_state');
      
      // Clear pending events
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Host listens for updates
      const hostUpdatePromise = waitForEvent<any>(hostSocket, 'room_state_update');
      
      // Guest leaves
      guestSocket.emit('leave_room', { gameCode: room.gameCode, playerId: guestId });
      
      // Assert host receives update with 1 player
      const hostUpdate = await hostUpdatePromise;
      expect(hostUpdate.players).toHaveLength(1);
      expect(hostUpdate.players[0].displayName).toBe('Alice');
    });

    it('should emit player_left when player leaves', async () => {
      // Create room with host
      const room = gameService.createRoom({ displayName: 'Alice', avatarId: '1' });
      const hostId = room.players[0].id;
      
      // Host connects
      const hostSocket = await createClientSocket();
      hostSocket.emit('join_room_socket', { gameCode: room.gameCode, playerId: hostId });
      await waitForEvent<any>(hostSocket, 'room_state');
      
      // Guest joins
      const updatedRoom = gameService.joinRoom(room.gameCode, { displayName: 'Bob', avatarId: '2' });
      const guestId = updatedRoom.players[1].id;
      const guestSocket = await createClientSocket();
      guestSocket.emit('join_room_socket', { gameCode: room.gameCode, playerId: guestId });
      await waitForEvent<any>(guestSocket, 'room_state');
      
      // Host listens for player_left
      const playerLeftPromise = waitForEvent<any>(hostSocket, 'player_left');
      
      // Guest leaves
      guestSocket.emit('leave_room', { gameCode: room.gameCode, playerId: guestId });
      
      // Assert host receives player_left
      const playerLeft = await playerLeftPromise;
      expect(playerLeft.playerId).toBe(guestId);
    });
  });

  // ===========================================================================
  // START GAME TESTS
  // ===========================================================================

  describe('start_game', () => {
    it('should emit countdown to all players when host starts game', async () => {
      // Create room with host
      const room = gameService.createRoom({ displayName: 'Alice', avatarId: '1' });
      const hostId = room.players[0].id;
      
      // Host connects
      const hostSocket = await createClientSocket();
      hostSocket.emit('join_room_socket', { gameCode: room.gameCode, playerId: hostId });
      await waitForEvent<any>(hostSocket, 'room_state');
      
      // Guest joins
      const updatedRoom = gameService.joinRoom(room.gameCode, { displayName: 'Bob', avatarId: '2' });
      const guestId = updatedRoom.players[1].id;
      const guestSocket = await createClientSocket();
      guestSocket.emit('join_room_socket', { gameCode: room.gameCode, playerId: guestId });
      await waitForEvent<any>(guestSocket, 'room_state');
      
      // Both listen for countdown (first countdown after 1 second, so give 2s timeout)
      const hostCountdownPromise = waitForEvent<any>(hostSocket, 'countdown', 2000);
      const guestCountdownPromise = waitForEvent<any>(guestSocket, 'countdown', 2000);
      
      // Host starts game
      hostSocket.emit('start_game', { gameCode: room.gameCode, playerId: hostId });
      
      // Assert both receive countdown (first emit is count=3)
      const [hostCountdown, guestCountdown] = await Promise.all([
        hostCountdownPromise,
        guestCountdownPromise
      ]);
      
      expect(hostCountdown.count).toBe(3);
      expect(guestCountdown.count).toBe(3);
    });

    it('should emit error when non-host tries to start game', async () => {
      // Create room with host
      const room = gameService.createRoom({ displayName: 'Alice', avatarId: '1' });
      const hostId = room.players[0].id;
      
      // Host connects
      const hostSocket = await createClientSocket();
      hostSocket.emit('join_room_socket', { gameCode: room.gameCode, playerId: hostId });
      await waitForEvent<any>(hostSocket, 'room_state');
      
      // Guest joins
      const updatedRoom = gameService.joinRoom(room.gameCode, { displayName: 'Bob', avatarId: '2' });
      const guestId = updatedRoom.players[1].id;
      const guestSocket = await createClientSocket();
      guestSocket.emit('join_room_socket', { gameCode: room.gameCode, playerId: guestId });
      await waitForEvent<any>(guestSocket, 'room_state');
      
      // Guest listens for error
      const errorPromise = waitForEvent<any>(guestSocket, 'error');
      
      // Guest tries to start game (should fail)
      guestSocket.emit('start_game', { gameCode: room.gameCode, playerId: guestId });
      
      // Assert error received
      const error = await errorPromise;
      expect(error.message).toBe('Only host can start the game');
    });
  });

  // ===========================================================================
  // RESTART GAME (PLAY AGAIN) TESTS
  // ===========================================================================

  describe('restart_game', () => {
    it('should reset room status to waiting', async () => {
      // Create room and set it to active (simulating game in progress)
      const room = gameService.createRoom({ displayName: 'Alice', avatarId: '1' });
      const hostId = room.players[0].id;
      gameService.updateRoomStatus(room.gameCode, 'active');
      gameService.updateGameState(room.gameCode, { someState: 'test' });
      
      // Verify room is active
      expect(gameService.getRoom(room.gameCode)?.status).toBe('active');
      expect(gameService.getRoom(room.gameCode)?.gameState).not.toBeNull();
      
      // Host connects
      const hostSocket = await createClientSocket();
      hostSocket.emit('join_room_socket', { gameCode: room.gameCode, playerId: hostId });
      await waitForEvent<any>(hostSocket, 'room_state');
      
      // Listen for room_state_update (should come after restart)
      const roomStatePromise = waitForEvent<any>(hostSocket, 'room_state_update');
      
      // Host restarts game
      hostSocket.emit('restart_game', { gameCode: room.gameCode, playerId: hostId });
      
      // Assert room_state_update received with waiting status
      const roomState = await roomStatePromise;
      expect(roomState.status).toBe('waiting');
      
      // Verify backend state is also updated
      const updatedRoom = gameService.getRoom(room.gameCode);
      expect(updatedRoom?.status).toBe('waiting');
      expect(updatedRoom?.gameState).toBeNull();
    });

    it('should emit game_restarted event to all players', async () => {
      // Create room with host
      const room = gameService.createRoom({ displayName: 'Alice', avatarId: '1' });
      const hostId = room.players[0].id;
      
      // Guest joins BEFORE setting to active (joinRoom requires waiting status)
      const updatedRoom = gameService.joinRoom(room.gameCode, { displayName: 'Bob', avatarId: '2' });
      const guestId = updatedRoom.players[1].id;
      
      // Now set room to active (simulating game in progress)
      gameService.updateRoomStatus(room.gameCode, 'active');
      
      // Host connects
      const hostSocket = await createClientSocket();
      hostSocket.emit('join_room_socket', { gameCode: room.gameCode, playerId: hostId });
      await waitForEvent<any>(hostSocket, 'room_state');
      
      // Guest connects
      const guestSocket = await createClientSocket();
      guestSocket.emit('join_room_socket', { gameCode: room.gameCode, playerId: guestId });
      await waitForEvent<any>(guestSocket, 'room_state');
      
      // Both listen for game_restarted
      const hostRestartPromise = waitForEvent<any>(hostSocket, 'game_restarted');
      const guestRestartPromise = waitForEvent<any>(guestSocket, 'game_restarted');
      
      // Host restarts game
      hostSocket.emit('restart_game', { gameCode: room.gameCode, playerId: hostId });
      
      // Assert both receive game_restarted
      const [hostRestart, guestRestart] = await Promise.all([
        hostRestartPromise,
        guestRestartPromise
      ]);
      
      expect(hostRestart.gameCode).toBe(room.gameCode);
      expect(guestRestart.gameCode).toBe(room.gameCode);
    });

    it('should broadcast room_state_update to all players', async () => {
      // Create room with host
      const room = gameService.createRoom({ displayName: 'Alice', avatarId: '1' });
      const hostId = room.players[0].id;
      
      // Guest joins BEFORE setting to active (joinRoom requires waiting status)
      const updatedRoom = gameService.joinRoom(room.gameCode, { displayName: 'Bob', avatarId: '2' });
      const guestId = updatedRoom.players[1].id;
      
      // Now set room to active (simulating game in progress)
      gameService.updateRoomStatus(room.gameCode, 'active');
      
      // Host connects
      const hostSocket = await createClientSocket();
      hostSocket.emit('join_room_socket', { gameCode: room.gameCode, playerId: hostId });
      await waitForEvent<any>(hostSocket, 'room_state');
      
      // Guest connects - this will trigger a room_state_update with 'active' status
      const guestSocket = await createClientSocket();
      guestSocket.emit('join_room_socket', { gameCode: room.gameCode, playerId: guestId });
      await waitForEvent<any>(guestSocket, 'room_state');
      
      // Wait for the join room_state_update to be sent (host gets it when guest joins)
      await waitForEvent<any>(hostSocket, 'room_state_update');
      
      // Now listen for the RESTART room_state_update
      const hostUpdatePromise = waitForEvent<any>(hostSocket, 'room_state_update');
      const guestUpdatePromise = waitForEvent<any>(guestSocket, 'room_state_update');
      
      // Host restarts game
      hostSocket.emit('restart_game', { gameCode: room.gameCode, playerId: hostId });
      
      // Assert both receive room_state_update with waiting status
      const [hostUpdate, guestUpdate] = await Promise.all([
        hostUpdatePromise,
        guestUpdatePromise
      ]);
      
      expect(hostUpdate.status).toBe('waiting');
      expect(guestUpdate.status).toBe('waiting');
      expect(hostUpdate.players).toHaveLength(2);
      expect(guestUpdate.players).toHaveLength(2);
    });

    it('should emit error when room does not exist', async () => {
      const socket = await createClientSocket();
      
      // Listen for error
      const errorPromise = waitForEvent<any>(socket, 'error');
      
      // Try to restart non-existent room
      socket.emit('restart_game', { gameCode: 'NOTFOUND', playerId: 'some-id' });
      
      // Assert error received
      const error = await errorPromise;
      expect(error.message).toBe('Room not found');
    });
  });
});
