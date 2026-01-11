/**
 * Entry Page
 * 
 * - Landing: Only "Create Game" button
 * - Invite link (?join=CODE): Direct to join form
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createSession, joinGame } from '../services/authService';
import { useAuthStore } from '../store/authStore';

export function EntryPage() {
  const [searchParams] = useSearchParams();
  const joinCode = searchParams.get('join')?.toUpperCase() || null;
  
  // If invite link, go straight to join form; otherwise show landing
  const [showForm, setShowForm] = useState(!!joinCode);
  const [displayName, setDisplayName] = useState('');
  const [avatarId, setAvatarId] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { setSession } = useAuthStore();
  const navigate = useNavigate();
  
  const isJoining = !!joinCode;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isJoining) {
        // Join existing game via invite link
        const response = await joinGame(displayName, avatarId, joinCode);
        setSession(response.session);
      } else {
        // Create new game
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

  // Landing page - only "Create Game" button
  if (!showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full">
          <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2">🎮 Simon Says</h1>
          <p className="text-gray-600 text-center mb-6 sm:mb-8 text-sm sm:text-base">Color Race Edition</p>
          
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 active:scale-98 text-white font-bold py-3 sm:py-4 px-6 rounded-lg sm:rounded-xl transition-all duration-75 text-base sm:text-lg min-h-[56px]"
            style={{ touchAction: 'manipulation' }}
          >
            Create Game
          </button>
        </div>
      </div>
    );
  }

  // Form - for both creating and joining (via invite link)
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full">
        {!isJoining && (
          <button
            onClick={() => setShowForm(false)}
            className="text-gray-600 hover:text-gray-800 active:text-gray-900 mb-4 text-sm sm:text-base"
          >
            ← Back
          </button>
        )}
        
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
          {isJoining ? 'Join Game' : 'Create Game'}
        </h2>
        
        {isJoining && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm mb-4">
            🎮 Joining game: <span className="font-mono font-bold">{joinCode}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              minLength={3}
              maxLength={12}
              required
              autoFocus
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-sm sm:text-base"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Avatar
            </label>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8'].map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAvatarId(id)}
                  className={`p-2.5 sm:p-4 rounded-lg border-2 transition-all duration-75 active:scale-95 min-h-[56px] min-w-[56px] ${
                    avatarId === id
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 active:border-gray-400'
                  }`}
                  style={{ touchAction: 'manipulation' }}
                >
                  <span className="text-2xl sm:text-3xl">{['😀', '🎮', '🚀', '⚡', '🎨', '🎯', '🏆', '🌟'][parseInt(id) - 1]}</span>
                </button>
              ))}
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 active:scale-98 disabled:bg-gray-400 text-white font-bold py-3 sm:py-4 px-6 rounded-lg sm:rounded-xl transition-all duration-75 text-base sm:text-lg min-h-[56px]"
            style={{ touchAction: 'manipulation' }}
          >
            {loading ? 'Loading...' : isJoining ? 'Join Game' : 'Create Game'}
          </button>
        </form>
      </div>
    </div>
  );
}
