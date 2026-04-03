import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  booking_type?: 'ONLINE' | 'OFFLINE';
  facility?: { name: string };
  status: string;
  entry_time: string;
  total_fee?: number;
  [key: string]: any;
}

export default function ProviderDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const colors = useThemeColors();
  const haptics = useHaptics();
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

  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Socket Real-time Sync
  useEffect(() => {
    if (!socket || !user?.id) return;
    
    joinProvider(user.id);

    const handleRefresh = () => {
      haptics.impactLight();
      fetchDashboardData(false);
    };

    socket.on('booking_updated', handleRefresh);
    socket.on('facility_created', handleRefresh);
    
    return () => {
      socket.off('booking_updated', handleRefresh);
      socket.off('facility_created', handleRefresh);
    };
  }, [socket, user?.id, joinProvider, fetchDashboardData]);

  const onRefresh = () => {
    haptics.impactLight();
    setRefreshing(true);
    fetchDashboardData(false);
  };

  const totalSlots = useMemo(() => 
    facilities.reduce((acc, f) => acc + (f.total_slots || 0), 0) || 1
  , [facilities]);

  const occupancyRate = useMemo(() => 
    Math.round((activeBookings.length / totalSlots) * 100)
  , [activeBookings, totalSlots]);

  if (loading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <View>
          <Text style={[styles.greetingLabel, { color: colors.textMuted }]}>PARTNER OVERVIEW</Text>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.full_name || 'Partner'}</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.syncBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}
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
        {/* Apple-style Hero Section: Offline Entry Widget */}
        <Animated.View entering={FadeInDown.duration(800)}>
          <ProfessionalCard 
             style={[styles.heroCard, { backgroundColor: colors.primary }]} 
             hasVibrancy={false}
             onPress={() => {
                haptics.impactMedium();
                router.push('/(provider)/manual-entry');
             }}
          >
             <View style={styles.heroLayout}>
                <View style={styles.heroTextSection}>
                   <Text style={styles.heroTitle}>Manual Check-in</Text>
                   <Text style={styles.heroSubtitle}>Direct entry for walk-in arrivals</Text>
                   
                   <View style={styles.occupancyBarContainer}>
                      <View style={styles.occupancyTextRow}>
                         <Text style={styles.occupancyLabel}>LIVE OCCUPANCY</Text>
                         <Text style={styles.occupancyPercent}>{occupancyRate}%</Text>
                      </View>
                      <View style={[styles.progressBarBg, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                         <Animated.View 
                            style={[
                               styles.progressBarFill, 
                               { width: `${occupancyRate}%`, backgroundColor: '#FFF' }
                            ]} 
                         />
                      </View>
                   </View>
                </View>
                <View style={[styles.heroIconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                   <Ionicons name="add" size={32} color="#FFF" />
                </View>
             </View>
          </ProfessionalCard>
        </Animated.View>

        {/* Stats Section with Apple Vibe */}
        <View style={styles.statsSection}>
           <View style={styles.statsRow}>
              <MiniStat 
                label="App Entries" 
                value={stats.onlineCount} 
                icon="phone-portrait-outline" 
                colors={colors}
              />
              <MiniStat 
                label="Manual" 
                value={stats.offlineCount} 
                icon="people-outline" 
                colors={colors}
              />
           </View>
           <View style={styles.statsRow}>
              <MiniStat 
                label="Revenue" 
                value={`₹${stats.todayRevenue}`} 
                icon="wallet-outline" 
                colors={colors}
              />
              <MiniStat 
                label="Facilities" 
                value={facilities.length} 
                icon="business-outline" 
                colors={colors}
              />
           </View>
        </View>

        {/* Recent Activity List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Arrivals</Text>
            <TouchableOpacity onPress={() => router.push('/(provider)/bookings')}>
               <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {activeBookings.length > 0 ? (
            activeBookings.slice(0, 5).map((booking, index) => (
              <Animated.View 
                key={booking.id} 
                entering={FadeInRight.delay(index * 100).duration(600)}
                layout={Layout.springify()}
              >
                <ProfessionalCard 
                  style={styles.activityItem} 
                  onPress={() => router.push(`/(provider)/facility/${booking.facility_id}`)}
                  hasVibrancy={true}
                >
                  <View style={styles.activityLeft}>
                    <View style={[styles.activityIcon, { backgroundColor: booking.booking_type === 'OFFLINE' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(79, 70, 229, 0.1)' }]}>
                       <Ionicons 
                          name={booking.booking_type === 'OFFLINE' ? 'walk-outline' : 'phone-portrait-outline'} 
                          size={20} 
                          color={booking.booking_type === 'OFFLINE' ? '#F59E0B' : colors.primary} 
                        />
                    </View>
                    <View>
                       <Text style={[styles.vehicleId, { color: colors.textPrimary }]}>{booking.vehicle_number}</Text>
                       <Text style={[styles.activitySub, { color: colors.textMuted }]}>
                          {booking.booking_type || 'ONLINE'} • {booking.facility?.name?.split(' ')[0]}
                       </Text>
                    </View>
                  </View>
                  <Text style={[styles.arrivalTimestamp, { color: colors.primary }]}>
                    {new Date(booking.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </ProfessionalCard>
              </Animated.View>
            ))
          ) : (
            <EmptyState icon="timer-outline" title="Ready to Sync" subtitle="Recent arrivals will appear here in real-time." />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function MiniStat({ label, value, icon, colors }: any) {
  return (
    <ProfessionalCard style={styles.miniStatCard} hasVibrancy={true}>
       <Ionicons name={icon} size={20} color={colors.primary} style={{ marginBottom: 12 }} />
       <Text style={[styles.miniStatLabel, { color: colors.textMuted }]}>{label}</Text>
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
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 70 : 40,
    paddingBottom: 24,
  },
  greetingLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 4 },
  userName: { fontSize: 26, fontWeight: '900', letterSpacing: -1 },
  syncBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 24, borderWidth: 1 },
  syncDot: { width: 8, height: 8, borderRadius: 4 },
  syncText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  heroCard: { padding: 0, borderRadius: 32, marginBottom: 24, borderWidth: 0, elevation: 12, shadowColor: '#4F46E5', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  heroLayout: { padding: 28, flexDirection: 'row', alignItems: 'center', gap: 20 },
  heroTextSection: { flex: 1 },
  heroTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  heroSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', marginTop: 4 },
  heroIconBox: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  occupancyBarContainer: { marginTop: 24 },
  occupancyTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'flex-end' },
  occupancyLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  occupancyPercent: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  statsSection: { gap: 12, marginBottom: 32 },
  statsRow: { flexDirection: 'row', gap: 12 },
  miniStatCard: { flex: 1, padding: 20, borderRadius: 24, borderWidth: 0 },
  miniStatLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase', opacity: 0.8 },
  miniStatValue: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  section: { marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  viewAll: { fontSize: 14, fontWeight: '800' },
  activityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: 28, marginBottom: 12, borderWidth: 0 },
  activityLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  activityIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  vehicleId: { fontSize: 15, fontWeight: '900' },
  activitySub: { fontSize: 11, fontWeight: '700', marginTop: 3 },
  arrivalTimestamp: { fontSize: 13, fontWeight: '900' },
});
