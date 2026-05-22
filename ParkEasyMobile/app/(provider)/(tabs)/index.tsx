import React, { useState, useEffect, useCallback, useMemo, ComponentProps } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInRight,
  Layout
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { get } from '../../../services/api';
import { ProfessionalCard } from '../../../components/ui/ProfessionalCard';
import { EmptyState } from '../../../components/EmptyState';
import { useAuthStore } from '../../../store/authStore';
import { useSocket } from '../../../hooks/useSocket';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useHaptics } from '../../../hooks/useHaptics';
import { useToast } from '../../../components/Toast';

const { width } = Dimensions.get('window');

interface Facility {
  id: string;
  name: string;
  address?: string;
  total_slots?: number;
  [key: string]: any;
}

interface Booking {
  id: string;
  vehicle_number: string;
  booking_type?: 'ONLINE' | 'OFFLINE' | 'WALK_IN';
  facility_id: string;
  facility?: { name: string };
  entry_time: string;
  status: string;
  total_fee?: number;
  [key: string]: any;
}

const formatBookingTime = (entry_time: string) => {
  if (!entry_time) return '-';
  const date = new Date(entry_time);
  return isNaN(date.getTime()) 
    ? '-' 
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ProviderDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const colors = useThemeColors();
  const haptics = useHaptics();
  const { showToast } = useToast();
  const { socket, isConnected, joinProvider } = useSocket();
  
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    onlineCount: 0,
    offlineCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardError, setDashboardError] = useState(false);

  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setDashboardError(false);
    try {
      const [statsRes, facilitiesRes, bookingsRes] = await Promise.all([
        get('/provider/dashboard/stats'),
        get('/provider/facilities'),
        get('/provider/bookings?status=ACTIVE&limit=10')
      ]);

      if (facilitiesRes.data?.data) {
        setFacilities(facilitiesRes.data.data);
      }

      if (bookingsRes.data?.data) {
        setActiveBookings(bookingsRes.data.data);
      }

      if (statsRes.data?.data) {
        const d = statsRes.data.data;
        setStats({
          todayRevenue: d.revenue?.today || 0,
          onlineCount: d.active_bookings_online || 0,
          offlineCount: d.active_bookings_offline || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardError(true);
      showToast('Sync failed. Please check your connection.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Socket Real-time Sync
  const handleSocketRefresh = useCallback(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  useEffect(() => {
    if (!socket || !user?.id) return;
    
    joinProvider(user.id);

    socket.on('booking_updated', handleSocketRefresh);
    socket.on('facility_created', handleSocketRefresh);
    
    return () => {
      socket.off('booking_updated', handleSocketRefresh);
      socket.off('facility_created', handleSocketRefresh);
    };
  }, [socket, user?.id, joinProvider, handleSocketRefresh]);

  const onRefresh = () => {
    haptics.impactLight();
    setRefreshing(true);
    fetchDashboardData(false);
  };

  const totalSlots = useMemo(() => 
    facilities.reduce((acc, f) => acc + (f.total_slots || 0), 0)
  , [facilities]);

  const occupancyRate = useMemo(() => {
    if (totalSlots === 0) return 0;
    const rate = Math.round((activeBookings.length / totalSlots) * 100);
    return Math.min(rate, 100);
  }, [activeBookings, totalSlots]);

  // Calculate specific occupancies for facility manager section
  const facilitiesWithOccupancy = useMemo(() => {
    return facilities.map(f => {
      const facilityBookings = activeBookings.filter(b => b.facility_id === f.id);
      const total = f.total_slots || 10; // fallback to 10 if not defined
      const filled = Math.min(facilityBookings.length, total);
      const rate = Math.round((filled / total) * 100);
      return {
        ...f,
        filled,
        total,
        rate
      };
    });
  }, [facilities, activeBookings]);

  if (loading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greetingLabel, { color: colors.textSecondary }]}>PARTNER OVERVIEW</Text>
          <Text style={styles.userName}>{user?.full_name || 'Operator'}</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.syncBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          onPress={onRefresh}
        >
          <View style={[styles.syncDot, { backgroundColor: isConnected ? colors.success : colors.warning }]} />
          <Text style={[styles.syncText, { color: isConnected ? colors.success : colors.warning }]}>
            {isConnected ? 'LIVE' : 'SYNCING'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {dashboardError && (
          <TouchableOpacity 
            style={[styles.errorBanner, { backgroundColor: colors.error }]} 
            onPress={() => fetchDashboardData()}
            activeOpacity={0.8}
          >
            <Ionicons name="cloud-offline-outline" size={16} color="#FFFFFF" />
            <Text style={styles.errorBannerText}>Sync Interrupted. Tap to reconnect.</Text>
          </TouchableOpacity>
        )}

        {/* Quick Check-in Button widget */}
        <Animated.View entering={FadeInDown.duration(800)}>
          <ProfessionalCard 
             style={styles.heroCard}
             onPress={() => {
                haptics.impactMedium();
                router.push('/(provider)/manual-entry');
             }}
          >
             <View style={styles.heroLayout}>
                 <View style={styles.heroTextSection}>
                    <Text style={styles.heroTitle}>Manual Check-in</Text>
                    <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Log direct entries for walk-in arrivals</Text>
                    
                    <View style={styles.occupancyBarContainer}>
                       <View style={styles.occupancyTextRow}>
                          <Text style={[styles.occupancyLabel, { color: colors.textSecondary }]}>TOTAL LIVE OCCUPANCY</Text>
                          <Text style={[styles.occupancyPercent, { color: colors.textPrimary }]}>{occupancyRate}%</Text>
                       </View>
                       <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                          <Animated.View 
                             style={[
                                styles.progressBarFill, 
                                { width: `${occupancyRate}%`, backgroundColor: colors.primary }
                             ]} 
                          />
                       </View>
                    </View>
                 </View>
                 <View style={[styles.heroIconBox, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="add" size={28} color={colors.primary} />
                 </View>
             </View>
          </ProfessionalCard>
        </Animated.View>

        {/* 2x2 Metrics Grid with Shaded Icon Backgrounds */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 12 }]}>Performance Overview</Text>
        <View style={styles.statsGrid}>
           <View style={styles.statsRow}>
              <MiniStat 
                label="Today's Revenue" 
                value={`₹${stats.todayRevenue}`} 
                icon="wallet-outline" 
                colors={colors}
              />
              <MiniStat 
                label="Total Bookings" 
                value={stats.onlineCount + stats.offlineCount} 
                icon="ticket-outline" 
                colors={colors}
              />
           </View>
           <View style={styles.statsRow}>
              <MiniStat 
                label="App Entries" 
                value={stats.onlineCount} 
                icon="phone-portrait-outline" 
                colors={colors}
              />
              <MiniStat 
                label="Walk-ins" 
                value={stats.offlineCount} 
                icon="walk-outline" 
                colors={colors}
              />
           </View>
        </View>

        {/* Facilities Management Occupancy Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 12 }]}>My Facilities</Text>
        {facilitiesWithOccupancy.length > 0 ? (
          <View style={styles.facilitiesSection}>
            {facilitiesWithOccupancy.map((fac, idx) => (
              <Animated.View 
                key={fac.id}
                entering={FadeInRight.delay(idx * 100).duration(500)}
                style={styles.facilityItemWrapper}
              >
                <ProfessionalCard 
                  style={styles.facilityManageCard}
                  onPress={() => router.push(`/(provider)/facility/${fac.id}`)}
                >
                  <View style={styles.facilityTitleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.facilityNameText, { color: colors.textPrimary }]} numberOfLines={1}>
                        {fac.name}
                      </Text>
                      <Text style={[styles.facilityAddressText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {fac.address || 'No address specified'}
                      </Text>
                    </View>
                    <View style={styles.facilitySlotsIndicator}>
                      <Text style={[styles.slotsText, { color: colors.textPrimary }]}>
                        {fac.filled} / {fac.total}
                      </Text>
                      <Text style={[styles.slotsSub, { color: colors.textSecondary }]}>slots filled</Text>
                    </View>
                  </View>

                  <View style={styles.facilityProgressContainer}>
                    <View style={[styles.progressBarBg, { backgroundColor: colors.border, height: 6 }]}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { 
                            width: `${fac.rate}%`, 
                            backgroundColor: fac.rate >= 90 ? colors.error : fac.rate >= 70 ? colors.warning : colors.success 
                          }
                        ]} 
                      />
                    </View>
                    <View style={styles.rateRow}>
                      <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>Occupancy Rate</Text>
                      <Text style={[
                        styles.rateValueText, 
                        { color: fac.rate >= 90 ? colors.error : fac.rate >= 70 ? colors.warning : colors.success }
                      ]}>
                        {fac.rate}%
                      </Text>
                    </View>
                  </View>
                </ProfessionalCard>
              </Animated.View>
            ))}
          </View>
        ) : (
          <ProfessionalCard style={styles.emptyFacilitiesCard}>
            <Ionicons name="business-outline" size={28} color={colors.textSecondary} style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyFacilitiesText, { color: colors.textSecondary }]}>No facilities managed yet.</Text>
          </ProfessionalCard>
        )}

        {/* Live Active Bookings List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, paddingHorizontal: 0 }]}>Live Active Bookings</Text>
            <TouchableOpacity onPress={() => router.push('/(provider)/bookings')}>
               <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {activeBookings.length > 0 ? (
            activeBookings.slice(0, 5).map((booking, index) => {
              const isOffline = booking.booking_type === 'OFFLINE' || booking.booking_type === 'WALK_IN';
              return (
                <Animated.View 
                  key={booking.id} 
                  entering={FadeInRight.delay(index * 100).duration(500)}
                  layout={Layout.springify()}
                >
                  <ProfessionalCard 
                    style={styles.activityItem} 
                    onPress={() => {
                      if (booking.facility_id) {
                        router.push(`/(provider)/facility/${booking.facility_id}`);
                      } else {
                        showToast('Facility details unavailable', 'info');
                      }
                    }}
                  >
                    <View style={styles.activityLeft}>
                      <View style={[styles.activityIcon, { backgroundColor: colors.surfaceElevated }]}>
                         <Ionicons 
                            name={isOffline ? 'walk-outline' : 'phone-portrait-outline'} 
                            size={18} 
                            color={isOffline ? colors.warning : colors.primary} 
                          />
                      </View>
                      <View style={{ flex: 1 }}>
                         <Text style={[styles.vehicleId, { color: colors.textPrimary }]}>{booking.vehicle_number}</Text>
                         <Text 
                           style={[styles.activitySub, { color: colors.textSecondary }]}
                           numberOfLines={1}
                         >
                            {booking.facility?.name || 'Main Facility'} • Checked-in {formatBookingTime(booking.entry_time)}
                         </Text>
                      </View>
                    </View>
                    
                    {/* Online vs Walk-in badges */}
                    <View style={[
                      styles.typeBadge, 
                      { 
                        backgroundColor: isOffline ? colors.warning + '15' : colors.primary + '15',
                        borderColor: isOffline ? colors.warning + '30' : colors.primary + '30'
                      }
                    ]}>
                      <Text style={[
                        styles.typeBadgeText, 
                        { color: isOffline ? colors.warning : colors.primary }
                      ]}>
                        {isOffline ? 'WALK-IN' : 'ONLINE'}
                      </Text>
                    </View>
                  </ProfessionalCard>
                </Animated.View>
              );
            })
          ) : (
            <EmptyState icon="timer-outline" title="Ready to Sync" subtitle="Live arrivals will appear here in real-time." />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

interface MiniStatProps {
  label: string;
  value: string | number;
  icon: ComponentProps<typeof Ionicons>['name'];
  colors: any;
}

function MiniStat({ label, value, icon, colors }: MiniStatProps) {
  return (
    <ProfessionalCard style={styles.miniStatCard}>
       <View style={[styles.miniIconBg, { backgroundColor: colors.primary + '12' }]}>
         <Ionicons name={icon} size={18} color={colors.primary} />
       </View>
       <Text style={[styles.miniStatLabel, { color: colors.textSecondary }]}>{label}</Text>
       <Text style={[styles.miniStatValue, { color: colors.textPrimary }]}>{value}</Text>
    </ProfessionalCard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
  },
  greetingLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 4 },
  userName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, color: '#FFFFFF' },
  syncBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 0.5 },
  syncDot: { width: 8, height: 8, borderRadius: 4 },
  syncText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 8 },
  heroCard: { padding: 0, borderRadius: 12, marginBottom: 20 },
  heroLayout: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroTextSection: { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.4, color: '#FFFFFF' },
  heroSubtitle: { fontSize: 12, marginTop: 2, fontWeight: '500' },
  heroIconBox: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  occupancyBarContainer: { marginTop: 16 },
  occupancyTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, alignItems: 'flex-end' },
  occupancyLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  occupancyPercent: { fontSize: 15, fontWeight: '700' },
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3, marginBottom: 12 },
  statsGrid: { gap: 12, marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 12 },
  miniStatCard: { flex: 1, padding: 16, borderRadius: 12 },
  miniIconBg: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  miniStatLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  miniStatValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  facilitiesSection: { gap: 12, marginBottom: 24 },
  facilityItemWrapper: { width: '100%' },
  facilityManageCard: { padding: 16, borderRadius: 12 },
  facilityTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  facilityNameText: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  facilityAddressText: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  facilitySlotsIndicator: { alignItems: 'flex-end' },
  slotsText: { fontSize: 14, fontWeight: '700' },
  slotsSub: { fontSize: 10, fontWeight: '500', marginTop: 1 },
  facilityProgressContainer: { width: '100%' },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  rateLabel: { fontSize: 11, fontWeight: '600' },
  rateValueText: { fontSize: 12, fontWeight: '700' },
  emptyFacilitiesCard: { padding: 24, alignItems: 'center', borderRadius: 12, marginBottom: 24 },
  emptyFacilitiesText: { fontSize: 13, fontWeight: '600' },
  section: { marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  viewAll: { fontSize: 13, fontWeight: '700' },
  activityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 10 },
  activityLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  activityIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  vehicleId: { fontSize: 14, fontWeight: '700' },
  activitySub: { fontSize: 11, fontWeight: '500', marginTop: 2, marginRight: 6 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  typeBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 10, marginBottom: 16 },
  errorBannerText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
});
