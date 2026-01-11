import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useThemeStore } from './store/themeStore'

/**
 * Theme Provider - Initializes theme on app load
 */
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const initTheme = useThemeStore((state) => state.initTheme);
  
  useEffect(() => {
    initTheme();
  }, [initTheme]);
  
  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
