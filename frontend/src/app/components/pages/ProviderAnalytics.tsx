import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  IndianRupee, 
  Users, 
  Car, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar,
  Filter,
  Download,
  ParkingCircle,
  PieChart as PieChartIcon,
  BarChart3,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { providerService } from '@/services/provider.service';
import { toast } from 'sonner';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function ProviderAnalytics() {
    const [period, setPeriod] = useState('7d');
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [occupancyData, setOccupancyData] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [period]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [rev, occ, s] = await Promise.all([
                providerService.getRevenueData(period),
                providerService.getOccupancyData(),
                providerService.getDashboardStats()
            ]);
            setRevenueData(rev);
            setOccupancyData(occ);
            setStats(s);
        } catch (error) {
            toast.error('Failed to load analytics data');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const vehicleDistribution = [
        { name: 'Car', value: revenueData.reduce((sum, d) => sum + (d.CAR || 0), 0) },
        { name: 'Bike', value: revenueData.reduce((sum, d) => sum + (d.BIKE || 0), 0) },
        { name: 'Scooter', value: revenueData.reduce((sum, d) => sum + (d.SCOOTER || 0), 0) },
        { name: 'Truck', value: revenueData.reduce((sum, d) => sum + (d.TRUCK || 0), 0) },
    ].filter(v => v.value > 0);

    if (isLoading && !stats) {
        return <div className="min-h-screen pt-24 flex justify-center items-center"><p>Loading Analytics...</p></div>;
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Business Intelligence</h1>
                        <p className="text-slate-500 font-medium mt-1">Detailed performance tracking across all facilities</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className="w-40 bg-white border-slate-200 shadow-sm font-bold">
                                <Calendar className="w-4 h-4 mr-2 text-indigo-500" />
                                <SelectValue placeholder="Period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="7d">Last 7 Days</SelectItem>
                                <SelectItem value="30d">Last 30 Days</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" className="bg-white border-slate-200 shadow-sm font-bold">
                            <Download className="w-4 h-4 mr-2" />
                            Export PDF
                        </Button>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="border-0 shadow-lg shadow-indigo-500/5 bg-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <IndianRupee className="w-12 h-12" />
                        </div>
                        <CardContent className="p-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
                            <h3 className="text-3xl font-black text-slate-900">₹{stats?.today_revenue || 0}</h3>
                            <div className="flex items-center gap-1 mt-2 text-emerald-500">
                                <ArrowUpRight className="w-4 h-4" />
                                <span className="text-xs font-bold">+{stats?.revenue_change_percent || 0}% from yesterday</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg shadow-indigo-500/5 bg-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <ParkingCircle className="w-12 h-12" />
                        </div>
                        <CardContent className="p-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Average Occupancy</p>
                            <h3 className="text-3xl font-black text-slate-900">{stats?.occupancy_rate || 0}%</h3>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                                <div className="bg-indigo-500 h-full" style={{ width: `${stats?.occupancy_rate || 0}%` }} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg shadow-indigo-500/5 bg-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Users className="w-12 h-12" />
                        </div>
                        <CardContent className="p-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Bookings</p>
                            <h3 className="text-3xl font-black text-slate-900">{stats?.active_bookings || 0}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-0 font-bold">LIVE NOW</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg shadow-indigo-500/5 bg-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Car className="w-12 h-12" />
                        </div>
                        <CardContent className="p-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg. Duration</p>
                            <h3 className="text-3xl font-black text-slate-900">2.4<span className="text-sm">hrs</span></h3>
                            <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase">Per vehicle entry</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Revenue Trend */}
                    <Card className="lg:col-span-2 border-slate-200 shadow-sm rounded-3xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 py-6 px-8">
                            <div>
                                <CardTitle className="text-lg font-black text-slate-800">Revenue Performance</CardTitle>
                                <CardDescription className="text-xs font-medium">Daily income trends across all vehicle types</CardDescription>
                            </div>
                            <TrendingUp className="w-5 h-5 text-indigo-500" />
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis 
                                            dataKey="date" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} 
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} 
                                            tickFormatter={(val) => `₹${val}`}
                                        />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5' }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="revenue" 
                                            stroke="#6366f1" 
                                            strokeWidth={3}
                                            fillOpacity={1} 
                                            fill="url(#colorRevenue)" 
                                            animationDuration={1500}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="CAR" 
                                            stackId="1"
                                            stroke="#8b5cf6" 
                                            fill="#8b5cf6" 
                                            fillOpacity={0.05}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Vehicle Type Distribution */}
                    <Card className="lg:col-span-1 border-slate-200 shadow-sm rounded-3xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 py-6 px-8">
                            <div>
                                <CardTitle className="text-lg font-black text-slate-800">Revenue Split</CardTitle>
                                <CardDescription className="text-xs font-medium">By vehicle category</CardDescription>
                            </div>
                            <PieChartIcon className="w-5 h-5 text-indigo-500" />
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={vehicleDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {vehicleDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-8 space-y-3">
                                {vehicleDistribution.map((item, index) => (
                                    <div key={item.name} className="flex justify-between items-center text-sm font-bold">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                            <span className="text-slate-600">{item.name}</span>
                                        </div>
                                        <span className="text-slate-900">₹{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Occupancy by Facility */}
                    <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 py-6 px-8">
                            <div>
                                <CardTitle className="text-lg font-black text-slate-800">Facility Hotspots</CardTitle>
                                <CardDescription className="text-xs font-medium">Where is the most demand?</CardDescription>
                            </div>
                            <BarChart3 className="w-5 h-5 text-indigo-500" />
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={occupancyData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis 
                                            dataKey="facility_name" 
                                            type="category" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                                            width={120}
                                        />
                                        <Tooltip 
                                             contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="occupancy_rate" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Hourly Traffic - MOCKED since we don't have hourly grouping yet */}
                    <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 py-6 px-8">
                            <div>
                                <CardTitle className="text-lg font-black text-slate-800">Peak Hours</CardTitle>
                                <CardDescription className="text-xs font-medium">Daily traffic patterns</CardDescription>
                            </div>
                            <Clock className="w-5 h-5 text-indigo-500" />
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={[
                                        { hour: '08:00', arrivals: 12 },
                                        { hour: '10:00', arrivals: 45 },
                                        { hour: '12:00', arrivals: 32 },
                                        { hour: '14:00', arrivals: 28 },
                                        { hour: '16:00', arrivals: 56 },
                                        { hour: '18:00', arrivals: 89 },
                                        { hour: '20:00', arrivals: 41 },
                                        { hour: '22:00', arrivals: 18 },
                                    ]}>
                                        <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                        <Tooltip />
                                        <Bar dataKey="arrivals" fill="#10b981" radius={[10, 10, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
