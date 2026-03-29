# Parking Management System - Backend API

A comprehensive parking management system built with Node.js, Express, PostgreSQL, and Prisma ORM.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens
- **Multi-Role Support**: Customer and Provider roles
- **Facility Management**: Create and manage parking lots, floors, and slots
- **Booking Engine**: Real-time slot availability with race condition handling
- **Reservation System**: 5-minute slot hold mechanism
- **Dynamic Pricing**: Configurable hourly rates and daily caps
- **Analytics Dashboard**: Revenue reports, occupancy stats, and live monitoring
- **CSV Export**: Revenue reports exportable to CSV
- **API Documentation**: Interactive Swagger UI

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## ⚙️ Installation

### 1. Clone and Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

Create a `.env` file in the `backend/` directory:

```bash
cp .env.example .env
```

See the **[Supabase Database Setup](#-supabase-database-setup)** section below for how to get your connection strings.

### 3. Database Setup (Supabase PostgreSQL)

Generate Prisma Client:

```bash
npx prisma generate
```

Push the schema to your Supabase database:

```bash
npx prisma db push
```

(Optional) Seed the database:

```bash
npx prisma db seed
```

### 4. Start the Server

Development mode (with hot reload):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The server will start on `http://localhost:5000`.

## 📚 API Documentation

Access the interactive API documentation at:

```
http://localhost:5000/api-docs
```

## 🧪 Testing

Run unit tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm test -- --coverage
```

## 📁 Project Structure

```
backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── config/
│   │   ├── db.js              # Prisma client
│   │   └── swagger.js         # Swagger configuration
│   ├── controllers/           # Request handlers
│   ├── middleware/            # Auth, validation, error handling
│   ├── routes/                # API routes
│   ├── services/              # Business logic
│   ├── utils/                 # Helper functions
│   ├── validators/            # Input validation schemas
│   └── app.js                 # Express app setup
├── tests/                     # Unit tests
├── index.js                   # Server entry point
├── .env.example               # Environment template
└── package.json
```

## 🔑 Key API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### Customer Booking
- `POST /api/v1/bookings/reserve` - Reserve a parking slot
- `POST /api/v1/bookings` - Confirm booking
- `POST /api/v1/bookings/checkout` - End booking and calculate fee

### Provider Dashboard
- `GET /api/v1/provider/dashboard/stats` - Dashboard statistics
- `POST /api/v1/provider/facilities` - Create facility
- `POST /api/v1/provider/pricing-rules` - Set pricing
- `GET /api/v1/provider/reports/revenue?format=csv` - Export revenue report

## 🛠️ Technologies Used

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Security**: Helmet, bcrypt
- **Logging**: Winston, Morgan
- **Documentation**: Swagger UI
- **Testing**: Jest

## 🔐 Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Helmet.js for HTTP headers security
- Input validation with Zod
- SQL injection prevention via Prisma
- Rate limiting (recommended to add)
- CORS configuration

## 🐘 Supabase Database Setup

This project uses **Supabase** as the hosted PostgreSQL provider. Prisma needs **two** connection strings:

| Variable | Purpose | Supabase Mode | Port |
|---|---|---|---|
| `DATABASE_URL` | Runtime queries (Prisma Client) | **Session mode** (pooled via PgBouncer) | `6543` |
| `DIRECT_URL` | Migrations & `prisma db push` | **Direct connection** | `5432` |

### Where to find them in the Supabase Dashboard

1. Go to your **Supabase Dashboard** → select your project
2. Navigate to **Project Settings** (gear icon in the sidebar)
3. Click **Database** in the left menu
4. Scroll to the **Connection String** section

#### For `DATABASE_URL` (pooled — Session mode)

5. Select the **"Session"** tab under Connection Pooling
6. Copy the connection string. It will look like:

```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

7. Paste it as `DATABASE_URL` in your `.env`

#### For `DIRECT_URL` (non-pooled — Direct)

8. Select the **"URI"** tab (or "Direct connection")
9. Copy the connection string. It will look like:

```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

10. Paste it as `DIRECT_URL` in your `.env`

> **⚠️ Why two URLs?** Supabase puts PgBouncer in front of PostgreSQL for connection pooling. PgBouncer doesn't support the DDL statements Prisma uses during migrations (`CREATE TABLE`, `ALTER TABLE`, etc.), so `DIRECT_URL` bypasses PgBouncer to connect directly to PostgreSQL. Your app still uses the pooled `DATABASE_URL` at runtime for better performance.

### Example `.env`

```env
# Pooled connection — used by your app at runtime
DATABASE_URL="postgresql://postgres.abcdefghijklmnop:MyP@ssword123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection — used by Prisma CLI for migrations
DIRECT_URL="postgresql://postgres.abcdefghijklmnop:MyP@ssword123@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
```

### Commands after setup

```bash
# 1. Regenerate Prisma Client
npx prisma generate

# 2. Push schema to Supabase (uses DIRECT_URL internally)
npx prisma db push

# 3. (Optional) Open Prisma Studio to browse your data
npx prisma studio
```

## 📊 Database Schema

The system uses the following core models:

- **User**: Customers and Providers
- **ParkingFacility**: Parking lots
- **Floor**: Building floors
- **ParkingSlot**: Individual parking spaces
- **Ticket**: Active bookings
- **PricingRule**: Dynamic pricing configuration
- **MonthlyPass**: Subscription passes

## 🚢 Production Deployment

### Option 1: Traditional Server (PM2)

1. Install PM2:
```bash
npm install -g pm2
```

2. Start the app:
```bash
pm2 start index.js --name parking-api
pm2 save
pm2 startup
```

### Option 2: Docker

```dockerfile
# Example Dockerfile (create this in backend/)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 5000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t parking-api .
docker run -p 5000:5000 --env-file .env parking-api
```

### Environment Variables for Production

Use `.env.production` as a template. Ensure these are set:

- `NODE_ENV="production"`
- `DATABASE_URL` — Supabase pooled connection (Session mode, port 6543)
- `DIRECT_URL` — Supabase direct connection (port 5432) for migrations
- Strong `JWT_SECRET` and `JWT_REFRESH_SECRET` (generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
- `ALLOWED_ORIGINS` — comma-separated list of allowed frontend domains
- `RAZORPAY_KEY_ID` — use `rzp_live_` prefix for production

## 📝 License

ISC

## 👥 Contributing

Contributions are welcome! Please follow the existing code style and add tests for new features.

## 🐛 Known Issues & Roadmap

- [ ] Add rate limiting middleware
- [ ] Implement Redis for session management
- [ ] Add email notifications
- [ ] Implement payment gateway integration
- [ ] Add WebSocket for real-time updates

## 📞 Support

For issues or questions, please open an issue in the repository.
