# simon-game-app

Professional development project with TDD, security, and AI assistance built-in.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build
npm run build
```

## 📚 Development Methodology

This project follows professional development practices:

- ✅ **Test-Driven Development** - Tests first, always
- ✅ **70%+ Test Coverage** - Enforced by cursor rules
- ✅ **Security by Default** - Built-in security patterns
- ✅ **AI-Assisted** - Cursor AI configured with project standards

See `docs/DEVELOPMENT-METHODOLOGY.md` for complete guidelines.

## 🛠️ Development

### Writing Tests

All features must be developed with TDD:
1. Write failing test (RED)
2. Write minimal implementation (GREEN)
3. Refactor (REFACTOR)

### Using Cursor AI

Cursor is configured with project rules. Just ask naturally:

```
Create a user authentication endpoint with tests
```

Cursor will automatically:
- Write tests first
- Follow security best practices
- Ensure 70%+ coverage

### Reference Documentation

Use `@` to reference documentation in Cursor:

```
@docs/DEVELOPMENT-METHODOLOGY.md

Implement password reset following security best practices
```

## 📁 Project Structure

```
simon-game-app/
├── .cursorrules-tdd           # TDD enforcement
├── .cursorrules-testing       # Testing standards
├── .cursorrules-security      # Security patterns
├── src/                       # Source code
├── tests/                     # Test files
└── docs/                      # Documentation
```

## 🧪 Testing

```bash
# Watch mode (recommended for development)
npm test

# Run once
npm run test:run

# With coverage report
npm run test:coverage

# Interactive UI
npm run test:ui
```

## 📊 Coverage Requirements

- Overall: 70% minimum
- Critical paths: 90%+
- Tests written before implementation

## 🔒 Security

Security patterns are enforced via cursor rules:
- Input validation
- Authentication patterns
- Rate limiting
- XSS/SQL injection prevention

## 🤝 Contributing

1. Write test first (TDD)
2. Implement feature
3. Ensure tests pass
4. Check coverage meets threshold
5. Submit PR

## 📝 License

MIT

---

**Created with** [creators-training-2026](https://github.com/itayshmool/creators-training-2026)
