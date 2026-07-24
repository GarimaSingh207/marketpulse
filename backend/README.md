# MarketPulse Backend

Node.js + Express + TypeScript API

---

## Folder Structure

```
backend/
├── src/
│   ├── index.ts                # Entry point - starts the server
│   ├── app.ts                  # Express app setup
│   ├── routes/
│   │   └── health.routes.ts    # Health check route
│   └── controllers/
│       └── health.controller.ts # Health check handler
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

Copy the example env file:

```bash
cp .env.example .env
```

### Run in development

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

| Method | Endpoint        | Description  |
|--------|-----------------|--------------|
| GET    | /api/health     | Health check |

### Health Check Response

```json
{
  "status": "ok",
  "message": "MarketPulse backend is running"
}
```
