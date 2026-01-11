/**
 * Haptic Service
 * 
 * Provides different vibration patterns for game events.
 * Creates tactile feedback that enhances the game feel.
 */

// =============================================================================
// HAPTIC PATTERNS
// =============================================================================

const PATTERNS = {
  // Light tap - color button press
  tap: 10,
  
  // Medium press - UI button press
  press: 50,
  
  // Success rhythm - correct answer
  success: [50, 30, 50],
  
  // Error staccato - wrong answer
  error: [100, 50, 100, 50, 100],
  
  // Dramatic - elimination
  eliminated: [200, 100, 300],
  
  // Celebration - victory
  victory: [50, 30, 50, 30, 50, 30, 200],
  
  // Countdown tick
  tick: 30,
  
  // Sequence color shown
  sequenceColor: 80,
};

// =============================================================================
// HAPTIC SERVICE
// =============================================================================

class HapticService {
  private isSupported: boolean;

  constructor() {
    this.isSupported = 'vibrate' in navigator;
  }

  /**
   * Check if haptics are supported
   */
  canVibrate(): boolean {
    return this.isSupported;
  }

  /**
   * Generic vibrate with pattern
   */
  private vibrate(pattern: number | number[]): void {
    if (!this.isSupported) return;
    
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Silently fail if vibration fails
    }
  }

  /**
   * Light tap for color buttons
   */
  tap(): void {
    this.vibrate(PATTERNS.tap);
  }

  /**
   * Medium press for UI buttons
   */
  press(): void {
    this.vibrate(PATTERNS.press);
  }

  /**
   * Success pattern for correct answers
   */
  success(): void {
    this.vibrate(PATTERNS.success);
  }

  /**
   * Error pattern for wrong answers
   */
  error(): void {
    this.vibrate(PATTERNS.error);
  }

  /**
   * Dramatic pattern for elimination
   */
  eliminated(): void {
    this.vibrate(PATTERNS.eliminated);
  }

  /**
   * Celebration pattern for victory
   */
  victory(): void {
    this.vibrate(PATTERNS.victory);
  }

  /**
   * Tick for countdown
   */
  tick(): void {
    this.vibrate(PATTERNS.tick);
  }

  /**
   * Sequence color shown
   */
  sequenceColor(): void {
    this.vibrate(PATTERNS.sequenceColor);
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const hapticService = new HapticService();
export default hapticService;
