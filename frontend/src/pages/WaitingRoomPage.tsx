/**
 * Waiting Room / Game Page
 * 
 * Combined page that shows:
 * - Waiting room before game starts
 * - Simon game board during gameplay
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSimonStore } from '../store/simonStore';
import { socketService } from '../services/socketService';
import { soundService } from '../services/soundService';
import { CircularSimonBoard } from '../components/game/CircularSimonBoard';
import { GameOverScreen } from '../components/game/GameOverScreen';
import { Toast } from '../components/ui/Toast';
import { MuteButton } from '../components/ui/MuteButton';

// Avatar mapping
const AVATAR_EMOJIS: Record<string, string> = {
  '1': '🦁', '2': '🐯', '3': '🦊', '4': '🐼', '5': '🐸',
  '6': '🦄', '7': '🐙', '8': '🦋', '9': '🐨', '10': '🦉'
};

const MAX_PLAYERS = 4;

export function WaitingRoomPage() {
  const navigate = useNavigate();
  const { session, clearSession } = useAuthStore();
  const gameCode = session?.gameCode;
  const playerId = session?.playerId;
  
  // Store gameCode and playerId in refs to avoid re-running useEffect
  // This prevents the socket disconnect bug when state updates trigger re-renders
  const gameCodeRef = useRef(gameCode);
  const playerIdRef = useRef(playerId);
  
  const { 
    isGameActive, 
    currentSequence, 
    currentRound, 
    isShowingSequence,
    isInputPhase,
    playerSequence,
    canSubmit,
    lastResult,
    message,
    secondsRemaining,
    timerColor,
    isTimerPulsing,
    isEliminated,
    scores,
    submittedPlayers,
    isGameOver,
    gameWinner,
    finalScores,
    initializeListeners,
    cleanup,
    addColorToSequence,
    submitSequence,
    resetGame,
  } = useSimonStore();
  
  const [roomStatus, setRoomStatus] = useState<'waiting' | 'countdown' | 'active'>('waiting');
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [isHost, setIsHost] = useState(session?.isHost || false);
  const [players, setPlayers] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const lastCountdownValue = useRef<number | null>(null);
  const hasInitialized = useRef(false);
  
  // Keep refs updated when values change
  useEffect(() => {
    gameCodeRef.current = gameCode;
    playerIdRef.current = playerId;
  }, [gameCode, playerId]);
  
  // Initialize ONCE on mount - using refs to avoid dependency issues
  useEffect(() => {
    // Prevent double initialization (React StrictMode)
    if (hasInitialized.current) {
      console.log('🎮 WaitingRoomPage already initialized, skipping');
      return;
    }
    hasInitialized.current = true;
    
    console.log('🎮 WaitingRoomPage mounted (ONCE)');
    
    // Connect socket first
    const socket = socketService.connect();
    console.log('✅ Socket connected:', socket.connected, 'id:', socket.id);
    
    // Track socket connection state and handle reconnection
    socket.on('connect', () => {
      console.log('🔌 Socket reconnected:', socket.id);
      
      // Re-join room on reconnection (important for mobile when app goes to background)
      const currentGameCode = gameCodeRef.current;
      const currentPlayerId = playerIdRef.current;
      if (currentGameCode && currentPlayerId) {
        console.log('🔄 Re-joining room after reconnect:', { gameCode: currentGameCode, playerId: currentPlayerId });
        socket.emit('join_room_socket', { gameCode: currentGameCode, playerId: currentPlayerId });
      }
    });
    
    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected! Reason:', reason);
    });
    
    // Initialize Simon game listeners
    initializeListeners();
    
    // IMPORTANT: Set up ALL listeners BEFORE emitting join_room_socket
    // This prevents race conditions where server responds before listeners are ready
    
    // Listen for initial room state (ONCE to avoid duplicates)
    socket.once('room_state', (room: any) => {
      console.log('📦 Initial room state:', room);
      setPlayers(room.players || []);
      setRoomStatus(room.status);
      
      // Check if we're the host - use ref for latest playerId
      const currentPlayerId = playerIdRef.current;
      const me = room.players?.find((p: any) => p.id === currentPlayerId);
      const isHostPlayer = me?.isHost || false;
      console.log('🎮 isHost check:', { playerId: currentPlayerId, me, isHostPlayer });
      setIsHost(isHostPlayer);
    });
    
    // Listen for room state updates (when players join/leave)
    socket.on('room_state_update', (room: any) => {
      try {
        console.log('🔄 Room state updated:', JSON.stringify(room));
        console.log('🔄 Players in update:', JSON.stringify(room.players));
        
        if (room.players && Array.isArray(room.players)) {
          setPlayers(room.players);
        } else {
          console.warn('⚠️ Invalid players data:', room.players);
        }
        
        if (room.status) {
          setRoomStatus(room.status);
        }
        
        // Check if we're the host - use ref for latest playerId
        const currentPlayerId = playerIdRef.current;
        const me = room.players?.find((p: any) => p.id === currentPlayerId);
        setIsHost(me?.isHost || false);
        console.log('✅ Room state update processed successfully');
      } catch (err) {
        console.error('❌ Error processing room_state_update:', err);
      }
    });
    
    // Listen for errors
    socket.on('error', (data: { message: string }) => {
      console.error('❌ Server error:', data.message);
      setToast({ message: data.message, type: 'error' });
    });
    
    // Listen for countdown
    socket.on('countdown', (data: { count: number }) => {
      console.log('⏳ Countdown:', data.count);
      setRoomStatus('countdown');
      setCountdownValue(data.count);
      
      // 🔊 Play countdown beep (only once per second)
      if (lastCountdownValue.current !== data.count) {
        soundService.playCountdown(data.count);
        lastCountdownValue.current = data.count;
      }
      
      if (data.count === 0) {
        setRoomStatus('active');
        setCountdownValue(null);
        lastCountdownValue.current = null;
      }
    });
    
    // Listen for player joined (show toast notification)
    socket.on('player_joined', (player: any) => {
      console.log('👋 Player joined event received:', JSON.stringify(player));
      if (player && player.displayName) {
        setToast({ message: `${player.displayName} joined!`, type: 'info' });
      }
    });
    
    // Listen for player left
    socket.on('player_left', (data: { playerId: string }) => {
      console.log('👋 Player left:', data.playerId);
      setPlayers(prev => prev.filter(p => p.id !== data.playerId));
    });
    
    // Listen for game restarted (Play Again)
    socket.on('game_restarted', (data: { gameCode: string }) => {
      console.log('🔄 Game restarted:', data.gameCode);
      // Reset local state to waiting room
      resetGame();
      setRoomStatus('waiting');
      lastCountdownValue.current = null;
    });
    
    // NOW emit join_room_socket AFTER all listeners are set up
    // Use refs to get current values
    const currentGameCode = gameCodeRef.current;
    const currentPlayerId = playerIdRef.current;
    if (currentGameCode && currentPlayerId) {
      console.log('📤 Emitting join_room_socket:', { gameCode: currentGameCode, playerId: currentPlayerId });
      socket.emit('join_room_socket', { gameCode: currentGameCode, playerId: currentPlayerId });
    }
    
    // Cleanup on unmount ONLY
    return () => {
      console.log('🧹 WaitingRoomPage cleanup (unmount)');
      hasInitialized.current = false;
      cleanup();
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room_state');
      socket.off('room_state_update');
      socket.off('error');
      socket.off('countdown');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('game_restarted');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - runs ONCE on mount only
  
  // Handle start game (host only)
  const handleStartGame = async () => {
    console.log('🎮 DEBUG: handleStartGame called');
    console.log('🎮 DEBUG: gameCode:', gameCode);
    console.log('🎮 DEBUG: playerId:', playerId);
    console.log('🎮 DEBUG: isHost:', isHost);
    
    // 🔊 Initialize sound on user interaction
    await soundService.init();
    
    const socket = socketService.getSocket();
    console.log('🎮 DEBUG: socket exists:', !!socket);
    console.log('🎮 DEBUG: socket connected:', socket?.connected);
    
    if (!socket) {
      console.error('❌ No socket connection');
      setToast({ message: 'No connection to server', type: 'error' });
      return;
    }
    
    if (!gameCode || !playerId) {
      console.error('❌ Missing gameCode or playerId');
      setToast({ message: 'Missing game info', type: 'error' });
      return;
    }
    
    console.log('📤 Emitting start_game:', { gameCode, playerId });
    socket.emit('start_game', { gameCode, playerId });
  };
  
  // Copy game code to clipboard
  const copyGameCode = async () => {
    if (!gameCode) return;
    
    try {
      await navigator.clipboard.writeText(gameCode);
      setToast({ message: 'Game code copied!', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to copy code', type: 'error' });
    }
  };
  
  // Share game using native share API (mobile-friendly)
  const shareGame = async () => {
    if (!gameCode) return;
    
    const inviteUrl = `${window.location.origin}/?join=${gameCode}`;
    
    // Check if native share is supported
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Simon Game!',
          text: `Join me in Simon Says! Use code: ${gameCode}`,
          url: inviteUrl,
        });
        setToast({ message: 'Invite shared!', type: 'success' });
      } catch (err) {
        // User cancelled or error - fallback to copy
        if ((err as Error).name !== 'AbortError') {
          try {
            await navigator.clipboard.writeText(inviteUrl);
            setToast({ message: 'Invite link copied!', type: 'success' });
          } catch {
            setToast({ message: 'Failed to share', type: 'error' });
          }
        }
      }
    } else {
      // Fallback to copy for desktop
      try {
        await navigator.clipboard.writeText(inviteUrl);
        setToast({ message: 'Invite link copied!', type: 'success' });
      } catch {
        setToast({ message: 'Failed to copy link', type: 'error' });
      }
    }
  };
  
  // Handle Play Again
  const handlePlayAgain = () => {
    // Reset local game state
    resetGame();
    setRoomStatus('waiting');
    
    // Emit restart_game to reset room on server
    const socket = socketService.getSocket();
    if (socket && gameCode && playerId) {
      console.log('🔄 Restarting game:', { gameCode, playerId });
      socket.emit('restart_game', { gameCode, playerId });
    }
  };

  // Handle Go Home / Leave Room
  const handleGoHome = () => {
    cleanup();
    clearSession();
    navigate('/');
  };
  
  // Render Game Over screen
  if (isGameOver) {
    return (
      <>
        <MuteButton />
        <GameOverScreen
          winner={gameWinner}
          finalScores={finalScores}
          currentPlayerId={playerId || ''}
          roundsPlayed={currentRound}
          onPlayAgain={handlePlayAgain}
          onGoHome={handleGoHome}
          gameCode={gameCode || ''}
        />
      </>
    );
  }

  // Render game board if active
  if (roomStatus === 'active' && isGameActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-2 sm:p-4">
        {/* Mute Button */}
        <MuteButton />
        
        <div className="flex flex-col items-center w-full max-w-md">
          {/* Step 4: Scoreboard */}
          {isGameActive && Object.keys(scores).length > 0 && (
            <div className="bg-gray-800 rounded-xl sm:rounded-2xl p-2 sm:p-3 mb-3 w-full">
              <div className="space-y-1">
                {players.map((player) => {
                  const score = scores[player.id] || 0;
                  const hasSubmitted = submittedPlayers.includes(player.id);
                  const isCurrentPlayer = player.id === playerId;
                  
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 rounded ${
                        isCurrentPlayer ? 'bg-blue-600' : 'bg-gray-700'
                      }`}
                    >
                      <span className="text-white text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                        <span>{player.avatar}</span>
                        <span>{player.displayName}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-white text-xs sm:text-sm font-bold">
                          {score} pts
                        </span>
                        {hasSubmitted && isInputPhase && (
                          <span className="text-green-400 text-xs">✓</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Step 4: Eliminated Message */}
          {isEliminated && (
            <div className="bg-red-500/20 border-2 border-red-500 rounded-xl sm:rounded-2xl p-3 mb-3 text-center w-full">
              <div className="text-3xl mb-1">💀</div>
              <div className="text-white text-base sm:text-lg font-bold">
                Eliminated!
              </div>
            </div>
          )}
          
          <CircularSimonBoard
            sequence={currentSequence}
            round={currentRound}
            isShowingSequence={isShowingSequence}
            isInputPhase={isInputPhase}
            playerSequence={playerSequence}
            canSubmit={canSubmit}
            lastResult={lastResult}
            onColorClick={addColorToSequence}
            onSubmit={() => {
              if (gameCode && playerId) {
                submitSequence(gameCode, playerId);
              }
            }}
            disabled={isEliminated}
            secondsRemaining={secondsRemaining}
            timerColor={timerColor}
            isTimerPulsing={isTimerPulsing}
          />
          
          {/* Message Display */}
          <div className="mt-6 text-center">
            <p className="text-white text-lg font-medium">{message}</p>
          </div>
          
          {/* Players Status */}
          <div className="mt-8 bg-white/10 backdrop-blur rounded-2xl p-4">
            <h3 className="text-white font-bold mb-2">Players</h3>
            <div className="grid grid-cols-2 gap-2">
              {players.map(player => (
                <div key={player.id} className="text-white/80 text-sm">
                  {player.displayName} {player.isHost && '👑'}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render countdown
  if (roomStatus === 'countdown' && countdownValue !== null) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4ade80 0%, #facc15 25%, #f97316 50%, #ef4444 75%, #3b82f6 100%)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '8rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem', textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            {countdownValue}
          </h1>
          <p style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.9)' }}>Get ready!</p>
        </div>
      </div>
    );
  }
  
  // Create empty slots array for the grid
  const playerSlots = [...players];
  while (playerSlots.length < MAX_PLAYERS) {
    playerSlots.push(null);
  }
  
  // Render waiting room
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100dvh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflow: 'hidden',
        boxSizing: 'border-box',
        background: 'linear-gradient(135deg, #4ade80 0%, #facc15 25%, #f97316 50%, #ef4444 75%, #3b82f6 100%)',
      }}
    >
      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* Content container */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '22rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        {/* Title */}
        <h1 style={{ 
          fontSize: '1.375rem', 
          fontWeight: 'bold', 
          color: 'white', 
          letterSpacing: '0.1em',
          textShadow: '0 2px 10px rgba(0,0,0,0.2)',
          margin: 0,
        }}>
          WAITING ROOM
        </h1>
        
        {/* Room Code Card */}
        <div 
          style={{
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            padding: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.7rem', color: '#6b7280', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
            ROOM CODE
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ 
              fontFamily: 'monospace', 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: '#7c3aed',
              letterSpacing: '0.15em',
            }}>
              {gameCode}
            </span>
            <button
              onClick={copyGameCode}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                fontSize: '1.25rem',
                opacity: 0.6,
              }}
              title="Copy code"
            >
              📋
            </button>
          </div>
        </div>
        
        {/* Players Card */}
        <div 
          style={{
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            padding: '0.75rem',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1rem' }}>👥</span>
              PLAYERS
            </span>
            <span style={{ 
              backgroundColor: '#f3f4f6', 
              padding: '0.25rem 0.625rem', 
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#1f2937',
            }}>
              {players.length} <span style={{ color: '#9ca3af' }}>/ {MAX_PLAYERS}</span>
            </span>
          </div>
          
          {/* Player Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '0.5rem',
          }}>
            {playerSlots.map((player, index) => {
              const isCurrentPlayer = player?.id === playerId;
              const isPlayerHost = player?.isHost;
              const avatarEmoji = player ? (AVATAR_EMOJIS[player.avatarId] || player.avatar || '🎮') : null;
              
              if (player) {
                // Filled slot
                return (
                  <div
                    key={player.id}
                    style={{
                      backgroundColor: isCurrentPlayer ? '#f0fdf4' : '#f9fafb',
                      border: isCurrentPlayer ? '2px solid #22c55e' : '1px solid #e5e7eb',
                      borderRadius: '0.75rem',
                      padding: '0.625rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minHeight: '5.5rem',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '2.75rem',
                      height: '2.75rem',
                      borderRadius: '50%',
                      backgroundColor: isCurrentPlayer ? '#22c55e' : '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      position: 'relative',
                      boxShadow: isCurrentPlayer ? '0 0 12px rgba(34, 197, 94, 0.4)' : 'none',
                    }}>
                      {avatarEmoji}
                      {/* Online indicator */}
                      <div style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        width: '0.875rem',
                        height: '0.875rem',
                        borderRadius: '50%',
                        backgroundColor: '#22c55e',
                        border: '2px solid white',
                      }} />
                    </div>
                    
                    {/* Name */}
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: '600', 
                      color: '#1f2937',
                      marginTop: '0.375rem',
                      textAlign: 'center',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {isCurrentPlayer ? 'YOU' : player.displayName}
                    </span>
                    
                    {/* Host badge */}
                    {isPlayerHost && (
                      <span style={{ 
                        fontSize: '0.625rem', 
                        fontWeight: '600', 
                        color: '#22c55e',
                        marginTop: '0.125rem',
                      }}>
                        HOST
                      </span>
                    )}
                  </div>
                );
              } else {
                // Empty slot
                return (
                  <div
                    key={`empty-${index}`}
                    style={{
                      backgroundColor: '#f9fafb',
                      border: '1.5px dashed #d1d5db',
                      borderRadius: '0.75rem',
                      padding: '0.625rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '5.5rem',
                    }}
                  >
                    <span style={{ fontSize: '1.5rem', color: '#d1d5db' }}>?</span>
                    <span style={{ fontSize: '0.625rem', color: '#9ca3af', marginTop: '0.25rem', letterSpacing: '0.05em' }}>
                      EMPTY
                    </span>
                  </div>
                );
              }
            })}
          </div>
        </div>
        
        {/* INVITE FRIENDS Button (host only) */}
        {isHost && (
          <button
            onClick={shareGame}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '9999px',
              backgroundColor: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <span style={{ fontSize: '1rem' }}>📤</span>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#7c3aed', letterSpacing: '0.05em' }}>
              INVITE FRIENDS
            </span>
          </button>
        )}
        
        {/* START GAME Button (host only, or solo player) */}
        {(isHost || players.length === 1) && (
          <button
            onClick={handleStartGame}
            style={{
              width: '100%',
              padding: '0.875rem',
              borderRadius: '9999px',
              fontWeight: 'bold',
              fontSize: '1rem',
              color: '#ffffff',
              border: '2px solid #9333ea',
              cursor: 'pointer',
              background: 'linear-gradient(180deg, #c084fc 0%, #a855f7 50%, #7c3aed 100%)',
              boxShadow: '0 4px 0 0 #581c87, 0 6px 12px rgba(88, 28, 135, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              letterSpacing: '0.05em',
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>▶️</span>
            START GAME
          </button>
        )}
        
        {/* Waiting for host message */}
        {!isHost && players.length > 1 && (
          <p style={{ 
            color: 'rgba(255,255,255,0.9)', 
            fontSize: '0.875rem',
            textAlign: 'center',
            margin: 0,
          }}>
            Waiting for host to start the game...
          </p>
        )}
        
        {/* LEAVE ROOM Button */}
        <button
          onClick={handleGoHome}
          style={{
            width: '100%',
            padding: '0.625rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            border: '2px solid rgba(255,255,255,0.8)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <span style={{ fontSize: '0.875rem' }}>🚪</span>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'white', letterSpacing: '0.05em' }}>
            LEAVE ROOM
          </span>
        </button>
      </div>
    </div>
  );
}
