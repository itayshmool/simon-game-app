/**
 * Theme Toggle Component
 * 
 * Switches between light and dark mode with animated icons.
 */

import { useThemeStore } from '../../store/themeStore';

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0.25rem',
      }}
    >
      <div
        style={{
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '50%',
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          backdropFilter: 'blur(8px)',
          border: `2px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          transition: 'all 0.3s ease',
          boxShadow: isDark 
            ? '0 2px 8px rgba(0,0,0,0.3)' 
            : '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        {isDark ? '☀️' : '🌙'}
      </div>
      <span
        style={{
          fontSize: '0.625rem',
          fontWeight: 'bold',
          color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {isDark ? 'Light' : 'Dark'}
      </span>
    </button>
  );
}
