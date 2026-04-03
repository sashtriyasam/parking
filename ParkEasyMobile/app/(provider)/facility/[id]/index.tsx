import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Switch,
  StatusBar,
  Platform,
  useWindowDimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn, 
  FadeInUp, 
  FadeInDown, 
  Layout,
} from 'react-native-reanimated';

import { get, post, put } from '../../../../services/api';
import { ParkingFacility, ParkingSlot, Booking, PricingRule } from '../../../../types';
import { useLiveSlots } from '../../../../hooks/useLiveSlots';
import { useSocket } from '../../../../hooks/useSocket';
import { useToast } from '../../../../components/Toast';
import { useThemeColors } from '../../../../hooks/useThemeColors';
import { useHaptics } from '../../../../hooks/useHaptics';
import { ProfessionalCard } from '../../../../components/ui/ProfessionalCard';
import { ProfessionalButton } from '../../../../components/ui/ProfessionalButton';

type TabType = 'overview' | 'slots' | 'bookings' | 'pricing';

export default function FacilityManagement() {
  const { width } = useWindowDimensions();
  const colors = useThemeColors();
  const haptics = useHaptics();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [facility, setFacility] = useState<ParkingFacility | null>(null);
  const [initialSlots, setInitialSlots] = useState<ParkingSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const { slots: liveSlots, isConnected, highlightedSlotId } = useLiveSlots(id || '', initialSlots);
  const { socket } = useSocket();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(`/provider/facilities/${id}`);
      if (res.data?.data) {
        setFacility(res.data.data.facility);
        setInitialSlots(res.data.data.slots || []);
        setBookings(res.data.data.activeBookings || []);
      }
    } catch (error) {
      console.error('Error fetching facility details:', error);
      showToast('Failed to load facility details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await get(`/provider/facilities/${id}/bookings`);
      if (res.data?.data) {
        setBookings(res.data.data.activeBookings || []);
      }
    } catch (e) {
      console.error('Error refreshing bookings', e);
    }
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;

    const onSlotUpdated = (payload: { slotId: string, status: string, facilityId: string }) => {
      if (payload.facilityId === id && payload.status === 'OCCUPIED') {
        fetchBookings();
      }
    };

    socket.on('slot_updated', onSlotUpdated);
    return () => {
      socket.off('slot_updated', onSlotUpdated);
    };
  }, [socket, id, fetchBookings]);

  const handleToggleStatus = async () => {
    if (!facility) return;
    haptics.impactMedium();
    try {
      const newStatus = !facility.is_active;
      await put(`/provider/facilities/${id}`, { is_active: newStatus });
      setFacility({ ...facility, is_active: newStatus });
    } catch (error) {
      haptics.notificationError();
      showToast('Failed to update status', 'error');
    }
  };

  const handleMarkExit = async (bookingId: string) => {
    haptics.impactMedium();
    Alert.alert(
      'Confirm Exit',
      'Are you sure you want to mark this vehicle as exited?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setActionLoading(true);
            try {
              await post(`/provider/bookings/${bookingId}/exit`);
              haptics.notificationSuccess();
              showToast('Exit processed successfully.', 'success');
              fetchData();
            } catch (error) {
              haptics.notificationError();
              showToast('Failed to process exit', 'error');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingHost, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!facility) return null;

  const renderOverview = () => (
    <ScrollView
      style={styles.tabScroll}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.tabContent}
    >
      <Animated.View entering={FadeInUp.delay(100)}>
        <ProfessionalCard style={styles.glassCard} hasVibrancy={true}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Status</Text>
            <View style={styles.statusToggle}>
              <Text style={[styles.statusLabel, { color: facility.is_active ? colors.success : colors.error }]}>
                {facility.is_active ? 'Online' : 'Offline'}
              </Text>
              <Switch
                value={facility.is_active}
                onValueChange={handleToggleStatus}
                trackColor={{ false: colors.border, true: colors.success + '40' }}
                thumbColor={facility.is_active ? colors.success : colors.textSecondary}
              />
            </View>
          </View>
          <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoKey, { color: colors.textMuted }]}>LOCATION</Text>
              <Text style={[styles.infoVal, { color: colors.textPrimary }]}>{facility.address}, {facility.city}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={[styles.infoKey, { color: colors.textMuted }]}>OPERATING HOURS</Text>
              <Text style={[styles.infoVal, { color: colors.textPrimary }]}>{facility.operating_hours}</Text>
            </View>
          </View>
        </ProfessionalCard>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(200)}>
        <ProfessionalCard style={styles.glassCard} hasVibrancy={true}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Description</Text>
          <Text style={[styles.descriptionTxt, { color: colors.textSecondary }]}>{facility.description || 'No description provided.'}</Text>
        </ProfessionalCard>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300)}>
        <ProfessionalButton 
          label="Edit Facility Settings" 
          onPress={() => {
            haptics.impactLight();
            router.push(`/(provider)/facility/${id}/edit`);
          }}
          variant="primary"
          style={styles.editBtn}
        />
      </Animated.View>
    </ScrollView>
  );

  const renderSlots = () => {
    const freeSlots = liveSlots.filter(s => s.status === 'free').length;
    return (
      <View style={styles.tabContent}>
        <Animated.View entering={FadeInDown.delay(100)}>
          <ProfessionalCard style={styles.slotOverview} hasVibrancy={true}>
            <View style={styles.slotStat}>
              <Text style={[styles.statVal, { color: colors.textPrimary }]}>{liveSlots.length}</Text>
              <Text style={[styles.statLbl, { color: colors.textMuted }]}>TOTAL</Text>
            </View>
            <View style={[styles.vLine, { backgroundColor: colors.border }]} />
            <View style={styles.slotStat}>
              <Text style={[styles.statVal, { color: colors.success }]}>{freeSlots}</Text>
              <Text style={[styles.statLbl, { color: colors.textMuted }]}>AVAIL</Text>
            </View>
            <View style={[styles.vLine, { backgroundColor: colors.border }]} />
            <View style={styles.slotStat}>
              <Text style={[styles.statVal, { color: colors.error }]}>{liveSlots.length - freeSlots}</Text>
              <Text style={[styles.statLbl, { color: colors.textMuted }]}>BUSY</Text>
            </View>
          </ProfessionalCard>
        </Animated.View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.slotsGridContainer}>
            {liveSlots.map((slot, index) => (
              <Animated.View key={slot.id} entering={FadeIn.delay(index * 10)}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.slotSquare,
                    {
                      width: (width - 70) / 4,
                      height: (width - 70) / 4,
                      backgroundColor: slot.status === 'free' ? colors.success + '10' : colors.error + '10',
                      borderColor: slot.status === 'free' ? colors.success + '20' : colors.error + '20'
                    },
                    slot.id === highlightedSlotId && { borderColor: colors.textPrimary, borderWidth: 2 }
                  ]}
                  onPress={() => {
                    haptics.impactLight();
                    Alert.alert('Slot ' + slot.slot_number, `Type: ${slot.vehicle_type}\nStatus: ${slot.status}`);
                  }}
                >
                  <Text style={[styles.slotNum, { color: slot.status === 'free' ? colors.success : colors.error }]}>
                    {slot.slot_number}
                  </Text>
                  <Ionicons
                    name={
                      slot.vehicle_type === 'car' || slot.vehicle_type === 'truck'
                        ? 'car'
                        : 'bicycle'
                    }
                    size={12}
                    color={slot.status === 'free' ? colors.success : colors.error}
                  />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderBookings = () => (
    <FlatList
      data={bookings}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      renderItem={({ item, index }) => (
        <Animated.View entering={FadeInUp.delay(index * 50)}>
          <ProfessionalCard style={styles.bookingItem} hasVibrancy={true}>
            <View style={styles.bookingTop}>
              <View>
                <Text style={[styles.vehicleNo, { color: colors.textPrimary }]}>{item.vehicle_number}</Text>
                <Text style={[styles.bookingSub, { color: colors.textMuted }]}>Slot {item.slot_id} • {item.vehicle_type.toUpperCase()}</Text>
              </View>
              <View style={[styles.liveTagDetail, { backgroundColor: colors.success + '15' }]}>
                <View style={[styles.liveDotSmall, { backgroundColor: colors.success }]} />
                <Text style={[styles.liveTxtDetail, { color: colors.success }]}>ACTIVE</Text>
              </View>
            </View>
            <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />
            <View style={styles.bookingBottom}>
              <View>
                <Text style={[styles.timeLbl, { color: colors.textMuted }]}>IN SINCE</Text>
                <Text style={[styles.timeVal, { color: colors.textPrimary }]}>{new Date(item.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.actionBtnSmall, { backgroundColor: colors.error }]}
                onPress={() => handleMarkExit(item.id)}
                disabled={actionLoading}
              >
                <Text style={styles.actionBtnTextSmall}>Mark Exit</Text>
              </TouchableOpacity>
            </View>
          </ProfessionalCard>
        </Animated.View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyHost}>
          <Ionicons name="document-text-outline" size={48} color={colors.textMuted} style={{ opacity: 0.2 }} />
          <Text style={[styles.emptyTxt, { color: colors.textMuted }]}>NO ACTIVE BOOKINGS</Text>
        </View>
      }
    />
  );

  const renderPricing = () => (
    <ScrollView style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
      <Animated.View entering={FadeInUp.delay(100)}>
        <ProfessionalCard style={styles.priceCard} hasVibrancy={true}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHead, { color: colors.textMuted }]}>VEHICLE</Text>
            <Text style={[styles.tableHead, { color: colors.textMuted }]}>HOURLY</Text>
            <Text style={[styles.tableHead, { color: colors.textMuted }]}>DAILY MAX</Text>
          </View>
          <View style={[styles.cardDivider, { backgroundColor: colors.border, marginVertical: 12 }]} />
          {(facility.pricing_rules || []).map((rate: PricingRule) => (
            <View key={rate.id || rate.vehicle_type} style={styles.tableRow}>
              <Text style={[styles.tableKey, { color: colors.textPrimary }]}>{rate.vehicle_type.toUpperCase()}</Text>
              <Text style={[styles.tableVal, { color: colors.textPrimary }]}>₹{rate.hourly_rate}</Text>
              <Text style={[styles.tableVal, { color: colors.textPrimary }]}>₹{rate.daily_max || '--'}</Text>
            </View>
          ))}
        </ProfessionalCard>
        <Text style={[styles.helperTxt, { color: colors.textMuted }]}>Rates can be adjusted in facility settings.</Text>
      </Animated.View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      
      <Animated.View entering={FadeInDown.duration(600)} style={styles.topHeader}>
        <BlurView intensity={20} tint={colors.isDark ? 'dark' : 'light'} style={styles.headerContent}>
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => {
              haptics.impactLight();
              router.back();
            }}>
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            
            <View style={styles.titleInfo}>
              <Text style={[styles.navSubtitle, { color: colors.textMuted }]}>FACILITY MANAGEMENT</Text>
              <Text style={[styles.navTitle, { color: colors.textPrimary }]} numberOfLines={1}>{facility.name}</Text>
            </View>

            <View style={[styles.liveBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.liveDot, { backgroundColor: isConnected ? colors.success : colors.warning }]} />
              <Text style={[styles.liveText, { color: isConnected ? colors.success : colors.warning }]}>{isConnected ? 'LIVE' : 'SYNC'}</Text>
            </View>
          </View>

          <View style={styles.tabsWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
              {(['overview', 'slots', 'bookings', 'pricing'] as TabType[]).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabBtn, activeTab === tab && { backgroundColor: colors.primary }]}
                  onPress={() => {
                    haptics.impactLight();
                    setActiveTab(tab);
                  }}
                >
                  <Text style={[styles.tabBtnText, { color: activeTab === tab ? '#FFF' : colors.textMuted }]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </BlurView>
      </Animated.View>

      <View style={styles.mainContent}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'slots' && renderSlots()}
        {activeTab === 'bookings' && renderBookings()}
        {activeTab === 'pricing' && renderPricing()}
      </View>

      <Animated.View entering={FadeInUp.delay(500)} style={styles.fabWrapper}>
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => {
            haptics.impactMedium();
            router.push(`/(provider)/(tabs)/scan?facilityId=${id}`);
          }}
        >
          <LinearGradient
            colors={[colors.primary, colors.primary + 'CC']}
            style={styles.fabScan}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="qr-code" size={22} color="white" />
            <Text style={styles.fabText}>Verify Entry/Exit</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingHost: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topHeader: { zIndex: 100 },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleInfo: { flex: 1, marginLeft: 12 },
  navTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  navSubtitle: { fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 2 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  tabsWrapper: { paddingBottom: 16 },
  tabsScroll: { paddingHorizontal: 20, gap: 10 },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  tabBtnText: { fontSize: 13, fontWeight: '800' },
  mainContent: { flex: 1 },
  tabScroll: { flex: 1 },
  tabContent: { padding: 24, paddingBottom: 150 },
  glassCard: { borderRadius: 32, marginBottom: 24, borderWidth: 0 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  statusToggle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusLabel: { fontSize: 14, fontWeight: '800' },
  cardDivider: { height: 1, marginVertical: 20, opacity: 0.2 },
  infoGrid: { gap: 20 },
  infoItem: {},
  infoKey: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 6, opacity: 0.6 },
  infoVal: { fontSize: 15, fontWeight: '700', lineHeight: 22 },
  descriptionTxt: { fontSize: 14, lineHeight: 22, fontWeight: '600', marginTop: 12 },
  editBtn: { width: '100%', marginTop: 8 },
  slotOverview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderRadius: 28, marginBottom: 24, borderWidth: 0 },
  slotStat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '900' },
  statLbl: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 6, opacity: 0.6 },
  vLine: { width: 1, height: 32, opacity: 0.3 },
  slotsGridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 120 },
  slotSquare: { borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  slotNum: { fontSize: 15, fontWeight: '900', marginBottom: 2 },
  listContainer: { padding: 24, paddingBottom: 150 },
  bookingItem: { borderRadius: 28, padding: 22, marginBottom: 16, borderWidth: 0 },
  bookingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  vehicleNo: { fontSize: 19, fontWeight: '900', letterSpacing: 0.5 },
  bookingSub: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  liveTagDetail: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  liveDotSmall: { width: 6, height: 6, borderRadius: 3 },
  liveTxtDetail: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  bookingBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeLbl: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 4, opacity: 0.6 },
  timeVal: { fontSize: 15, fontWeight: '800' },
  actionBtnSmall: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  actionBtnTextSmall: { color: 'white', fontSize: 13, fontWeight: '900' },
  emptyHost: { padding: 80, alignItems: 'center' },
  emptyTxt: { marginTop: 20, fontSize: 14, fontWeight: '800', letterSpacing: 1, opacity: 0.5 },
  priceCard: { borderRadius: 32, padding: 24, borderWidth: 0 },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 4 },
  tableHead: { flex: 1, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, opacity: 0.6 },
  tableRow: { flexDirection: 'row', paddingVertical: 18, paddingHorizontal: 4 },
  tableKey: { flex: 1, fontSize: 15, fontWeight: '800' },
  tableVal: { flex: 1, fontSize: 15, fontWeight: '700' },
  helperTxt: { fontSize: 12, fontWeight: '600', marginTop: 20, paddingHorizontal: 8, opacity: 0.6, fontStyle: 'italic', lineHeight: 18 },
  fabWrapper: { position: 'absolute', bottom: 40, left: 24, right: 24 },
  fabScan: { flexDirection: 'row', paddingVertical: 18, borderRadius: 22, justifyContent: 'center', alignItems: 'center', gap: 12, elevation: 12 },
  fabText: { color: 'white', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
});
