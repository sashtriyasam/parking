import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Car, Bike, Truck, Clock, Zap, Shield, IndianRupee, Smartphone, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Card } from '@/app/components/ui/card';
import { mockFacilities } from '@/data/mockData';

export function Landing() {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [vehicleType, setVehicleType] = useState('car');

  const handleSearch = () => {
    navigate(`/customer/search?location=${location}&vehicleType=${vehicleType}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1668764633331-228bae0957e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBwYXJraW5nJTIwZmFjaWxpdHklMjBidWlsZGluZ3xlbnwxfHx8fDE3NzAwNTg5Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-indigo-900/60 to-black/40"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight">
            Smart Parking for
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              Smart Cities
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-200 mb-4 font-medium">
            Find, Book & Park in Seconds
          </p>
          <p className="text-lg text-gray-300 mb-12">
            Join 2M+ users who trust ParkEasy
          </p>

          {/* Search Bar */}
          <Card className="max-w-4xl mx-auto p-6 bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Enter location..."
                    className="pl-10 h-12 text-base"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <Select value={vehicleType} onValueChange={setVehicleType}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bike">
                      <div className="flex items-center">
                        <Bike className="w-4 h-4 mr-2" />
                        Bike
                      </div>
                    </SelectItem>
                    <SelectItem value="scooter">
                      <div className="flex items-center">
                        <Bike className="w-4 h-4 mr-2" />
                        Scooter
                      </div>
                    </SelectItem>
                    <SelectItem value="car">
                      <div className="flex items-center">
                        <Car className="w-4 h-4 mr-2" />
                        Car
                      </div>
                    </SelectItem>
                    <SelectItem value="truck">
                      <div className="flex items-center">
                        <Truck className="w-4 h-4 mr-2" />
                        Truck
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleSearch}
                className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full"
              >
                Search Parking
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Popular Parking Spots */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              Popular Parking Spots
            </h2>
            <p className="text-lg text-gray-600">Find parking near you</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockFacilities.map((facility) => (
              <Card
                key={facility.id}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                onClick={() => navigate(`/customer/facility/${facility.id}`)}
              >
                <div className="relative h-48">
                  <img
                    src={facility.images[0]}
                    alt={facility.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-sm">{facility.rating}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{facility.name}</h3>
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{facility.city}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-indigo-600">₹60/hr</span>
                    <span className="text-sm text-gray-500">{facility.availableSlots} slots</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">Book parking in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 mb-6 transform hover:scale-110 transition-transform">
                <MapPin className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Find</h3>
              <p className="text-gray-600">Search for parking near your destination</p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 mb-6 transform hover:scale-110 transition-transform">
                <Clock className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Book</h3>
              <p className="text-gray-600">Reserve your spot instantly</p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 mx-auto bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 mb-6 transform hover:scale-110 transition-transform">
                <Zap className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Park</h3>
              <p className="text-gray-600">Enter with QR code, no hassle</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">
              Why Choose ParkEasy?
            </h2>
            <p className="text-lg text-gray-600">The smartest way to park</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure & Safe</h3>
              <p className="text-gray-600">24/7 CCTV surveillance and security at all facilities</p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <IndianRupee className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Best Prices</h3>
              <p className="text-gray-600">Daily maximum caps and monthly passes for savings</p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Smartphone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Contactless Entry</h3>
              <p className="text-gray-600">QR code based entry and exit for quick access</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Mobile App CTA */}
      <section className="py-24 bg-gradient-to-br from-indigo-900 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-transparent skew-y-3"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-4xl sm:text-5xl font-black mb-6">
                Download the App for Exclusive Offers
              </h2>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-lg">Real-time slot availability</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-lg">Navigation to parking spot</span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-lg">Special discounts & rewards</span>
                </li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-white text-indigo-900 hover:bg-gray-100 h-14 px-8 rounded-xl font-semibold">
                  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  App Store
                </Button>
                <Button className="bg-white text-indigo-900 hover:bg-gray-100 h-14 px-8 rounded-xl font-semibold">
                  <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  Google Play
                </Button>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1740439615440-ca2d2b796589?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydHBob25lJTIwcGFya2luZyUyMGFwcCUyMG1vYmlsZXxlbnwxfHx8fDE3NzAwNTg5Mzl8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Mobile App"
                className="w-full max-w-md mx-auto transform scale-110"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-lg">P</span>
                </div>
                <span className="text-xl font-black">ParkEasy</span>
              </div>
              <p className="text-gray-600 text-sm">
                Smart parking for smart cities. Join millions of users who park smarter every day.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-indigo-600">About Us</a></li>
                <li><a href="#" className="hover:text-indigo-600">Careers</a></li>
                <li><a href="#" className="hover:text-indigo-600">Press</a></li>
                <li><a href="#" className="hover:text-indigo-600">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-indigo-600">Help Center</a></li>
                <li><a href="#" className="hover:text-indigo-600">Contact Us</a></li>
                <li><a href="#" className="hover:text-indigo-600">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-600">Terms of Service</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">For Providers</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-indigo-600">List Your Facility</a></li>
                <li><a href="#" className="hover:text-indigo-600">Provider Login</a></li>
                <li><a href="#" className="hover:text-indigo-600">Resources</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 text-center text-sm text-gray-600">
            <p>&copy; 2026 ParkEasy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
