# Security Implementation Reference

This document describes every security control implemented in the MarketPulse backend.

---

## 1. Helmet — HTTP Security Headers

Helmet is applied globally in `app.ts` via `app.use(helmet())`.

It sets the following headers automatically:

| Header | Value set by Helmet | Purpose |
|--------|---------------------|---------|
| `Content-Security-Policy` | Restrictive default | Prevents XSS and data injection |
| `X-DNS-Prefetch-Control` | `off` | Prevents DNS prefetch leakage |
| `X-Frame-Options` | `SAMEORIGIN` | Prevents clickjacking |
| `Strict-Transport-Security` | `max-age=15552000` | Forces HTTPS in browsers |
| `X-Download-Options` | `noopen` | Prevents IE file downloads |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `X-Permitted-Cross-Domain-Policies` | `none` | Prevents Adobe cross-domain access |
| `Referrer-Policy` | `no-referrer` | Prevents referrer leakage |
| `X-XSS-Protection` | `0` | Disables legacy XSS filter (CSP is better) |

---

## 2. Rate Limiting

Two separate rate limiters are applied using `express-rate-limit`.

### General API Limiter

Applied to all `/api/*` routes.

```
Window:  15 minutes
Limit:   100 requests per IP
Headers: RateLimit-* (standard), no legacy X-RateLimit-*
```

### Authentication Limiter

Applied specifically to `/api/auth/*` (login, register).

```
Window:  15 minutes
Limit:   20 requests per IP
Headers: RateLimit-* (standard)
```

This tighter limit prevents brute-force attacks against login.

**Error response** (429):
```json
{
  "success": false,
  "message": "Too many authentication attempts, please try again later."
}
```

---

## 3. CORS

CORS is restricted to a configurable origin via the `CORS_ORIGIN` environment variable.

```
Default:     http://localhost:5173
Production:  Set CORS_ORIGIN to your frontend domain
```

Rules:
- Requests with no origin (Postman, curl, server-to-server) are always allowed.
- In development (`NODE_ENV != production`), any `http://localhost:<port>` origin is allowed.
- In production, only the exact `CORS_ORIGIN` value is permitted.
- Wildcard (`*`) is never used.

Socket.IO CORS uses the same `CORS_ORIGIN` variable.

---

## 4. JWT Authentication

**Configuration:**
- Algorithm: HS256 (default)
- Expiration: 24 hours
- Secret: loaded from `JWT_SECRET` environment variable — no fallback
- Server refuses to start if `JWT_SECRET` is missing

**Token format:**

```
Authorization: Bearer <token>
```

**Payload:**
```json
{
  "id": "user_cuid",
  "email": "user@example.com",
  "role": "USER"
}
```

**Error responses:**

| Condition | Status | Message |
|-----------|--------|---------|
| Token missing | 401 | Authentication token required |
| Token invalid/expired | 401 | Invalid or expired token |

**Socket.IO** authentication uses the same JWT verification. The token is passed in `socket.handshake.auth.token` during the handshake.

---

## 5. RBAC — Role-Based Access Control

Two roles exist: `USER` and `ADMIN`.

The `authorizeRoles(...roles)` middleware in `role.middleware.ts` checks `req.user.role` against the allowed roles after `authenticateToken` has already verified the JWT.

| Route | Required Role |
|-------|--------------|
| `GET /api/admin/users` | ADMIN |
| `DELETE /api/admin/users/:id` | ADMIN |
| All other protected routes | USER or ADMIN |

---

## 6. Password Hashing — bcrypt

Passwords are hashed using bcrypt with a salt factor of **10** before storage.

Plain text passwords are **never stored, logged, or returned** in any API response.

---

## 7. Redis Security

- Redis connection string loaded from `REDIS_URL` environment variable.
- Redis is used exclusively for stock price caching — no sensitive data (tokens, passwords, user data) is ever stored in Redis.
- If Redis is unavailable, the application falls back to fetching live data directly — no crash, no data exposure.
- Connection errors are logged without leaking the connection URL.

---

## 8. Prisma & Database

- Database connection string loaded from `DATABASE_URL` environment variable.
- All user-facing responses use explicit `select` clauses — the `password` field is never returned in any API response.
- Prisma parameterizes all queries by default — SQL injection is not possible through the ORM layer.
- Cascade deletes are configured in the schema — orphaned records cannot exist.

---

## 9. Input Validation

All endpoints that accept a request body use **Zod** schemas for validation.

| Schema | Used in |
|--------|---------|
| `registerSchema` | POST /api/auth/register |
| `loginSchema` | POST /api/auth/login |
| `createPortfolioSchema` | POST /api/portfolios |
| `createHoldingSchema` | POST /api/portfolios/:id/holdings |
| `createTransactionSchema` | POST /api/holdings/:id/transactions |
| `createWatchlistSchema` | POST /api/watchlists |
| `addWatchlistStockSchema` | POST /api/watchlists/:id/stocks |

Symbol fields are normalized to uppercase at validation time.
Name fields are trimmed of whitespace.

---

## 10. Environment Variables

The server validates that all required environment variables are present at startup:
- `JWT_SECRET`
- `DATABASE_URL`
- `MARKET_API_KEY`

If any are missing, the process exits immediately with a descriptive error message.

**Required variables:**

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | Environment mode (`development` or `production`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `MARKET_API_KEY` | Finnhub API key |
| `REDIS_URL` | Redis connection URL |
| `CORS_ORIGIN` | Allowed frontend origin |
