# MarketPulse Backend

Node.js + Express + TypeScript API with PostgreSQL, Prisma ORM, JWT Authentication, RBAC, Portfolio Management, Watchlists, Live Market Data, Redis Caching, Socket.IO, Helmet, and Rate Limiting.

---

## Folder Structure

```
backend/
├── prisma/
│   ├── migrations/
│   │   └── 20260724211400_init/
│   │       └── migration.sql           # Initial database migration
│   └── schema.prisma                   # Prisma data models & relational schema
├── src/
│   ├── controllers/
│   │   ├── admin.controller.ts         # Admin user management handlers (list, delete)
│   │   ├── auth.controller.ts          # Register, login, and profile handlers
│   │   ├── dbCheck.controller.ts       # Database connection check handler
│   │   ├── health.controller.ts        # Health check handler
│   │   ├── holding.controller.ts       # Holding management handlers (add, delete)
│   │   ├── market.controller.ts        # Live stock price quote handler
│   │   ├── portfolio.controller.ts     # Portfolio CRUD handlers (create, list, delete)
│   │   ├── portfolioValue.controller.ts# Real-time portfolio valuation handler
│   │   ├── transaction.controller.ts   # BUY/SELL transaction handlers with weighted avg price
│   │   └── watchlist.controller.ts     # Watchlist CRUD + stock management handlers
│   ├── lib/
│   │   ├── prisma.ts                   # Prisma client singleton
│   │   └── redis.ts                    # Redis (ioredis) client singleton
│   ├── middleware/
│   │   ├── auth.middleware.ts          # JWT Bearer token authentication middleware
│   │   └── role.middleware.ts          # Role-Based Access Control (RBAC) middleware
│   ├── routes/
│   │   ├── admin.routes.ts             # Admin routes (/users, /users/:id)
│   │   ├── auth.routes.ts              # Auth routes (/register, /login)
│   │   ├── dbCheck.routes.ts           # Database check route
│   │   ├── health.routes.ts            # Health check route
│   │   ├── holding.routes.ts           # Holding & Transaction routes
│   │   ├── market.routes.ts            # Market price quote routes
│   │   ├── portfolio.routes.ts         # Portfolio routes & Valuation route
│   │   ├── profile.routes.ts           # Protected user profile route
│   │   └── watchlist.routes.ts         # Watchlist routes
│   ├── schemas/
│   │   ├── auth.schema.ts              # Zod auth validation schemas
│   │   ├── portfolio.schema.ts         # Zod portfolio, holding, & transaction schemas
│   │   └── watchlist.schema.ts         # Zod watchlist validation schemas
│   ├── services/
│   │   └── market.service.ts           # Market data service (Finnhub API + Redis 60s caching)
│   ├── socket.ts                       # Socket.IO server initialization & event helpers
│   ├── app.ts                          # Express app setup, security middleware & route registration
│   └── index.ts                        # Entry point - loads env & starts server
├── seed-admin.ts                       # Admin user seed script
├── package.json
├── README.md
└── tsconfig.json
```

---

## Getting Started

### Install dependencies

```bash
cd backend
npm install
```

### Set up environment variables

Copy the example env file and set your credentials:

```bash
cp .env.example .env
```

Environment variables:
- `PORT`: Server port (default: `5000`)
- `NODE_ENV`: Environment mode (`development` or `production`)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key used for signing JWT tokens
- `MARKET_API_KEY`: Finnhub API key for live stock quotes
- `REDIS_URL`: Redis connection URL (default: `redis://localhost:6379`)
- `CORS_ORIGIN`: Allowed frontend origin (default: `http://localhost:5173`)

### Database Setup & Prisma Commands

1. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

2. **Sync Database Schema**:
   ```bash
   npx prisma db push
   ```

3. **Seed Admin User**:
   ```bash
   npx tsx seed-admin.ts
   ```
   Creates `admin@example.com` (Password: `Admin123`, Role: `ADMIN`) if it does not already exist.

---

## Running the Server

### Development mode

```bash
npm run dev
```

Server starts at `http://localhost:5000`

### Build for production

```bash
npm run build
```

### Start production build

```bash
npm start
```

---

## API Endpoints

| Method | Endpoint                                   | Access         | Description                                          |
|--------|--------------------------------------------|----------------|------------------------------------------------------|
| GET    | `/api/health`                              | Public         | Server health check                                  |
| GET    | `/api/db-check`                            | Public         | Database connection status                           |
| POST   | `/api/auth/register`                       | Public         | Register a new user (returns 201)                    |
| POST   | `/api/auth/login`                          | Public         | Login user & return 24h JWT token                    |
| GET    | `/api/profile`                             | Protected      | Retrieve authenticated user's profile                |
| GET    | `/api/admin/users`                         | Admin Only     | Retrieve all registered users (omits password)       |
| DELETE | `/api/admin/users/:id`                     | Admin Only     | Delete a user by ID                                  |
| POST   | `/api/portfolios`                          | Protected      | Create portfolio for authenticated user              |
| GET    | `/api/portfolios`                          | Protected      | Get all portfolios owned by authenticated user       |
| DELETE | `/api/portfolios/:id`                      | Owner Only     | Delete portfolio                                     |
| POST   | `/api/portfolios/:portfolioId/holdings`    | Owner Only     | Add holding to portfolio                             |
| GET    | `/api/portfolios/:portfolioId/value`       | Owner Only     | Get live portfolio value & holding market values     |
| DELETE | `/api/holdings/:id`                        | Owner Only     | Delete holding                                       |
| POST   | `/api/holdings/:holdingId/transactions`    | Owner Only     | Create BUY or SELL transaction                       |
| GET    | `/api/market/price/:symbol`               | Protected      | Fetch real-time stock price (Redis-cached 60s)       |
| POST   | `/api/watchlists`                          | Protected      | Create a watchlist                                   |
| GET    | `/api/watchlists`                          | Protected      | Get all watchlists for authenticated user            |
| GET    | `/api/watchlists/:id`                      | Owner Only     | Get watchlist with live stock prices                 |
| DELETE | `/api/watchlists/:id`                      | Owner Only     | Delete watchlist and all its stocks                  |
| POST   | `/api/watchlists/:id/stocks`              | Owner Only     | Add stock to watchlist (rejects duplicates)          |
| DELETE | `/api/watchlists/:id/stocks/:symbol`      | Owner Only     | Remove stock from watchlist                          |

---

## Security Middleware

| Middleware | Purpose |
|-----------|----------|
| `helmet` | Sets 9 secure HTTP response headers |
| `cors` | Restricts to `CORS_ORIGIN` env var — no wildcard in production |
| `express-rate-limit` (general) | 100 req / 15 min per IP on all `/api` routes |
| `express-rate-limit` (auth) | 20 req / 15 min per IP on `/api/auth` specifically |
| `authenticateToken` | Validates JWT Bearer token; JWT_SECRET has no fallback |
| `authorizeRoles` | Enforces role-based access (ADMIN/USER) |

See [`docs/security.md`](../docs/security.md) for the complete security reference.

---

## Redis Caching Flow & Rules

1. **Cached Entities**: Stock quotes ONLY (`stock:<SYMBOL>`).
2. **TTL**: 60 seconds (`EX 60`).
3. **Lookup Sequence**:
   - Checks Redis cache for key `stock:<SYMBOL>`.
   - **Cache Hit**: Logs `CACHE HIT` and returns cached quote immediately.
   - **Cache Miss**: Logs `CACHE MISS`, fetches price from Finnhub, saves to Redis for 60 seconds, and returns price.
4. **Shared Cache**: The same cached price is served for both portfolio valuation and watchlist price requests.
5. **Resilience**: If Redis is down, the system falls back to fetching directly from Finnhub without crashing.

---

## Socket.IO Real-Time Events

See [`docs/socket-events.md`](../docs/socket-events.md) for the complete event reference.

All events are emitted to the user's private room `user:<USER_ID>`. Clients must authenticate with a JWT token during the Socket.IO handshake.
