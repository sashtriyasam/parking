# Testing Guide - Parking Management System

## 🚀 Quick Start

### Backend Server
```bash
cd backend
npm run dev
```
✅ Server running at: `http://localhost:5000`  
✅ API Docs: `http://localhost:5000/api-docs`

### Frontend Application
```bash
cd frontend
npm run dev
```
✅ App running at: `http://localhost:5173`

---

## 📋 Manual Testing Checklist

### 1. Landing Page (`http://localhost:5173`)

**What to Test**:
- [ ] Hero section displays correctly
- [ ] Search bar accepts location input
- [ ] Vehicle type dropdown works
- [ ] "Find Parking" button navigates to search results
- [ ] "How It Works" section is visible
- [ ] All navigation links work

**Expected Behavior**:
- Clicking "Find Parking" → redirects to `/customer/search`
- Clicking "Login/Sign Up" → redirects to auth pages

---

### 2. Authentication

#### Sign Up (`/signup`)
**Test Flow**:
1. Enter email: `test@example.com`
2. Password: `test1234`
3. Full name: `Test User`
4. Role: `CUSTOMER`
5. Click "Sign Up"

**Expected**:
- ✅ Account created
- ✅ Auto-login
- ✅ Redirect to `/customer/search`

#### Login (`/login`)
**Test Flow**:
1. Email: `test@example.com`
2. Password: `test1234`
3. Click "Login"

**Expected**:
- ✅ JWT token stored
- ✅ Redirect to search page

---

### 3. Customer Search Page (`/customer/search`)

**What to Test**:

#### Filters
- [ ] Distance slider (1-20km)
- [ ] Price range inputs
- [ ] Vehicle type dropdown
- [ ] Sort by dropdown
- [ ] Feature checkboxes
- [ ] Apply/Reset buttons

#### Results Display
- [ ] Parking facility cards load
- [ ] Shows: name, address, distance, slots, pricing
- [ ] "View Details" button works
- [ ] "Quick Book" button (if slots available)

#### Mobile Testing
- [ ] Resize to mobile width
- [ ] Filter icon appears
- [ ] Filters open in modal
- [ ] Grid stacks vertically

---

### 4. Search Functionality

**Test Scenarios**:

1. **Default Search**:
   - Opens page → uses geolocation or default Mumbai coords
   - Should show nearby facilities

2. **Custom Location**:
   - Enter "Andheri" in search bar
   - Select vehicle type: "CAR"
   - Click search
   - Results should update

3. **Filter by Distance**:
   - Set slider to 2km
   - Click Apply
   - Only facilities within 2km shown

4. **Filter by Price**:
   - Set range: ₹20-₹100
   - Click Apply
   - Only matching facilities shown

5. **Sort by Price**:
   - Select "Price: Low to High"
   - Results reorder by hourly rate

---

### 5. Real-time Updates

**What to Test**:
- Keep search page open for 30+ seconds
- Data should auto-refresh (check network tab)
- Availability should update if backend changes

---

### 6. API Integration Testing

Use Swagger UI: `http://localhost:5000/api-docs`

**Test Endpoints**:

1. **POST /api/v1/auth/register**
   - Create test account
   - Verify token returned

2. **GET /api/v1/customer/parking/search**
   - Set params: `latitude=19.076&longitude=72.877&radius=5`
   - Verify facilities returned

3. **GET /api/v1/customer/parking/:facilityId/details**
   - Use facility ID from search
   - Verify detailed info returned

---

## 🐛 Common Issues & Solutions

### Issue: "No parking facilities found"
**Solution**: 
- Check if backend has seed data
- Run: `cd backend && npm run seed` (if seed script exists)
- Or manually create facilities via API

### Issue: Filter changes don't reflect
**Solution**:
- Click "Apply" button after changing filters
- Check browser console for errors

### Issue: Location not detected
**Solution**:
- Grant browser location permissions
- Or manually enter location in search bar

### Issue: "Failed to load parking facilities"
**Solution**:
- Verify backend is running on port 5000
- Check `.env` file has correct `VITE_API_URL`

---

## 📊 Test Data Requirements

### Minimum Test Data:
- 1+ Parking facilities in database
- Each facility should have:
  - Name, address, latitude, longitude
  - At least 1 floor
  - Multiple slots (different vehicle types)
  - Pricing rules

### Create Test Facility (via API):
```bash
POST /api/v1/provider/facilities
{
  "name": "Test Parking Center",
  "address": "Andheri West, Mumbai",
  "city": "Mumbai",
  "latitude": 19.1136,
  "longitude": 72.8697,
  "total_floors": 2,
  "operating_hours": "24/7"
}
```

---

## ✅ Success Criteria

**Landing Page**:
- ✅ Loads in < 2 seconds
- ✅ Search bar functional
- ✅ All sections visible

**Search Page**:
- ✅ Shows results within 1 second
- ✅ Filters work correctly
- ✅ Mobile responsive
- ✅ Auto-refresh every 30s

**Overall**:
- ✅ No console errors
- ✅ Smooth navigation
- ✅ JWT auth working
- ✅ API calls successful

---

## 🎥 Browser DevTools Checklist

1. **Console**: No errors (except missing Google Maps API key warning)
2. **Network**: 
   - `/customer/parking/search` returns 200
   - Requests include `Authorization: Bearer <token>`
3. **Application Storage**:
   - `localStorage.token` exists after login
   - `localStorage.user` contains user data
4. **Performance**:
   - First load < 3 seconds
   - Subsequent navigation instant (React Router)

---

**Ready to test!** 🚀
