import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { get } from '../../../services/api';
import { Card } from '../../../components/ui/Card';
import { colors } from '../../../constants/colors';
import { EmptyState } from '../../../components/EmptyState';
import { useAuthStore } from '../../../store/authStore';
import { useRouter } from 'expo-router';
import { useSocket } from '../../../hooks/useSocket';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';

const OccupancyGauge = ({ value, total }: { value: number, total: number }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const radius = 80;
  const strokeWidth = 15;
  const center = 100;
  const circumference = 2 * Math.PI * radius;
  const halfCircumference = circumference / 2;
  const strokeDashoffset = halfCircumference - (percentage / 100) * halfCircumference;

  return (
    <View style={gaugeStyles.container}>
      <Svg width="200" height="120" viewBox="0 0 200 120">
        <G rotation="-180" origin="100, 100">
          {/* Background Arc */}
          <Path
            d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
            stroke={colors.border}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          {/* Progress Arc */}
          <Path
            d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
            stroke={percentage > 85 ? colors.danger : percentage > 60 ? colors.warning : colors.success}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${halfCircumference} ${halfCircumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
        <SvgText
          x="100"
          y="90"
          textAnchor="middle"
          fontSize="24"
          fontWeight="bold"
          fill={colors.textPrimary}
        >
          {Math.round(percentage)}%
        </SvgText>
        <SvgText
          x="100"
          y="110"
          textAnchor="middle"
          fontSize="12"
          fill={colors.textSecondary}
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
    marginVertical: 10,
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
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

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
        setLastUpdate(new Date());
      } else {
        // Handle empty but successful response
        setStats({
          activeFacilities: facilitiesRes.data?.data?.length || 0,
          activeBookings: 0,
          todayRevenue: 0,
          totalRevenue: 0,
        });
        setLastUpdate(new Date());
      }
      
      if (facilitiesRes.data?.data) {
        setFacilities(facilitiesRes.data.data);
      }

      // Fetch recent bookings separately if needed or if it comes from dashboard
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

  // Real-time updates handler (Phase 6B)
  const { socket, isConnected, joinFacility } = useSocket();

  useEffect(() => {
    if (!socket || facilities.length === 0) return;

    // Join all facility rooms
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
      setLastUpdate(new Date());
    };

    socket.on('slot_updated', handleSlotUpdate);

    return () => {
      socket.off('slot_updated', handleSlotUpdate);
    };
  }, [socket, facilities, joinFacility]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
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

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'Partner'}</Text>
            <Text style={styles.title}>Operation Center</Text>
          </View>
          <View style={[styles.connectionBadge, { backgroundColor: isConnected ? colors.success + '20' : colors.textMuted + '20' }]}>
            <View style={[styles.connectionDot, { backgroundColor: isConnected ? colors.success : colors.textMuted }]} />
            <Text style={[styles.connectionText, { color: isConnected ? colors.success : colors.textMuted }]}>
              {isConnected ? 'Live' : 'Offline'}
            </Text>
          </View>
        </View>
        {lastUpdate && (
          <Text style={styles.lastUpdate}>
            Last updated: {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Text>
        )}
      </View>
      
      <View style={styles.gaugeSection}>
        <Card style={styles.gaugeCard}>
          <OccupancyGauge 
            value={stats.activeBookings} 
            total={facilities.reduce((acc, f) => acc + (f.total_slots || 0), 0) || 100} 
          />
          <View style={styles.gaugeStats}>
            <View style={styles.gaugeStatItem}>
              <Text style={styles.gaugeStatValue}>{stats.activeBookings}</Text>
              <Text style={styles.gaugeStatLabel}>Occupied</Text>
            </View>
            <View style={styles.gaugeStatDivider} />
            <View style={styles.gaugeStatItem}>
              <Text style={styles.gaugeStatValue}>
                {Math.max(0, (facilities.reduce((acc, f) => acc + (f.total_slots || 0), 0) || 100) - stats.activeBookings)}
              </Text>
              <Text style={styles.gaugeStatLabel}>Available</Text>
            </View>
          </View>
        </Card>
      </View>

      <View style={styles.statsGrid}>
        <Card style={[styles.statCard, styles.glassCard]}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="business" size={24} color={colors.primary} />
          </View>
          <Text style={styles.statValue}>{stats.activeFacilities}</Text>
          <Text style={styles.statLabel}>Facilities</Text>
        </Card>

        <Card style={[styles.statCard, styles.glassCard]}>
          <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="cash" size={24} color={colors.success} />
          </View>
          <Text style={styles.statValue}>₹{stats.todayRevenue}</Text>
          <Text style={styles.statLabel}>Today's Revenue</Text>
        </Card>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      </View>
      <View style={styles.actionsGrid}>
        <TouchableOpacity 
          style={styles.actionItem} 
          onPress={() => router.push('/(provider)/add-facility')}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={24} color={colors.surface} />
          </View>
          <Text style={styles.actionLabel}>Add Facility</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem} 
          onPress={() => router.push('/(provider)/facilities')}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.info }]}>
            <Ionicons name="list" size={24} color={colors.surface} />
          </View>
          <Text style={styles.actionLabel}>View All</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem} 
          onPress={() => router.push('/(provider)/earnings')}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.success }]}>
            <Ionicons name="wallet-outline" size={24} color={colors.surface} />
          </View>
          <Text style={styles.actionLabel}>Earnings</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem} 
          onPress={() => router.push('/(provider)/bookings')}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.warning }]}>
            <Ionicons name="calendar" size={24} color={colors.surface} />
          </View>
          <Text style={styles.actionLabel}>Bookings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
      </View>
      <View style={styles.recentList}>
        {recentBookings.length > 0 ? (
          recentBookings.map((booking) => (
            <Card key={booking.id} style={styles.recentCard}>
              <View style={styles.bookingInfo}>
                <View>
                  <Text style={styles.customerName}>{booking.customer?.full_name || 'Guest User'}</Text>
                  <Text style={styles.facilityName}>{booking.facility?.name} • {booking.slot?.slot_number || booking.slot_id?.substring(0,8)}</Text>
                  <Text style={styles.bookingTime}>
                    {new Date(booking.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.amountContainer}>
                  <Text style={styles.amountText}>₹{booking.total_fee || booking.base_fee || 0}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: booking.status === 'ACTIVE' ? colors.success + '20' : colors.textMuted + '20' }]}>
                    <Text style={[styles.statusText, { color: booking.status === 'ACTIVE' ? colors.success : colors.textSecondary }]}>
                      {booking.status}
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          ))
        ) : (
          <EmptyState
            icon="calendar-outline"
            title="No recent activity"
            subtitle="Your facility's bookings and entries will appear here."
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    padding: 24,
    paddingTop: 48,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  lastUpdate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  greeting: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  actionItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '40%',
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  gaugeSection: {
    paddingHorizontal: 16,
    marginTop: -20,
  },
  gaugeCard: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.surface,
    ...colors.shadows.md,
  },
  gaugeStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
    gap: 24,
  },
  gaugeStatItem: {
    alignItems: 'center',
  },
  gaugeStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  gaugeStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  gaugeStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  glassCard: {
    backgroundColor: colors.glassSurface,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    ...colors.shadows.sm,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  recentList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  recentCard: {
    padding: 16,
    marginBottom: 8,
  },
  bookingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  facilityName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bookingTime: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
  },
  emptyActivity: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    color: colors.textMuted,
    fontSize: 14,
  },
});
