# MarketPulse Backend

Node.js + Express + TypeScript API with PostgreSQL & Prisma ORM

---

## Folder Structure

```
backend/
├── prisma/
│   ├── migrations/
│   │   └── 20260724211400_init/
│   │       └── migration.sql    # Initial database migration
│   └── schema.prisma            # Prisma data models & relational schema
├── src/
│   ├── controllers/
│   │   ├── dbCheck.controller.ts # Database connection check handler
│   │   └── health.controller.ts  # Health check handler
│   ├── lib/
│   │   └── prisma.ts            # Prisma client singleton
│   ├── routes/
│   │   ├── dbCheck.routes.ts     # Database check route
│   │   └── health.routes.ts      # Health check route
│   ├── app.ts                    # Express app setup
│   └── index.ts                  # Entry point - starts the server
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

Copy the example env file and set your PostgreSQL connection string:

```bash
cp .env.example .env
```

Environment variables:
- `PORT`: Server port (default: `5000`)
- `DATABASE_URL`: PostgreSQL connection string (e.g. `postgresql://username:password@localhost:5432/marketpulse?schema=public`)

### Database Setup & Prisma Commands

1. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

2. **Run Database Migrations**:
   ```bash
   npx prisma migrate dev --name init
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

| Method | Endpoint         | Description                   |
|--------|------------------|-------------------------------|
| GET    | /api/health      | Server health check           |
| GET    | /api/db-check    | Database connection status    |

### Health Check Response

```json
{
  "status": "ok",
  "message": "MarketPulse backend is running"
}
```

### Database Check Response

Connected:
```json
{
  "database": "connected"
}
```

Disconnected:
```json
{
  "database": "disconnected"
}
```
