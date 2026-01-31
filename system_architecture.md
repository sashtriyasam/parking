# Parking Management System Architecture Document

## 1. Database Schema

We will use a Relational Database (PostgreSQL recommended) to handle the structured data and relationships between users, providers, parking lots, and bookings.

### **Tables**

#### `users`
- `id` (UUID, PK)
- `email` (VARCHAR, Unique)
- `password_hash` (VARCHAR)
- `full_name` (VARCHAR)
- `phone_number` (VARCHAR)
- `role` (ENUM: 'CUSTOMER', 'PROVIDER', 'ADMIN')
- `created_at` (TIMESTAMP)

#### `parking_lots`
- `id` (UUID, PK)
- `provider_id` (UUID, FK -> users.id)
- `name` (VARCHAR)
- `description` (TEXT)
- `address` (TEXT)
- `city` (VARCHAR)
- `latitude` (DECIMAL)
- `longitude` (DECIMAL)
- `total_floors` (INT)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMP)

#### `parking_floors`
- `id` (UUID, PK)
- `parking_lot_id` (UUID, FK -> parking_lots.id)
- `floor_number` (INT)
- `name` (VARCHAR) - Optional, e.g., "Level 1"

#### `parking_slots`
- `id` (UUID, PK)
- `floor_id` (UUID, FK -> parking_floors.id)
- `slot_number` (VARCHAR) - e.g., "A-12"
- `vehicle_type` (ENUM: 'BIKE', 'SCOOTER', 'CAR', 'TRUCK')
- `base_price_per_hour` (DECIMAL)
- `is_occupied` (BOOLEAN, Default: false)
- `current_booking_id` (UUID, FK -> bookings.id, Nullable)

#### `bookings`
- `id` (UUID, PK)
- `user_id` (UUID, FK -> users.id)
- `slot_id` (UUID, FK -> parking_slots.id)
- `vehicle_number` (VARCHAR)
- `start_time` (TIMESTAMP)
- `end_time` (TIMESTAMP)
- `status` (ENUM: 'ACTIVE', 'COMPLETED', 'CANCELLED', 'OVERDUE')
- `check_in_time` (TIMESTAMP, Nullable)
- `check_out_time` (TIMESTAMP, Nullable)
- `total_amount` (DECIMAL)
- `payment_status` (ENUM: 'PENDING', 'PAID')

#### `passes` (Monthly Passes)
- `id` (UUID, PK)
- `user_id` (UUID, FK -> users.id)
- `parking_lot_id` (UUID, FK -> parking_lots.id)
- `vehicle_type` (ENUM)
- `valid_from` (DATE)
- `valid_until` (DATE)
- `status` (ENUM: 'ACTIVE', 'EXPIRED')

### **Indexes**
- `users`: `email`
- `parking_lots`: `city`, `latitude`/`longitude` (Spatial index for geospatial search)
- `bookings`: `user_id`, `slot_id`, `status`
- `parking_slots`: `floor_id`, `is_occupied`

---

## 2. Entity Relationship Diagram (ERD) Description

- **User** (One) ---- (Many) **ParkingLot** (Provider Relationship)
- **User** (One) ---- (Many) **Booking** (Customer Relationship)
- **ParkingLot** (One) ---- (Many) **ParkingFloor**
- **ParkingFloor** (One) ---- (Many) **ParkingSlot**
- **ParkingSlot** (One) ---- (One) **Booking** (Active Booking)
- **ParkingLot** (One) ---- (Many) **Pass**
- **User** (One) ---- (Many) **Pass**

---

## 3. API Endpoint Structure (REST)

### **Authentication**
- `POST /api/v1/auth/register` - Register new user (Customer/Provider)
- `POST /api/v1/auth/login` - Login and receive JWT
- `GET /api/v1/user/profile` - Get current user profile

### **Parking Management (Provider)**
- `POST /api/v1/provider/parking-lots` - Create a new parking lot
- `GET /api/v1/provider/parking-lots` - List provider's lots
- `PUT /api/v1/provider/parking-lots/:id` - Update lot details
- `POST /api/v1/provider/parking-lots/:id/floors` - Add floors
- `POST /api/v1/provider/floors/:id/slots` - Add slots (bulk option recommended)

### **Search & Booking (Customer)**
- `GET /api/v1/parking-lots` - Search lots (filters: lat, long, radius, vehicle_type)
- `GET /api/v1/parking-lots/:id` - Get lot details
- `GET /api/v1/parking-lots/:id/availability` - Get real-time slot availability
- `POST /api/v1/bookings` - Create a booking (Reserve slot)
- `POST /api/v1/bookings/:id/cancel` - Cancel booking
- `POST /api/v1/bookings/:id/checkout` - End booking and calculate final fee

### **Tickets & Passes**
- `GET /api/v1/tickets/:id` - Get digital ticket details
- `POST /api/v1/passes` - Purchase monthly pass

---

## 4. Authentication & Authorization Flow

### **Strategy**
- **JWT (JSON Web Tokens)**: Stateless authentication.
- **Roles**: `CUSTOMER`, `PROVIDER`.

### **Flow**
1. **Registration**: User signs up with email/password and selects a role.
2. **Login**: User posts credentials, server validates hash, returns `accessToken` (short-lived) and `refreshToken` (httpOnly cookie).
3. **Protected Routes**: Middleware checks `Authorization: Bearer <token>` header.
4. **Role Middleware**: Specific endpoints (e.g., creating lots) require `role === 'PROVIDER'`.

---

## 5. Tech Stack Recommendations

### **Frontend**
- **Framework**: React.js with Vite (Fast, reliable, standard).
- **Styling**: TailwindCSS (Utility-first, fast development, responsive) or Vanilla CSS (if preferred).
- **State**: Zustand (Simple global state), React Query (Server state/caching).
- **Maps**: Leaflet.js or Google Maps API (for location search).
- **Real-time**: Socket.io-client.

### **Backend**
- **Runtime**: Node.js.
- **Framework**: Express.js (Standard, flexible) or NestJS (Structured, scalable).
- **Database**: PostgreSQL (Reliable relational data).
- **ORM**: Prisma (Type-safe database access).
- **Real-time**: Socket.io (WebSocket handling).

### **Infrastructure**
- **Containerization**: Docker.
- **Deployment**: Vercel (Frontend), Render/Railway/AWS (Backend).

---

## 6. Folder Structure

### **Backend (`/server`)**
```
/src
  /config         # DB, Env, Constants
  /controllers    # Request handlers
  /middlewares    # Auth, Validation, Error handling
  /routes         # API Route definitions
  /services       # Business logic
  /models         # Database models (if not using ORM schema file)
  /utils          # Helper functions
  index.js        # Entry point
```

### **Frontend (`/client`)**
```
/src
  /assets         # Images, fonts
  /components     # Reusable UI components (Button, Input, Modal)
  /features       # Feature-based modules (Auth, Booking, Search)
  /hooks          # Custom React hooks
  /pages          # Route pages (Home, Login, Dashboard)
  /services       # API calls (Axios instances)
  /store          # State management (Zustand)
  App.jsx         # Main component
  main.jsx        # Entry point
```

---

## 7. State Management Approach

1.  **Server State (React Query)**:
    -   Used for fetching and caching lists of parking lots, bookings, and profile data.
    -   Handles loading, error, and stale states automatically.

2.  **Global UI State (Context API or Zustand)**:
    -   **UserContext**: Stores authentication status and user info.
    -   **BookingFlow**: specific state for the multi-step booking wizard (Selected Lot -> Selected Floor -> Selected Slot).

---

## 8. Real-time Update Mechanism

To ensure the "BookMyShow-like" experience where a slot turns "Occupied" instantly for other looking users:

1.  **Backend**:
    -   Integrate **Socket.io**.
    -   Event: `slot_status_changed`.
    -   When a booking is confirmed or a vehicle enters/exits, emit event to a "room" specific to that `parking_lot_id`.

2.  **Frontend**:
    -   When a user views a specific Parking Lot page, join `room_${parking_lot_id}`.
    -   Listen for `slot_status_changed` events.
    -   Update the specific slot's color/status in the visual grid immediately without page reload.
