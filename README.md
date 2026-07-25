# MarketPulse

Full-Stack Financial Analytics Platform

---

## Tech Stack

**Frontend:** React, React Router, Axios, Socket.IO Client

**Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis, Socket.IO

**Security:** JWT, bcrypt, Helmet, express-rate-limit

**Deployment:** Docker, Docker Compose, GitHub Actions, AWS (EC2, S3, IAM)

---

## Features

- [x] JWT Authentication with bcrypt password hashing
- [x] Role-Based Access Control (RBAC)
- [x] Real-time portfolio tracking via Socket.IO
- [x] Live market data via Finnhub API
- [x] Redis caching for stock price responses (60s TTL)
- [x] Personalized watchlists with live prices
- [x] Portfolio management (create, holdings, BUY/SELL transactions)
- [x] Relational database schemas (PostgreSQL + Prisma)
- [x] API rate limiting (express-rate-limit)
- [x] HTTP security headers (Helmet)
- [ ] Dockerized deployment with Docker Compose
- [ ] CI/CD with GitHub Actions
- [ ] AWS EC2 hosting with Nginx reverse proxy
- [ ] S3 and IAM integration

---

## Project Structure

```
MarketPulse/
├── backend/          # Node.js + Express API
├── frontend/         # React SPA
├── docs/             # API documentation & Postman collection
│   ├── MarketPulse_API.postman_collection.json
│   ├── socket-events.md
│   └── watchlists.md
├── .gitignore
├── LICENSE
├── README.md
└── url.txt           # Live demo URL
```

---

## Live Demo

> Coming soon — deployment URL will be added to `url.txt`

---

## Getting Started

```bash
# Backend
cd backend
npm install
cp .env.example .env   # fill in your credentials
npx prisma db push
npx tsx seed-admin.ts  # creates admin@example.com / Admin123
npm run dev            # starts on http://localhost:5000

# Frontend
cd frontend
npm install
npm run dev            # starts on http://localhost:5173
```

---

## License

This project is licensed under the [MIT License](LICENSE).
