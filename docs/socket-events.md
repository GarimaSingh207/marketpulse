# Socket.IO Real-Time Events Reference

MarketPulse uses Socket.IO for real-time WebSocket notifications.

---

## Authentication & Room Assignment

Clients connect to the Socket.IO server at `ws://localhost:5000` providing a valid Bearer JWT token in the handshake auth or headers:

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: {
    token: "YOUR_JWT_TOKEN"
  }
});
```

Upon successful JWT verification, the client automatically joins room `user:<USER_ID>`. All event notifications are broadcast strictly to the user's private room.

---

## Portfolio Events

### 1. `portfolio:created`
Emitted when a portfolio is created.

**Payload:**
```json
{
  "portfolioId": "cmrz...",
  "name": "Tech Growth",
  "userId": "cmrz..."
}
```

---

### 2. `portfolio:deleted`
Emitted when a portfolio is deleted.

**Payload:**
```json
{
  "portfolioId": "cmrz..."
}
```

---

### 3. `holding:created`
Emitted when a holding is added to a portfolio.

**Payload:**
```json
{
  "holdingId": "cmrz...",
  "portfolioId": "cmrz...",
  "symbol": "AAPL",
  "quantity": 10,
  "averagePrice": 150
}
```

---

### 4. `holding:deleted`
Emitted when a holding is removed from a portfolio.

**Payload:**
```json
{
  "holdingId": "cmrz...",
  "portfolioId": "cmrz..."
}
```

---

### 5. `transaction:created`
Emitted when a BUY or SELL transaction is executed.

**Payload:**
```json
{
  "transactionId": "cmrz...",
  "holdingId": "cmrz...",
  "portfolioId": "cmrz...",
  "type": "BUY",
  "quantity": 5,
  "price": 175.50,
  "createdAt": "2026-07-25T03:30:00.000Z"
}
```

---

### 6. `portfolio:valueUpdated`
Emitted automatically when a transaction recalculates holding quantity or weighted average price.

**Payload:**
```json
{
  "portfolioId": "cmrz...",
  "updatedHolding": {
    "holdingId": "cmrz...",
    "quantity": 15,
    "averagePrice": 158.50
  }
}
```

---

## Watchlist Events

### 7. `watchlist:created`
Emitted when a watchlist is created.

**Payload:**
```json
{
  "watchlistId": "cmrz...",
  "name": "My Tech Picks"
}
```

---

### 8. `watchlist:deleted`
Emitted when a watchlist is deleted.

**Payload:**
```json
{
  "watchlistId": "cmrz..."
}
```

---

### 9. `watchlist:stockAdded`
Emitted when a stock is added to a watchlist.

**Payload:**
```json
{
  "watchlistId": "cmrz...",
  "stockId": "cmrz...",
  "symbol": "AAPL"
}
```

---

### 10. `watchlist:stockRemoved`
Emitted when a stock is removed from a watchlist.

**Payload:**
```json
{
  "watchlistId": "cmrz...",
  "symbol": "AAPL"
}
```
