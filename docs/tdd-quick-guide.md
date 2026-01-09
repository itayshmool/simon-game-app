# TDD Quick Reference Guide

## The 3-Step Cycle

```
🔴 RED → ✅ GREEN → 🔄 REFACTOR
```

### 1. 🔴 RED - Write Failing Test
- Write the smallest possible test
- Confirm it **fails** for the right reason
- Don't write implementation yet

### 2. ✅ GREEN - Make It Pass
- Write **minimum** code to pass
- Hardcode if needed (refactor later)
- Make test green **as fast as possible**

### 3. 🔄 REFACTOR - Clean Up
- Improve code quality
- Extract duplications
- Tests must **stay green**

## Quick Example

```typescript
// Step 1: RED - Write failing test
it('calculates 10% discount', () => {
  expect(calculateDiscount(100, 0.10)).toBe(10);
});

// Test fails ❌ (function doesn't exist)

// Step 2: GREEN - Minimal implementation
function calculateDiscount(amount: number, rate: number): number {
  return amount * rate;
}

// Test passes ✅

// Step 3: REFACTOR - Clean up
function calculateDiscount(
  amount: number,
  discountRate: number
): number {
  if (amount < 0) throw new Error('Invalid amount');
  if (discountRate < 0 || discountRate > 1) {
    throw new Error('Invalid discount rate');
  }
  return amount * discountRate;
}

// Tests still pass ✅
```

## Rules (No Exceptions)

❌ **NEVER** write implementation before test  
❌ **NEVER** skip the red phase  
❌ **NEVER** say "I'll test later"  

✅ **ALWAYS** test first  
✅ **ALWAYS** confirm test fails  
✅ **ALWAYS** keep tests green  

## Coverage Targets

| Type | Minimum | Critical Paths |
|------|---------|----------------|
| Overall | 70% | 90%+ |
| Business Logic | 90%+ | 100% |
| Utilities | 90%+ | - |
| UI Components | 60% | - |

## Test Structure

```typescript
describe('Feature or Function Name', () => {
  it('should [expected behavior] when [condition]', () => {
    // Arrange - Set up test data
    const input = someValue;
    
    // Act - Execute the function
    const result = functionUnderTest(input);
    
    // Assert - Verify the result
    expect(result).toBe(expectedValue);
  });
});
```

## When to Apply TDD

| Code Type | TDD? | Why |
|-----------|------|-----|
| Business Logic | ✅ YES | Complex, error-prone |
| API Endpoints | ✅ YES | Contract validation |
| Utilities | ✅ YES | Reusable, must be reliable |
| UI Logic | ✅ YES | State management, interactions |
| UI Styling | ❌ NO | Visual, not testable |
| Config Files | ❌ NO | Static, no logic |

## Common Mistakes

### ❌ Testing Implementation
```typescript
// BAD
it('calls internal method', () => {
  spyOn(service, 'validateInput'); // HOW it works
});
```

### ✅ Testing Behavior
```typescript
// GOOD
it('throws error for invalid input', () => {
  expect(() => service.process(null)).toThrow(); // WHAT it does
});
```

## Benefits

✅ Catch bugs before they exist  
✅ Better API design (test forces good design)  
✅ Living documentation (tests show usage)  
✅ Confidence in refactoring  
✅ Faster debugging  

## Quick Checklist

- [ ] Test written first?
- [ ] Test failed before implementing?
- [ ] Minimum code to pass?
- [ ] Tests still green after refactor?
- [ ] Edge cases covered?
- [ ] Test names descriptive?

## Remember

> **"Code without tests is broken by design."**

> **"Tests first = Design first."**

---

**Red → Green → Refactor. Always.**

