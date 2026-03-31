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
  Dimensions,
  StatusBar,
  Platform,
  useWindowDimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { get, post, put } from '../../../../services/api';
import { colors } from '../../../../constants/colors';
import { ParkingFacility, ParkingSlot, Booking, PricingRule } from '../../../../types';
import { useLiveSlots } from '../../../../hooks/useLiveSlots';
import { useSocket } from '../../../../hooks/useSocket';
import { useToast } from '../../../../components/Toast';



type TabType = 'overview' | 'slots' | 'bookings' | 'pricing';

export default function FacilityManagement() {
  const { width } = useWindowDimensions();
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
      Alert.alert('Error', 'Failed to load facility details');
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
    try {
      const newStatus = !facility.is_active;
      await put(`/provider/facilities/${id}`, { is_active: newStatus });
      setFacility({ ...facility, is_active: newStatus });
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleMarkExit = async (bookingId: string) => {
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
              showToast('Exit processed successfully.', 'success');
              fetchData();
            } catch (error) {
              Alert.alert('Error', 'Failed to process exit');
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
      <View style={styles.loadingHost}>
        <ActivityIndicator size="small" color="white" />
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
      <BlurView intensity={20} tint="dark" style={styles.glassCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Status</Text>
          <View style={styles.statusToggle}>
            <Text style={[styles.statusLabel, { color: facility.is_active ? '#34d399' : '#ff4b4b' }]}>
              {facility.is_active ? 'Online' : 'Offline'}
            </Text>
            <Switch
              value={facility.is_active}
              onValueChange={handleToggleStatus}
              trackColor={{ false: '#333', true: 'rgba(52, 211, 153, 0.3)' }}
              thumbColor={facility.is_active ? '#34d399' : '#999'}
            />
          </View>
        </View>
        <View style={styles.cardDivider} />
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoKey}>Location</Text>
            <Text style={styles.infoVal}>{facility.address}, {facility.city}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoKey}>Hours</Text>
            <Text style={styles.infoVal}>{facility.operating_hours}</Text>
          </View>
        </View>
      </BlurView>

      <BlurView intensity={15} tint="dark" style={styles.glassCard}>
        <Text style={styles.cardTitle}>Description</Text>
        <Text style={styles.descriptionTxt}>{facility.description || 'No description provided.'}</Text>
      </BlurView>

      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => router.push(`/(provider)/facility/${id}/edit`)}
      >
        <Ionicons name="create-outline" size={20} color="#080a0f" />
        <Text style={styles.editBtnText}>Edit Facility Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderSlots = () => {
    const freeSlots = liveSlots.filter(s => s.status === 'free').length;
    return (
      <View style={styles.tabContent}>
        <View style={styles.slotOverview}>
          <View style={styles.slotStat}>
            <Text style={styles.statVal}>{liveSlots.length}</Text>
            <Text style={styles.statLbl}>Total</Text>
          </View>
          <View style={styles.vLine} />
          <View style={styles.slotStat}>
            <Text style={[styles.statVal, { color: '#34d399' }]}>{freeSlots}</Text>
            <Text style={styles.statLbl}>Available</Text>
          </View>
          <View style={styles.vLine} />
          <View style={styles.slotStat}>
            <Text style={[styles.statVal, { color: '#ff4b4b' }]}>{liveSlots.length - freeSlots}</Text>
            <Text style={styles.statLbl}>Occupied</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.slotsGridContainer}>
            {liveSlots.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={[
                  styles.slotSquare,
                  {
                    width: (width - 70) / 4,
                    height: (width - 70) / 4,
                    backgroundColor: slot.status === 'free' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(255, 75, 75, 0.1)'
                  },
                  slot.id === highlightedSlotId && { borderColor: '#fff', borderWidth: 2 }
                ]}
                onPress={() => Alert.alert('Slot ' + slot.slot_number, `Type: ${slot.vehicle_type}\nStatus: ${slot.status}`)}
              >
                <Text style={[styles.slotNum, { color: slot.status === 'free' ? '#34d399' : '#ff4b4b' }]}>
                  {slot.slot_number}
                </Text>
                <Ionicons
                  name={
                    slot.vehicle_type === 'car' || slot.vehicle_type === 'truck'
                      ? 'car'
                      : 'bicycle'
                  }
                  size={12}
                  color={slot.status === 'free' ? '#34d399' : '#ff4b4b'}
                />
              </TouchableOpacity>
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
      renderItem={({ item }) => (
        <BlurView intensity={15} tint="dark" style={styles.bookingItem}>
          <View style={styles.bookingTop}>
            <View>
              <Text style={styles.vehicleNo}>{item.vehicle_number}</Text>
              <Text style={styles.bookingSub}>Slot {item.slot_id} • {item.vehicle_type.toUpperCase()}</Text>
            </View>
            <View style={styles.liveTagDetail}>
              <View style={styles.liveDotSmall} />
              <Text style={styles.liveTxtDetail}>Active</Text>
            </View>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.bookingBottom}>
            <View>
              <Text style={styles.timeLbl}>In Since</Text>
              <Text style={styles.timeVal}>{new Date(item.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <TouchableOpacity
              style={styles.actionBtnSmall}
              onPress={() => handleMarkExit(item.id)}
              disabled={actionLoading}
            >
              <Text style={styles.actionBtnTextSmall}>Mark Exit</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      )}
      ListEmptyComponent={
        <View style={styles.emptyHost}>
          <Ionicons name="document-text-outline" size={48} color="rgba(255,255,255,0.1)" />
          <Text style={styles.emptyTxt}>No active sessions</Text>
        </View>
      }
    />
  );

  const renderPricing = () => (
    <ScrollView style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
      <BlurView intensity={15} tint="dark" style={styles.priceCard}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHead}>Vehicle</Text>
          <Text style={styles.tableHead}>Hourly</Text>
          <Text style={styles.tableHead}>Daily</Text>
        </View>
        <View style={styles.cardDivider} />
        {(facility.pricing_rules || []).map((rate: PricingRule) => (
          <View key={rate.id || rate.vehicle_type} style={styles.tableRow}>
            <Text style={styles.tableKey}>{rate.vehicle_type.toUpperCase()}</Text>
            <Text style={styles.tableVal}>₹{rate.hourly_rate}</Text>
            <Text style={styles.tableVal}>₹{rate.daily_max || '--'}</Text>
          </View>
        ))}
      </BlurView>
      <Text style={styles.helperTxt}>Rates can be adjusted in settings.</Text>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0f1219', '#080a0f']} style={StyleSheet.absoluteFill} />

      <View style={styles.topHeader}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <BlurView intensity={20} tint="dark" style={styles.iconBox}>
              <Ionicons name="chevron-back" size={24} color="white" />
            </BlurView>
          </TouchableOpacity>
          <View style={styles.titleInfo}>
            <Text style={styles.navSubtitle}>Facility Control</Text>
            <Text style={styles.navTitle} numberOfLines={1}>{facility.name}</Text>
          </View>
          <View style={[styles.liveBadge, { backgroundColor: isConnected ? 'rgba(52, 211, 153, 0.1)' : 'rgba(255,255,255,0.05)' }]}>
            <View style={[styles.liveDot, { backgroundColor: isConnected ? '#34d399' : '#999' }]} />
            <Text style={[styles.liveText, { color: isConnected ? '#34d399' : '#999' }]}>{isConnected ? 'Live' : 'Syncing'}</Text>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          {(['overview', 'slots', 'bookings', 'pricing'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {activeTab === tab && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.mainContent}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'slots' && renderSlots()}
        {activeTab === 'bookings' && renderBookings()}
        {activeTab === 'pricing' && renderPricing()}
      </View>

      <TouchableOpacity
        style={styles.fabScan}
        onPress={() => router.push(`/(provider)/(tabs)/scan?facilityId=${id}`)}
      >
        <Ionicons name="qr-code" size={24} color="#080a0f" />
        <Text style={styles.fabText}>Scan & Exit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080a0f',
  },
  loadingHost: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#080a0f',
  },
  topHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: 'rgba(8, 10, 15, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  iconBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleInfo: {
    flex: 1,
    marginLeft: 15,
  },
  navTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  navSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabBtnActive: {

  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  tabBtnTextActive: {
    color: 'white',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 3,
    backgroundColor: 'white',
    borderRadius: 3,
  },
  mainContent: {
    flex: 1,
  },
  tabScroll: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
    paddingBottom: 100,
  },
  glassCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 15,
  },
  infoGrid: {
    gap: 15,
  },
  infoItem: {

  },
  infoKey: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 4,
  },
  infoVal: {
    fontSize: 15,
    fontWeight: '500',
    color: 'white',
    lineHeight: 22,
  },
  descriptionTxt: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 22,
    marginTop: 10,
  },
  editBtn: {
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 16,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  editBtnText: {
    color: '#080a0f',
    fontSize: 16,
    fontWeight: '600',
  },
  slotOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  slotStat: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  statLbl: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },
  vLine: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  slotsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 100,
  },
  slotSquare: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  slotNum: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 120,
  },
  bookingItem: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  bookingTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vehicleNo: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  bookingSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },
  liveTagDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#34d399',
  },
  liveTxtDetail: {
    fontSize: 10,
    fontWeight: '600',
    color: '#34d399',
  },
  bookingBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLbl: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 2,
  },
  timeVal: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  actionBtnSmall: {
    backgroundColor: '#ff4b4b',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnTextSmall: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyHost: {
    padding: 60,
    alignItems: 'center',
  },
  emptyTxt: {
    marginTop: 15,
    color: 'rgba(255,255,255,0.2)',
    fontSize: 15,
  },
  priceCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 10,
  },
  tableHead: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 15,
  },
  tableKey: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  tableVal: {
    flex: 1,
    fontSize: 14,
    color: 'white',
  },
  helperTxt: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 15,
    fontStyle: 'italic',
    paddingHorizontal: 10,
  },
  fabScan: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 18,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  fabText: {
    color: '#080a0f',
    fontSize: 17,
    fontWeight: '700',
  },
});
