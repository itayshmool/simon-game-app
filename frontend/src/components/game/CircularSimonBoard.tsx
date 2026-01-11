/**
 * Circular Simon Board Component (Classic Design with SVG)
 * 
 * Authentic circular Simon game with proper pie-slice wedges using SVG paths.
 * Replicates the iconic look of the original 1978 Simon game.
 */

import { useState, useEffect, useRef } from 'react';
import type { Color } from '../../shared/types';
import { soundService } from '../../services/soundService';

// =============================================================================
// TYPES
// =============================================================================

interface CircularSimonBoardProps {
  sequence: Color[];
  round: number;
  isShowingSequence: boolean;
  isInputPhase: boolean;
  playerSequence: Color[];
  canSubmit: boolean;
  lastResult: { isCorrect: boolean; playerName: string } | null;
  onColorClick: (color: Color) => void;
  onSubmit: () => void;
  disabled?: boolean;
  secondsRemaining: number;
  timerColor: 'green' | 'yellow' | 'red';
  isTimerPulsing: boolean;
  // Difficulty timing
  colorDurationMs?: number;
  colorGapMs?: number;
}

// =============================================================================
// SVG PATH HELPER - Creates pie slice arc path
// =============================================================================

function createWedgePath(
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  // Convert angles to radians
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  // Calculate points
  const x1 = centerX + outerRadius * Math.cos(startRad);
  const y1 = centerY + outerRadius * Math.sin(startRad);
  const x2 = centerX + outerRadius * Math.cos(endRad);
  const y2 = centerY + outerRadius * Math.sin(endRad);
  const x3 = centerX + innerRadius * Math.cos(endRad);
  const y3 = centerY + innerRadius * Math.sin(endRad);
  const x4 = centerX + innerRadius * Math.cos(startRad);
  const y4 = centerY + innerRadius * Math.sin(startRad);

  // Large arc flag (0 for arcs less than 180 degrees)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  // Create SVG path
  return `
    M ${x1} ${y1}
    A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}
    L ${x3} ${y3}
    A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
    Z
  `;
}

// =============================================================================
// WEDGE COMPONENT (SVG Pie Slice)
// =============================================================================

interface WedgeProps {
  color: Color;
  isActive: boolean;
  onClick: () => void;
  disabled: boolean;
  startAngle: number;
  endAngle: number;
  centerX: number;
  centerY: number;
  innerRadius: number;
  outerRadius: number;
}

const ColorWedge: React.FC<WedgeProps> = ({
  color,
  isActive,
  onClick,
  disabled,
  startAngle,
  endAngle,
  centerX,
  centerY,
  innerRadius,
  outerRadius,
}) => {
  // DIMMED base colors (VERY dark when inactive) and NEON BRIGHT when active
  // Increased contrast for arcade "pop" effect
  const colors: Record<Color, { dim: string; bright: string }> = {
    green: { dim: '#0d3d14', bright: '#44ff66' },  // Very dark green -> Neon green
    red: { dim: '#4a0d0d', bright: '#ff4444' },    // Very dark red -> Bright red
    yellow: { dim: '#4a4000', bright: '#ffff00' }, // Very dark yellow -> Pure yellow
    blue: { dim: '#052040', bright: '#44aaff' },   // Very dark blue -> Bright blue
  };

  const wedgeColor = colors[color];
  const fillColor = isActive ? wedgeColor.bright : wedgeColor.dim;

  const path = createWedgePath(
    centerX,
    centerY,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle
  );

  return (
    <path
      d={path}
      fill={fillColor}
      stroke="#000"
      strokeWidth="5"
      onClick={disabled ? undefined : onClick}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'fill 0.08s ease, filter 0.08s ease, transform 0.08s ease',
        filter: isActive 
          ? `brightness(2) drop-shadow(0 0 40px ${wedgeColor.bright}) drop-shadow(0 0 80px ${wedgeColor.bright}) drop-shadow(0 0 120px ${wedgeColor.bright})` 
          : 'brightness(1)',
        transformOrigin: `${centerX}px ${centerY}px`,
        transform: isActive ? 'scale(1.08)' : 'scale(1)',
        opacity: disabled ? 0.6 : 1,
      }}
      role="button"
      aria-label={`${color} button`}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          onClick();
        }
      }}
    />
  );
};

// =============================================================================
// CIRCULAR SIMON BOARD COMPONENT
// =============================================================================

export const CircularSimonBoard: React.FC<CircularSimonBoardProps> = ({
  sequence,
  round,
  isShowingSequence,
  isInputPhase,
  playerSequence,
  canSubmit,
  onColorClick,
  onSubmit,
  disabled = false,
  secondsRemaining,
  timerColor,
  isTimerPulsing,
  colorDurationMs = 600,
  colorGapMs = 200,
}) => {
  const [activeColor, setActiveColor] = useState<Color | null>(null);

  // SVG dimensions
  const size = 300;
  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = size / 2 - 10; // Leave margin for stroke
  const innerRadius = size * 0.18; // Center hub size
  const gapAngle = 4; // Gap between wedges in degrees

  // Wedge angles (with gaps)
  const wedges: { color: Color; start: number; end: number }[] = [
    { color: 'green', start: 180 + gapAngle / 2, end: 270 - gapAngle / 2 },   // Top Left
    { color: 'red', start: 270 + gapAngle / 2, end: 360 - gapAngle / 2 },      // Top Right
    { color: 'yellow', start: 90 + gapAngle / 2, end: 180 - gapAngle / 2 },    // Bottom Left
    { color: 'blue', start: 0 + gapAngle / 2, end: 90 - gapAngle / 2 },        // Bottom Right
  ];

  // Track which color in sequence is being shown
  const [sequenceIndex, setSequenceIndex] = useState<number>(-1);
  
  // Track if audio is initialized
  const audioInitialized = useRef(false);
  
  // CRITICAL FIX: Use ref to track current sequence to avoid closure issues
  // When sequence prop changes between rounds, the ref ensures we always read the latest value
  // Update ref immediately (not in useEffect) to ensure it's always current
  const sequenceRef = useRef<Color[]>(sequence);
  sequenceRef.current = sequence; // Update synchronously, not in useEffect

  // Initialize audio on first user interaction
  useEffect(() => {
    const initAudio = async () => {
      if (!audioInitialized.current) {
        await soundService.init();
        audioInitialized.current = true;
      }
    };

    // Try to init immediately (will work if user has interacted)
    initAudio();

    // Also listen for first click
    const handleClick = () => {
      initAudio();
      document.removeEventListener('click', handleClick);
    };
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  // Animate sequence when showing - DRAMATIC and SLOW with SOUND
  useEffect(() => {
    // Reset state immediately when not showing
    if (!isShowingSequence || sequence.length === 0) {
      setActiveColor(null);
      setSequenceIndex(-1);
      return;
    }

    // CRITICAL: Capture ALL values at the start
    // These captured values will be used throughout the animation
    const sequenceLength = sequence.length;
    const sequenceToShow = [...sequence]; // Copy to ensure we have exact sequence
    const currentRound = round;
    
    // Verify we have a valid sequence
    if (sequenceLength === 0) {
      console.error(`🎨 ERROR: Empty sequence for round ${currentRound}`);
      return;
    }
    
    console.log(`🎨 ANIMATION START: Round ${currentRound}, Length: ${sequenceLength}, Colors:`, sequenceToShow);
    console.log(`🎨 Timing: ${colorDurationMs}ms show, ${colorGapMs}ms gap`);

    // Use difficulty-based timing from server
    const SHOW_DURATION = colorDurationMs;  // How long each color stays lit
    const SHOW_GAP = colorGapMs;            // Gap between colors (all dark)

    let currentIndex = 0;
    let timeoutId: ReturnType<typeof setTimeout>;
    let isCancelled = false; // Track if this effect was cancelled

    const showNextColor = () => {
      // CRITICAL FIX: Use the captured sequenceLength instead of reading from ref
      // This ensures we always use the length from when the animation started
      console.log(`🎨 showNextColor: index=${currentIndex}, sequenceLength=${sequenceLength}, cancelled=${isCancelled}`);
      
      if (isCancelled || currentIndex >= sequenceLength) {
        console.log(`🎨 Animation complete or cancelled. Index: ${currentIndex}, Length: ${sequenceLength}`);
        setActiveColor(null);
        setSequenceIndex(-1);
        return;
      }

      // Use the captured sequence array
      const color = sequenceToShow[currentIndex];
      console.log(`🎨 Showing color ${currentIndex + 1}/${sequenceLength}: ${color}`);
      setActiveColor(color);
      setSequenceIndex(currentIndex);

      // 🔊 PLAY COLOR TONE (duration matches visual)
      soundService.playColor(color, SHOW_DURATION / 1000);

      // Vibrate when showing sequence
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }

      setTimeout(() => {
        if (isCancelled) {
          console.log(`🎨 Cancelled during timeout for index ${currentIndex}`);
          return; // Don't continue if effect was cancelled
        }
        
        setActiveColor(null);
        currentIndex++;
        
        // Use the captured sequenceLength instead of reading from ref
        console.log(`🎨 After timeout: index=${currentIndex}, sequenceLength=${sequenceLength}, cancelled=${isCancelled}`);
        
        if (!isCancelled && currentIndex < sequenceLength) {
          timeoutId = setTimeout(showNextColor, SHOW_GAP);
        } else {
          console.log(`🎨 Animation finished. Final index: ${currentIndex}, Length: ${sequenceLength}`);
          setActiveColor(null);
          setSequenceIndex(-1);
        }
      }, SHOW_DURATION);
    };

    // Small delay before starting sequence
    timeoutId = setTimeout(showNextColor, 500);

    return () => {
      console.log(`🎨 CLEANUP: Round ${currentRound}, cancelling animation`);
      isCancelled = true; // Mark as cancelled to prevent stale callbacks
      if (timeoutId) clearTimeout(timeoutId);
      setActiveColor(null);
      setSequenceIndex(-1);
    };
  }, [isShowingSequence, sequence, round, colorDurationMs, colorGapMs]); // Dependencies: re-run when any of these change

  // Handle color button click
  const handleColorClick = (color: Color) => {
    if (disabled || isShowingSequence || !isInputPhase) return;

    // 🔊 PLAY COLOR TONE (short click sound)
    soundService.playColorClick(color);

    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    setActiveColor(color);
    setTimeout(() => setActiveColor(null), 150);
    onColorClick(color);
  };

  // Get color emoji
  const getColorEmoji = (color: Color): string => {
    const emojis: Record<Color, string> = {
      red: '🔴',
      blue: '🔵',
      yellow: '🟡',
      green: '🟢',
    };
    return emojis[color];
  };

  // Timer colors inline
  const timerColors = {
    green: '#22c55e',
    yellow: '#facc15',
    red: '#ef4444',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      gap: '0.5rem',
    }}>
      {/* Status Message - clean, no box */}
      <div style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
        {isShowingSequence ? (
          <p 
            className="watch-pattern-text"
            style={{ 
              color: '#facc15', 
              fontWeight: 'bold', 
              fontSize: '1rem',
              margin: 0,
            }}
          >
            👀 Watch the pattern!
          </p>
        ) : (
          <p style={{ 
            color: '#d1d5db', 
            fontSize: '0.875rem',
            margin: 0,
          }}>
            {disabled 
              ? '👻 Spectating...' 
              : isInputPhase
                ? '🎮 Repeat the pattern!' 
                : '✅ Ready'}
          </p>
        )}
      </div>

      {/* LARGE Timer Display - Very prominent */}
      {isInputPhase && secondsRemaining > 0 && (
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRadius: '1rem',
          padding: '0.5rem 1.5rem',
          boxShadow: `0 0 20px ${timerColors[timerColor]}40`,
          border: `3px solid ${timerColors[timerColor]}`,
        }}>
          <span style={{
            fontSize: secondsRemaining <= 5 ? '2.5rem' : '2rem',
            fontWeight: 'bold',
            color: timerColors[timerColor],
            animation: isTimerPulsing ? 'pulse 0.5s infinite' : 'none',
          }}>
            {secondsRemaining}s
          </span>
        </div>
      )}

      {/* SVG Circular Simon Board */}
      <div style={{ 
        width: '100%', 
        maxWidth: 'min(75vw, 280px)',
        margin: '0 auto',
      }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          style={{ width: '100%', height: 'auto', touchAction: 'manipulation' }}
        >
          {/* Background circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={outerRadius + 5}
            fill="#1a1a1a"
          />

          {/* Colored wedges */}
          {wedges.map((wedge) => (
            <ColorWedge
              key={wedge.color}
              color={wedge.color}
              isActive={activeColor === wedge.color}
              onClick={() => handleColorClick(wedge.color)}
              disabled={disabled || isShowingSequence || !isInputPhase}
              startAngle={wedge.start}
              endAngle={wedge.end}
              centerX={centerX}
              centerY={centerY}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
            />
          ))}

          {/* Center hub */}
          <circle
            cx={centerX}
            cy={centerY}
            r={innerRadius - 2}
            fill="#1a1a1a"
            stroke="#333"
            strokeWidth="3"
          />

          {/* Center content */}
          {isShowingSequence && sequenceIndex >= 0 ? (
            <>
              <text
                x={centerX}
                y={centerY + 8}
                textAnchor="middle"
                fill="#fff"
                fontSize="32"
                fontWeight="bold"
                fontFamily="Arial, sans-serif"
              >
                {sequenceIndex + 1}
              </text>
              <text
                x={centerX}
                y={centerY + 24}
                textAnchor="middle"
                fill="#888"
                fontSize="12"
                fontFamily="Arial, sans-serif"
              >
                of {sequence.length}
              </text>
            </>
          ) : (
            <>
              <text
                x={centerX}
                y={centerY - 2}
                textAnchor="middle"
                fill="white"
                fontSize="14"
                fontWeight="bold"
                fontFamily="Arial, sans-serif"
                letterSpacing="2"
              >
                ROUND
              </text>
              <text
                x={centerX}
                y={centerY + 18}
                textAnchor="middle"
                fill="white"
                fontSize="24"
                fontWeight="bold"
                fontFamily="Arial, sans-serif"
              >
                {round}
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Player Sequence Display */}
      {isInputPhase && (
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRadius: '0.75rem',
          padding: '0.5rem 1rem',
          width: '100%',
          maxWidth: 'min(75vw, 280px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.25rem',
            minHeight: '1.75rem',
          }}>
            {playerSequence.length > 0 ? (
              <>
                {playerSequence.map((color, i) => (
                  <span key={i} style={{ fontSize: '1.25rem' }}>
                    {getColorEmoji(color)}
                  </span>
                ))}
              </>
            ) : (
              <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                Tap colors to repeat
              </span>
            )}
            <span style={{ 
              color: '#6b7280', 
              fontSize: '0.75rem', 
              marginLeft: '0.5rem',
              fontWeight: '600',
            }}>
              {playerSequence.length}/{sequence.length}
            </span>
          </div>
        </div>
      )}

      {/* Submit Button - Prominent purple like other buttons */}
      {isInputPhase && (
        <button
          onClick={() => {
            if (canSubmit && 'vibrate' in navigator) {
              navigator.vibrate(100);
            }
            onSubmit();
          }}
          disabled={!canSubmit}
          className={canSubmit ? 'arcade-btn arcade-btn-green' : ''}
          style={{
            width: '100%',
            maxWidth: 'min(75vw, 280px)',
            padding: '0.875rem 1.5rem',
            borderRadius: '9999px',
            fontWeight: 'bold',
            fontSize: '1.125rem',
            border: 'none',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            touchAction: 'manipulation',
            background: canSubmit 
              ? 'linear-gradient(180deg, #22c55e 0%, #16a34a 50%, #15803d 100%)'
              : '#6b7280',
            color: '#ffffff',
            boxShadow: canSubmit 
              ? '0 4px 0 0 #166534, 0 6px 12px rgba(22, 101, 52, 0.3)'
              : 'none',
            opacity: canSubmit ? 1 : 0.5,
          }}
        >
          {canSubmit ? '✅ SUBMIT' : `${playerSequence.length}/${sequence.length} colors`}
        </button>
      )}
    </div>
  );
};

export default CircularSimonBoard;
