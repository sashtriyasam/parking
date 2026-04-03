# API Reference

**Base URL:** `https://parkeasy-backend-uy3x.onrender.com/api/v1`  
**Also available at:** `/api` (without version prefix)  
**Swagger UI:** `/api-docs`  
**Health:** `GET /health`

All authenticated endpoints require:
```
Authorization: Bearer <accessToken>
```

---

## Authentication — `/auth`

### POST `/auth/register`
Create a new account.

**Validation (Zod):**
- `email` — valid email format
- `password` — minimum 8 characters
- `full_name` — 2–100 characters
- `phone_number` — optional, 10–15 digits
- `role` — must be exactly `"CUSTOMER"` or `"PROVIDER"`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepass123",
  "full_name": "Priya Mehta",
  "phone_number": "+919876543210",
  "role": "CUSTOMER"
}
```

**Response 201:**
```json
{
  "status": "success",
  "data": {
    "user": { "id": "uuid", "email": "...", "full_name": "...", "role": "CUSTOMER" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### POST `/auth/login`
**Validation (Zod):** email + password required

**Request:**
```json
{ "email": "user@example.com", "password": "securepass123" }
```

**Response 200:** same shape as register

---

### POST `/auth/refresh`
Exchange a refresh token for a new token pair. Old token is deleted (rotation).

**Request:**
```json
{ "refreshToken": "eyJ..." }
```

**Response 200:**
```json
{
  "status": "success",
  "data": { "accessToken": "eyJ...", "refreshToken": "eyJ..." }
}
```

---

### POST `/auth/logout` 🔒
Invalidates the refresh token in the database.

**Request:**
```json
{ "refreshToken": "eyJ..." }
```

---

### GET `/auth/me` 🔒
Returns the current authenticated user.

---

### POST `/auth/update-push-token` 🔒
Store/update Expo push token for notifications.

**Request:**
```json
{ "pushToken": "ExponentPushToken[xxx]" }
```

---

## Customer — `/customer`

Public routes (no auth needed):

### GET `/customer/search`
Search for parking facilities near a location.

**Query params:**
| Param | Type | Description |
|---|---|---|
| `latitude` | number | Required |
| `longitude` | number | Required |
| `radius` | number | Search radius in km (default: 5) |
| `vehicle_type` | string | CAR / BIKE / TRUCK |
| `sort_by` | string | distance / price / availability |

**Response 200:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "name": "Worli Sea Face Parking",
      "address": "Worli Sea Face, Mumbai",
      "latitude": 18.9988,
      "longitude": 72.8154,
      "distance_km": 1.2,
      "available_slots": 13,
      "hourly_rate": 60,
      "image_url": "..."
    }
  ]
}
```

---

### GET `/customer/facility/:facilityId`
Full facility details including floors, slots, pricing.

---

### GET `/customer/facility/:facilityId/slots`
Available slots for a facility, grouped by floor.

---

### GET `/customer/profile` 🔒
### PUT `/customer/profile` 🔒
### GET `/customer/stats` 🔒

---

### Vehicles 🔒
```
GET    /customer/vehicles
POST   /customer/vehicles
DELETE /customer/vehicles/:vehicleId
```

**Add vehicle request:**
```json
{
  "vehicle_number": "MH04AB1234",
  "vehicle_type": "CAR",
  "nickname": "My Swift"
}
```

---

### Favorites 🔒
```
GET    /customer/favorites
POST   /customer/favorites/:facilityId
DELETE /customer/favorites/:facilityId
```

---

### Tickets 🔒
```
GET  /customer/tickets/active
GET  /customer/tickets/history
GET  /customer/tickets/:ticketId
POST /customer/tickets/:ticketId/extend
```

---

### Booking Flow 🔒
```
POST /customer/booking/confirm
GET  /customer/booking/:ticketId/pdf
```

---

### Monthly Passes 🔒
```
GET  /customer/passes/available
POST /customer/passes/purchase
GET  /customer/passes/active
```

---

## Bookings — `/bookings` 🔒

All routes require authentication.

### POST `/bookings/reserve`
Reserve a slot (holds for `RESERVATION_TIMEOUT_MINUTES`, default 10 min).

**Request:**
```json
{
  "facility_id": "uuid",
  "vehicle_type": "CAR",
  "floor_id": "uuid"
}
```

**Response 200:**
```json
{
  "status": "success",
  "data": {
    "slot_id": "uuid",
    "reserved_until": "2026-03-31T18:45:00.000Z",
    "vehicle_type": "CAR"
  }
}
```

---

### POST `/bookings`
Create a booking (after reservation + payment order created).

**Request:**
```json
{
  "facility_id": "uuid",
  "slot_id": "uuid",
  "vehicle_number": "MH04AB1234",
  "vehicle_type": "CAR",
  "payment_method": "upi",
  "status": "PENDING"
}
```

---

### POST `/bookings/checkout`
End a booking (mark exit time, calculate fees).

---

### GET `/bookings/me`
Get current user's bookings.

---

## Payments — `/payments` 🔒

### POST `/payments/create-order`
Create a Razorpay order.

**Request:**
```json
{
  "amount": 60,
  "facility_id": "uuid",
  "slot_id": "uuid"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_xxxxx",
    "amount": 6000,
    "currency": "INR",
    "key": "rzp_test_xxx"
  }
}
```

> Note: `amount` in response is in paise (rupees × 100). Pass directly to Razorpay SDK.

---

### POST `/payments/verify`
Verify Razorpay signature and confirm booking.

**Request:**
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "sha256_hex",
  "slot_id": "uuid",
  "vehicle_number": "MH04AB1234",
  "vehicle_type": "CAR"
}
```

---

## Passes — `/passes` 🔒

```
GET    /passes/me                         (CUSTOMER)
GET    /passes/available                  (CUSTOMER)
POST   /passes/purchase                   (CUSTOMER)
DELETE /passes/:id/cancel                 (CUSTOMER)
GET    /passes/facility/:facilityId       (PROVIDER)
```

---

## Provider — `/provider` 🔒

All routes require `role: PROVIDER` or `ADMIN`.

### Dashboard
```
GET /provider/dashboard/stats
GET /provider/dashboard/revenue
GET /provider/dashboard/occupancy
GET /provider/dashboard/recent-bookings
```

### Facilities
```
POST   /provider/facilities
GET    /provider/facilities
GET    /provider/facilities/:facilityId
PUT    /provider/facilities/:facilityId
DELETE /provider/facilities/:facilityId
GET    /provider/facilities/:facilityId/live-status
```

### Slots & Floors
```
POST /provider/facilities/:facilityId/floors
POST /provider/facilities/:facilityId/slots/bulk
POST /provider/floors/:floorId/slots/bulk
PUT  /provider/slots/:slotId
DELETE /provider/slots/:slotId
GET  /provider/facilities/:facilityId/slots
```

### Pricing
```
POST /provider/pricing-rules
GET  /provider/facilities/:facilityId/pricing
PUT  /provider/facilities/:facilityId/pricing
```

**Set pricing rule request:**
```json
{
  "facility_id": "uuid",
  "vehicle_type": "CAR",
  "hourly_rate": 60,
  "daily_max": 500,
  "monthly_pass_price": 3500
}
```

### Bookings & Analytics
```
GET /provider/bookings
GET /provider/analytics
GET /provider/earnings
GET /provider/withdrawals
POST /provider/withdrawals
GET /provider/reports/revenue
GET /provider/check-vehicle?plate=MH04AB1234
```

---

## Parking (Public) — `/parking`

```
GET /parking                         All facilities
GET /parking/search                  Search (same as /customer/search)
GET /parking/:facilityId/details     Facility details
GET /parking/:facilityId/available-slots
GET /parking/:id                     Single facility
GET /parking/floors/:floorId/slots   All slots on a floor
```

---

## Error Format

All errors follow this shape:
```json
{
  "status": "error",
  "message": "Human readable error message"
}
```

Common status codes:
| Code | Meaning |
|---|---|
| 400 | Validation error or bad request |
| 401 | Not authenticated or token expired |
| 403 | Authenticated but wrong role |
| 404 | Resource not found |
| 429 | Rate limited (100 req / 15 min per IP) |
| 500 | Internal server error |

---

## Rate Limiting

100 requests per IP per 15-minute window. Returns `429` with message `"Too many requests from this IP, please try again after 15 minutes"`.

---

## WebSocket Events

**Connection:**
```js
const socket = io('https://parkeasy-backend-uy3x.onrender.com', {
  auth: { token: accessToken },
  transports: ['websocket']
});
```

**Events:**

| Event | Direction | Payload |
|---|---|---|
| `join_facility` | Client → Server | `facilityId: string` |
| `leave_facility` | Client → Server | `facilityId: string` |
| `slot_updated` | Server → Client | `{ slot_id, status, reservation_expiry }` |
