import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Platform, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { get } from '../../../services/api';
import { ProfessionalCard } from '../../../components/ui/ProfessionalCard';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useHaptics } from '../../../hooks/useHaptics';
import { EmptyState } from '../../../components/EmptyState';
import { Skeleton } from '../../../components/ui/SkeletonLoader';

export default function ProviderBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colors = useThemeColors();
  const haptics = useHaptics();

  const fetchBookings = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await get('/provider/bookings');
      if (res.data?.data) {
        setBookings(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching provider bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    haptics.impactLight();
    fetchBookings(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return colors.success;
      case 'COMPLETED': return colors.primary;
      case 'CANCELLED': return colors.error;
      default: return colors.textMuted;
    }
  };

  const renderBooking = ({ item, index }: { item: any; index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 50).duration(600)}
      layout={Layout.springify()}
    >
      <ProfessionalCard 
        style={styles.bookingCard} 
        hasVibrancy={true}
      >
        <View style={styles.cardHeader}>
          <View style={styles.idGroup}>
            <Text style={[styles.idLabel, { color: colors.textMuted }]}>BOOKING ID</Text>
            <Text style={[styles.bookingId, { color: colors.textPrimary }]}>#{item?.id ? item.id.substring(0, 8).toUpperCase() : 'UNKNOWN'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <View style={[styles.iconBox, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                <Ionicons name="car" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>VEHICLE</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{item.vehicle_number || 'N/A'}</Text>
              </View>
            </View>
            <View style={styles.infoBox}>
              <View style={[styles.iconBox, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                <Ionicons name="location" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>SLOT</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{item.slot?.slot_number || 'TBD'}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.timeRow}>
            <View style={styles.timeColumn}>
              <Text style={[styles.timeLabel, { color: colors.textMuted }]}>ENTRY</Text>
              <Text style={[styles.timeValue, { color: colors.textPrimary }]}>
                {item.entry_time ? new Date(item.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </Text>
            </View>
            <View style={styles.timeColumn}>
              <Text style={[styles.timeLabel, { color: colors.textMuted }]}>DATE</Text>
              <Text style={[styles.timeValue, { color: colors.textPrimary }]}>
                {item.entry_time ? new Date(item.entry_time).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '-- --'}
              </Text>
            </View>
            <View style={styles.timeColumn}>
              <Text style={[styles.timeLabel, { color: colors.textMuted }]}>FEE</Text>
              <Text style={[styles.timeValue, { color: colors.success }]}>₹{item.total_fee || item.base_fee || 0}</Text>
            </View>
          </View>
        </View>
      </ProfessionalCard>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
         <BlurView intensity={20} tint={colors.isDark ? 'dark' : 'light'} style={styles.headerContent}>
            <Text style={[styles.headerLabel, { color: colors.textMuted }]}>HISTORY & LOGS</Text>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
         </BlurView>
      </View>

      {loading ? (
        <View style={styles.listContent}>
          {[1,2,3,4].map(i => (
            <Skeleton key={i} width="100%" height={180} borderRadius={28} style={{ marginBottom: 16 }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBooking}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="journal-outline"
              title="No Activity"
              subtitle="All parking bookings and check-ins will be listed here."
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    zIndex: 100,
  },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  listContent: {
    padding: 24,
    paddingTop: 30,
    paddingBottom: 100,
  },
  bookingCard: {
    marginBottom: 16,
    borderRadius: 28,
    borderWidth: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  idGroup: {
    gap: 2,
  },
  idLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  bookingId: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardBody: {
    gap: 24,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    opacity: 0.3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeColumn: {
    gap: 4,
  },
  timeLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  timeValue: {
    fontSize: 15,
    fontWeight: '800',
  },
});
