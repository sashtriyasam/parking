# Database Reference

**Provider:** PostgreSQL 17 via Supabase  
**ORM:** Prisma 5.10.0  
**Project:** `parkeasy-prod` (ID: `dofeprhouepdxltbppyl`, region: `ap-south-1`)

---

## Schema Overview

```
users
 ├── parking_facilities (provider's facilities)
 ├── tickets (customer's parking tickets)
 ├── monthly_passes
 ├── vehicles
 ├── favorites
 ├── refresh_tokens
 ├── withdrawals
 └── settlements

parking_facilities
 ├── floors
 │    └── parking_slots
 ├── pricing_rules
 ├── tickets
 ├── monthly_passes
 └── favorites
```

---

## Tables

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | `TEXT` (UUID) | Primary key |
| `email` | `TEXT` | Unique |
| `password_hash` | `TEXT` | bcrypt hash |
| `full_name` | `TEXT` | Nullable |
| `role` | `TEXT` | `CUSTOMER` \| `PROVIDER` \| `ADMIN` |
| `balance` | `DECIMAL(12,2)` | Provider earnings balance |
| `push_token` | `TEXT` | Expo push token, nullable |
| `created_at` | `TIMESTAMP` | |
| `updated_at` | `TIMESTAMP` | Auto-updated |

---

### `refresh_tokens`
Stores hashed refresh tokens for revocation. Rotated on every use.

| Column | Type | Notes |
|---|---|---|
| `id` | `TEXT` (UUID) | Primary key |
| `token_hash` | `TEXT` | SHA-256 hash of the token. Unique |
| `user_id` | `TEXT` | FK → users.id (CASCADE delete) |
| `expires_at` | `TIMESTAMP` | 7 days from issue |
| `created_at` | `TIMESTAMP` | |

> The raw token is never stored — only its SHA-256 hash. Tokens are deleted on use (rotation) or on logout.

---

### `parking_facilities`
| Column | Type | Notes |
|---|---|---|
| `id` | `TEXT` (UUID) | Primary key |
| `provider_id` | `TEXT` | FK → users.id |
| `name` | `TEXT` | |
| `address` | `TEXT` | |
| `city` | `TEXT` | |
| `latitude` | `DECIMAL` | Nullable |
| `longitude` | `DECIMAL` | Nullable |
| `total_floors` | `INT` | Default 1 |
| `operating_hours` | `TEXT` | e.g. "24/7" or "06:00 AM - 11:00 PM" |
| `is_active` | `BOOLEAN` | Default true |
| `image_url` | `TEXT` | Nullable |
| `contact_number` | `TEXT` | Nullable |
| `description` | `TEXT` | Nullable |
| `created_at` | `TIMESTAMP` | |
| `updated_at` | `TIMESTAMP` | |

---

### `floors`
| Column | Type | Notes |
|---|---|---|
| `id` | `TEXT` (UUID) | Primary key |
| `facility_id` | `TEXT` | FK → parking_facilities.id (CASCADE) |
| `floor_number` | `INT` | 0 = Ground Floor |
| `floor_name` | `TEXT` | e.g. "Ground Floor", "Level 1" |

Unique constraint: `(facility_id, floor_number)`

---

### `parking_slots`
| Column | Type | Notes |
|---|---|---|
| `id` | `TEXT` (UUID) | Primary key |
| `floor_id` | `TEXT` | FK → floors.id (CASCADE) |
| `slot_number` | `TEXT` | e.g. "C-01", "B-03" |
| `vehicle_type` | `TEXT` | `CAR` \| `BIKE` \| `TRUCK` |
| `status` | `TEXT` | `FREE` \| `RESERVED` \| `OCCUPIED` |
| `area_sqft` | `DECIMAL` | Nullable |
| `is_active` | `BOOLEAN` | Default true |
| `reservation_expiry` | `TIMESTAMP` | Null when not reserved |

Unique constraint: `(floor_id, slot_number)`  
Index: `(floor_id, status)` for fast slot queries

**Slot Status Flow:**
```
FREE → RESERVED (on reserve, 10 min TTL)
RESERVED → FREE (cron cleanup, every minute)
RESERVED → OCCUPIED (on booking confirm)
OCCUPIED → FREE (on checkout/exit)
```

---

### `tickets`
| Column | Type | Notes |
|---|---|---|
| `id` | `TEXT` (UUID) | Primary key |
| `customer_id` | `TEXT` | FK → users.id |
| `facility_id` | `TEXT` | FK → parking_facilities.id |
| `slot_id` | `TEXT` | FK → parking_slots.id (SET NULL on delete) |
| `vehicle_number` | `TEXT` | e.g. "MH04AB1234" |
| `vehicle_type` | `TEXT` | CAR / BIKE / TRUCK |
| `entry_time` | `TIMESTAMP` | Default now() |
| `exit_time` | `TIMESTAMP` | Null until exit |
| `base_fee` | `DECIMAL(12,2)` | Nullable |
| `extra_charges` | `DECIMAL(12,2)` | Nullable |
| `total_fee` | `DECIMAL(12,2)` | Null until checkout |
| `status` | `TEXT` | `ACTIVE` \| `COMPLETED` \| `CANCELLED` |
| `payment_status` | `TEXT` | `PENDING` \| `PAID` \| `FAILED` |
| `payment_method` | `TEXT` | `CARD` \| `UPI` \| `WALLET` \| `PAY_AT_EXIT` |
| `payment_id` | `TEXT` | Razorpay payment ID |
| `qr_code` | `TEXT` | Base64 QR code image |
| `created_at` | `TIMESTAMP` | |
| `updated_at` | `TIMESTAMP` | |

---

### `pricing_rules`
| Column | Type | Notes |
|---|---|---|
| `id` | `TEXT` (UUID) | Primary key |
| `facility_id` | `TEXT` | FK → parking_facilities.id (CASCADE) |
| `vehicle_type` | `TEXT` | CAR / BIKE / TRUCK |
| `hourly_rate` | `DECIMAL(12,2)` | In INR |
| `daily_max` | `DECIMAL(12,2)` | Max daily charge, nullable |
| `monthly_pass_price` | `DECIMAL(12,2)` | Nullable |

Unique constraint: `(facility_id, vehicle_type)`

**Seeded pricing (Mumbai test data):**
| Facility | Vehicle | Hourly | Daily Max | Monthly |
|---|---|---|---|---|
| Worli Sea Face | CAR | ₹60 | ₹500 | ₹3,500 |
| Worli Sea Face | BIKE | ₹20 | ₹150 | ₹1,200 |
| Worli Sea Face | TRUCK | ₹120 | ₹900 | ₹6,000 |
| BKC | CAR | ₹100 | ₹800 | ₹5,500 |
| BKC | BIKE | ₹30 | ₹200 | ₹1,800 |
| Andheri Metro | CAR | ₹40 | ₹300 | ₹2,500 |
| Andheri Metro | BIKE | ₹15 | ₹100 | ₹900 |

---

### `monthly_passes`
| Column | Type | Notes |
|---|---|---|
| `id` | `TEXT` (UUID) | Primary key |
| `customer_id` | `TEXT` | FK → users.id |
| `facility_id` | `TEXT` | FK → parking_facilities.id |
| `vehicle_type` | `TEXT` | |
| `start_date` | `TIMESTAMP` | |
| `end_date` | `TIMESTAMP` | |
| `price` | `DECIMAL(12,2)` | |
| `status` | `TEXT` | `ACTIVE` \| `EXPIRED` \| `CANCELLED` |
| `payment_id` | `TEXT` | Razorpay payment ID |
| `payment_status` | `TEXT` | Default `PAID` |

---

### `vehicles`
| Column | Type | Notes |
|---|---|---|
| `id` | `TEXT` (UUID) | Primary key |
| `user_id` | `TEXT` | FK → users.id (CASCADE) |
| `vehicle_number` | `TEXT` | e.g. "MH04AB1234" |
| `vehicle_type` | `TEXT` | CAR / BIKE / TRUCK |
| `nickname` | `TEXT` | Nullable, e.g. "My Swift" |
| `created_at` | `TIMESTAMP` | |

---

### `favorites`
| Column | Type | Notes |
|---|---|---|
| `id` | `TEXT` (UUID) | Primary key |
| `user_id` | `TEXT` | FK → users.id (CASCADE) |
| `facility_id` | `TEXT` | FK → parking_facilities.id (CASCADE) |
| `created_at` | `TIMESTAMP` | |

Unique constraint: `(user_id, facility_id)`

---

### `withdrawals`
Provider earnings withdrawal requests.

| Column | Type | Notes |
|---|---|---|
| `id` | `TEXT` (UUID) | Primary key |
| `user_id` (mapped as `provider_id`) | `TEXT` | FK → users.id |
| `amount` | `DECIMAL(12,2)` | |
| `currency` | `TEXT` | Default `INR` |
| `status` | `TEXT` | `PENDING` \| `APPROVED` \| `COMPLETED` \| `REJECTED` |
| `payout_method` | `TEXT` | `UPI` \| `BANK` |
| `payout_details` | `TEXT` | Encrypted bank/UPI info |
| `payout_id` | `TEXT` | Razorpay Fund Account ID |
| `idempotency_key` | `TEXT` | Unique, prevents duplicate payouts |
| `remarks` | `TEXT` | |
| `error_msg` | `TEXT` | |

---

### `settlements`
| Column | Type | Notes |
|---|---|---|
| `id` | `TEXT` (UUID) | Primary key |
| `user_id` | `TEXT` | FK → users.id |
| `amount` | `DECIMAL(12,2)` | |
| `ticket_count` | `INT` | Tickets in this settlement |
| `status` | `TEXT` | `PENDING` \| `SETTLED` |
| `period_start` | `TIMESTAMP` | |
| `period_end` | `TIMESTAMP` | |

---

### `platform_transactions`
| Column | Type | Notes |
|---|---|---|
| `id` | `TEXT` (UUID) | Primary key |
| `ticket_id` | `TEXT` | Unique, nullable |
| `amount` | `DECIMAL(12,2)` | Total transaction |
| `platform_fee` | `DECIMAL(12,2)` | Deducted fee |
| `net_amount` | `DECIMAL(12,2)` | Provider's net earnings |
| `type` | `TEXT` | `TRANSACTION` \| `WITHDRAWAL` \| `REFUND` |
| `created_at` | `TIMESTAMP` | |

---

## Background Jobs

### Reservation Cleanup Cron
**Schedule:** Every minute (`* * * * *`)  
**File:** `backend/src/jobs/cleanupReservations.js`  
**Action:** Sets all `RESERVED` slots with expired `reservation_expiry` back to `FREE`

```js
// Runs every minute
prisma.parkingSlot.updateMany({
  where: { status: 'RESERVED', reservation_expiry: { lt: new Date() } },
  data: { status: 'FREE', reservation_expiry: null }
})
```

---

## Seeded Test Data

3 Mumbai parking facilities with real coordinates:

| Facility | Coordinates | Slots | Pricing |
|---|---|---|---|
| Worli Sea Face Parking | 18.9988, 72.8154 | 25 slots (2 floors) | ₹60/hr CAR |
| Bandra Kurla Complex | 19.0662, 72.8659 | 17 slots (3 floors) | ₹100/hr CAR |
| Andheri West Metro | 19.1197, 72.8468 | 13 slots (2 floors) | ₹40/hr CAR |

Total: 55 parking slots seeded, mix of FREE and OCCUPIED statuses.
