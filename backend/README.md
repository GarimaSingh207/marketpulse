# MarketPulse Backend

Node.js + Express + TypeScript API with PostgreSQL, Prisma ORM, & JWT Authentication

---

## Folder Structure

```
backend/
├── prisma/
│   ├── migrations/
│   │   └── 20260724211400_init/
│   │       └── migration.sql       # Initial database migration
│   └── schema.prisma               # Prisma data models & relational schema
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts      # Register, login, and profile handlers
│   │   ├── dbCheck.controller.ts   # Database connection check handler
│   │   └── health.controller.ts    # Health check handler
│   ├── lib/
│   │   └── prisma.ts               # Prisma client singleton
│   ├── middleware/
│   │   └── auth.middleware.ts      # JWT Bearer token authentication middleware
│   ├── routes/
│   │   ├── auth.routes.ts          # Auth routes (/register, /login)
│   │   ├── dbCheck.routes.ts       # Database check route
│   │   ├── health.routes.ts        # Health check route
│   │   └── profile.routes.ts       # Protected user profile route
│   ├── schemas/
│   │   └── auth.schema.ts          # Zod validation schemas
│   ├── app.ts                      # Express app setup & route registration
│   └── index.ts                    # Entry point - loads env & starts server
├── package.json
├── tsconfig.json
├── .env
└── .env.example
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

| Method | Endpoint          | Access      | Description                            |
|--------|-------------------|-------------|----------------------------------------|
| GET    | `/api/health`     | Public      | Server health check                    |
| GET    | `/api/db-check`   | Public      | Database connection status             |
| POST   | `/api/auth/register` | Public   | Register a new user (returns 201)      |
| POST   | `/api/auth/login`    | Public   | Login user & return 24h JWT token      |
| GET    | `/api/profile`    | Protected   | Retrieve authenticated user's profile  |

---

## Authentication Flow

1. **Register**: Send `POST /api/auth/register` with `{ name, email, password }`. Input is validated via Zod, password is hashed with `bcrypt`, and the user is saved with default role `USER`. Returns 201 Created without password.
2. **Login**: Send `POST /api/auth/login` with `{ email, password }`. Verifies credentials with `bcrypt` and returns `{ token, user }` where `token` is a 24h JWT.
3. **Protected Route Access**: Pass `Authorization: Bearer <TOKEN>` header on protected requests (e.g. `GET /api/profile`). Middleware decodes and verifies token before proceeding.
