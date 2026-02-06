# ParkEasy - Smart Parking Management System

A comprehensive parking management solution with separate Customer and Provider flows.

## 📁 Project Structure

```
PARKING THING/
├── backend/                    # Node.js + Express API
│   ├── prisma/                 # Database schema & migrations
│   ├── src/
│   │   ├── config/             # Database & Swagger config
│   │   ├── controllers/        # Request handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── booking.controller.js
│   │   │   ├── customer.controller.js
│   │   │   ├── parking.controller.js
│   │   │   ├── pass.controller.js
│   │   │   ├── provider.controller.js
│   │   │   └── ticket.controller.js
│   │   ├── middleware/         # Auth, validation, error handling
│   │   ├── routes/             # API route definitions
│   │   ├── services/           # Business logic
│   │   │   ├── analytics.service.js
│   │   │   ├── booking.service.js
│   │   │   ├── discovery.service.js
│   │   │   ├── pass.service.js
│   │   │   ├── payment.service.js
│   │   │   ├── pricing.service.js
│   │   │   └── socket.service.js
│   │   ├── utils/              # Helper functions
│   │   └── validators/         # Zod schemas
│   ├── tests/                  # Jest unit tests
│   ├── .env.example            # Environment template
│   └── package.json
│
├── frontend/                   # React + Vite + TypeScript
│   ├── src/
│   │   ├── app/                # Main application code
│   │   ├── context/            # React contexts
│   │   ├── data/               # Mock data
│   │   ├── services/           # API service layer
│   │   ├── store/              # Zustand state management
│   │   ├── styles/             # CSS stylesheets
│   │   └── types/              # TypeScript definitions
│   └── package.json
│
├── Smart Parking Management System/  # Android native app
│
├── BUG_REPORT.md               # Known issues & fixes
├── TESTING.md                  # Testing guide
├── system_architecture.md      # System design docs
└── setup.ps1                   # Windows setup script
```

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
cp .env.example .env           # Configure your environment
npx prisma db push             # Setup database
npm run dev                    # Start on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                    # Start on http://localhost:5173
```

## 🔧 Configuration

See `backend/.env.example` for all configuration options:

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection | Required |
| JWT_SECRET | Auth token secret | Required |
| RESERVATION_TIMEOUT_MINUTES | Slot reservation hold time | 5 |
| GOOGLE_MAPS_API_KEY | Distance calculations | Optional |
| RAZORPAY_KEY_ID | Payment gateway | Optional |

## 📊 API Documentation

- Swagger UI: `http://localhost:5000/api-docs`
- Health Check: `http://localhost:5000/health`

## 🧪 Testing

```bash
cd backend
npm test              # Run tests
npm test -- --coverage  # With coverage
```

**Current Coverage**: 97.87%

## 🛠️ Tech Stack

**Backend**: Node.js, Express, Prisma, PostgreSQL, JWT, Winston  
**Frontend**: React, TypeScript, Vite, Zustand, React Query  
**Mobile**: Android (Kotlin/Java)

## 📝 Recent Updates

- Fixed 18 bugs across the codebase
- Added configurable reservation timeout
- Improved error handling with Winston logger
- Standardized vehicle type casing

---

See [TESTING.md](./TESTING.md) for detailed testing instructions.
