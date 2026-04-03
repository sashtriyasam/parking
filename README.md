# ParkEasy 🅿️

A full-stack smart parking management platform for India, built as a React Native mobile app with a Node.js/Express backend and PostgreSQL database via Supabase.

## What it does

ParkEasy connects parking facility providers with customers. Customers search for nearby parking, reserve a slot, pay via Razorpay, and get a QR code ticket. Providers manage their facilities, scan QR codes at entry/exit, and track earnings.

## Project Structure

```
parking-main/
├── backend/                  # Node.js/Express API server
├── ParkEasyMobile/           # Expo React Native mobile app
├── frontend/                 # Web frontend (React + Vite)
└── Smart Parking Management System/   # Legacy web prototype
```

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework | Express 5 |
| Database ORM | Prisma 5 |
| Database | PostgreSQL (Supabase) |
| Auth | JWT (access 15m + refresh 7d) |
| Realtime | Socket.io 4 |
| Payments | Razorpay |
| Validation | Zod |
| Logging | Winston |
| Scheduling | node-cron |
| Push Notifications | Expo Server SDK |
| PDF Generation | PDFKit |
| QR Codes | qrcode |

### Mobile App
| Layer | Technology |
|---|---|
| Framework | Expo SDK 54 / React Native 0.81.5 |
| Navigation | Expo Router 6 (file-based) |
| State Management | Zustand 5 |
| Data Fetching | TanStack Query 5 |
| HTTP Client | Axios |
| Auth Storage | Expo SecureStore |
| Realtime | Socket.io-client |
| Payments | react-native-razorpay |
| Maps | react-native-maps |
| Camera/QR | expo-camera |
| Notifications | expo-notifications |
| OTA Updates | expo-updates |

### Infrastructure
| Service | Purpose |
|---|---|
| Render.com | Backend hosting (free tier) |
| Supabase | PostgreSQL database + auth |
| UptimeRobot | Keep Render alive (ping /health every 5min) |
| EAS Build | Mobile app builds |
| EAS Update | OTA updates |

## Live URLs

- **Backend API:** `https://parkeasy-backend-uy3x.onrender.com`
- **API Docs (Swagger):** `https://parkeasy-backend-uy3x.onrender.com/api-docs`
- **Health Check:** `https://parkeasy-backend-uy3x.onrender.com/health`
- **Expo Account:** `shivamshelatkar`
- **Android Package:** `com.sashtriyasam.parkeasy`
- **EAS Project ID:** `9d982466-1e49-4b8d-b58e-448daeebe14b`

## Quick Start

See [SETUP.md](./SETUP.md) for local development and [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment.

## Roles

| Role | Access |
|---|---|
| `CUSTOMER` | Search parking, book slots, manage tickets, monthly passes |
| `PROVIDER` | Manage facilities, scan QR codes, view earnings/analytics |

## Key Features

- Real-time slot availability via Socket.io
- Razorpay payment integration (UPI, Card, Wallet)
- QR code ticket generation and scanning
- Monthly parking passes
- Slot reservation with 5-minute expiry + auto-cleanup cron
- JWT refresh token rotation with DB storage (revocable)
- OTA updates via Expo Updates
- Push notifications via Expo Push API
- PDF ticket download
- Provider analytics and earnings dashboard
- Global error boundary (mobile)
- Rate limiting (100 req/15min per IP)
