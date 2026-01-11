/**
 * Score Pop Component
 * 
 * Floating "+points" animation that appears when score increases.
 * Creates dopamine hit on correct answers.
 */

import { useEffect, useState } from 'react';

interface ScorePopProps {
  points: number;
  onComplete: () => void;
}

export function ScorePop({ points, onComplete }: ScorePopProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Animation duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 1200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible || points <= 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '30%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        pointerEvents: 'none',
        animation: 'score-pop-float 1.2s ease-out forwards',
      }}
    >
      <span
        className="font-score"
        style={{
          fontSize: '3rem',
          fontWeight: '900',
          color: '#22c55e',
          textShadow: `
            0 0 20px rgba(34, 197, 94, 0.8),
            0 0 40px rgba(34, 197, 94, 0.6),
            0 2px 4px rgba(0, 0, 0, 0.3)
          `,
        }}
      >
        +{points}
      </span>

      <style>{`
        @keyframes score-pop-float {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(0) scale(0.5);
          }
          20% {
            opacity: 1;
            transform: translateX(-50%) translateY(-20px) scale(1.2);
          }
          40% {
            transform: translateX(-50%) translateY(-40px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-100px) scale(0.8);
          }
        }
      `}</style>
    </div>
  );
}

export default ScorePop;
