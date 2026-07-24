# MarketPulse Documentation & API References

This directory contains technical documentation and API test collections for the MarketPulse platform.

---

## Postman Collection

The API test collection is available at:
[`MarketPulse_API.postman_collection.json`](./MarketPulse_API.postman_collection.json)

### Included Endpoints:
1. **System & Health**:
   - `GET /api/health`
   - `GET /api/db-check`
2. **Authentication**:
   - `POST /api/auth/register`
   - `POST /api/auth/login`
   - `GET /api/profile`
3. **Admin Management (RBAC)**:
   - `GET /api/admin/users`
   - `DELETE /api/admin/users/:id`
4. **Portfolios & Holdings**:
   - `POST /api/portfolios`
   - `GET /api/portfolios`
   - `DELETE /api/portfolios/:id`
   - `POST /api/portfolios/:portfolioId/holdings`
   - `DELETE /api/holdings/:id`
   - `POST /api/holdings/:holdingId/transactions`
5. **Market Data & Valuation**:
   - `GET /api/market/price/:symbol`
   - `GET /api/portfolio/value/:portfolioId`

---

## Socket.IO Events Documentation

Detailed specifications for WebSocket connection authentication and real-time events are documented in:
[`socket-events.md`](./socket-events.md)
