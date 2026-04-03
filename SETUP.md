# Local Development Setup

## Prerequisites

- Node.js ≥ 18.0.0
- npm ≥ 9.0.0
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- A Supabase project with the schema pushed
- A Razorpay account (test keys are fine)

---

## 1. Clone & Install

```bash
git clone https://github.com/sashtriyasam/parking.git
cd parking
```

### Backend
```bash
cd backend
npm install
```

### Mobile
```bash
cd ParkEasyMobile
npm install
```

---

## 2. Environment Variables

### Backend — create `backend/.env`

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres.YOUR_REF:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.YOUR_REF:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# Auth
JWT_SECRET="your-32-char-minimum-secret-here"
JWT_REFRESH_SECRET="different-32-char-minimum-secret"

# Razorpay (test keys)
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxx"

# App URLs (CORS whitelist)
FRONTEND_URL="http://localhost:5173"
MOBILE_APP_URL="http://localhost:8081"
RENDER_APP_URL="https://parkeasy-backend-uy3x.onrender.com"

# Push Notifications (optional for local)
EXPO_ACCESS_TOKEN="your-expo-token"

# Misc
NODE_ENV="development"
PORT=5000
RESERVATION_TIMEOUT_MINUTES=10
```

### Mobile — create `ParkEasyMobile/.env`

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
```

> For testing against the live Render backend instead of local:
> ```env
> EXPO_PUBLIC_API_URL=https://parkeasy-backend-uy3x.onrender.com/api/v1
> ```

---

## 3. Database Setup

The schema is managed by Prisma. If starting fresh:

```bash
cd backend
npx prisma db push        # Push schema to your Supabase DB
npx prisma generate       # Generate Prisma client
```

To seed test data (Mumbai parking facilities), run the seed script:
```bash
node prisma/seed.js
```

Or connect Supabase MCP and run the seed SQL directly.

---

## 4. Run the Backend

```bash
cd backend
npm run dev       # nodemon watches for changes
```

Server starts on `http://localhost:5000`
Swagger docs at `http://localhost:5000/api-docs`
Health check at `http://localhost:5000/health`

---

## 5. Run the Mobile App

```bash
cd ParkEasyMobile
npx expo start
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR with Expo Go on your phone

> **Note:** `react-native-razorpay` requires a native build — it will NOT work in Expo Go. For payment testing, use a development build:
> ```bash
> eas build --platform android --profile development
> ```

---

## 6. Test Accounts (Seeded)

Register via the app or API. The seed script creates facilities but not users — register fresh accounts via `/api/v1/auth/register`.

**Test credentials after manual registration:**

| Role | Email | Password |
|---|---|---|
| Provider | `provider@parkeasy.in` | (set during registration) |
| Customer | `customer@parkeasy.in` | (set during registration) |

---

## 7. Key Development Commands

```bash
# Backend
npm run dev              # Start with nodemon
npm test                 # Run Jest tests
npx prisma studio        # Open Prisma DB browser

# Mobile
npx expo start           # Start dev server
npx expo start --clear   # Clear Metro cache
eas build --platform android --profile preview    # Build APK
eas update --channel preview --message "fix: xyz"  # Push OTA update
```

---

## Common Issues

**`Database disconnected` on /health**
- Make sure `DATABASE_URL` has `?pgbouncer=true` at the end
- Verify Supabase project is active (not paused)

**Blank screen after login**
- This was fixed — `isInitialized` is now set in `login()` and `logout()` in `authStore.ts`

**Payment screen crashes**
- `react-native-razorpay` needs a native build, not Expo Go
- Run `eas build --profile development` instead

**Socket not connecting**
- Ensure `EXPO_PUBLIC_API_URL` is set correctly in `.env`
- Socket URL is derived by stripping `/api/v1` from `EXPO_PUBLIC_API_URL`
