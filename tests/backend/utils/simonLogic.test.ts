/**
 * Simon Logic Unit Tests
 * 
 * Tests for Simon Says game logic including:
 * - Initialization
 * - Timer calculations
 * - Game end conditions
 * - Solo vs multiplayer modes
 */

import { describe, it, expect } from 'vitest';
import {
  initializeSimonGame,
  generateSequence,
  advanceToNextRound,
  calculateTimeoutSeconds,
  calculateTimeoutMs,
  shouldGameEnd,
  getWinner,
  processRoundSubmissions,
} from '../../../src/backend/utils/simonLogic';
import type { Player, SimonGameState, Color } from '../../../src/shared/types';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function createMockPlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i + 1}`,
    displayName: `Player ${i + 1}`,
    avatarId: '1',
    isHost: i === 0,
  }));
}

// =============================================================================
// INITIALIZATION TESTS
// =============================================================================

describe('initializeSimonGame', () => {
  it('should initialize game with single player (solo mode)', () => {
    const players = createMockPlayers(1);
    const gameState = initializeSimonGame(players);

    expect(gameState.gameType).toBe('simon');
    expect(gameState.phase).toBe('showing_sequence');
    expect(gameState.round).toBe(1);
    expect(gameState.sequence.length).toBe(1);
    expect(gameState.timeoutMs).toBe(17000); // 15 + (1 × 2) = 17 seconds
    expect(Object.keys(gameState.playerStates)).toHaveLength(1);
    expect(Object.keys(gameState.scores)).toHaveLength(1);
    expect(gameState.scores['player-1']).toBe(0);
  });

  it('should initialize game with multiple players', () => {
    const players = createMockPlayers(4);
    const gameState = initializeSimonGame(players);

    expect(Object.keys(gameState.playerStates)).toHaveLength(4);
    expect(Object.keys(gameState.scores)).toHaveLength(4);
    
    players.forEach(player => {
      expect(gameState.playerStates[player.id]).toBeDefined();
      expect(gameState.playerStates[player.id].status).toBe('playing');
      expect(gameState.scores[player.id]).toBe(0);
    });
  });

  it('should initialize all player states as playing', () => {
    const players = createMockPlayers(3);
    const gameState = initializeSimonGame(players);

    Object.values(gameState.playerStates).forEach(state => {
      expect(state.status).toBe('playing');
      expect(state.currentInputIndex).toBe(0);
    });
  });
});

// =============================================================================
// SEQUENCE GENERATION TESTS
// =============================================================================

describe('generateSequence', () => {
  it('should generate sequence of correct length', () => {
    const sequence = generateSequence(5);
    expect(sequence).toHaveLength(5);
  });

  it('should only contain valid colors', () => {
    const validColors: Color[] = ['red', 'blue', 'yellow', 'green'];
    const sequence = generateSequence(10);

    sequence.forEach(color => {
      expect(validColors).toContain(color);
    });
  });

  it('should generate different sequences', () => {
    const seq1 = generateSequence(10);
    const seq2 = generateSequence(10);

    // Very unlikely to be identical
    expect(seq1).not.toEqual(seq2);
  });
});

// =============================================================================
// TIMER CALCULATION TESTS (CRITICAL!)
// =============================================================================

describe('calculateTimeoutSeconds', () => {
  it('should calculate correct timeout for round 1', () => {
    expect(calculateTimeoutSeconds(1)).toBe(17); // 15 + (1 × 2)
  });

  it('should calculate correct timeout for round 5', () => {
    expect(calculateTimeoutSeconds(5)).toBe(25); // 15 + (5 × 2)
  });

  it('should calculate correct timeout for round 10', () => {
    expect(calculateTimeoutSeconds(10)).toBe(35); // 15 + (10 × 2)
  });
});

describe('calculateTimeoutMs', () => {
  it('should return milliseconds for round 1', () => {
    expect(calculateTimeoutMs(1)).toBe(17000); // 17 seconds
  });

  it('should return milliseconds for round 5', () => {
    expect(calculateTimeoutMs(5)).toBe(25000); // 25 seconds
  });
});

// =============================================================================
// GAME END CONDITIONS TESTS (CRITICAL FOR SOLO MODE!)
// =============================================================================

describe('shouldGameEnd', () => {
  it('should NOT end game in solo mode with 1 active player', () => {
    const players = createMockPlayers(1);
    const gameState = initializeSimonGame(players);

    // Solo mode: 1 active player, game should continue
    const result = shouldGameEnd(gameState);
    expect(result).toBe(false); // ❌ FAILING TEST - THIS IS THE BUG!
  });

  it('should end game when all players eliminated', () => {
    const players = createMockPlayers(2);
    const gameState = initializeSimonGame(players);

    // Eliminate both players
    gameState.playerStates['player-1'].status = 'eliminated';
    gameState.playerStates['player-2'].status = 'eliminated';

    const result = shouldGameEnd(gameState);
    expect(result).toBe(true);
  });

  it('should end game in multiplayer when 1 player remains', () => {
    const players = createMockPlayers(3);
    const gameState = initializeSimonGame(players);

    // Eliminate 2 players, leave 1
    gameState.playerStates['player-1'].status = 'eliminated';
    gameState.playerStates['player-2'].status = 'eliminated';
    // player-3 still playing

    const result = shouldGameEnd(gameState);
    expect(result).toBe(true); // Only 1 player left = winner
  });

  it('should NOT end game in multiplayer with 2+ players', () => {
    const players = createMockPlayers(4);
    const gameState = initializeSimonGame(players);

    // Eliminate 1 player, leave 3
    gameState.playerStates['player-1'].status = 'eliminated';

    const result = shouldGameEnd(gameState);
    expect(result).toBe(false); // 3 players still playing
  });
});

// =============================================================================
// WINNER DETECTION TESTS
// =============================================================================

describe('getWinner', () => {
  it('should return winner when 1 player remains', () => {
    const players = createMockPlayers(3);
    const gameState = initializeSimonGame(players);

    gameState.playerStates['player-1'].status = 'eliminated';
    gameState.playerStates['player-2'].status = 'eliminated';

    const winner = getWinner(gameState);
    expect(winner).toBe('player-3');
  });

  it('should return null when multiple players remain', () => {
    const players = createMockPlayers(3);
    const gameState = initializeSimonGame(players);

    gameState.playerStates['player-1'].status = 'eliminated';

    const winner = getWinner(gameState);
    expect(winner).toBe(null);
  });

  it('should return highest scorer when all eliminated', () => {
    const players = createMockPlayers(3);
    const gameState = initializeSimonGame(players);

    gameState.playerStates['player-1'].status = 'eliminated';
    gameState.playerStates['player-2'].status = 'eliminated';
    gameState.playerStates['player-3'].status = 'eliminated';

    gameState.scores['player-1'] = 5;
    gameState.scores['player-2'] = 10;
    gameState.scores['player-3'] = 7;

    const winner = getWinner(gameState);
    expect(winner).toBe('player-2'); // Highest score
  });
});

// =============================================================================
// ROUND ADVANCEMENT TESTS
// =============================================================================

describe('advanceToNextRound', () => {
  it('should increment round number', () => {
    const players = createMockPlayers(1);
    const gameState = initializeSimonGame(players);

    const nextState = advanceToNextRound(gameState);
    expect(nextState.round).toBe(2);
  });

  it('should grow sequence by 1', () => {
    const players = createMockPlayers(1);
    const gameState = initializeSimonGame(players);
    
    expect(gameState.sequence.length).toBe(1);
    
    const nextState = advanceToNextRound(gameState);
    expect(nextState.sequence.length).toBe(2);
  });

  it('should preserve previous sequence colors', () => {
    const players = createMockPlayers(1);
    const gameState = initializeSimonGame(players);
    
    const originalSequence = [...gameState.sequence];
    const nextState = advanceToNextRound(gameState);
    
    // First color should be the same
    expect(nextState.sequence[0]).toBe(originalSequence[0]);
  });

  it('should reset player input indices', () => {
    const players = createMockPlayers(2);
    const gameState = initializeSimonGame(players);
    
    gameState.playerStates['player-1'].currentInputIndex = 5;
    gameState.playerStates['player-2'].currentInputIndex = 3;
    
    const nextState = advanceToNextRound(gameState);
    
    expect(nextState.playerStates['player-1'].currentInputIndex).toBe(0);
    expect(nextState.playerStates['player-2'].currentInputIndex).toBe(0);
  });
});

// =============================================================================
// ROUND PROCESSING TESTS
// =============================================================================

describe('processRoundSubmissions', () => {
  it('should eliminate player with wrong answer', () => {
    const players = createMockPlayers(1);
    const gameState = initializeSimonGame(players);
    
    gameState.sequence = ['red'];
    gameState.submissions = {
      'player-1': {
        playerId: 'player-1',
        sequence: ['blue'], // Wrong!
        timestamp: Date.now(),
        isCorrect: false,
      },
    };

    const result = processRoundSubmissions(gameState);
    
    expect(result.eliminations).toHaveLength(1);
    expect(result.eliminations[0].playerId).toBe('player-1');
    expect(result.gameState.playerStates['player-1'].status).toBe('eliminated');
  });

  it('should award point to fastest correct submission', () => {
    const players = createMockPlayers(2);
    const gameState = initializeSimonGame(players);
    
    gameState.sequence = ['red'];
    gameState.submissions = {
      'player-1': {
        playerId: 'player-1',
        sequence: ['red'],
        timestamp: 1000,
        isCorrect: true,
      },
      'player-2': {
        playerId: 'player-2',
        sequence: ['red'],
        timestamp: 2000, // Slower
        isCorrect: true,
      },
    };

    const result = processRoundSubmissions(gameState);
    
    expect(result.roundWinner?.playerId).toBe('player-1');
    expect(result.gameState.scores['player-1']).toBe(1);
    expect(result.gameState.scores['player-2']).toBe(0);
  });

  it('should not award points when all answers wrong', () => {
    const players = createMockPlayers(2);
    const gameState = initializeSimonGame(players);
    
    gameState.sequence = ['red'];
    gameState.submissions = {
      'player-1': {
        playerId: 'player-1',
        sequence: ['blue'],
        timestamp: 1000,
        isCorrect: false,
      },
      'player-2': {
        playerId: 'player-2',
        sequence: ['green'],
        timestamp: 2000,
        isCorrect: false,
      },
    };

    const result = processRoundSubmissions(gameState);
    
    expect(result.roundWinner).toBe(null);
    expect(result.eliminations).toHaveLength(2);
  });
});

// =============================================================================
// INTEGRATION TEST: SOLO MODE FLOW
// =============================================================================

describe('Solo Mode Integration', () => {
  it('should allow solo player to progress through multiple rounds', () => {
    const players = createMockPlayers(1);
    let gameState = initializeSimonGame(players);

    // Round 1
    expect(gameState.round).toBe(1);
    expect(shouldGameEnd(gameState)).toBe(false);

    // Player submits correct answer
    gameState.submissions = {
      'player-1': {
        playerId: 'player-1',
        sequence: [...gameState.sequence],
        timestamp: Date.now(),
        isCorrect: true,
      },
    };

    const result1 = processRoundSubmissions(gameState);
    expect(result1.eliminations).toHaveLength(0);
    expect(shouldGameEnd(result1.gameState)).toBe(false);

    // Advance to round 2
    gameState = advanceToNextRound(result1.gameState);
    expect(gameState.round).toBe(2);
    expect(shouldGameEnd(gameState)).toBe(false);

    // Round 2: Player submits correct answer
    gameState.submissions = {
      'player-1': {
        playerId: 'player-1',
        sequence: [...gameState.sequence],
        timestamp: Date.now(),
        isCorrect: true,
      },
    };

    const result2 = processRoundSubmissions(gameState);
    expect(result2.eliminations).toHaveLength(0);
    expect(shouldGameEnd(result2.gameState)).toBe(false);

    // Solo mode should continue indefinitely until player makes mistake
  });

  it('should end solo game when player makes mistake', () => {
    const players = createMockPlayers(1);
    const gameState = initializeSimonGame(players);

    gameState.sequence = ['red'];
    gameState.submissions = {
      'player-1': {
        playerId: 'player-1',
        sequence: ['blue'], // Wrong!
        timestamp: Date.now(),
        isCorrect: false,
      },
    };

    const result = processRoundSubmissions(gameState);
    
    expect(result.eliminations).toHaveLength(1);
    expect(result.gameState.playerStates['player-1'].status).toBe('eliminated');
    expect(shouldGameEnd(result.gameState)).toBe(true); // 0 active players
  });
});

// =============================================================================
// DIFFICULTY TESTS
// =============================================================================

describe('Difficulty Settings', () => {
  describe('initializeSimonGame with difficulty', () => {
    it('should default to medium difficulty', () => {
      const players = createMockPlayers(1);
      const gameState = initializeSimonGame(players);
      
      expect(gameState.difficulty).toBe('medium');
    });

    it('should set easy difficulty', () => {
      const players = createMockPlayers(1);
      const gameState = initializeSimonGame(players, 'easy');
      
      expect(gameState.difficulty).toBe('easy');
    });

    it('should set hard difficulty', () => {
      const players = createMockPlayers(1);
      const gameState = initializeSimonGame(players, 'hard');
      
      expect(gameState.difficulty).toBe('hard');
    });

    it('should store difficulty in game state', () => {
      const players = createMockPlayers(2);
      const easyGame = initializeSimonGame(players, 'easy');
      const hardGame = initializeSimonGame(players, 'hard');
      
      expect(easyGame.difficulty).toBe('easy');
      expect(hardGame.difficulty).toBe('hard');
    });
  });

  describe('advanceToNextRound preserves difficulty', () => {
    it('should preserve easy difficulty across rounds', () => {
      const players = createMockPlayers(1);
      let gameState = initializeSimonGame(players, 'easy');
      
      gameState = advanceToNextRound(gameState);
      expect(gameState.difficulty).toBe('easy');
      
      gameState = advanceToNextRound(gameState);
      expect(gameState.difficulty).toBe('easy');
    });

    it('should preserve hard difficulty across rounds', () => {
      const players = createMockPlayers(1);
      let gameState = initializeSimonGame(players, 'hard');
      
      gameState = advanceToNextRound(gameState);
      expect(gameState.difficulty).toBe('hard');
    });
  });
});
