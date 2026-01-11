/**
 * Simon Splash Screen Component
 * 
 * Shows the SVG splash design and auto-transitions after duration
 */

import { useEffect } from 'react';

interface SimonSplashScreenProps {
  onComplete: () => void;
  duration?: number; // in milliseconds, default 1000 (1 second)
}

export function SimonSplashScreen({ onComplete, duration = 1000 }: SimonSplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  return (
    <div 
      className="fixed inset-0 w-screen h-screen overflow-hidden cursor-pointer"
      onClick={onComplete} // Allow tap to skip
      style={{ 
        background: `radial-gradient(ellipse at 30% 30%, #4ade80 0%, #facc15 25%, #f97316 50%, #ef4444 75%, #3b82f6 100%)`,
      }}
    >
      {/* SVG Splash Screen - covers full viewport */}
      <img 
        src="/simon-splash.svg" 
        alt="Simon's Sequence"
        className="w-full h-full object-cover pointer-events-none"
        draggable={false}
      />
    </div>
  );
}
