# MarketPulse

Full-Stack Financial Analytics Platform

---

## Tech Stack

**Frontend:** React 18, React Router v6, Axios, Socket.IO Client, Nginx (Alpine)

**Backend:** Node.js 20, Express, TypeScript, Prisma ORM, PostgreSQL 16, Redis 7, Socket.IO

**Security:** JWT, bcrypt, Helmet, express-rate-limit

**Infrastructure & Containerization:** Docker, Docker Compose, GitHub Actions, AWS (EC2, S3, IAM)

---

## Features

- [x] JWT Authentication with bcrypt password hashing
- [x] Role-Based Access Control (RBAC)
- [x] Real-time portfolio tracking via Socket.IO
- [x] Live market data via Finnhub API
- [x] Redis caching for stock price responses (60s TTL)
- [x] Personalized watchlists with live stock prices
- [x] Portfolio management (create, holdings, BUY/SELL transactions)
- [x] Relational database schemas (PostgreSQL + Prisma)
- [x] API rate limiting (express-rate-limit)
- [x] HTTP security headers (Helmet)
- [x] Dockerized deployment with Docker Compose (Frontend, Backend, PostgreSQL, Redis)
- [ ] CI/CD with GitHub Actions
- [ ] AWS EC2 hosting with Nginx reverse proxy
- [ ] S3 and IAM integration

---

## Project Structure

```
MarketPulse/
├── backend/          # Node.js + Express + TypeScript API
│   ├── Dockerfile
│   ├── docker-entrypoint.sh
│   └── prisma/
├── frontend/         # React SPA (Vite)
│   ├── Dockerfile
│   └── nginx.conf
├── docs/             # Documentation & Postman collection
│   ├── MarketPulse_API.postman_collection.json
│   ├── security.md
│   ├── socket-events.md
│   └── watchlists.md
├── docker-compose.yml
├── .env.example
├── .gitignore
├── LICENSE
├── README.md
└── url.txt           # Live demo URL
```

---

## Docker Quick Start (Single Command)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine + Docker Compose (v2+)

### 1. Start the entire application

Run a single command from the project root:

```bash
docker compose up --build
```

This automatically orchestrates and builds:
- **`postgres`** (PostgreSQL 16 on port `5432` with healthcheck)
- **`redis`** (Redis 7 on port `6379` with healthcheck)
- **`backend`** (Node.js API on port `5000`, waits for Postgres & Redis health, pushes Prisma schema, seeds `admin@example.com` / `Admin123`)
- **`frontend`** (React SPA on port `5173` served via Nginx Alpine)

### 2. Access the Application

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Database Connection Check**: [http://localhost:5000/api/db-check](http://localhost:5000/api/db-check)

### 3. Stop containers

```bash
# Stop containers keeping database volumes
docker compose down

# Stop containers and remove persistent database volumes
docker compose down -v
```

---

## Local Development (Without Docker)

```bash
# 1. Backend Setup
cd backend
npm install
cp .env.example .env
npx prisma db push
npx tsx seed-admin.ts  # seeds admin@example.com / Admin123
npm run dev            # starts API on http://localhost:5000

# 2. Frontend Setup
cd frontend
npm install
cp .env.example .env
npm run dev            # starts SPA on http://localhost:5173
```

---

## Troubleshooting & FAQ

- **Database Connection Refused**: Ensure PostgreSQL container passes healthcheck (`docker compose ps`).
- **Prisma Schema Mismatch**: Run `docker compose exec backend npx prisma db push`.
- **CORS Error in Browser**: Verify `CORS_ORIGIN` in `.env` matches `http://localhost:5173`.

---

## License

This project is licensed under the [MIT License](LICENSE).
