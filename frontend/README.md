# MarketPulse Frontend

React 18 + TypeScript + Vite Financial Analytics Dashboard SPA.

---

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Routing**: React Router DOM (v6)
- **HTTP Client**: Axios (with JWT interceptors)
- **Real-time WebSockets**: Socket.IO Client

---

## Folder Structure

```
frontend/src/
├── components/             # Reusable UI components
│   ├── EmptyState.tsx       # Standard empty state layout
│   ├── ErrorBanner.tsx      # Standard error banner layout
│   ├── Layout.tsx           # Main app layout (Sidebar + Navbar + Outlet)
│   ├── Modal.tsx            # Overlay modal dialog
│   ├── Navbar.tsx           # Top navigation bar
│   ├── ProtectedRoute.tsx   # Auth guard for client routes
│   ├── Sidebar.tsx          # App navigation sidebar
│   ├── Spinner.tsx          # Accessible loading spinner
│   └── StatCard.tsx         # Dashboard metric card
├── context/
│   ├── AuthContext.tsx      # Authentication state & localStorage persistence
│   └── SocketContext.tsx    # Authenticated Socket.IO connection manager
├── pages/
│   ├── Dashboard.tsx        # Portfolio overview & aggregate metrics
│   ├── Login.tsx            # User login page
│   ├── Market.tsx           # Real-time stock search & price quote lookup
│   ├── PortfolioDetail.tsx  # Holdings, gain/loss, transactions & trading modal
│   ├── Portfolios.tsx       # Portfolio list & creation
│   ├── Register.tsx         # User registration page
│   └── Watchlists.tsx       # Watchlist management & live stock quotes
├── services/
│   └── api.ts               # Axios client with JWT request/response interceptors
├── types/
│   └── index.ts             # Shared TypeScript API interface definitions
├── App.css                  # Custom dark mode design system & utilities
├── App.tsx                  # Client router configuration & provider hierarchy
└── main.tsx                 # Entry point
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

Environment variables:
- `VITE_API_URL`: Backend API base URL (default: `http://localhost:5000`)
- `VITE_SOCKET_URL`: Socket.IO WebSocket server URL (default: `http://localhost:5000`)

### Run in development mode

```bash
npm run dev
```

App starts at `http://localhost:5173`

### Build for production

```bash
npm run build
```

---

## Features

- **JWT Authentication**: Login, register, persistent session state, and auto-logout on 401 response.
- **Real-time Updates**: Socket.IO integration automatically refreshes dashboard, portfolio values, holdings, and watchlists without manual polling.
- **Portfolio Management**: Create, delete, track holdings, compute total return %, and execute Buy/Sell transactions.
- **Watchlists**: Create personal watchlists, add/remove stock tickers, and view live prices cached by Redis.
- **Market Lookup**: Search real-time Finnhub stock quotes.
- **Responsive Dark Design**: Tailored CSS design system supporting Desktop, Tablet, and Mobile displays.
