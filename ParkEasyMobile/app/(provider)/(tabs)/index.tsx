import React, { useState, useEffect, useCallback, ComponentProps } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeInUp,
  Layout,
  ZoomIn,
  SlideInUp
} from 'react-native-reanimated';
import { get } from '../../../services/api';
import { GlassCard } from '../../../components/ui/GlassCard';
import { colors } from '../../../constants/colors';
import { EmptyState } from '../../../components/EmptyState';
import { useAuthStore } from '../../../store/authStore';
import { useRouter } from 'expo-router';
import { useSocket } from '../../../hooks/useSocket';
import Svg, { Path, Circle, G, Text as SvgText, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface Facility {
  id: string;
  name: string;
  address?: string;
  total_slots?: number;
  [key: string]: any;
}

interface Booking {
  id: string;
  customer?: {
    full_name: string;
  };
  facility?: {
    name: string;
  };
  slot?: {
    slot_number: string | number;
  };
  total_fee?: number;
  entry_time: string;
  [key: string]: any;
}

const OccupancyGauge = ({ value, total }: { value: number, total: number }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const radius = 70;
  const strokeWidth = 10;
  const center = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={gaugeStyles.container}>
      <Svg width="160" height="160" viewBox="0 0 160 160">
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
        <SvgText
          x="80"
          y="85"
          textAnchor="middle"
          fontSize="28"
          fontWeight="700"
          fill="white"
        >
          {Math.round(percentage)}%
        </SvgText>
        <SvgText
          x="80"
          y="105"
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          fill="rgba(255,255,255,0.4)"
          letterSpacing={1}
        >
          OCCUPANCY
        </SvgText>
      </Svg>
    </View>
  );
};

const gaugeStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default function ProviderDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState({
    activeFacilities: 0,
    activeBookings: 0,
    todayRevenue: 0,
    totalRevenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);


  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [statsRes, facilitiesRes] = await Promise.all([
        get('/provider/dashboard/stats'),
        get('/provider/facilities')
      ]);

      if (statsRes.data?.data) {
        const d = statsRes.data.data;
        setStats({
          activeFacilities: facilitiesRes.data?.data?.length || 0,
          activeBookings: d.active_bookings || 0,
          todayRevenue: d.revenue?.today || 0,
          totalRevenue: d.revenue?.month || 0,
        });
      }

      if (facilitiesRes.data?.data) {
        setFacilities(facilitiesRes.data.data);
      }

      const recentRes = await get('/provider/bookings?limit=5');
      if (recentRes.data?.data) {
        setRecentBookings(recentRes.data.data);
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

  const { socket, isConnected, joinFacility } = useSocket();

  useEffect(() => {
    if (!socket || facilities.length === 0) return;
    facilities.forEach(f => joinFacility(f.id));

    const handleSlotUpdate = (payload: { status: string, facilityId: string }) => {
      setStats(prev => {
        let newActiveBookings = prev.activeBookings;
        if (payload.status === 'OCCUPIED') {
          newActiveBookings += 1;
        } else if (payload.status === 'FREE') {
          newActiveBookings = Math.max(0, newActiveBookings - 1);
        }
        return { ...prev, activeBookings: newActiveBookings };
      });
    };

    socket.on('slot_updated', handleSlotUpdate);
    return () => {
      socket.off('slot_updated', handleSlotUpdate);
    };
  }, [socket, facilities, joinFacility]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const totalSlots = facilities.reduce((acc, f) => acc + (f.total_slots || 0), 0) || 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.bgWrapper}>
        <LinearGradient
          colors={['#0f1219', '#080a0f']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <Animated.View entering={FadeIn.duration(800)} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.profileBox}>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.full_name?.split(' ')[0] || 'Partner'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => router.push('/(provider)/scan')}
              style={styles.headerIconBtn}
            >
              <BlurView intensity={20} tint="dark" style={styles.iconBlur}>
                <Ionicons name="qr-code-outline" size={22} color="white" />
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Animated.View entering={FadeInUp.delay(200).duration(600)}>
          <BlurView intensity={25} tint="dark" style={styles.mainInsightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightTitle}>Live Overview</Text>
              <View style={styles.liveIndicator}>
                <View style={[styles.liveDot, { backgroundColor: isConnected ? colors.primary : '#ff3b30' }]} />
                <Text style={styles.liveText}>{isConnected ? 'Connected' : 'Offline'}</Text>
              </View>
            </View>

            <View style={styles.insightContent}>
              <OccupancyGauge value={stats.activeBookings} total={totalSlots} />

              <View style={styles.insightStats}>
                <View style={styles.insightStatItem}>
                  <Text style={styles.insightStatVal}>{stats.activeBookings}</Text>
                  <Text style={styles.insightStatLabel}>Booked</Text>
                </View>
                <View style={styles.insightStatDivider} />
                <View style={styles.insightStatItem}>
                  <Text style={styles.insightStatVal}>{Math.max(0, totalSlots - stats.activeBookings)}</Text>
                  <Text style={styles.insightStatLabel}>Available</Text>
                </View>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Global Financial Node Stats */}
        <View style={styles.quickStatsRow}>
          <Animated.View entering={FadeInDown.delay(300)} style={styles.statCol}>
            <BlurView intensity={20} tint="dark" style={styles.miniStatCard}>
              <Text style={styles.miniStatLabel}>Today's Revenue</Text>
              <Text style={styles.miniStatVal}>₹{stats.todayRevenue}</Text>
            </BlurView>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(400)} style={styles.statCol}>
            <BlurView intensity={20} tint="dark" style={styles.miniStatCard}>
              <Text style={styles.miniStatLabel}>Active Facilities</Text>
              <Text style={styles.miniStatVal}>{stats.activeFacilities}</Text>
            </BlurView>
          </Animated.View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management</Text>
          <View style={styles.actionGrid}>
            <ActionCard
              icon="add-outline"
              label="Add Facility"
              onPress={() => router.push('/(provider)/add-facility')}
            />
            <ActionCard
              icon="business-outline"
              label="Facilities"
              onPress={() => router.push('/(provider)/facilities')}
            />
            <ActionCard
              icon="wallet-outline"
              label="Earnings"
              onPress={() => router.push('/(provider)/earnings')}
            />
            <ActionCard
              icon="pie-chart-outline"
              label="Analytics"
              onPress={() => router.push('/(provider)/analytics')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {isConnected && (
              <View style={styles.liveBadge}>
                <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>

          {recentBookings.length > 0 ? (
            recentBookings.map((booking, index) => (
              <Animated.View key={booking.id} entering={FadeInDown.delay(index * 100 + 500)}>
                <BlurView intensity={15} tint="dark" style={styles.activityCard}>
                  <View style={styles.activityIcon}>
                    <Ionicons name="car-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityUser}>{booking.customer?.full_name || 'Guest User'}</Text>
                    <Text style={styles.activityMeta}>
                      {booking.facility?.name} • Slot {booking.slot?.slot_number}
                    </Text>
                  </View>
                  <View style={styles.activityEnd}>
                    <Text style={styles.activityPrice}>+₹{booking.total_fee || 0}</Text>
                    <Text style={styles.activityTime}>
                      {new Date(booking.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </BlurView>
              </Animated.View>
            ))
          ) : (
            <EmptyState
              icon="calendar-outline"
              title="No Recent Activity"
              subtitle="Bookings will appear here as they happen."
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

interface ActionCardProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}

function ActionCard({ icon, label, onPress }: ActionCardProps) {
  return (
    <TouchableOpacity style={styles.actionCardWrapper} onPress={onPress}>
      <BlurView intensity={20} tint="dark" style={styles.actionCard}>
        <View style={styles.actionIconContainer}>
          <Ionicons name={icon} size={24} color={colors.primary} />
        </View>
        <Text style={styles.actionLabel}>{label}</Text>
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080a0f',
  },
  bgWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#080a0f',
  },
  header: {
    backgroundColor: 'rgba(8, 10, 15, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileBox: {
    flexDirection: 'column',
  },
  greetingText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 22,
    color: 'white',
    fontWeight: '700',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  iconBlur: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  mainInsightCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginBottom: 20,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  insightContent: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  insightStats: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    marginTop: 20,
    gap: 40,
  },
  insightStatItem: {
    alignItems: 'center',
  },
  insightStatVal: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  insightStatLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 25,
  },
  statCol: {
    flex: 1,
  },
  miniStatCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  miniStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 6,
  },
  miniStatVal: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCardWrapper: {
    width: (width - 52) / 2,
    borderRadius: 20,
    overflow: 'hidden',
  },
  actionCard: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(28, 116, 233, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 10,
    overflow: 'hidden',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activityUser: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  activityMeta: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 2,
  },
  activityEnd: {
    alignItems: 'flex-end',
  },
  activityPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#34d399',
  },
  activityTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.3)',
    marginTop: 2,
  },
});
