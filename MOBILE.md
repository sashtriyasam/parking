# Mobile App — ParkEasyMobile

Built with Expo SDK 54 + React Native 0.81.5. Uses file-based routing via Expo Router 6.

---

## Directory Structure

```
ParkEasyMobile/
├── app/
│   ├── _layout.tsx              # Root layout (QueryClient, SafeArea, ErrorBoundary)
│   ├── (auth)/
│   │   ├── _layout.tsx          # Auth group layout
│   │   ├── login.tsx            # Login screen
│   │   └── signup.tsx           # Signup screen
│   ├── (customer)/
│   │   ├── _layout.tsx          # Customer tab layout
│   │   ├── index.tsx            # Home / Map screen
│   │   ├── search.tsx           # Search results
│   │   ├── facility/[id].tsx    # Facility details
│   │   ├── tickets.tsx          # My tickets
│   │   ├── passes.tsx           # Monthly passes
│   │   ├── payments.tsx         # Payment history
│   │   ├── vehicles.tsx         # My vehicles
│   │   ├── profile.tsx          # Re-exports ProfileScreen component
│   │   ├── booking/
│   │   │   ├── vehicle.tsx      # Step 1: Select vehicle
│   │   │   ├── payment.tsx      # Step 2: Review & pay
│   │   │   └── success.tsx      # Step 3: Confirmation
│   │   └── support/
│   │       ├── faq.tsx
│   │       └── contact.tsx
│   ├── (provider)/
│   │   ├── _layout.tsx
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx      # Provider tab bar
│   │   │   ├── index.tsx        # Dashboard
│   │   │   ├── bookings.tsx     # All bookings
│   │   │   ├── facilities.tsx   # My facilities
│   │   │   ├── scan.tsx         # QR Scanner
│   │   │   └── profile.tsx      # Re-exports ProfileScreen
│   │   ├── add-facility.tsx
│   │   ├── analytics.tsx
│   │   ├── earnings.tsx
│   │   └── facility/[id]/
│   │       ├── index.tsx        # Facility management
│   │       └── edit.tsx         # Edit facility
│   └── settings/
│       └── personal-info.tsx
├── components/
│   ├── AppHeader.tsx
│   ├── EmptyState.tsx
│   ├── ErrorBoundary.tsx        # Global crash boundary
│   ├── ParkingFacilityCard.tsx
│   ├── PaymentSheet.tsx         # Razorpay payment bottom sheet
│   ├── ProfileScreen.tsx        # Shared profile component
│   ├── SlotGrid.tsx
│   ├── Toast.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── EmptyState.tsx
│       └── Skeleton.tsx
├── constants/
│   ├── colors.ts                # Design system colors
│   └── mapAppearance.ts         # Dark map style config
├── hooks/
│   ├── useLiveSlots.ts          # Socket.io slot updates
│   ├── useOTAUpdate.ts          # Expo Updates hook
│   ├── usePushNotifications.ts  # Expo Notifications setup
│   └── useSocket.ts             # Socket singleton manager
├── services/
│   └── api.ts                   # Axios client + interceptors
├── store/
│   ├── authStore.ts             # Zustand auth state
│   └── bookingFlowStore.ts      # Multi-step booking state
├── types/
│   ├── index.ts                 # All TypeScript types
│   └── razorpay.d.ts            # Razorpay type declarations
├── utils/
│   └── ErrorHandler.ts
├── app.json                     # Expo config
└── eas.json                     # EAS build profiles
```

---

## Navigation Architecture

Expo Router uses file-based routing. Route groups in `()` don't appear in the URL.

```
/               → _layout.tsx (root, handles auth redirect)
/(auth)/login   → Login screen
/(auth)/signup  → Signup screen

/(customer)/           → Customer home (map)
/(customer)/search     → Search results
/(customer)/facility/[id]  → Facility details
/(customer)/booking/vehicle  → Booking step 1
/(customer)/booking/payment  → Booking step 2
/(customer)/booking/success  → Booking step 3
/(customer)/tickets    → My tickets
/(customer)/passes     → Monthly passes
/(customer)/payments   → Payment history
/(customer)/vehicles   → My vehicles
/(customer)/profile    → Profile
/(customer)/support/faq
/(customer)/support/contact

/(provider)/(tabs)/         → Provider dashboard
/(provider)/(tabs)/bookings → Bookings
/(provider)/(tabs)/facilities → Facilities
/(provider)/(tabs)/scan     → QR scanner
/(provider)/(tabs)/profile  → Profile
/(provider)/add-facility
/(provider)/analytics
/(provider)/earnings
/(provider)/facility/[id]/        → Facility detail
/(provider)/facility/[id]/edit    → Edit facility

/settings/personal-info
```

---

## Auth Flow

1. App starts → `_layout.tsx` calls `loadFromStorage()`
2. `loadFromStorage()` checks SecureStore for `accessToken` + `user`
3. `isInitialized` set to `true` regardless of result
4. If user found → redirect to `/(customer)` or `/(provider)/(tabs)` based on role
5. If no user → redirect to `/(auth)/login`
6. On login/register → `isInitialized: true` set immediately (no blank screen)
7. On logout → `disconnectSocket()` called, SecureStore cleared, redirect to login

### Token Storage (SecureStore)
```
accessToken   → JWT, expires 15 minutes
refreshToken  → JWT, expires 7 days
user          → JSON stringified User object
```

### Token Refresh Logic
Handled in `services/api.ts` Axios interceptor:
- On `401` response → attempt refresh via `POST /auth/refresh`
- On success → update SecureStore + retry original request
- On failure → clear SecureStore (logout)

---

## State Management

### `authStore.ts` (Zustand)
```typescript
{
  user: User | null,
  accessToken: string | null,
  isLoading: boolean,
  isInitialized: boolean,    // true after loadFromStorage OR login/logout
  login(user, accessToken, refreshToken): Promise<void>,
  logout(): Promise<void>,
  loadFromStorage(): Promise<void>
}
```

### `bookingFlowStore.ts` (Zustand)
Multi-step booking state passed between screens:
```typescript
{
  facility_id: string | null,
  facility_name: string | null,
  selected_slot: ParkingSlot | null,
  vehicle_number: string | null,
  vehicle_type: string | null,
  selected_payment_method: string | null,
  created_ticket_id: string | null,
  // setters for each field + reset()
}
```

---

## API Client (`services/api.ts`)

Base URL from `EXPO_PUBLIC_API_URL` env var.

Interceptors:
1. **Request:** Attaches `Authorization: Bearer <token>` from SecureStore
2. **Response:** Detects Railway "Application not found" HTML responses and rejects them
3. **Response error:** On 401, attempts token refresh; on failure, clears storage

Exports:
```typescript
get(url, config?)
post(url, data?, config?)
put(url, data?, config?)
patch(url, data?, config?)
del(url, config?)
export default apiClient  // raw Axios instance
```

---

## WebSocket (`hooks/useSocket.ts`)

Singleton socket pattern. URL derived from `EXPO_PUBLIC_API_URL` by stripping `/api/v1`.

```typescript
connectSocket(token)       // creates socket, called when accessToken available
disconnectSocket()         // destroys socket, called on logout
getSocketInstance()        // returns current socket | null
useSocket()                // React hook: returns { isConnected, joinFacility, leaveFacility }
```

Socket auto-connects when `accessToken` is set, auto-disconnects on logout.

---

## Payment Flow

1. Customer selects slot → `/(customer)/booking/vehicle.tsx`
2. Enters vehicle details → `/(customer)/booking/payment.tsx`
3. Payment screen calls `POST /bookings` to create pending booking
4. Opens `PaymentSheet` component
5. `PaymentSheet` calls `POST /payments/create-order` → gets Razorpay order
6. Opens `RazorpayCheckout.open()` with order details
7. On Razorpay success → calls `POST /payments/verify` with signature
8. Backend verifies signature → confirms booking → returns ticket
9. Navigates to `/(customer)/booking/success.tsx`

---

## Key Packages

| Package | Purpose |
|---|---|
| `expo-router` | File-based navigation |
| `zustand` | State management |
| `@tanstack/react-query` | Server state / data fetching |
| `axios` | HTTP client |
| `expo-secure-store` | Encrypted token storage |
| `socket.io-client` | Real-time slot updates |
| `react-native-razorpay` | Payment gateway (requires native build) |
| `expo-camera` | QR code scanning (provider) |
| `react-native-maps` | Map display |
| `react-native-qrcode-svg` | QR ticket display |
| `expo-notifications` | Push notifications |
| `expo-updates` | OTA updates |
| `expo-linear-gradient` | UI gradients |
| `expo-blur` | Blur effects |
| `expo-haptics` | Haptic feedback |
| `react-native-reanimated` | Animations |

---

## Permissions (Android)

Declared in `app.json`:
```json
[
  "CAMERA",
  "ACCESS_COARSE_LOCATION",
  "ACCESS_FINE_LOCATION",
  "READ_MEDIA_IMAGES"
]
```

---

## OTA Update Hook (`hooks/useOTAUpdate.ts`)

Checks for updates on app load. If update available, downloads and prompts reload. Non-blocking — app works normally during download.

---

## Push Notifications Hook (`hooks/usePushNotifications.ts`)

1. Requests permission on first launch
2. Gets Expo push token
3. Posts token to `POST /auth/update-push-token`
4. Sets up notification listeners

---

## Error Boundary

`components/ErrorBoundary.tsx` wraps the entire app in `_layout.tsx`. Catches any unhandled JS errors and shows a recovery screen instead of a blank crash. Logs to console (production: hook into Sentry here).
