/**
 * Toast Notification Component
 * 
 * Shows temporary success/error messages as a floating overlay
 */

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColors: Record<string, string> = {
    success: '#22c55e',
    error: '#ef4444',
    info: '#3b82f6',
  };

  const icons: Record<string, string> = {
    success: '✅',
    error: '❌',
    info: '👋',
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      <div
        style={{
          backgroundColor: bgColors[type],
          color: '#ffffff',
          padding: '0.75rem 1.25rem',
          borderRadius: '9999px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          minWidth: '200px',
          maxWidth: '90vw',
        }}
      >
        <span style={{ fontSize: '1.25rem' }}>{icons[type]}</span>
        <span style={{ fontWeight: '600', fontSize: '0.9rem', flex: 1 }}>{message}</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.8)',
            cursor: 'pointer',
            fontSize: '1rem',
            padding: '0 0.25rem',
          }}
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
