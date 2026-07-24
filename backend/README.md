# MarketPulse Backend

Node.js + Express + TypeScript API with PostgreSQL, Prisma ORM, JWT Authentication, RBAC, & Portfolio Management

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
│   │   ├── portfolio.controller.ts     # Portfolio CRUD handlers (create, list, delete)
│   │   └── transaction.controller.ts   # BUY/SELL transaction handlers with weighted avg price
│   ├── lib/
│   │   └── prisma.ts                   # Prisma client singleton
│   ├── middleware/
│   │   ├── auth.middleware.ts          # JWT Bearer token authentication middleware
│   │   └── role.middleware.ts          # Role-Based Access Control (RBAC) middleware
│   ├── routes/
│   │   ├── admin.routes.ts             # Admin routes (/users, /users/:id)
│   │   ├── auth.routes.ts              # Auth routes (/register, /login)
│   │   ├── dbCheck.routes.ts           # Database check route
│   │   ├── health.routes.ts            # Health check route
│   │   ├── holding.routes.ts           # Holding & Transaction routes
│   │   ├── portfolio.routes.ts         # Portfolio routes
│   │   └── profile.routes.ts           # Protected user profile route
│   ├── schemas/
│   │   ├── auth.schema.ts              # Zod auth validation schemas
│   │   └── portfolio.schema.ts         # Zod portfolio, holding, & transaction schemas
│   ├── app.ts                          # Express app setup & route registration
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
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key used for signing JWT tokens

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

| Method | Endpoint                                 | Access         | Description                                       |
|--------|------------------------------------------|----------------|---------------------------------------------------|
| GET    | `/api/health`                            | Public         | Server health check                               |
| GET    | `/api/db-check`                          | Public         | Database connection status                        |
| POST   | `/api/auth/register`                     | Public         | Register a new user (returns 201)                 |
| POST   | `/api/auth/login`                        | Public         | Login user & return 24h JWT token                 |
| GET    | `/api/profile`                           | Protected      | Retrieve authenticated user's profile             |
| GET    | `/api/admin/users`                       | Admin Only     | Retrieve all registered users (omits password)    |
| DELETE | `/api/admin/users/:id`                   | Admin Only     | Delete a user by ID (404 if not found)            |
| POST   | `/api/portfolios`                        | Protected      | Create portfolio for authenticated user           |
| GET    | `/api/portfolios`                        | Protected      | Get all portfolios owned by authenticated user    |
| DELETE | `/api/portfolios/:id`                    | Owner Only     | Delete portfolio (404 if not found/unowned)       |
| POST   | `/api/portfolios/:portfolioId/holdings`  | Owner Only     | Add holding to portfolio                          |
| DELETE | `/api/holdings/:id`                      | Owner Only     | Delete holding                                    |
| POST   | `/api/holdings/:holdingId/transactions`  | Owner Only     | Create BUY or SELL transaction                    |

---

## Transaction & Average Price Calculations

1. **BUY Transactions**:
   - Increases holding `quantity`: `updatedQuantity = currentQuantity + newQuantity`.
   - Recalculates weighted average cost basis:
     $$\text{New Average Price} = \frac{(\text{Current Quantity} \times \text{Current Avg Price}) + (\text{BUY Quantity} \times \text{BUY Price})}{\text{Updated Quantity}}$$
2. **SELL Transactions**:
   - Decreases holding `quantity`: `updatedQuantity = currentQuantity - sellQuantity`.
   - Validates that `sellQuantity <= currentQuantity`. Returns HTTP `400` if selling more than available.
   - Selling shares does not modify the weighted cost basis of remaining shares (`averagePrice` remains unchanged).
   - If `quantity` becomes `0`, the holding entry remains in the database (retains transaction history).
