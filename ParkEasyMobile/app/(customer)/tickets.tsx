import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Platform,
  StatusBar
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeInDown, 
  FadeInRight,
  Layout
} from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';

import { get } from '../../services/api';
import { ProfessionalCard } from '../../components/ui/ProfessionalCard';
import { ProfessionalButton } from '../../components/ui/ProfessionalButton';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptics } from '../../hooks/useHaptics';

const { width } = Dimensions.get('window');

interface Booking {
  id: string;
  vehicle_number: string;
  entry_time: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  facility: {
    name: string;
    address: string;
  };
  total_fee?: number;
}

export default function TicketsScreen() {
  const colors = useThemeColors();
  const haptics = useHaptics();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await get('/bookings/my');
      if (res.data?.data) {
        setBookings(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    haptics.impactLight();
    fetchBookings(false);
  };

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
      
      <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
        <BlurView intensity={20} tint={colors.isDark ? 'dark' : 'light'} style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerInfoSection}>
               <Text style={[styles.headerLabel, { color: colors.textMuted }]}>MY ACTIVITY • TICKETS</Text>
               <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Your Bookings</Text>
            </View>
            <View style={[styles.activeBadge, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
               <Text style={[styles.activeBadgeText, { color: colors.success }]}>
                  {bookings.filter(b => b.status === 'ACTIVE').length} ACTIVE
               </Text>
            </View>
          </View>
        </BlurView>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {bookings.length > 0 ? (
          bookings.map((booking, index) => (
            <Animated.View 
              key={booking.id} 
              entering={FadeInRight.delay(index * 100).duration(600)}
              layout={Layout.springify()}
            >
              <TicketItem 
                booking={booking} 
                onPress={() => {
                   haptics.impactMedium();
                   setSelectedTicket(booking);
                }}
                colors={colors}
              />
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="ticket-outline" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No Bookings Found</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Your digital tickets and parking receipts will appear here once you make a booking.</Text>
          </View>
        )}
      </ScrollView>

      {/* Wallet-Style Detailed Ticket View */}
      {selectedTicket && (
        <Animated.View entering={FadeInDown.duration(400)} style={StyleSheet.absoluteFill}>
           <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
              <TouchableOpacity style={styles.dismissOverlay} onPress={() => setSelectedTicket(null)} />
              
              <View style={styles.overlayContent}>
                 <ProfessionalCard style={styles.modalTicket} hasVibrancy={true}>
                    <View style={styles.modalHeader}>
                       <View style={styles.modalHeaderInfo}>
                          <Text style={[styles.modalFacility, { color: colors.textPrimary }]}>{selectedTicket.facility.name}</Text>
                          <Text style={[styles.modalAddress, { color: colors.textMuted }]} numberOfLines={1}>{selectedTicket.facility.address}</Text>
                       </View>
                       <View style={[styles.statusTag, { backgroundColor: selectedTicket.status === 'ACTIVE' ? colors.success : colors.surface }]}>
                          <Text style={styles.statusTagText}>{selectedTicket.status}</Text>
                       </View>
                    </View>
                    
                    <View style={styles.qrSection}>
                       <View style={[styles.qrFrame, { borderColor: colors.primary }]}>
                          <QRCode 
                             value={JSON.stringify({ ticketId: selectedTicket.id, type: 'BOOKING' })}
                             size={200}
                             color={colors.textPrimary}
                             backgroundColor="transparent"
                             quietZone={10}
                          />
                       </View>
                       <Text style={[styles.qrHint, { color: colors.textMuted }]}>SCAN AT ENTRY OR EXIT POINT</Text>
                    </View>

                    <View style={styles.detailsGrid}>
                       <DetailBlock label="VEHICLE" value={selectedTicket.vehicle_number} colors={colors} />
                       <DetailBlock label="ENTRY TIME" value={new Date(selectedTicket.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} colors={colors} />
                       <DetailBlock label="BOOKED DATE" value={new Date(selectedTicket.entry_time).toLocaleDateString()} colors={colors} />
                       <DetailBlock label="EST. COST" value={selectedTicket.total_fee ? `₹${selectedTicket.total_fee}` : '--'} colors={colors} />
                    </View>

                    <ProfessionalButton 
                       label="Close Ticket" 
                       onPress={() => setSelectedTicket(null)}
                       variant="primary"
                    />
                 </ProfessionalCard>
              </View>
           </BlurView>
        </Animated.View>
      )}
    </View>
  );
}

function TicketItem({ booking, onPress, colors }: any) {
  const isActive = booking.status === 'ACTIVE';
  
  return (
    <ProfessionalCard style={styles.ticketCard} onPress={onPress} hasVibrancy={isActive}>
      <View style={styles.ticketMain}>
        <View style={[styles.iconWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
           <Ionicons name={isActive ? "shield-checkmark" : "checkmark-circle"} size={22} color={isActive ? colors.primary : colors.textMuted} />
        </View>
        <View style={styles.ticketLabelContent}>
           <Text style={[styles.facilityLabel, { color: colors.textPrimary }]} numberOfLines={1}>{booking.facility.name}</Text>
           <Text style={[styles.vehicleLabel, { color: colors.textMuted }]}>{booking.vehicle_number}</Text>
        </View>
      </View>
      <View style={styles.ticketTrailing}>
         <View style={styles.timeWrapper}>
            <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>ENTRY</Text>
            <Text style={[styles.timeValue, { color: colors.textPrimary }]}>
              {new Date(booking.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
         </View>
         <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </ProfessionalCard>
  );
}

function DetailBlock({ label, value, colors }: any) {
  return (
    <View style={styles.gridItem}>
       <Text style={[styles.gridLabel, { color: colors.textMuted }]}>{label}</Text>
       <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { zIndex: 100 },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, gap: 12 },
  headerInfoSection: { flex: 1 },
  headerLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  activeBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  activeBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  scrollContent: { padding: 24, paddingBottom: 100 },
  ticketCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 28, marginBottom: 16, padding: 20 },
  ticketMain: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  iconWrapper: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  ticketLabelContent: { flex: 1 },
  facilityLabel: { fontSize: 16, fontWeight: '900', letterSpacing: -0.5 },
  vehicleLabel: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  ticketTrailing: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeWrapper: { alignItems: 'flex-end' },
  timeLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1, marginBottom: 2 },
  timeValue: { fontSize: 14, fontWeight: '800' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 120 },
  emptyText: { fontSize: 24, fontWeight: '900', marginTop: 24, letterSpacing: -0.5 },
  emptySubtext: { fontSize: 15, fontWeight: '600', textAlign: 'center', marginTop: 12, paddingHorizontal: 48, lineHeight: 22 },
  dismissOverlay: { ...StyleSheet.absoluteFillObject },
  overlayContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalTicket: { width: width - 48, borderRadius: 40, padding: 32 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 },
  modalHeaderInfo: { flex: 1, marginRight: 16 },
  modalFacility: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  modalAddress: { fontSize: 13, fontWeight: '600' },
  statusTag: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  statusTagText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  qrSection: { alignItems: 'center', marginBottom: 40 },
  qrFrame: { padding: 20, borderWidth: 2, borderRadius: 32, marginBottom: 20 },
  qrHint: { fontSize: 10, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, marginBottom: 40, justifyContent: 'space-between' },
  gridItem: { width: '45%' },
  gridLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 6, textTransform: 'uppercase' },
  gridValue: { fontSize: 16, fontWeight: '800' },
});
