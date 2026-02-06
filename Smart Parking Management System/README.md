# ParkEasy - Smart Parking Management System

A comprehensive web application for managing parking facilities with real-time slot availability, booking system, and provider management dashboard.

## 🎯 Features

### Customer Features
- **Smart Search**: Find parking facilities by location with advanced filters
- **Real-Time Slot Grid**: BookMyShow-style interactive slot selection with live status updates
- **Instant Booking**: Quick 3-step booking process (Vehicle Details → Payment → Confirmation)
- **Digital Tickets**: QR code-based parking tickets for contactless entry
- **Multiple Payment Options**: UPI, Card, and Pay-at-Exit
- **Booking Management**: View active and completed bookings
- **Profile Management**: Manage vehicles, payment methods, and favorites

### Provider Features
- **Analytics Dashboard**: Real-time revenue tracking and occupancy metrics
- **Visual Charts**: Revenue trends and facility occupancy visualization
- **Facility Management**: Multi-facility management with detailed analytics
- **Booking Overview**: Track all bookings across facilities

### Key Highlights
- ✨ Modern, responsive design with Tailwind CSS
- 🎨 Indigo brand color scheme with intuitive UX
- 📱 Mobile-first responsive layout
- 🔄 Real-time slot status updates with animations
- 📊 Interactive charts using Recharts
- 🎯 Role-based access control (Customer/Provider)
- 🔐 Protected routes for secure access

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Charts**: Recharts
- **Animations**: Motion (Framer Motion)
- **Forms**: React Hook Form
- **Notifications**: Sonner (Toast notifications)
- **Build Tool**: Vite

## 📦 Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm run dev
```

## 🚀 Usage

### Customer Flow
1. **Landing Page**: Browse popular parking spots or search by location
2. **Search**: Filter facilities by vehicle type, price, amenities
3. **Facility Details**: View facility info, select floor and parking slot
4. **Booking**: Enter vehicle details, choose payment method
5. **Confirmation**: Get QR code ticket for entry
6. **Manage**: View active bookings and history

### Provider Flow
1. **Login**: Sign in as provider
2. **Dashboard**: View revenue, occupancy, and analytics
3. **Facilities**: Manage multiple parking facilities
4. **Bookings**: Track all customer bookings

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── pages/         # Page components
│   │   ├── ui/            # Reusable UI components
│   │   ├── Navigation.tsx # Navigation bar
│   │   └── SlotGrid.tsx   # Parking slot grid component
│   └── App.tsx            # Main app with routing
├── context/
│   └── AppContext.tsx     # Global state management
├── data/
│   └── mockData.ts        # Mock data for demo
├── types/
│   └── index.ts           # TypeScript types
└── styles/                # CSS files
```

## 🎨 Design System

### Colors
- **Primary**: Indigo-600 (#4F46E5)
- **Success**: Emerald-500 (#10B981)
- **Warning**: Amber-500 (#F59E0B)
- **Danger**: Red-500 (#EF4444)

### Status Colors
- **Free Slots**: Green (#10B981)
- **Occupied**: Red (#EF4444)
- **Reserved**: Amber (#F59E0B)
- **Maintenance**: Gray (#6B7280)

## 🔑 Key Components

### SlotGrid Component
The hero feature - an interactive parking slot selector with:
- Color-coded status indicators
- Hover effects with pricing info
- Selection animation
- Real-time status updates
- Vehicle type icons

### Booking Flow
Multi-step booking process with:
- Progress indicator
- Form validation
- Price calculation
- Payment method selection
- QR code generation

### Provider Dashboard
Analytics dashboard featuring:
- Revenue metrics with trend indicators
- Occupancy rate visualization
- Interactive charts (Line and Bar)
- Recent bookings table
- Facility cards

## 📝 Mock Data

The application uses mock data to simulate:
- 4 parking facilities across Mumbai and Gurugram
- 180-300 parking slots per facility
- Vehicle types: Bike, Scooter, Car, Truck
- Pricing tiers based on vehicle type
- Customer and provider user profiles
- Sample bookings and reviews

## 🎯 Future Enhancements

With Supabase integration, this app could include:
- **Real-time Updates**: WebSocket-based live slot status
- **User Authentication**: Secure login with email/phone
- **Payment Integration**: Razorpay/Stripe for actual payments
- **Geolocation**: Find parking near current location
- **Push Notifications**: Booking reminders and updates
- **Monthly Passes**: Subscription management
- **Reviews System**: User ratings and feedback
- **Admin Panel**: Super admin for platform management

## 🔐 Authentication

Current implementation uses mock authentication:
- **Customer Login**: Any email/password
- **Provider Login**: Any email/password with provider role
- Protected routes redirect to login if not authenticated
- Role-based access control

## 📱 Responsive Design

- **Desktop**: Full featured dashboard with charts
- **Tablet**: Optimized grid layouts
- **Mobile**: Hamburger menu, bottom sheets for filters
- Breakpoints: xs (<640px), sm (640px), md (768px), lg (1024px), xl (1280px)

## 🎬 Demo Users

**Customer**
- Name: Rahul Sharma
- Email: rahul.sharma@email.com

**Provider**
- Name: Mumbai Parking Solutions  
- Email: info@mumbaiparking.com

## 📄 License

This is a demo project created for educational purposes.

## 🙏 Credits

- Design inspired by BookMyShow, Uber, and Airbnb
- Icons by Lucide
- UI components by Radix UI
- Images from Unsplash
