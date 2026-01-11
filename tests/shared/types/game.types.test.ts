/**
 * Game Types Tests
 * 
 * Tests for difficulty settings and Simon constants.
 */

import { describe, it, expect } from 'vitest';
import { 
  DIFFICULTY_SETTINGS, 
  SIMON_CONSTANTS,
  getSimonConstantsForDifficulty,
} from '../../../src/shared/types/game.types';
import type { Difficulty } from '../../../src/shared/types/platform.types';

describe('Difficulty Settings', () => {
  it('should have all three difficulty levels', () => {
    expect(DIFFICULTY_SETTINGS).toHaveProperty('easy');
    expect(DIFFICULTY_SETTINGS).toHaveProperty('medium');
    expect(DIFFICULTY_SETTINGS).toHaveProperty('hard');
  });

  it('should have required timing properties for each level', () => {
    const requiredProps = [
      'showColorDurationMs',
      'showColorGapMs',
      'initialTimeoutMs',
      'timeoutDecrementMs',
      'minTimeoutMs',
    ];

    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
    
    for (const difficulty of difficulties) {
      for (const prop of requiredProps) {
        expect(DIFFICULTY_SETTINGS[difficulty]).toHaveProperty(prop);
        expect(typeof DIFFICULTY_SETTINGS[difficulty][prop as keyof typeof DIFFICULTY_SETTINGS['easy']]).toBe('number');
      }
    }
  });

  it('should have easy slower than medium', () => {
    expect(DIFFICULTY_SETTINGS.easy.showColorDurationMs).toBeGreaterThan(
      DIFFICULTY_SETTINGS.medium.showColorDurationMs
    );
    expect(DIFFICULTY_SETTINGS.easy.showColorGapMs).toBeGreaterThan(
      DIFFICULTY_SETTINGS.medium.showColorGapMs
    );
    expect(DIFFICULTY_SETTINGS.easy.initialTimeoutMs).toBeGreaterThan(
      DIFFICULTY_SETTINGS.medium.initialTimeoutMs
    );
  });

  it('should have medium slower than hard', () => {
    expect(DIFFICULTY_SETTINGS.medium.showColorDurationMs).toBeGreaterThan(
      DIFFICULTY_SETTINGS.hard.showColorDurationMs
    );
    expect(DIFFICULTY_SETTINGS.medium.showColorGapMs).toBeGreaterThan(
      DIFFICULTY_SETTINGS.hard.showColorGapMs
    );
    expect(DIFFICULTY_SETTINGS.medium.initialTimeoutMs).toBeGreaterThan(
      DIFFICULTY_SETTINGS.hard.initialTimeoutMs
    );
  });

  it('should have specific values for easy difficulty', () => {
    expect(DIFFICULTY_SETTINGS.easy.showColorDurationMs).toBe(900);
    expect(DIFFICULTY_SETTINGS.easy.showColorGapMs).toBe(300);
    expect(DIFFICULTY_SETTINGS.easy.initialTimeoutMs).toBe(10000);
    expect(DIFFICULTY_SETTINGS.easy.minTimeoutMs).toBe(3000);
  });

  it('should have specific values for medium difficulty', () => {
    expect(DIFFICULTY_SETTINGS.medium.showColorDurationMs).toBe(600);
    expect(DIFFICULTY_SETTINGS.medium.showColorGapMs).toBe(200);
    expect(DIFFICULTY_SETTINGS.medium.initialTimeoutMs).toBe(5000);
    expect(DIFFICULTY_SETTINGS.medium.minTimeoutMs).toBe(1500);
  });

  it('should have specific values for hard difficulty', () => {
    expect(DIFFICULTY_SETTINGS.hard.showColorDurationMs).toBe(350);
    expect(DIFFICULTY_SETTINGS.hard.showColorGapMs).toBe(150);
    expect(DIFFICULTY_SETTINGS.hard.initialTimeoutMs).toBe(4000);
    expect(DIFFICULTY_SETTINGS.hard.minTimeoutMs).toBe(1000);
  });
});

describe('SIMON_CONSTANTS', () => {
  it('should use medium difficulty values by default', () => {
    expect(SIMON_CONSTANTS.SHOW_COLOR_DURATION_MS).toBe(DIFFICULTY_SETTINGS.medium.showColorDurationMs);
    expect(SIMON_CONSTANTS.SHOW_COLOR_GAP_MS).toBe(DIFFICULTY_SETTINGS.medium.showColorGapMs);
    expect(SIMON_CONSTANTS.INITIAL_TIMEOUT_MS).toBe(DIFFICULTY_SETTINGS.medium.initialTimeoutMs);
    expect(SIMON_CONSTANTS.MIN_TIMEOUT_MS).toBe(DIFFICULTY_SETTINGS.medium.minTimeoutMs);
  });

  it('should have sequence settings', () => {
    expect(SIMON_CONSTANTS.INITIAL_SEQUENCE_LENGTH).toBe(1);
    expect(SIMON_CONSTANTS.SEQUENCE_INCREMENT).toBe(1);
  });
});

describe('getSimonConstantsForDifficulty', () => {
  it('should return easy difficulty settings', () => {
    const constants = getSimonConstantsForDifficulty('easy');
    expect(constants.SHOW_COLOR_DURATION_MS).toBe(900);
    expect(constants.SHOW_COLOR_GAP_MS).toBe(300);
    expect(constants.INITIAL_TIMEOUT_MS).toBe(10000);
  });

  it('should return medium difficulty settings', () => {
    const constants = getSimonConstantsForDifficulty('medium');
    expect(constants.SHOW_COLOR_DURATION_MS).toBe(600);
    expect(constants.SHOW_COLOR_GAP_MS).toBe(200);
    expect(constants.INITIAL_TIMEOUT_MS).toBe(5000);
  });

  it('should return hard difficulty settings', () => {
    const constants = getSimonConstantsForDifficulty('hard');
    expect(constants.SHOW_COLOR_DURATION_MS).toBe(350);
    expect(constants.SHOW_COLOR_GAP_MS).toBe(150);
    expect(constants.INITIAL_TIMEOUT_MS).toBe(4000);
  });

  it('should default to medium when no difficulty provided', () => {
    const constants = getSimonConstantsForDifficulty();
    expect(constants.SHOW_COLOR_DURATION_MS).toBe(600);
  });

  it('should always include sequence settings', () => {
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
    
    for (const difficulty of difficulties) {
      const constants = getSimonConstantsForDifficulty(difficulty);
      expect(constants.INITIAL_SEQUENCE_LENGTH).toBe(1);
      expect(constants.SEQUENCE_INCREMENT).toBe(1);
    }
  });
});
