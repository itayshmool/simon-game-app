/**
 * Entry Page
 * 
 * Vibrant game-inspired design matching splash screen colors
 * Fits mobile viewport without scrolling
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createSession, joinGame } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { SimonSplashScreen } from '../components/ui/SimonSplashScreen';

// Avatar options
const AVATARS = ['🦁', '🐯', '🦊', '🐼', '🐸', '🦄', '🐙', '🦋', '🐨', '🦉'];

export function EntryPage() {
  const [searchParams] = useSearchParams();
  const joinCode = searchParams.get('join')?.toUpperCase() || null;
  
  const [showForm, setShowForm] = useState(!!joinCode);
  const [displayName, setDisplayName] = useState('');
  const [avatarId, setAvatarId] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { setSession } = useAuthStore();
  const navigate = useNavigate();
  
  const isJoining = !!joinCode;

  const handleSubmit = async () => {
    if (displayName.length < 3) return;
    
    setError('');
    setLoading(true);

    try {
      if (isJoining) {
        const response = await joinGame(displayName, avatarId, joinCode);
        setSession(response.session);
      } else {
        const response = await createSession(displayName, avatarId);
        setSession(response.session);
      }
      navigate('/waiting');
    } catch (err) {
      setError(err instanceof Error ? err.message : isJoining ? 'Failed to join game' : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  // Landing page with Simon splash screen
  if (!showForm) {
    return <SimonSplashScreen onComplete={() => setShowForm(true)} />;
  }

  // Create Game Form - fits viewport without scrolling
  return (
    <div 
      style={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        background: 'linear-gradient(135deg, #4ade80 0%, #facc15 25%, #f97316 50%, #ef4444 75%, #3b82f6 100%)',
      }}
    >
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
        
        {/* Simon Board Logo - compact */}
        <div 
          style={{
            width: '4rem',
            height: '4rem',
            position: 'relative',
            borderRadius: '50%',
            overflow: 'hidden',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            border: '3px solid #1f2937',
            flexShrink: 0,
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '50%', background: 'linear-gradient(to bottom right, #4ade80, #16a34a)' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '50%', background: 'linear-gradient(to bottom left, #f87171, #dc2626)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '50%', height: '50%', background: 'linear-gradient(to top right, #facc15, #ca8a04)' }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '50%', height: '50%', background: 'linear-gradient(to top left, #60a5fa, #2563eb)' }} />
          <div style={{ position: 'absolute', top: 0, left: '50%', width: '3px', height: '100%', background: '#1f2937', transform: 'translateX(-50%)' }} />
          <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '3px', background: '#1f2937', transform: 'translateY(-50%)' }} />
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '1.25rem',
              height: '1.25rem',
              borderRadius: '50%',
              background: '#111827',
              border: '2px solid #4ade80',
            }}
          />
        </div>
        
        {/* Join code banner */}
        {isJoining && (
          <div 
            style={{
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              padding: '0.5rem 0.75rem',
            }}
          >
            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.75rem', margin: 0 }}>Joining game</p>
            <p style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.25rem', color: '#1f2937', margin: '0.25rem 0 0 0' }}>{joinCode}</p>
          </div>
        )}
        
        {/* Name Input Card */}
        <div 
          style={{
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            padding: '0.75rem',
          }}
        >
          <label style={{ display: 'block', fontSize: '1rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            What's your name?
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name here..."
            maxLength={12}
            autoFocus
            style={{
              width: '100%',
              padding: '0.625rem 0.75rem',
              backgroundColor: '#f3f4f6',
              border: '2px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              color: '#1f2937',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        
        {/* Avatar Picker Card */}
        <div 
          style={{
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            padding: '0.75rem',
          }}
        >
          <label style={{ display: 'block', fontSize: '1rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            Pick your avatar:
          </label>
          
          {/* Horizontal scrolling avatars */}
          <div style={{ position: 'relative' }}>
            <div 
              style={{
                display: 'flex',
                gap: '0.5rem',
                overflowX: 'auto',
                paddingBottom: '0.25rem',
                paddingRight: '1.5rem',
                scrollbarWidth: 'none',
              }}
            >
              {AVATARS.map((emoji, i) => {
                const isSelected = avatarId === String(i + 1);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAvatarId(String(i + 1))}
                    style={{
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <div 
                      style={{
                        width: '2.75rem',
                        height: '2.75rem',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        transition: 'all 0.15s',
                        border: isSelected ? '3px solid #22c55e' : '2px solid #e5e7eb',
                        backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                        boxShadow: isSelected ? '0 2px 8px rgba(34,197,94,0.3)' : 'none',
                      }}
                    >
                      {emoji}
                    </div>
                    {/* Selection dot */}
                    <div 
                      style={{
                        height: '4px',
                        width: '4px',
                        borderRadius: '50%',
                        marginTop: '0.25rem',
                        backgroundColor: isSelected ? '#22c55e' : 'transparent',
                      }}
                    />
                  </button>
                );
              })}
            </div>
            
            {/* Fade gradient */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '2rem',
                height: '100%',
                pointerEvents: 'none',
                background: 'linear-gradient(to right, transparent, #ffffff)',
              }}
            />
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div 
            style={{
              width: '100%',
              backgroundColor: '#fef2f2',
              border: '2px solid #fecaca',
              color: '#b91c1c',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}
        
        {/* Create Game Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || displayName.length < 3}
          style={{
            width: '100%',
            padding: '0.875rem',
            borderRadius: '9999px',
            fontWeight: 'bold',
            fontSize: '1.125rem',
            color: '#ffffff',
            border: '2px solid #9333ea',
            cursor: loading || displayName.length < 3 ? 'not-allowed' : 'pointer',
            opacity: loading || displayName.length < 3 ? 0.5 : 1,
            background: 'linear-gradient(180deg, #c084fc 0%, #a855f7 50%, #7c3aed 100%)',
            boxShadow: loading || displayName.length < 3 
              ? 'none' 
              : '0 4px 0 0 #581c87, 0 6px 12px rgba(88, 28, 135, 0.3)',
            transition: 'all 0.15s ease-out',
            marginTop: '0.25rem',
          }}
        >
          {loading ? 'Loading...' : isJoining ? 'JOIN GAME' : 'CREATE GAME'}
        </button>
      </div>
    </div>
  );
}
