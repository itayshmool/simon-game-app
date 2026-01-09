# AI Prompting Guide for Development

## Core Principle

**AI implements, humans architect.**

## Using Cursor Rules

### What Are Cursor Rules?

Project-specific instruction files (`.cursorrules`, `.cursorrules-*`) that teach AI your context.

### Create Rules Files

```
.cursorrules-*
├── .cursorrules-tdd          # Test-first workflow
├── .cursorrules-testing      # Coverage targets
├── .cursorrules-security     # Auth patterns
├── .cursorrules-architecture # System design
└── .cursorrules-performance  # Optimization rules
```

## Effective Prompts

### ❌ Bad Prompts (Vague)

```
"Add authentication"
"Fix the bug"
"Make it responsive"
"Optimize the code"
```

### ✅ Good Prompts (Specific)

```
"Implement JWT authentication following .cursorrules-security:
- HTTP-only cookies
- 30-day expiration
- Refresh token rotation
Write tests first per .cursorrules-tdd"

"The login form fails when email contains '+' character.
Steps to reproduce: Enter 'user+test@example.com'
Expected: Login succeeds
Actual: 400 validation error
Add test reproducing the bug, then fix per TDD workflow."

"Responsive layout breaks on 375px viewport (iPhone SE).
Current: Horizontal scroll appears
Expected: No scroll, content fits screen
Follow mobile-first principles from .cursorrules-mobile-first."
```

## Prompt Structure

### Template

```
[CONTEXT] + [REQUIREMENT] + [CONSTRAINTS] + [REFERENCE]
```

### Examples

```
Context: User registration form in /pages/SignupPage.tsx
Requirement: Add password strength indicator
Constraints: Must update in real-time, follow TDD workflow
Reference: Follow .cursorrules-security password requirements

Context: API endpoint GET /api/users/:id
Requirement: Add caching with Redis
Constraints: 5-minute TTL, invalidate on user update
Reference: Use .cursorrules-performance caching pattern
```

## Development Workflow with AI

### 1. Feature Request

```
"I need to add a 'forgot password' feature.
Requirements:
- User enters email
- System sends reset link
- Link expires in 1 hour
- User can set new password

Follow .cursorrules-tdd and .cursorrules-security.
Start by proposing the test cases."
```

### 2. AI Proposes Tests

Review and approve or request changes.

### 3. AI Implements

AI writes code following TDD workflow.

### 4. Review & Iterate

You review, AI refactors if needed.

## When to Use AI

### ✅ Good Use Cases

- **Boilerplate code** - Repetitive structure
- **Well-defined features** - Clear requirements
- **Test writing** - Given behavior specification
- **Refactoring** - Improving existing code
- **Documentation** - README, API docs
- **Code review** - First pass, catch obvious issues

### ❌ Not Recommended

- **Architecture decisions** - Requires human judgment
- **Security-critical code** - Review very carefully
- **Complex algorithms** - Verify thoroughly
- **Production deployments** - Human oversight required
- **Customer-facing decisions** - Business judgment

## Debugging with AI

### Effective Debug Prompts

```typescript
// ❌ BAD
"This doesn't work, fix it"

// ✅ GOOD
"Function `calculateTotal` returns NaN.
Input: { items: [{ price: 10, quantity: 2 }], tax: 0.1 }
Expected: 22 (20 + 10% tax)
Actual: NaN

Current code:
[paste code]

Write test reproducing the issue, then fix."
```

## Code Review with AI

```
"Review this code for:
1. Security vulnerabilities (check .cursorrules-security)
2. Performance issues
3. Test coverage gaps
4. Code quality (following .cursorrules-architecture)

[paste code]
"
```

## Refactoring with AI

```
"Refactor UserService.ts:
Current issues:
- 200+ lines (too long)
- Multiple responsibilities
- Hard to test

Goals:
- Split into smaller functions (<50 lines each)
- Single responsibility principle
- Maintain 100% test coverage

Follow .cursorrules-architecture patterns."
```

## Multi-Step Features

Break into atomic tasks:

```
"Feature: User profile with avatar upload

Step 1: File upload endpoint
- POST /api/users/:id/avatar
- Validate: image type, max 5MB
- Store in cloud storage
- Tests first

[Wait for completion]

Step 2: Frontend upload component
- Drag & drop support
- Image preview
- Progress indicator
- Tests for upload logic

[Wait for completion]

Step 3: Profile page integration
- Display avatar
- Edit button
- Responsive design
```

## Testing Prompts

```
"Write tests for calculateDiscount function:
Test cases:
1. Basic discount: $100, 10% = $10
2. No discount: $50 (under threshold) = $0
3. Tiered: $600, should get 20% = $120
4. Edge cases: $0, negative amounts, null

Follow .cursorrules-testing patterns."
```

## Performance Optimization

```
"Profile and optimize /api/posts endpoint:
Current: 2.5s response time
Target: <500ms

Check:
1. N+1 queries
2. Missing indexes
3. Caching opportunities
4. Large payload size

Follow .cursorrules-performance guidelines."
```

## Documentation

```
"Generate API documentation for auth endpoints:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/session

Include:
- Request/response examples
- Authentication requirements
- Error codes
- Rate limits

Format: OpenAPI 3.0 spec"
```

## Best Practices

### 1. Reference Your Rules

```
"Follow .cursorrules-tdd" ✅
"Use TDD" ❌ (less specific)
```

### 2. Provide Context

```
"In UserService.createUser method..." ✅
"In the code..." ❌ (which code?)
```

### 3. Be Specific

```
"Add validation for email format using Zod" ✅
"Add validation" ❌ (what kind?)
```

### 4. Include Examples

```
"Like the existing calculateTax function" ✅
"Do it properly" ❌ (proper according to what?)
```

### 5. Set Constraints

```
"Must complete in <100ms" ✅
"Make it fast" ❌ (how fast?)
```

## Iterative Refinement

### First Pass
```
"Create user registration endpoint"
```

### Refine
```
"Add input validation with Zod"
```

### Refine More
```
"Add rate limiting (5 attempts/hour)"
```

### Final Polish
```
"Add comprehensive error messages"
```

## AI Limitations

### AI is NOT good at:
- Making architectural decisions
- Understanding business context
- Security trade-offs
- Performance vs. maintainability balance
- User experience decisions

### AI IS good at:
- Implementing defined patterns
- Writing boilerplate
- Finding edge cases
- Suggesting refactorings
- Writing tests

## Remember

> **"AI is your pair programmer, not your architect."**

> **"Good prompts = Good results. Vague prompts = Vague results."**

---

**You architect. AI implements. Together, you build faster.**

