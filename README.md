# MarketPulse

Full-Stack Financial Analytics Platform

<!-- GitHub Actions CI/CD Badges Placeholder -->
<!-- Replace <USERNAME> and <REPO> with your GitHub username and repository name after pushing -->
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#github-actions-cicd-pipeline)
[![Test Status](https://img.shields.io/badge/tests-137%20passed-blue)](#github-actions-cicd-pipeline)

> **Badge Setup Note:** Once pushed to GitHub, replace the URLs above with your repository workflow badge URLs:
> - **Build Badge:** `https://github.com/<USERNAME>/<REPO>/actions/workflows/ci.yml/badge.svg`

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
- [x] CI/CD with GitHub Actions (Automated build, type checks, unit/integration testing & coverage)
- [ ] AWS EC2 hosting with Nginx reverse proxy
- [ ] S3 and IAM integration

---

## Project Structure

```
MarketPulse/
├── .github/
│   └── workflows/
│       └── ci.yml    # Production GitHub Actions CI Pipeline
├── backend/          # Node.js + Express + TypeScript API
│   ├── Dockerfile
│   ├── docker-entrypoint.sh
│   ├── vitest.config.ts
│   ├── prisma/
│   └── src/
│       └── tests/
├── frontend/         # React SPA (Vite)
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vite.config.ts
│   └── src/
│       └── tests/
├── docs/             # Documentation & Postman collection
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

## Automated Testing Suite

MarketPulse features a comprehensive automated testing suite built with **Vitest**, **Supertest**, and **React Testing Library**.

### Test Frameworks & Utilities
- **Backend:** Vitest + Supertest + In-Memory Mocks (Prisma Client, ioredis, Socket.IO)
- **Frontend:** Vitest + React Testing Library + jsdom + Mock Context Providers

### Test Commands

#### Backend Tests
```bash
cd backend
npm test               # Run all backend tests once
npm run test:watch     # Run backend tests in watch mode
npm run test:coverage  # Generate backend coverage report
```

#### Frontend Tests
```bash
cd frontend
npm test               # Run all frontend component/page tests once
npm run test:watch     # Run frontend tests in watch mode
npm run test:coverage  # Generate frontend coverage report
```

### Test Coverage Summary

| Workspace | Test Files | Total Tests | Statement Coverage | Branch Coverage | Function Coverage | Line Coverage |
|-----------|------------|-------------|--------------------|-----------------|-------------------|---------------|
| **Backend** | 7 | 70 | 69.47% | 52.22% | 64.58% | 69.24% |
| **Frontend** | 10 | 67 | 56.42% | 60.29% | 61.22% | 56.72% |

### Test Folder Structure

```
MarketPulse/
├── backend/
│   ├── vitest.config.ts
│   └── src/
│       └── tests/
│           ├── setup.ts              # Test env configuration & global mocks
│           ├── mocks/                # Prisma, Redis, Socket.IO mocks
│           ├── health.test.ts        # Health check & 404 endpoint tests
│           ├── auth.test.ts          # Auth, registration, login & JWT middleware tests
│           ├── portfolio.test.ts     # Portfolio CRUD endpoint tests
│           ├── holding.test.ts       # Holding endpoint tests
│           ├── transaction.test.ts   # Buy/Sell transaction logic tests
│           ├── watchlist.test.ts     # Watchlist & stock tracking tests
│           └── market.test.ts        # Live price & fallback quote tests
├── frontend/
│   ├── vite.config.ts                # Vitest jsdom configuration
│   └── src/
│       └── tests/
│           ├── setup.ts              # jsdom setup & browser API mocks
│           ├── mocks/                # AuthContext & SocketContext mock providers
│           ├── components/           # Component tests (Navbar, Sidebar, Modal, Spinner, etc.)
│           └── pages/                # Page integration tests (Login, Register, Dashboard)
```

---

## GitHub Actions CI/CD Pipeline

MarketPulse includes an automated Continuous Integration pipeline defined in [`.github/workflows/ci.yml`](file:///.github/workflows/ci.yml).

### Workflow Triggers
The CI workflow automatically triggers on:
- **Pushes** to `main` or `master` branches.
- **Pull Requests** targeting `main` or `master` branches.

### Pipeline Architecture & Parallel Jobs
The pipeline runs on `ubuntu-latest` with **Node.js 20** and utilizes `npm` dependency caching (`cache: 'npm'`) to minimize build times.

```
┌────────────────────────────────────────────────────────┐
│                   GitHub Push / PR                     │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
  ┌───────────────────┐           ┌───────────────────┐
  │   Backend Job     │           │   Frontend Job    │
  ├───────────────────┤           ├───────────────────┤
  │ 1. Checkout       │           │ 1. Checkout       │
  │ 2. Setup Node.js  │           │ 2. Setup Node.js  │
  │ 3. npm ci         │           │ 3. npm ci         │
  │ 4. prisma generate│           │ 4. tsc --noEmit   │
  │ 5. tsc --noEmit   │           │ 5. npm test       │
  │ 6. npm test       │           │ 6. test:coverage  │
  │ 7. test:coverage  │           │ 7. Upload Artifact│
  │ 8. Upload Artifact│           └───────────────────┘
  └───────────────────┘
```

### Coverage Artifacts
Each job automatically generates and uploads code coverage reports:
- **`backend-coverage`**: Contains html, lcov, and json coverage reports for backend API routes and logic.
- **`frontend-coverage`**: Contains html, lcov, and json coverage reports for frontend UI components and state logic.

Artifacts are retained for 7 days per workflow run.

### Reproducing CI Verification Locally

To run the exact validation steps performed in GitHub Actions locally:

```bash
# 1. Backend Verification
cd backend
npm ci
npx prisma generate
npx tsc --noEmit
npm test
npm run test:coverage

# 2. Frontend Verification
cd frontend
npm ci
npx tsc --noEmit
npm test
npm run test:coverage
```

---

## License

This project is licensed under the [MIT License](LICENSE).
