# MarketPulse Frontend

React + TypeScript Single Page Application (Vite)

---

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Routing**: React Router DOM (v6)
- **HTTP Client**: Axios

---

## Folder Structure

```
frontend/
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/
│   │   └── Home.tsx        # Homepage displaying backend health status
│   ├── services/
│   │   └── api.ts          # Centralized Axios instance
│   ├── App.css             # Component & layout styling
│   ├── App.tsx             # Main routing component
│   ├── main.tsx            # Application entry point
│   └── vite-env.d.ts       # Vite environment types
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env
└── .env.example
```

---

## Getting Started

### Install dependencies

```bash
cd frontend
npm install
```

### Set up environment variables

Copy the example env file:

```bash
cp .env.example .env
```

Environment variable:
- `VITE_API_URL`: Backend API base URL (default: `http://localhost:5000`)

### Run in development mode

```bash
npm run dev
```

App starts at `http://localhost:3000`

### Build for production

```bash
npm run build
```

---

## Features

- Dynamic health check against backend API (`GET /api/health`).
- Reusable Axios instance using environment variables (`import.meta.env.VITE_API_URL`).
- Clean, centered, responsive vanilla CSS design.
