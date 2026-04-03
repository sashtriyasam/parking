# Deployment Guide

## Current Production Setup

| Component | Service | URL |
|---|---|---|
| Backend API | Render.com (free) | `https://parkeasy-backend-uy3x.onrender.com` |
| Database | Supabase (free) | Project: `parkeasy-prod` |
| Keep-alive | UptimeRobot | Pings `/health` every 5 min |
| Mobile builds | EAS Build | Account: `shivamshelatkar` |
| OTA Updates | EAS Update | Channel: `preview` / `production` |

---

## Backend — Render.com

### Initial Deployment

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect `sashtriyasam/parking` repo
3. Settings:
   - **Root Directory:** `backend`
   - **Docker Build Context:** `backend/`
   - **Dockerfile Path:** `backend/Dockerfile`
   - **Instance Type:** Free
   - **Health Check Path:** `/health`
4. Add environment variables (see below)
5. **Pre-Deploy Command:** `npx prisma db push`
6. Deploy

### Environment Variables on Render

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres.dofeprhouepdxltbppyl:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.dofeprhouepdxltbppyl:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
JWT_SECRET=[your secret]
JWT_REFRESH_SECRET=[your secret]
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RENDER_APP_URL=https://parkeasy-backend-uy3x.onrender.com
EXPO_ACCESS_TOKEN=[optional for push notifications]
```

### Dockerfile (backend/Dockerfile)

```dockerfile
FROM node:20-slim
ENV NODE_ENV=production
RUN groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup -s /bin/sh appuser
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY . .
RUN npx prisma generate
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 5000
CMD ["node", "index.js"]
```

> **Why `node:20-slim` + `apt-get install openssl`?**  
> `node:20-alpine` doesn't include OpenSSL 1.1.x which older Prisma binary targets need. `node:20-slim` (Debian) has OpenSSL 3.x, so we install it explicitly. The `binaryTargets` in `schema.prisma` is set to `debian-openssl-3.0.x`.

### Keep-Alive via UptimeRobot

Render free tier sleeps after 15 minutes of inactivity. UptimeRobot pings every 5 minutes to prevent this.

1. Go to [uptimerobot.com](https://uptimerobot.com) → free account
2. Add New Monitor:
   - Type: `HTTP(s)`
   - URL: `https://parkeasy-backend-uy3x.onrender.com/health`
   - Interval: `5 minutes`

### render.yaml

```yaml
services:
  - type: web
    name: parkeasy-backend
    runtime: node
    buildCommand: "npm ci --omit=dev && npx prisma generate"
    startCommand: "node index.js"
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "5000"
```

---

## Database — Supabase

**Project:** `parkeasy-prod`  
**Region:** `ap-south-1` (Mumbai)  
**Project ID:** `dofeprhouepdxltbppyl`

### Connection Strings

| Type | Port | Use for |
|---|---|---|
| Transaction Pooler | 6543 | `DATABASE_URL` (app queries via PgBouncer) |
| Session Pooler | 5432 | `DIRECT_URL` (Prisma migrations) |

Both need `?pgbouncer=true` appended to `DATABASE_URL` only.

### Schema Management

```bash
# Push schema changes
cd backend
npx prisma db push

# Generate client after schema changes
npx prisma generate

# Open Prisma Studio (local DB browser)
npx prisma studio
```

Schema file: `backend/prisma/schema.prisma`

### Current Tables (all seeded and live)
- `users`, `refresh_tokens`
- `parking_facilities`, `floors`, `parking_slots`
- `pricing_rules`, `tickets`, `monthly_passes`
- `vehicles`, `favorites`
- `withdrawals`, `settlements`, `platform_transactions`

---

## Mobile App — EAS Build

### Build Profiles (eas.json)

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "node": "22.14.0"
    },
    "preview": {
      "channel": "preview",
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "node": "22.14.0"
    },
    "production": {
      "channel": "production",
      "android": { "buildType": "apk" },
      "autoIncrement": true,
      "node": "22.14.0"
    }
  }
}
```

### Build Commands

```bash
# Development build (native modules, uses Expo Dev Client)
eas build --platform android --profile development

# Preview APK (for internal testing, direct install)
eas build --platform android --profile preview

# Production APK
eas build --platform android --profile production
```

### OTA Updates (no rebuild needed)

```bash
# Push update to preview channel
eas update --channel preview --message "fix: socket reconnection"

# Push update to production channel
eas update --channel production --message "feat: pass cancellation"
```

OTA update check happens on app load (`checkAutomatically: ON_LOAD`).  
Fallback cache timeout: 3 seconds.

### App Details

| Field | Value |
|---|---|
| Expo Account | `shivamshelatkar` |
| EAS Project ID | `9d982466-1e49-4b8d-b58e-448daeebe14b` |
| Android Package | `com.sashtriyasam.parkeasy` |
| iOS Bundle | `com.sashtriyasam.parkeasy` |
| Runtime Version | Policy: `appVersion` |
| Updates URL | `https://u.expo.dev/9d982466-1e49-4b8d-b58e-448daeebe14b` |

### Required Env for Mobile Build

```env
EXPO_PUBLIC_API_URL=https://parkeasy-backend-uy3x.onrender.com/api/v1
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
```

---

## GitHub Actions — OTA Auto-deploy

File: `ParkEasyMobile/.github/workflows/ota-update.yml`

Triggers OTA push automatically on commits to `main`. Make sure `EXPO_TOKEN` is set in GitHub repository secrets.

---

## Deployment Checklist

Before every production deployment:

- [ ] Run `npx prisma db push` if schema changed
- [ ] All env vars set on Render
- [ ] `/health` returns `{ "database": "connected" }`
- [ ] UptimeRobot monitor active
- [ ] Mobile `.env` pointing to production URL
- [ ] EAS build completed successfully
- [ ] OTA update pushed if JS-only changes
- [ ] Razorpay keys switched to live keys (`rzp_live_xxx`)
