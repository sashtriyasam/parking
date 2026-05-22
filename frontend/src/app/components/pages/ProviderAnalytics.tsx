import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  IndianRupee,
  Users,
  Car,
  Clock,
  ArrowUpRight,
  Calendar,
  Download,
  ParkingCircle,
  PieChart as PieChartIcon,
  BarChart3,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { providerService } from '@/services/provider.service';
import { toast } from 'sonner';

const APPLE_COLORS = ['#007AFF', '#34C759', '#FF9F0A', '#FF3B30', '#8E8E93'];

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
    return (
      <div className="min-h-screen bg-background pt-24 flex justify-center items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Loading Analytics…</p>
        </div>
      </div>
    );
  }

  const tooltipStyle = {
    borderRadius: '12px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--card)',
    color: 'var(--foreground)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    fontSize: 12
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">Operator Hub</p>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Business Intelligence</h1>
            <p className="text-muted-foreground text-sm mt-1">Performance tracking across all facilities</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40 h-9 bg-secondary border-border text-sm font-semibold rounded-lg">
                <Calendar className="w-3.5 h-3.5 mr-2 text-primary" />
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            <button className="h-9 px-4 flex items-center gap-2 bg-secondary border border-border rounded-lg text-sm font-semibold text-foreground hover:bg-secondary/80 transition-colors">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            label="Total Revenue"
            value={`₹${stats?.today_revenue || 0}`}
            change={`+${stats?.revenue_change_percent || 0}% from yesterday`}
            changePositive
            icon={IndianRupee}
            accent="#34C759"
          />
          <MetricCard
            label="Avg. Occupancy"
            value={`${stats?.occupancy_rate || 0}%`}
            progress={stats?.occupancy_rate || 0}
            icon={ParkingCircle}
            accent="#007AFF"
          />
          <MetricCard
            label="Active Bookings"
            value={stats?.active_bookings || 0}
            badge="LIVE"
            icon={Users}
            accent="#FF9F0A"
          />
          <MetricCard
            label="Avg. Duration"
            value="2.4 hrs"
            sub="Per vehicle entry"
            icon={Car}
            accent="#8E8E93"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          {/* Revenue Trend */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="font-bold text-foreground">Revenue Performance</h3>
                <p className="text-muted-foreground text-xs mt-0.5">Daily income trends across all vehicle types</p>
              </div>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div className="p-6 h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#007AFF" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 600 }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 600 }}
                    tickFormatter={val => `₹${val}`}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#007AFF"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    animationDuration={1200}
                    dot={{ r: 4, fill: '#007AFF', strokeWidth: 0 }}
                    activeDot={{ r: 7, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Vehicle Distribution */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="font-bold text-foreground">Revenue Split</h3>
                <p className="text-muted-foreground text-xs mt-0.5">By vehicle category</p>
              </div>
              <PieChartIcon className="w-4 h-4 text-primary" />
            </div>
            <div className="p-6">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vehicleDistribution.length > 0 ? vehicleDistribution : [{ name: 'No Data', value: 1 }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(vehicleDistribution.length > 0 ? vehicleDistribution : [{ name: 'No Data', value: 1 }]).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={APPLE_COLORS[index % APPLE_COLORS.length]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2.5">
                {vehicleDistribution.map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: APPLE_COLORS[index % APPLE_COLORS.length] }} />
                      <span className="text-sm font-medium text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">₹{item.value}</span>
                  </div>
                ))}
                {vehicleDistribution.length === 0 && (
                  <p className="text-center text-muted-foreground text-xs py-2">No data for selected period</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Facility Hotspots */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="font-bold text-foreground">Facility Hotspots</h3>
                <p className="text-muted-foreground text-xs mt-0.5">Where is the most demand?</p>
              </div>
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <div className="p-6 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={occupancyData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="facility_name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--foreground)', fontSize: 11, fontWeight: 700 }}
                    width={110}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="occupancy_rate" fill="#007AFF" radius={[0, 8, 8, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Peak Hours */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="font-bold text-foreground">Peak Hours</h3>
                <p className="text-muted-foreground text-xs mt-0.5">Daily traffic patterns</p>
              </div>
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div className="p-6 h-[300px]">
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 600 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="arrivals" fill="#34C759" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
  change?: string;
  changePositive?: boolean;
  progress?: number;
  badge?: string;
  sub?: string;
}

function MetricCard({ label, value, icon: Icon, accent, change, changePositive, progress, badge, sub }: MetricCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden group">
      <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon className="w-10 h-10" style={{ color: accent }} />
      </div>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
      <p className="text-3xl font-black text-foreground mb-2">{value}</p>
      {change && (
        <div className="flex items-center gap-1" style={{ color: changePositive ? '#34C759' : '#FF3B30' }}>
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">{change}</span>
        </div>
      )}
      {progress !== undefined && (
        <div className="w-full bg-secondary h-1 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, backgroundColor: accent }} />
        </div>
      )}
      {badge && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary">
          {badge}
        </span>
      )}
      {sub && <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">{sub}</p>}
    </div>
  );
}
