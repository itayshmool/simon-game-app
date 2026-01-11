/**
 * Mute Button Component
 * 
 * Toggle button for muting/unmuting game sounds.
 * Persists preference in localStorage.
 */

import { useState, useEffect } from 'react';
import { soundService } from '../../services/soundService';

export const MuteButton: React.FC = () => {
  const [isMuted, setIsMuted] = useState(soundService.getMuted());

  // Sync with sound service on mount
  useEffect(() => {
    setIsMuted(soundService.getMuted());
  }, []);

  const handleToggle = () => {
    const newMuted = soundService.toggleMute();
    setIsMuted(newMuted);
  };

  return (
    <button
      onClick={handleToggle}
      style={{
        width: '2.5rem',
        height: '2.5rem',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isMuted ? 'rgba(107, 114, 128, 0.8)' : 'rgba(34, 197, 94, 0.8)',
        backdropFilter: 'blur(8px)',
        border: `2px solid ${isMuted ? 'rgba(107, 114, 128, 0.5)' : 'rgba(34, 197, 94, 0.5)'}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        touchAction: 'manipulation',
        transition: 'all 0.2s ease',
        fontSize: '1.25rem',
      }}
      aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
      title={isMuted ? 'Click to unmute' : 'Click to mute'}
    >
      {isMuted ? '🔇' : '🔊'}
    </button>
  );
};

export default MuteButton;
