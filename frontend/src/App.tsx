/**
 * Main App Component
 * 
 * Routes and navigation.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EntryPage } from './pages/EntryPage';
import { WaitingRoomPage } from './pages/WaitingRoomPage';
import { LandscapeWarning } from './components/ui/LandscapeWarning';

function App() {
  return (
    <BrowserRouter>
      <LandscapeWarning />
      <Routes>
        <Route path="/" element={<EntryPage />} />
        <Route path="/waiting" element={<WaitingRoomPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
