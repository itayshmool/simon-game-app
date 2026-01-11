/**
 * Game Over Screen Component
 * 
 * Displays the end game results with:
 * - Winner celebration with crown
 * - Final scoreboard with medals
 * - Game stats
 * - Play Again / Home buttons
 * - Share score functionality
 */

import { useEffect, useState } from 'react';
import { soundService } from '../../services/soundService';

// =============================================================================
// TYPES
// =============================================================================

interface GameOverScreenProps {
  winner: {
    playerId: string;
    name: string;
    score: number;
  } | null;
  finalScores: Array<{
    playerId: string;
    name: string;
    score: number;
    isEliminated?: boolean;
  }>;
  currentPlayerId: string;
  roundsPlayed: number;
  onPlayAgain: () => void;
  onGoHome: () => void;
  gameCode: string;
}

// =============================================================================
// CONFETTI COMPONENT
// =============================================================================

const Confetti: React.FC = () => {
  const colors = ['#22c55e', '#facc15', '#f97316', '#ef4444', '#3b82f6', '#a855f7'];
  const confettiPieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 2.5 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    size: 8 + Math.random() * 8,
  }));

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
      zIndex: 0,
    }}>
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          style={{
            position: 'absolute',
            left: `${piece.left}%`,
            top: '-20px',
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            animationName: 'confetti-fall',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            transform: `rotate(${piece.rotation}deg)`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
};

// =============================================================================
// GAME OVER SCREEN COMPONENT
// =============================================================================

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  winner,
  finalScores,
  currentPlayerId,
  roundsPlayed,
  onPlayAgain,
  onGoHome,
  gameCode,
}) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [animatedScore, setAnimatedScore] = useState(0);
  const isWinner = winner?.playerId === currentPlayerId;
  const isSoloGame = finalScores.length === 1;

  // Animate score count-up
  useEffect(() => {
    if (!winner) return;
    
    const targetScore = winner.score;
    const duration = 1500;
    const steps = 30;
    const increment = targetScore / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetScore) {
        setAnimatedScore(targetScore);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [winner]);

  // Play victory sound on mount
  useEffect(() => {
    soundService.playVictory();
    
    const timer = setTimeout(() => setShowConfetti(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  // Get medal emoji based on rank
  const getMedal = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}.`;
    }
  };

  // Share score functionality
  const handleShare = async () => {
    const myScore = finalScores.find(s => s.playerId === currentPlayerId)?.score || 0;
    const rank = finalScores.findIndex(s => s.playerId === currentPlayerId) + 1;
    
    const shareText = isSoloGame
      ? `🎮 I reached Round ${roundsPlayed} in Simon Says with ${myScore} points! Can you beat my score?`
      : `🏆 I finished #${rank} in Simon Says with ${myScore} points! ${isWinner ? '👑 WINNER!' : ''}`;
    
    const shareUrl = `${window.location.origin}/?join=${gameCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Simon Says Score',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard(shareText + '\n' + shareUrl);
        }
      }
    } else {
      copyToClipboard(shareText + '\n' + shareUrl);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      height: '100dvh',
      background: 'linear-gradient(135deg, #4ade80 0%, #facc15 25%, #f97316 50%, #ef4444 75%, #3b82f6 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      overflow: 'hidden',
    }}>
      {/* Confetti */}
      {showConfetti && <Confetti />}
      
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '24rem',
      }}>
        {/* Game Over Title */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#ffffff',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            margin: 0,
          }}>
            🎉 GAME OVER 🎉
          </h1>
        </div>

        {/* Winner Section - White card */}
        {winner && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '0.75rem',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          }}>
            {/* Crown */}
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👑</div>
            
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#7c3aed',
              margin: '0 0 0.5rem 0',
            }}>
              {isSoloGame ? 'GREAT JOB!' : 'WINNER!'}
            </h2>
            
            <div style={{
              color: '#1f2937',
              fontSize: '1.25rem',
              fontWeight: '600',
              marginBottom: '0.25rem',
            }}>
              {winner.name}
            </div>
            
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#7c3aed',
            }}>
              {animatedScore} <span style={{ fontSize: '1rem', color: '#6b7280' }}>points</span>
            </div>
            
            {isWinner && !isSoloGame && (
              <div style={{
                marginTop: '0.5rem',
                color: '#22c55e',
                fontSize: '0.875rem',
                fontWeight: '600',
              }}>
                ✨ That's YOU! ✨
              </div>
            )}
          </div>
        )}

        {/* Scoreboard (Multiplayer only) */}
        {!isSoloGame && finalScores.length > 1 && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            padding: '1rem',
            marginBottom: '0.75rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{
              color: '#6b7280',
              fontWeight: '600',
              textAlign: 'center',
              marginBottom: '0.75rem',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '0 0 0.75rem 0',
            }}>
              Final Standings
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {finalScores.map((player, index) => {
                const isCurrentPlayer = player.playerId === currentPlayerId;
                const rank = index + 1;
                
                return (
                  <div
                    key={player.playerId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      backgroundColor: isCurrentPlayer ? '#dbeafe' : '#f9fafb',
                      border: isCurrentPlayer ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.125rem', width: '1.5rem', textAlign: 'center' }}>
                        {getMedal(rank)}
                      </span>
                      <span style={{
                        color: '#1f2937',
                        fontWeight: isCurrentPlayer ? '600' : '500',
                        fontSize: '0.875rem',
                      }}>
                        {player.name}
                        {isCurrentPlayer && (
                          <span style={{ fontSize: '0.7rem', marginLeft: '0.25rem', color: '#3b82f6' }}>(you)</span>
                        )}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <span style={{ color: '#7c3aed', fontWeight: 'bold', fontSize: '0.875rem' }}>
                        {player.score} pts
                      </span>
                      {player.isEliminated && (
                        <span style={{ fontSize: '0.75rem' }}>💀</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Game Stats - Compact pills */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '2rem',
            padding: '0.5rem 1rem',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>{roundsPlayed}</div>
            <div style={{ fontSize: '0.625rem', color: '#6b7280', textTransform: 'uppercase' }}>Rounds</div>
          </div>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '2rem',
            padding: '0.5rem 1rem',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
              {finalScores.find(s => s.playerId === currentPlayerId)?.score || 0}
            </div>
            <div style={{ fontSize: '0.625rem', color: '#6b7280', textTransform: 'uppercase' }}>Your Score</div>
          </div>
          {!isSoloGame && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '2rem',
              padding: '0.5rem 1rem',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
                #{finalScores.findIndex(s => s.playerId === currentPlayerId) + 1}
              </div>
              <div style={{ fontSize: '0.625rem', color: '#6b7280', textTransform: 'uppercase' }}>Rank</div>
            </div>
          )}
        </div>

        {/* Action Buttons - Purple gradient like other screens */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* Play Again Button - Green */}
          <button
            onClick={onPlayAgain}
            style={{
              width: '100%',
              padding: '0.875rem 1.5rem',
              borderRadius: '9999px',
              fontWeight: 'bold',
              fontSize: '1rem',
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 0 0 #166534, 0 6px 12px rgba(22, 101, 52, 0.3)',
              touchAction: 'manipulation',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            🔄 PLAY AGAIN
          </button>

          {/* Home Button - Purple */}
          <button
            onClick={onGoHome}
            style={{
              width: '100%',
              padding: '0.875rem 1.5rem',
              borderRadius: '9999px',
              fontWeight: 'bold',
              fontSize: '1rem',
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(180deg, #c084fc 0%, #a855f7 50%, #7c3aed 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 0 0 #581c87, 0 6px 12px rgba(88, 28, 135, 0.3)',
              touchAction: 'manipulation',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            🏠 HOME
          </button>

          {/* Share Button - Blue */}
          <button
            onClick={handleShare}
            style={{
              width: '100%',
              padding: '0.75rem 1.5rem',
              borderRadius: '9999px',
              fontWeight: 'bold',
              fontSize: '0.875rem',
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 0 0 #1d4ed8, 0 6px 12px rgba(29, 78, 216, 0.3)',
              touchAction: 'manipulation',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            📤 SHARE SCORE
          </button>
        </div>
      </div>

      {/* CSS for confetti animation */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default GameOverScreen;
