# Security Checklist

## Authentication & Authorization

- [ ] **JWT tokens in HTTP-only cookies** (not localStorage)
- [ ] **Secure cookie flags set**: httpOnly, secure, sameSite
- [ ] **Token expiration** configured (e.g., 30 days max)
- [ ] **Refresh token rotation** (if using refresh tokens)
- [ ] **Password hashing** with bcrypt (saltRounds >= 12)
- [ ] **Role-based access control** implemented
- [ ] **Permission checks** on all protected endpoints
- [ ] **Resource ownership validation** (users can only access their data)

## Input Validation

- [ ] **All inputs validated** (Zod, Joi, or similar)
- [ ] **Email format validation**
- [ ] **Password strength requirements** (min 8 chars, upper/lower/number)
- [ ] **Input sanitization** (remove HTML/scripts)
- [ ] **File upload validation** (type, size, content)
- [ ] **URL validation** (prevent open redirects)
- [ ] **Request size limits** configured

## Injection Prevention

- [ ] **SQL injection** - Using parameterized queries or ORM
- [ ] **NoSQL injection** - Input sanitization for MongoDB, etc.
- [ ] **Command injection** - Never pass user input to shell
- [ ] **XSS prevention** - Output escaping, CSP headers
- [ ] **LDAP injection** - Input validation
- [ ] **XML injection** - Disable external entities

## Security Headers

- [ ] **Helmet.js** installed and configured
- [ ] **Content-Security-Policy** (CSP) configured
- [ ] **X-Frame-Options** set to DENY or SAMEORIGIN
- [ ] **X-Content-Type-Options** set to nosniff
- [ ] **Strict-Transport-Security** (HSTS) enabled
- [ ] **Referrer-Policy** configured
- [ ] **Permissions-Policy** configured

## Rate Limiting

- [ ] **API rate limiting** configured (e.g., 100 req/15min)
- [ ] **Authentication endpoints** have stricter limits (e.g., 5/hour)
- [ ] **WebSocket rate limiting** implemented
- [ ] **IP-based limiting** for public endpoints
- [ ] **User-based limiting** for authenticated endpoints

## HTTPS & Network Security

- [ ] **HTTPS enforced** (SSL certificate valid)
- [ ] **HTTP redirects to HTTPS**
- [ ] **TLS 1.2+** required
- [ ] **Secure flag** on cookies
- [ ] **CORS properly configured** (specific origins, not *)
- [ ] **Credentials allowed** only for trusted origins

## Secrets Management

- [ ] **No secrets in code** (all in environment variables)
- [ ] **`.env` in `.gitignore`**
- [ ] **Secrets validated on startup**
- [ ] **Secret rotation policy** defined
- [ ] **Different secrets** for dev/staging/production
- [ ] **Minimum secret length** enforced (e.g., 32+ chars)

## Error Handling

- [ ] **Generic error messages** to client
- [ ] **Detailed errors logged** server-side only
- [ ] **No stack traces** exposed to client
- [ ] **No sensitive data** in error messages
- [ ] **Error monitoring** set up (Sentry, etc.)

## Data Protection

- [ ] **Sensitive data encrypted** at rest
- [ ] **Sensitive data encrypted** in transit (HTTPS)
- [ ] **Password never stored in plain text**
- [ ] **Personal data** minimized (collect only what's needed)
- [ ] **Data retention policy** defined
- [ ] **Secure deletion** of user data

## Logging & Monitoring

- [ ] **Security events logged** (failed logins, etc.)
- [ ] **No sensitive data** in logs (passwords, tokens, etc.)
- [ ] **Log rotation** configured
- [ ] **Anomaly detection** alerts set up
- [ ] **Failed login attempts** monitored
- [ ] **Unusual activity** tracked

## Dependencies

- [ ] **Regular `npm audit`** or `yarn audit`
- [ ] **Automated security updates** (Dependabot, Renovate)
- [ ] **Dependencies kept up to date**
- [ ] **Minimize dependencies** (fewer = smaller attack surface)
- [ ] **License compliance** checked

## Session Management

- [ ] **Session timeout** configured
- [ ] **Idle timeout** implemented
- [ ] **Logout functionality** properly invalidates session
- [ ] **Concurrent session limits** (optional)
- [ ] **Session fixation** prevented

## CSRF Protection

- [ ] **SameSite cookies** configured (strict or lax)
- [ ] **CSRF tokens** for state-changing operations
- [ ] **Double-submit cookie** pattern (optional layer)

## API Security

- [ ] **API versioning** implemented
- [ ] **API documentation** secured (not public if sensitive)
- [ ] **GraphQL** - Query depth limiting
- [ ] **GraphQL** - Query cost analysis
- [ ] **REST** - Proper HTTP methods (GET for read, POST for write)

## Testing

- [ ] **Security tests** in test suite
- [ ] **Penetration testing** scheduled
- [ ] **OWASP Top 10** reviewed
- [ ] **Security code review** process

## Compliance

- [ ] **GDPR compliance** (if handling EU data)
- [ ] **COPPA compliance** (if users under 13)
- [ ] **PCI DSS** (if handling payments)
- [ ] **Privacy policy** published
- [ ] **Terms of service** published

## Incident Response

- [ ] **Incident response plan** documented
- [ ] **Security contact** published
- [ ] **Backup strategy** implemented
- [ ] **Recovery procedure** tested

## Quick Wins (Do These First)

1. ✅ Use HTTPS everywhere
2. ✅ Install Helmet.js
3. ✅ Add rate limiting
4. ✅ Use HTTP-only cookies for tokens
5. ✅ Validate all inputs with Zod
6. ✅ Use parameterized queries (ORM)
7. ✅ Add CORS configuration
8. ✅ Run `npm audit` regularly

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Web Security Academy](https://portswigger.net/web-security)

---

**Security is not optional. It's foundational.**

