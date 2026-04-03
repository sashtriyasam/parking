# Architecture & Backend Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│                                                         │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │  ParkEasyMobile  │      │  Web Frontend    │        │
│  │  (Expo RN)       │      │  (React + Vite)  │        │
│  │  Expo Router     │      │  Zustand stores  │        │
│  │  Zustand         │      │  TanStack Query  │        │
│  │  TanStack Query  │      └──────────────────┘        │
│  └────────┬─────────┘                                   │
│           │ HTTPS + Socket.io                           │
└───────────┼─────────────────────────────────────────────┘
            │
┌───────────▼─────────────────────────────────────────────┐
│                   RENDER.COM (Free)                     │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Node.js / Express 5 API               │   │
│  │                                                  │   │
│  │  Rate Limiter → Helmet → CORS → morgan          │   │
│  │                                                  │   │
│  │  /api/v1/                                       │   │
│  │    auth       booking    customer               │   │
│  │    provider   parking    payments               │   │
│  │    passes     verification                      │   │
│  │                                                  │   │
│  │  Socket.io server (slot updates)                │   │
│  │  node-cron (reservation cleanup, every 1 min)   │   │
│  │  Swagger UI at /api-docs                        │   │
│  └──────────────┬───────────────────────────────────┘   │
└─────────────────┼───────────────────────────────────────┘
                  │ Prisma ORM (pgbouncer=true)
┌─────────────────▼───────────────────────────────────────┐
│              SUPABASE (ap-south-1 / Mumbai)             │
│              PostgreSQL 17                              │
│              parkeasy-prod                              │
└─────────────────────────────────────────────────────────┘

External Services:
  Razorpay  → Payment orders + verification
  Expo Push → Push notifications to mobile
  UptimeRobot → Pings /health every 5min (keeps Render alive)
  EAS Build   → Native APK builds
  EAS Update  → OTA JS updates
```

---

## Backend File Structure

```
backend/
├── index.js                    # Entry point — DB connect, Socket init, server listen
├── package.json
├── Dockerfile                  # node:20-slim + openssl install
├── render.yaml                 # Render deployment config
├── prisma/
│   ├── schema.prisma           # Database schema (source of truth)
│   └── seed.js                 # Seed script
├── src/
│   ├── app.js                  # Express app setup, middleware, routes
│   ├── config/
│   │   ├── db.js               # Prisma client singleton
│   │   └── swagger.js          # Swagger/OpenAPI setup
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── booking.controller.js
│   │   ├── customer.controller.js
│   │   ├── parking.controller.js
│   │   ├── pass.controller.js
│   │   ├── payment.controller.js
│   │   ├── provider.controller.js
│   │   ├── ticket.controller.js
│   │   └── verificationController.js
│   ├── middleware/
│   │   ├── auth.js             # protect() + restrictTo()
│   │   ├── errorHandler.js     # Global error handler
│   │   └── validate.js         # Zod validation middleware
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── booking.routes.js
│   │   ├── customer.routes.js
│   │   ├── parking.routes.js
│   │   ├── pass.routes.js
│   │   ├── payment.routes.js
│   │   ├── provider.routes.js
│   │   └── verificationRoutes.js
│   ├── services/
│   │   ├── analytics.service.js
│   │   ├── booking.service.js  # reserveSlot + confirmBooking (optimistic locking)
│   │   ├── discovery.service.js
│   │   ├── geocoding.service.js
│   │   ├── pass.service.js
│   │   ├── payment.service.js  # Razorpay integration
│   │   ├── pricing.service.js
│   │   └── socket.service.js   # Socket.io init + emitSlotUpdate
│   ├── validators/
│   │   └── auth.validator.js   # Zod schemas for register/login
│   ├── jobs/
│   │   └── cleanupReservations.js  # Cron: free expired RESERVED slots
│   └── utils/
│       ├── AppError.js         # Custom error class
│       ├── asyncHandler.js     # Try/catch wrapper
│       ├── cache.js
│       ├── logger.js           # Winston logger
│       ├── pdfGenerator.js     # PDFKit ticket PDF
│       ├── pushNotifications.js # Expo push notifications
│       ├── qrcode.js           # QR code generation
│       └── token.js            # JWT generate/verify + sha256 hash
```

---

## Request Lifecycle

```
Request arrives
    ↓
Helmet (security headers)
    ↓
Rate Limiter (100/15min per IP)
    ↓
CORS check (whitelist: localhost, FRONTEND_URL, MOBILE_APP_URL, RENDER_APP_URL)
    ↓
express.json() parser
    ↓
cookieParser()
    ↓
morgan (dev only)
    ↓
Swagger middleware (at /api-docs)
    ↓
Route matching (/api/v1/* or /api/*)
    ↓
[Optional] validate(zodSchema) middleware
    ↓
[Optional] protect() middleware (JWT verify + DB user check)
    ↓
[Optional] restrictTo(roles) middleware
    ↓
Controller → Service → Prisma → Supabase PostgreSQL
    ↓
Response
    ↓
[On error] → Global errorHandler middleware
```

---

## Auth System

### Access Token
- JWT signed with `JWT_SECRET`
- Expires in **15 minutes**
- Payload: `{ sub: userId, role }`
- Sent in `Authorization: Bearer` header

### Refresh Token
- JWT signed with `JWT_REFRESH_SECRET`
- Expires in **7 days**
- Stored as SHA-256 hash in `refresh_tokens` table
- **Rotation:** On use, old token deleted, new pair issued
- **Revocation:** Logout deletes from DB → even valid JWTs can't refresh

```
Login/Register
    → generateTokens() → { accessToken, refreshToken }
    → hashToken(refreshToken) → stored in DB
    → both tokens returned to client

Client uses accessToken (15min window)

On 401:
    → POST /auth/refresh with refreshToken
    → verifyRefreshToken() (JWT signature)
    → lookup token_hash in DB
    → if found + not expired → delete old → issue new pair
    → if not found → 401 (already rotated or logged out)

Logout:
    → DELETE refresh_token from DB by hash
    → client clears SecureStore
```

---

## Slot Reservation System

Race condition prevention via optimistic locking:

```javascript
// 1. Find candidate slots (top 5 FREE slots for vehicle type)
const candidates = await prisma.parkingSlot.findMany({
  where: { floor: { facility_id }, vehicle_type, status: 'FREE' },
  take: 5
});

// 2. Try to atomically reserve one
for (const candidate of candidates) {
  const result = await prisma.parkingSlot.updateMany({
    where: { id: candidate.id, status: 'FREE' },  // double-check status
    data: { status: 'RESERVED', reservation_expiry: expiryTime }
  });
  if (result.count > 0) break; // Got one!
}
```

If two users try simultaneously, only one `updateMany` succeeds (PostgreSQL row-level locking). The other tries the next candidate.

Reservations expire after `RESERVATION_TIMEOUT_MINUTES` (default: 10 min).  
Cleanup cron runs every minute.

---

## Socket.io Architecture

```javascript
// Server (socket.service.js)
io.on('connection', (socket) => {
  socket.on('join_facility', (facilityId) => {
    socket.join(`facility_${facilityId}`);
  });
  socket.on('leave_facility', (facilityId) => {
    socket.leave(`facility_${facilityId}`);
  });
});

// Emit to all clients watching a facility
emitSlotUpdate(facilityId, { slot_id, status, reservation_expiry });
```

```javascript
// Client (useSocket.ts)
// Singleton socket, connected once with auth token
// Auto-reconnect: 5 attempts, 2s delay
// useSocket() hook provides joinFacility(), leaveFacility()
// useLiveSlots() hook subscribes to slot_updated events
```

---

## Middleware Details

### `protect()`
1. Extracts Bearer token from `Authorization` header
2. Verifies JWT signature + expiry
3. Queries DB to confirm user still exists
4. Attaches `req.user` for downstream use

### `restrictTo(...roles)`
Checks `req.user.role` against allowed roles. Returns 403 if not permitted.

### `validate(schema)`
Zod schema validation on `req.body`. Returns 400 with joined error messages on failure.

### Global Error Handler
All errors thrown with `AppError` or via `asyncHandler` reach `errorHandler.js`:
- Operational errors (AppError) → structured JSON response
- Programming errors → 500 with generic message
- Prisma errors → mapped to user-friendly messages

---

## Payments (Razorpay)

```
Client: POST /payments/create-order { amount, facility_id, slot_id }
    ↓
Server: razorpay.orders.create({ amount: amount * 100, currency: 'INR' })
    ↓
Client: RazorpayCheckout.open(options) → user pays
    ↓
Client: POST /payments/verify { razorpay_order_id, razorpay_payment_id, razorpay_signature, ... }
    ↓
Server: HMAC SHA-256 verify: hash(orderId|paymentId) === signature
    ↓
Server: bookingService.confirmBooking() → slot OCCUPIED + ticket PAID
    ↓
Server: prisma.ticket.update({ payment_id, payment_status: 'PAID' })
    ↓
Client: navigate to success screen
```

**Important:** Amount is in paise on the wire (₹60 = 6000 paise). The `createPaymentOrder` service multiplies by 100.

---

## Logger (Winston)

Logs to console with timestamps. Log levels:
- `info` — server start, DB connect, socket events
- `warn` — missing optional env vars, Razorpay not initialized
- `error` — unhandled errors, DB failures

Production: `NODE_ENV=production` — morgan HTTP logs are disabled (only `development` mode logs HTTP).

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | Supabase pooler URL with `?pgbouncer=true` |
| `DIRECT_URL` | ✅ | — | Supabase direct URL for migrations |
| `JWT_SECRET` | ✅ | — | Min 32 chars |
| `JWT_REFRESH_SECRET` | ✅ | — | Min 32 chars, different from JWT_SECRET |
| `PORT` | — | 5000 | Server port |
| `NODE_ENV` | — | development | `production` disables HTTP logs |
| `RAZORPAY_KEY_ID` | ⚠️ | — | Optional, payments won't work without it |
| `RAZORPAY_KEY_SECRET` | ⚠️ | — | Optional |
| `EXPO_ACCESS_TOKEN` | ⚠️ | — | Optional, push notifications won't work |
| `FRONTEND_URL` | — | — | Added to CORS whitelist |
| `MOBILE_APP_URL` | — | — | Added to CORS whitelist |
| `RENDER_APP_URL` | — | — | Added to CORS whitelist |
| `RESERVATION_TIMEOUT_MINUTES` | — | 10 | Slot hold duration |

Server exits with code 1 if `DATABASE_URL`, `JWT_SECRET`, or `JWT_REFRESH_SECRET` are missing.
