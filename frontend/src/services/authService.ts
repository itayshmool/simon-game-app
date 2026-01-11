/**
 * Auth Service
 * 
 * HTTP API calls for session management.
 */

import type { 
  CreateSessionResponse, 
  JoinGameResponse, 
  VerifySessionResponse,
  Difficulty,
} from '../shared/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Create a new game session (host)
 */
export async function createSession(
  displayName: string,
  avatarId: string,
  difficulty: Difficulty = 'medium'
): Promise<CreateSessionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/create-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // CRITICAL: Send/receive cookies
    body: JSON.stringify({ displayName, avatarId, difficulty }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create session');
  }

  return response.json();
}

/**
 * Join an existing game
 */
export async function joinGame(
  displayName: string,
  avatarId: string,
  gameCode: string
): Promise<JoinGameResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/join-game`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // CRITICAL: Send/receive cookies
    body: JSON.stringify({ displayName, avatarId, gameCode }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to join game');
  }

  return response.json();
}

/**
 * Verify if session is valid (on page load)
 */
export async function verifySession(): Promise<VerifySessionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-session`, {
    method: 'GET',
    credentials: 'include', // CRITICAL: Send cookies
  });

  if (!response.ok) {
    return { valid: false };
  }

  return response.json();
}

/**
 * Logout and leave game
 */
export async function logout(): Promise<void> {
  await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}
