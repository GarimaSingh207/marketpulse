# Watchlist API Reference

MarketPulse allows authenticated users to create personal watchlists, add stocks to them, and retrieve live prices for each symbol.

---

## Authentication

All endpoints require a valid JWT Bearer token in the `Authorization` header.

```
Authorization: Bearer <token>
```

---

## Endpoints

### Create Watchlist

**POST** `/api/watchlists`

**Request body:**
```json
{
  "name": "My Tech Picks"
}
```

**Response `201`:**
```json
{
  "id": "cmrz...",
  "name": "My Tech Picks",
  "userId": "cmrz...",
  "stocks": []
}
```

---

### Get All Watchlists

**GET** `/api/watchlists`

Returns all watchlists owned by the authenticated user.

**Response `200`:**
```json
[
  {
    "id": "cmrz...",
    "name": "My Tech Picks",
    "userId": "cmrz...",
    "stocks": [
      { "id": "cmrz...", "watchlistId": "cmrz...", "symbol": "AAPL" }
    ]
  }
]
```

---

### Get Watchlist with Live Prices

**GET** `/api/watchlists/:id`

Returns a single watchlist with all stocks and their current market prices (fetched from Finnhub, Redis-cached for 60 seconds).

Owner only — returns `404` if the watchlist belongs to another user.

**Response `200`:**
```json
{
  "id": "cmrz...",
  "name": "My Tech Picks",
  "userId": "cmrz...",
  "stocks": [
    {
      "id": "cmrz...",
      "symbol": "AAPL",
      "currentPrice": 227.48
    },
    {
      "id": "cmrz...",
      "symbol": "TSLA",
      "currentPrice": null
    }
  ]
}
```

> `currentPrice` is `null` if the live price cannot be fetched (invalid symbol or service unavailable).

---

### Delete Watchlist

**DELETE** `/api/watchlists/:id`

Deletes the watchlist and all its stocks (cascade).

Owner only.

**Response `200`:**
```json
{
  "message": "Watchlist deleted successfully"
}
```

---

### Add Stock to Watchlist

**POST** `/api/watchlists/:id/stocks`

Symbols are automatically normalized to uppercase.

Duplicate symbols within the same watchlist are rejected with `409`.

**Request body:**
```json
{
  "symbol": "aapl"
}
```

**Response `201`:**
```json
{
  "id": "cmrz...",
  "watchlistId": "cmrz...",
  "symbol": "AAPL"
}
```

**Error `409`** (duplicate):
```json
{
  "message": "AAPL is already in this watchlist"
}
```

---

### Remove Stock from Watchlist

**DELETE** `/api/watchlists/:id/stocks/:symbol`

The symbol in the URL is case-insensitive (automatically uppercased).

**Response `200`:**
```json
{
  "message": "AAPL removed from watchlist"
}
```

---

## Socket.IO Real-Time Events

All watchlist events are emitted to the authenticated user's private room `user:<USER_ID>`.

| Event | When emitted |
|-------|-------------|
| `watchlist:created` | After a watchlist is created |
| `watchlist:deleted` | After a watchlist is deleted |
| `watchlist:stockAdded` | After a stock is added |
| `watchlist:stockRemoved` | After a stock is removed |

### `watchlist:created`
```json
{
  "watchlistId": "cmrz...",
  "name": "My Tech Picks"
}
```

### `watchlist:deleted`
```json
{
  "watchlistId": "cmrz..."
}
```

### `watchlist:stockAdded`
```json
{
  "watchlistId": "cmrz...",
  "stockId": "cmrz...",
  "symbol": "AAPL"
}
```

### `watchlist:stockRemoved`
```json
{
  "watchlistId": "cmrz...",
  "symbol": "AAPL"
}
```

---

## Redis Caching

Live prices fetched during `GET /api/watchlists/:id` are cached in Redis using the key `stock:<SYMBOL>` with a 60-second TTL. The cache is shared with portfolio valuation — a price fetched for a portfolio holding is also served from cache for the same symbol in a watchlist request.
