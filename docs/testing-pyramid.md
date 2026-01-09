# Testing Pyramid Quick Reference

## The Pyramid

```
           ╱╲
          ╱  ╲         E2E Tests (5%)
         ╱____╲        • Slow, expensive, brittle
        ╱      ╲       • Critical paths only
       ╱        ╲      
      ╱  Integr. ╲     Integration Tests (25%)
     ╱____________╲    • API endpoints
    ╱              ╲   • Service interactions
   ╱                ╲  
  ╱   Unit Tests     ╲ Unit Tests (70%)
 ╱____________________╲• Fast, isolated, reliable
```

## Unit Tests (70%)

### What to Test
- Pure functions
- Utility functions
- Component logic (not styling)
- Business rules
- Validators
- Formatters

### Example
```typescript
describe('formatCurrency', () => {
  it('formats positive numbers', () => {
    expect(formatCurrency(123.45)).toBe('$123.45');
  });
  
  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });
  
  it('handles negative', () => {
    expect(formatCurrency(-50)).toBe('-$50.00');
  });
});
```

### Characteristics
- **Fast**: Milliseconds
- **Isolated**: No external dependencies
- **Deterministic**: Same input = same output
- **Focused**: Test one thing

## Integration Tests (25%)

### What to Test
- API endpoints (full cycle)
- Database operations
- External service calls
- Multi-component flows
- State management + side effects

### Example
```typescript
describe('POST /api/users', () => {
  it('creates user and returns 201', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', name: 'Test' });
    
    expect(res.status).toBe(201);
    
    // Verify in database
    const user = await db.users.findOne({ 
      email: 'test@example.com' 
    });
    expect(user).toBeDefined();
  });
});
```

### Characteristics
- **Moderate speed**: Seconds
- **Real dependencies**: Database, APIs
- **Isolated environment**: Test DB
- **End-to-end flow**: Multiple layers

## E2E Tests (5%)

### What to Test (CRITICAL PATHS ONLY)
- User registration + login
- Checkout flow (e-commerce)
- Payment processing
- Core user journey

### Example
```typescript
test('user signup flow', async ({ page }) => {
  await page.goto('/signup');
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'SecurePass123');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('h1')).toHaveText('Welcome!');
});
```

### Characteristics
- **Slow**: Minutes
- **Expensive**: Require full environment
- **Brittle**: UI changes break tests
- **Complete**: Real browser, real interactions

## Coverage Targets

| Type | Minimum | Critical Paths |
|------|---------|----------------|
| **Overall** | 70% | 90%+ |
| **Business Logic** | 90%+ | 100% |
| **Utilities** | 90%+ | - |
| **API Endpoints** | 80%+ | 100% |
| **UI Components** | 60% | - |

## Test Organization

```
src/
├── utils/
│   ├── validation.ts
│   └── validation.test.ts      # Unit tests (co-located)
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx         # Unit tests (co-located)
└── services/
    ├── userService.ts
    └── userService.test.ts

tests/
├── integration/
│   ├── api/
│   │   └── users.test.ts       # Integration tests
│   └── database/
│       └── queries.test.ts
└── e2e/
    ├── signup.spec.ts          # E2E tests
    └── checkout.spec.ts
```

## When to Use Each

### Unit Tests
✅ Pure functions  
✅ Utility helpers  
✅ Component logic  
✅ Business rules  
❌ UI appearance  
❌ External APIs  

### Integration Tests
✅ API endpoints  
✅ Database queries  
✅ Service interactions  
✅ State + side effects  
❌ UI interactions  
❌ Browser-specific behavior  

### E2E Tests
✅ Critical user flows  
✅ Cross-browser testing  
✅ Payment processing  
✅ User journeys  
❌ Every feature  
❌ Unit-level logic  

## Testing Best Practices

### 1. Arrange-Act-Assert
```typescript
it('calculates total', () => {
  // Arrange
  const items = [{ price: 10 }, { price: 20 }];
  
  // Act
  const total = calculateTotal(items);
  
  // Assert
  expect(total).toBe(30);
});
```

### 2. One Assertion Per Test
```typescript
// ✅ GOOD
it('validates email format', () => {
  expect(isValid('test@example.com')).toBe(true);
});

it('rejects email without @', () => {
  expect(isValid('invalid')).toBe(false);
});

// ❌ BAD
it('validates emails', () => {
  expect(isValid('test@example.com')).toBe(true);
  expect(isValid('invalid')).toBe(false);
  expect(isValid('')).toBe(false);
});
```

### 3. Descriptive Names
```typescript
// ✅ GOOD
it('should return 401 when user is not authenticated', () => {});

// ❌ BAD
it('test auth', () => {});
```

### 4. Test Edge Cases
```typescript
describe('divide', () => {
  it('divides positive numbers', () => {});
  it('divides negative numbers', () => {});
  it('throws error on division by zero', () => {});
  it('handles very large numbers', () => {});
  it('handles null/undefined', () => {});
});
```

## Test Frameworks

### Frontend
- **Vitest** (Vite projects)
- **Jest** (React, general)
- **Testing Library** (Components)
- **Playwright** (E2E)

### Backend
- **Jest** (Node.js)
- **Supertest** (API testing)
- **pytest** (Python)
- **JUnit** (Java)

## Running Tests

```json
{
  "scripts": {
    "test": "vitest",                    // Watch mode
    "test:run": "vitest run",            // Run once
    "test:coverage": "vitest --coverage", // With coverage
    "test:unit": "vitest run src/",      // Unit only
    "test:integration": "vitest run tests/integration/",
    "test:e2e": "playwright test"
  }
}
```

## CI/CD Integration

```yaml
# .github/workflows/test.yml
- name: Unit tests
  run: npm run test:unit
  
- name: Integration tests
  run: npm run test:integration
  
- name: E2E tests
  run: npm run test:e2e
  
- name: Coverage check
  run: |
    npm run test:coverage
    if [ $COVERAGE -lt 70 ]; then exit 1; fi
```

## Cost vs. Value

| Type | Speed | Cost | Maintenance | Value |
|------|-------|------|-------------|-------|
| Unit | ⚡⚡⚡ | 💰 | ✅✅✅ | 📈📈📈 |
| Integration | ⚡⚡ | 💰💰 | ✅✅ | 📈📈 |
| E2E | ⚡ | 💰💰💰 | ✅ | 📈 |

## Common Anti-Patterns

### ❌ Inverted Pyramid
```
More E2E than unit tests
= Slow, brittle test suite
```

### ❌ Ice Cream Cone
```
Heavy on E2E and unit,
light on integration
= Missing middle layer
```

### ✅ Pyramid
```
Lots of unit tests,
some integration,
few E2E
= Fast, reliable, maintainable
```

## Remember

> **"Write tests. Not too many. Mostly integration."** - Kent C. Dodds

> **"Fast tests = tests that get run."**

---

**70% Unit, 25% Integration, 5% E2E**

