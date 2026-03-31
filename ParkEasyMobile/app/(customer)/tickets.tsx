import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, Platform, Dimensions, StatusBar, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  FadeIn,
  SlideInUp,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  withDelay
} from 'react-native-reanimated';
import { get } from '../../services/api';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/SkeletonLoader';
import { colors } from '../../constants/colors';
import { Booking } from '../../types';
import { EmptyState } from '../../components/EmptyState';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

const ParkingTimer = ({ entryTime }: { entryTime: string }) => {
  const [elapsed, setElapsed] = useState('');
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );

    const updateTimer = () => {
      const start = new Date(entryTime).getTime();
      const now = new Date().getTime();
      const diff = now - start;
      if (diff < 0) return setElapsed('00:00:00');

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setElapsed(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [entryTime]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={styles.timerContainer}>
      <Ionicons name="time-outline" size={16} color={colors.premium.primary} />
      <Animated.Text style={[styles.timerText, animatedStyle]}>{elapsed}</Animated.Text>
    </View>
  );
};

export default function TicketsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [tickets, setTickets] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Booking | null>(null);

  const fetchTickets = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await get('/customer/tickets');
      setTickets(res.data.data || []);
    } catch (e) {
      console.error('Error fetching tickets', e);
    } finally {
      if (showLoading) setLoading(false);
      else setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const poll = setInterval(() => fetchTickets(false), 30000);
    return () => clearInterval(poll);
  }, []);

  const activeTickets = tickets.filter(t => t.status?.toUpperCase() === 'ACTIVE');
  const historyTickets = tickets.filter(t => t.status?.toUpperCase() !== 'ACTIVE');

  const displayTickets = activeTab === 'ACTIVE' ? activeTickets : historyTickets;

  const renderTicket = ({ item, index }: { item: Booking, index: number }) => {
    const isActive = item.status?.toUpperCase() === 'ACTIVE';
    const facilityName = item.slot?.floor?.facility?.name || item.facility?.name || `Facility #${item.facility_id}`;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).duration(800).springify().damping(12)}
        layout={Layout.springify()}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            if (isActive) {
              setSelectedTicket(item);
              setQrModalVisible(true);
            }
          }}
        >
          <BlurView
            intensity={isActive ? 40 : 20}
            tint="dark"
            style={[
              styles.card,
              isActive && { borderColor: colors.premium.primary + '30', borderWidth: 2 }
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.facilityInfo}>
                <Text style={styles.facilityName} numberOfLines={1}>{facilityName}</Text>
                <View style={styles.idWrapper}>
                  <Text style={styles.ticketId}>NODE ID: {(item.id || '').substring(0, 10).toUpperCase()}</Text>
                </View>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: isActive ? colors.premium.primary + '20' : 'rgba(255,255,255,0.05)' }
              ]}>
                <View style={[styles.statusDot, { backgroundColor: isActive ? colors.premium.tertiary : colors.textMuted }]} />
                <Text style={[
                  styles.statusText,
                  { color: isActive ? 'white' : 'rgba(255,255,255,0.4)' }
                ]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.detailsGrid}>
              <View style={styles.detailBox}>
                <Text style={styles.label}>VEHICLE</Text>
                <Text style={styles.value}>{item.vehicle_number}</Text>
              </View>
              <View style={styles.detailBox}>
                <Text style={styles.label}>SECTOR</Text>
                <Text style={styles.value}>{item.slot?.slot_number || item.slot_id}</Text>
              </View>
              <View style={styles.detailBox}>
                <Text style={styles.label}>CREDITS</Text>
                <Text style={[styles.value, { color: colors.premium.tertiary }]}>₹{item.total_fee || item.base_fee || 0}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardFooter}>
              {isActive ? (
                <View style={styles.activeFooter}>
                  <ParkingTimer entryTime={item.entry_time} />
                  <View style={styles.quickAccess}>
                    <Text style={styles.accessText}>TAP TO ACCESS</Text>
                    <Ionicons name="finger-print" size={16} color={colors.premium.primary} />
                  </View>
                </View>
              ) : (
                <View style={styles.archiveFooter}>
                  <View style={styles.timeInfo}>
                    <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.archiveTime}>{new Date(item.entry_time).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                  </View>
                  <Text style={styles.archiveDetail}>ARCHIVED</Text>
                </View>
              )}
            </View>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Immersive Background */}
      <View style={styles.bgWrapper}>
        <LinearGradient
          colors={['#080a0f', '#020617']}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.glowPoint, { top: '30%', right: '-20%', backgroundColor: colors.premium.primary, opacity: 0.1 }]} />
        <View style={[styles.glowPoint, { bottom: '10%', left: '-20%', backgroundColor: colors.premium.secondary, opacity: 0.05 }]} />
      </View>

      <Animated.View entering={SlideInUp.duration(600)} style={styles.header}>
        <BlurView intensity={30} tint="dark" style={styles.headerContent}>
          <Text style={styles.headerTitle}>SECURE TICKETS</Text>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setActiveTab('ACTIVE')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'ACTIVE' && styles.activeTabText]}>ACTIVE</Text>
              {activeTab === 'ACTIVE' && (
                <Animated.View layout={Layout.springify()} style={styles.activeTabUnderline} />
              )}
              {activeTickets.length > 0 && (
                <View style={[styles.countBadge, { backgroundColor: colors.premium.primary }]}>
                  <Text style={styles.countText}>{activeTickets.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setActiveTab('HISTORY')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'HISTORY' && styles.activeTabText]}>HISTORY</Text>
              {activeTab === 'HISTORY' && (
                <Animated.View layout={Layout.springify()} style={styles.activeTabUnderline} />
              )}
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>

      {loading ? (
        <View style={styles.listContent}>
          {[1, 2, 3].map(i => <Skeleton key={i} width="100%" height={180} borderRadius={30} style={{ marginBottom: 20 }} />)}
        </View>
      ) : (
        <FlatList
          data={displayTickets}
          keyExtractor={item => item.id}
          renderItem={renderTicket}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => fetchTickets(false)}
          ListEmptyComponent={
            <Animated.View entering={FadeIn.delay(400)}>
              <EmptyState
                icon="ticket-outline"
                title={`ZERO ${activeTab} NODES`}
                subtitle={activeTab === 'ACTIVE' ? "Your terminal is clear. No active bookings found." : "Archive void. No history detected."}
                actionLabel={activeTab === 'ACTIVE' ? "INITIALIZE SCAN" : undefined}
                onAction={activeTab === 'ACTIVE' ? () => router.push('/(customer)/search') : undefined}
              />
            </Animated.View>
          }
        />
      )}

      <Modal
        visible={qrModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <BlurView intensity={60} tint="dark" style={styles.modalOverlay}>
          <Animated.View
            entering={FadeInUp.springify().damping(15)}
            style={styles.modalContent}
          >
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setQrModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <View style={styles.accessIconWrapper}>
                <Ionicons name="key-outline" size={32} color={colors.premium.primary} />
              </View>
              <Text style={styles.modalTitle}>SYSTEM ACCESS</Text>
              <Text style={styles.modalSub}>Position QR toward terminal sensor for authentication</Text>
            </View>

            <View style={styles.qrContainer}>
              <View style={styles.qrCornerLT} />
              <View style={styles.qrCornerRT} />
              <View style={styles.qrCornerLB} />
              <View style={styles.qrCornerRB} />
              <BlurView intensity={20} style={styles.qrWrapper}>
                {selectedTicket?.qr_code || selectedTicket?.id ? (
                  <QRCode
                    value={selectedTicket?.qr_code || selectedTicket?.id || ''}
                    size={220}
                    color="white"
                    backgroundColor="transparent"
                  />
                ) : (
                  <ActivityIndicator color={colors.premium.primary} />
                )}
              </BlurView>
            </View>

            <View style={styles.modalFooter}>
              <Text style={styles.modalTicketId}>
                SECURE ID: #{(selectedTicket?.id || '').substring(0, 12).toUpperCase()}
              </Text>
              <Text style={styles.modalFacility}>{selectedTicket?.facility?.name?.toUpperCase() || 'AUTHORIZED HUB'}</Text>
            </View>
          </Animated.View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080a0f',
  },
  bgWrapper: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glowPoint: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  header: {
    zIndex: 100,
  },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 5,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.6,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 30,
    gap: 30,
  },
  tab: {
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1,
  },
  activeTabText: {
    color: 'white',
  },
  activeTabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.premium.primary,
    borderRadius: 2,
  },
  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '900',
  },
  listContent: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 120,
  },
  card: {
    padding: 24,
    marginBottom: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  facilityInfo: {
    flex: 1,
    marginRight: 12,
  },
  facilityName: {
    fontSize: 18,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  idWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketId: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '800',
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  detailBox: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  value: {
    fontSize: 14,
    fontWeight: '800',
    color: 'white',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeFooter: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.premium.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  quickAccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  accessText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.premium.primary,
    letterSpacing: 1,
  },
  archiveFooter: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    opacity: 0.6,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  archiveTime: {
    fontSize: 12,
    color: 'white',
    fontWeight: '700',
  },
  archiveDetail: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    padding: 32,
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 0,
    right: 32,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  accessIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 30,
    backgroundColor: colors.premium.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.premium.primary + '20',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 6,
    marginBottom: 12,
  },
  modalSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  qrContainer: {
    width: 280,
    height: 280,
    padding: 20,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrWrapper: {
    width: 240,
    height: 240,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  qrCornerLT: { position: 'absolute', top: 0, left: 0, width: 30, height: 30, borderTopWidth: 2, borderLeftWidth: 2, borderColor: colors.premium.primary },
  qrCornerRT: { position: 'absolute', top: 0, right: 0, width: 30, height: 30, borderTopWidth: 2, borderRightWidth: 2, borderColor: colors.premium.primary },
  qrCornerLB: { position: 'absolute', bottom: 0, left: 0, width: 30, height: 30, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: colors.premium.primary },
  qrCornerRB: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderBottomWidth: 2, borderRightWidth: 2, borderColor: colors.premium.primary },
  modalFooter: {
    marginTop: 40,
    alignItems: 'center',
  },
  modalTicketId: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    marginBottom: 8,
  },
  modalFacility: {
    fontSize: 18,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -0.5,
  },
});

