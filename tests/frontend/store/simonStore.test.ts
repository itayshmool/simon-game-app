/**
 * Simon Store Tests
 * 
 * Tests for the Simon game state management.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useSimonStore } from '../../../frontend/src/store/simonStore';

describe('Simon Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useSimonStore.setState({
      gameState: null,
      isShowingSequence: false,
      currentSequence: [],
      currentRound: 1,
      isInputPhase: false,
      playerSequence: [],
      canSubmit: false,
      lastResult: null,
      message: 'Waiting for game to start...',
      isGameActive: false,
      isGameOver: false,
      gameWinner: null,
      finalScores: [],
      isEliminated: false,
      scores: {},
      submittedPlayers: [],
      secondsRemaining: 0,
      timerColor: 'green',
      isTimerPulsing: false,
    });
  });

  // ===========================================================================
  // RESET GAME TESTS
  // ===========================================================================

  describe('resetGame', () => {
    it('should reset isGameOver to false', () => {
      // Set game over state
      useSimonStore.setState({ isGameOver: true });
      expect(useSimonStore.getState().isGameOver).toBe(true);
      
      // Reset game
      useSimonStore.getState().resetGame();
      
      // Assert isGameOver is false
      expect(useSimonStore.getState().isGameOver).toBe(false);
    });

    it('should clear gameWinner', () => {
      // Set winner
      useSimonStore.setState({ 
        gameWinner: { playerId: 'p1', name: 'Alice', score: 10 } 
      });
      expect(useSimonStore.getState().gameWinner).not.toBeNull();
      
      // Reset game
      useSimonStore.getState().resetGame();
      
      // Assert gameWinner is null
      expect(useSimonStore.getState().gameWinner).toBeNull();
    });

    it('should clear finalScores', () => {
      // Set final scores
      useSimonStore.setState({ 
        finalScores: [
          { playerId: 'p1', name: 'Alice', score: 10 },
          { playerId: 'p2', name: 'Bob', score: 5 },
        ]
      });
      expect(useSimonStore.getState().finalScores).toHaveLength(2);
      
      // Reset game
      useSimonStore.getState().resetGame();
      
      // Assert finalScores is empty
      expect(useSimonStore.getState().finalScores).toHaveLength(0);
    });

    it('should reset isEliminated to false', () => {
      // Set eliminated
      useSimonStore.setState({ isEliminated: true });
      expect(useSimonStore.getState().isEliminated).toBe(true);
      
      // Reset game
      useSimonStore.getState().resetGame();
      
      // Assert isEliminated is false
      expect(useSimonStore.getState().isEliminated).toBe(false);
    });

    it('should clear scores', () => {
      // Set scores
      useSimonStore.setState({ 
        scores: { 'p1': 10, 'p2': 5 }
      });
      expect(Object.keys(useSimonStore.getState().scores)).toHaveLength(2);
      
      // Reset game
      useSimonStore.getState().resetGame();
      
      // Assert scores is empty
      expect(Object.keys(useSimonStore.getState().scores)).toHaveLength(0);
    });

    it('should clear submittedPlayers', () => {
      // Set submitted players
      useSimonStore.setState({ submittedPlayers: ['p1', 'p2'] });
      expect(useSimonStore.getState().submittedPlayers).toHaveLength(2);
      
      // Reset game
      useSimonStore.getState().resetGame();
      
      // Assert submittedPlayers is empty
      expect(useSimonStore.getState().submittedPlayers).toHaveLength(0);
    });

    it('should reset game state fields', () => {
      // Set active game state
      useSimonStore.setState({
        isGameActive: true,
        currentSequence: ['red', 'blue', 'green'],
        currentRound: 5,
        isShowingSequence: true,
        isInputPhase: true,
        playerSequence: ['red', 'blue'],
        canSubmit: true,
      });
      
      // Reset game
      useSimonStore.getState().resetGame();
      
      // Assert all game state fields are reset
      const state = useSimonStore.getState();
      expect(state.isGameActive).toBe(false);
      expect(state.currentSequence).toHaveLength(0);
      expect(state.currentRound).toBe(1);
      expect(state.isShowingSequence).toBe(false);
      expect(state.isInputPhase).toBe(false);
      expect(state.playerSequence).toHaveLength(0);
      expect(state.canSubmit).toBe(false);
    });

    it('should reset timer state', () => {
      // Set timer state
      useSimonStore.setState({
        secondsRemaining: 10,
        timerColor: 'red',
        isTimerPulsing: true,
      });
      
      // Reset game
      useSimonStore.getState().resetGame();
      
      // Assert timer state is reset
      const state = useSimonStore.getState();
      expect(state.secondsRemaining).toBe(0);
      expect(state.timerColor).toBe('green');
      expect(state.isTimerPulsing).toBe(false);
    });

    it('should reset message to waiting state', () => {
      // Set a game message
      useSimonStore.setState({ message: 'Round 5 - Watch the sequence!' });
      
      // Reset game
      useSimonStore.getState().resetGame();
      
      // Assert message is reset
      expect(useSimonStore.getState().message).toBe('Waiting for game to start...');
    });
  });

  // ===========================================================================
  // ADD COLOR TO SEQUENCE TESTS
  // ===========================================================================

  describe('addColorToSequence', () => {
    it('should add color to playerSequence', () => {
      useSimonStore.setState({ 
        currentSequence: ['red', 'blue', 'green'],
        playerSequence: [],
      });
      
      useSimonStore.getState().addColorToSequence('red');
      
      expect(useSimonStore.getState().playerSequence).toEqual(['red']);
    });

    it('should set canSubmit to true when sequence is complete', () => {
      useSimonStore.setState({ 
        currentSequence: ['red', 'blue'],
        playerSequence: ['red'],
        canSubmit: false,
      });
      
      useSimonStore.getState().addColorToSequence('blue');
      
      expect(useSimonStore.getState().canSubmit).toBe(true);
      expect(useSimonStore.getState().playerSequence).toEqual(['red', 'blue']);
    });

    it('should not set canSubmit if sequence is incomplete', () => {
      useSimonStore.setState({ 
        currentSequence: ['red', 'blue', 'green'],
        playerSequence: [],
        canSubmit: false,
      });
      
      useSimonStore.getState().addColorToSequence('red');
      
      expect(useSimonStore.getState().canSubmit).toBe(false);
    });
  });
});
