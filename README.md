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
- [x] AWS EC2 deployment setup with production Docker Compose (`docker-compose.production.yml`)
- [ ] AWS S3 & CloudFront asset hosting

---

## Project Structure

```
MarketPulse/
├── .github/
│   └── workflows/
│       └── ci.yml                     # Production GitHub Actions CI Pipeline
├── backend/                           # Node.js + Express + TypeScript API
│   ├── Dockerfile
│   ├── docker-entrypoint.sh
│   ├── vitest.config.ts
│   ├── .env.production.example        # Backend production environment template
│   ├── prisma/
│   └── src/
│       └── tests/
├── frontend/                          # React SPA (Vite)
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vite.config.ts
│   ├── .env.production.example        # Frontend production environment template
│   └── src/
│       └── tests/
├── docs/                              # Documentation & Postman collection
├── docker-compose.yml                 # Local development Compose configuration
├── docker-compose.production.yml      # Production AWS Compose configuration
├── .env.example                       # Root environment variables template
├── .gitignore
├── LICENSE
├── README.md
└── url.txt                            # Live demo URL
```

---

## Docker Quick Start (Local Development)

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

## AWS Production Deployment Guide

MarketPulse is configured for containerized production deployment on **AWS EC2** using [`docker-compose.production.yml`](file:///docker-compose.production.yml).

### 1. EC2 Instance Provisioning
1. Launch an AWS EC2 instance:
   - **AMI**: Ubuntu 24.04 LTS (or 22.04 LTS) 64-bit (x86).
   - **Instance Type**: `t3.micro` (free tier eligible) or `t3.small` (recommended for production builds).
   - **Storage**: 20 GB General Purpose SSD (gp3).
2. Configure **Security Group** Inbound Rules:
   - **HTTP (80)**: Source `0.0.0.0/0` (Frontend web traffic).
   - **HTTPS (443)**: Source `0.0.0.0/0` (TLS/SSL traffic).
   - **Custom TCP (5000)**: Source `0.0.0.0/0` (Backend REST API / Socket.IO).
   - **SSH (22)**: Source `My IP` (Secure administrative access).

### 2. EC2 Environment Setup (One-time)
Connect to your EC2 instance via SSH and install Docker and Docker Compose v2:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker prerequisites
sudo apt install -y ca-certificates curl gnupg lsb-release git

# Add Docker’s official GPG key and repository
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine & Docker Compose plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Grant user permission to run Docker without sudo
sudo usermod -aG docker $USER
newgrp docker
```

### 3. Application Deployment

```bash
# Clone the repository onto EC2
git clone https://github.com/<YOUR_USERNAME>/marketpulse.git
cd marketpulse

# Copy the root production environment template
cp .env.example .env

# Edit .env with your production values
nano .env
```

**Required Production `.env` Values:**
```ini
POSTGRES_USER=marketpulse_prod_user
POSTGRES_PASSWORD=YOUR_SECURE_GENERATED_PASSWORD
POSTGRES_DB=marketpulse_prod

NODE_ENV=production
PORT=5000
JWT_SECRET=YOUR_32_CHAR_MIN_CRYPTO_RANDOM_SECRET
MARKET_API_KEY=YOUR_FINNHUB_PRODUCTION_API_KEY
CORS_ORIGIN=http://<YOUR_EC2_PUBLIC_IP_OR_DOMAIN>

VITE_API_URL=http://<YOUR_EC2_PUBLIC_IP_OR_DOMAIN>:5000
VITE_SOCKET_URL=http://<YOUR_EC2_PUBLIC_IP_OR_DOMAIN>:5000
```

### 4. Running Production Containers

Launch the production stack:

```bash
docker compose -f docker-compose.production.yml up -d --build
```

### 5. Production Database Migrations

For production schema updates:

```bash
# In production, generate Prisma client inside container and apply migrations cleanly:
docker compose -f docker-compose.production.yml exec backend npx prisma generate
docker compose -f docker-compose.production.yml exec backend npx prisma migrate deploy
```

> **Why `prisma migrate deploy` over `db push`?**  
> `prisma migrate deploy` applies version-controlled SQL migrations deterministically without altering existing production data or risking schema drift.

### 6. Application Updates (Continuous Deployment)

To deploy an updated version of MarketPulse without data loss:

```bash
# Pull latest code from main branch
git pull origin main

# Rebuild static frontend & backend images, then restart containers gracefully
docker compose -f docker-compose.production.yml up -d --build

# Run any pending database migrations
docker compose -f docker-compose.production.yml exec backend npx prisma migrate deploy
```

### 7. Viewing Logs & Container Status

```bash
# Check service health and running status
docker compose -f docker-compose.production.yml ps

# View live aggregate container logs
docker compose -f docker-compose.production.yml logs -f

# View backend specific logs
docker compose -f docker-compose.production.yml logs -f backend

# View Nginx web server logs
docker compose -f docker-compose.production.yml logs -f frontend
```

### 8. Restarting Services & Health Checks

```bash
# Restart entire stack
docker compose -f docker-compose.production.yml restart

# Check backend health check endpoint
curl -f http://localhost:5000/api/health

# Check database connection check endpoint
curl -f http://localhost:5000/api/db-check
```

### 9. Rollback Procedure

If a deployment issues occurs:

```bash
# 1. Rollback code to previous git commit/tag
git checkout <PREVIOUS_STABLE_COMMIT_OR_TAG>

# 2. Rebuild and restart containers
docker compose -f docker-compose.production.yml up -d --build

# 3. Verify health status
curl -f http://localhost:5000/api/health
```

### 10. Monitoring Recommendations

- **Automated Uptime Checks**: Configure AWS Route 53 Health Checks or UptimeRobot targeting `http://<EC2_IP>:5000/api/health`.
- **System Metrics**: Enable AWS CloudWatch Basic Monitoring on your EC2 instance for CPU, Disk I/O, and Network utilization.
- **Docker Resource Monitoring**: Run `docker stats` on EC2 to monitor container RAM and CPU utilization.

---

## License

This project is licensed under the [MIT License](LICENSE).
