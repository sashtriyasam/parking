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

Update the `.env` file with your configuration:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/parking_system"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
```

### 3. Database Setup

Run Prisma migrations to create the database schema:

```bash
npx prisma migrate dev --name init
```

Generate Prisma Client:

```bash
npx prisma generate
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

Ensure these are set in your production environment:

- `NODE_ENV="production"`
- `DATABASE_URL` (use connection pooling for serverless)
- Strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- Configure `ALLOWED_ORIGINS` for CORS

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
