import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  useWindowDimensions,
  FlatList,
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
import { ErrorHandler } from '../../utils/ErrorHandler';

const TICKET_HEIGHT = 140; // Estimated height + margin

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
  const { width } = useWindowDimensions();
  const colors = useThemeColors();
  const haptics = useHaptics();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Segmented control state: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  const [activeSegment, setActiveSegment] = useState<'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ACTIVE');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await get('/bookings/my');
      if (res.data?.data) {
        setBookings(res.data.data);
        setError(null);
      }
    } catch (error: any) {
      const msg = error.message || 'Failed to load bookings';
      setError(msg);
      if (showLoading) {
        Alert.alert('Connection Error', 'We couldn\'t load your digital tickets. Please pull down to refresh and try again.');
      } else {
        ErrorHandler.showToast('Sync Failed', msg, 'error');
      }
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

  const filteredBookings = bookings.filter(b => b.status === activeSegment);

  if (loading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error && !refreshing && bookings.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, padding: 32 }]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.primary} />
        <Text style={[styles.emptyText, { color: colors.textPrimary, textAlign: 'center' }]}>Update Failed</Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>{error}</Text>
        <View style={{ width: '100%', marginTop: 32 }}>
          <ProfessionalButton 
            label="Retry Connection" 
            onPress={() => fetchBookings()}
            variant="primary"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header & Segments Area */}
      <View style={styles.header}>
        <BlurView intensity={20} tint={colors.isDark ? 'dark' : 'light'} style={[styles.headerContent, { borderBottomColor: colors.border }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerInfoSection}>
               <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>MY ACTIVITY • TICKETS</Text>
               <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Your Bookings</Text>
            </View>
            <View style={[styles.activeBadge, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
               <Text style={[styles.activeBadgeText, { color: colors.success }]}>
                  {bookings.filter(b => b.status === 'ACTIVE').length} ACTIVE
               </Text>
            </View>
          </View>

          {/* Segmented Control */}
          <View style={[styles.segmentsContainer, { backgroundColor: colors.surface }]}>
            {(['ACTIVE', 'COMPLETED', 'CANCELLED'] as const).map((segment) => {
              const isActive = activeSegment === segment;
              return (
                <TouchableOpacity
                  key={segment}
                  style={[
                    styles.segmentButton,
                    isActive && { backgroundColor: colors.surfaceElevated }
                  ]}
                  onPress={() => {
                    haptics.impactLight();
                    setActiveSegment(segment);
                  }}
                >
                  <Text style={[
                    styles.segmentText,
                    { color: colors.textSecondary },
                    isActive && { color: colors.textPrimary, fontWeight: '700' }
                  ]}>
                    {segment.charAt(0) + segment.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onRefresh={onRefresh}
        refreshing={refreshing}
        renderItem={({ item: booking, index }) => (
          <Animated.View 
            entering={FadeInRight.delay(Math.min(index * 50, 400)).duration(400)}
            layout={Layout.springify()}
          >
            <TicketItem 
              booking={booking} 
              onPress={() => {
                 haptics.impactMedium();
                 setSelectedTicket(booking);
              }}
              onDownload={() => {
                 haptics.notificationSuccess();
                 setSelectedTicket(booking);
              }}
              colors={colors}
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="ticket-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
            <Text style={[styles.emptyText, { color: colors.textPrimary }]}>No Bookings</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              There are no {activeSegment.toLowerCase()} tickets associated with your account.
            </Text>
          </View>
        }
      />

      {/* Wallet-Style Detailed Ticket View */}
      {selectedTicket && (
        <Animated.View entering={FadeInDown.duration(300)} style={StyleSheet.absoluteFill}>
           <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
              <TouchableOpacity 
                style={styles.dismissOverlay} 
                onPress={() => setSelectedTicket(null)} 
                accessibilityLabel="Dismiss ticket details"
                accessibilityRole="button"
              />
              
              <View style={styles.overlayContent}>
                 <ProfessionalCard style={[styles.modalTicket, { width: width - 40 }]} hasVibrancy={true}>
                    <View style={styles.modalHeader}>
                       <View style={styles.modalHeaderInfo}>
                          <Text style={[styles.modalFacility, { color: colors.textPrimary }]}>{selectedTicket.facility.name}</Text>
                          <Text style={[styles.modalAddress, { color: colors.textSecondary }]} numberOfLines={1}>{selectedTicket.facility.address}</Text>
                       </View>
                       <View style={[
                         styles.statusTag, 
                         { 
                           backgroundColor: selectedTicket.status === 'ACTIVE' ? colors.success + '15' : colors.surface,
                           borderColor: selectedTicket.status === 'ACTIVE' ? colors.success + '30' : colors.border,
                           borderWidth: 1
                         }
                       ]}>
                          <Text style={[
                            styles.statusTagText, 
                            { color: selectedTicket.status === 'ACTIVE' ? colors.success : colors.textSecondary }
                          ]}>
                            {selectedTicket.status}
                          </Text>
                       </View>
                    </View>
                    
                    <View style={styles.qrSection}>
                       <View style={[styles.qrFrame, { borderColor: colors.primary }]}>
                          <QRCode 
                             value={JSON.stringify({ ticketId: selectedTicket.id, type: 'BOOKING' })}
                             size={180}
                             color={colors.textPrimary}
                             backgroundColor="transparent"
                             quietZone={10}
                          />
                       </View>
                       <Text style={[styles.qrHint, { color: colors.textSecondary }]}>PRESENT ENCRYPTED QR AT GATE</Text>
                    </View>

                    <View style={styles.detailsGrid}>
                       <DetailBlock label="VEHICLE" value={selectedTicket.vehicle_number} colors={colors} />
                       <DetailBlock label="ENTRY" value={new Date(selectedTicket.entry_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} colors={colors} />
                       <DetailBlock label="DATE" value={new Date(selectedTicket.entry_time).toLocaleDateString('en-IN')} colors={colors} />
                       <DetailBlock label="AMOUNT" value={selectedTicket.total_fee ? `₹${selectedTicket.total_fee}` : '--'} colors={colors} />
                    </View>

                    <ProfessionalButton 
                       label="Close Pass" 
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

interface TicketItemProps {
  booking: Booking;
  onPress: () => void;
  onDownload: () => void;
  colors: {
    surface: string;
    border: string;
    primary: string;
    textSecondary: string;
    textPrimary: string;
  };
}

function TicketItem({ booking, onPress, onDownload, colors }: TicketItemProps) {
  const isActive = booking.status === 'ACTIVE';
  
  return (
    <ProfessionalCard style={styles.ticketCard} onPress={onPress} hasVibrancy={isActive}>
      <View style={styles.ticketMain}>
        <View style={[styles.iconWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
           <Ionicons 
             name={isActive ? "shield-checkmark" : "checkmark-circle"} 
             size={20} 
             color={isActive ? colors.primary : colors.textSecondary} 
           />
        </View>
        
        <View style={styles.ticketLabelContent}>
           <Text style={[styles.facilityLabel, { color: colors.textPrimary }]} numberOfLines={1}>
             {booking.facility.name}
           </Text>
           
           <View style={styles.metaRow}>
             <Text style={[styles.vehicleLabel, { color: colors.textSecondary }]}>
               {booking.vehicle_number}
             </Text>
             {booking.total_fee !== undefined && (
               <>
                 <Text style={[styles.metaDot, { color: colors.textSecondary }]}>•</Text>
                 <Text style={[styles.rateLabel, { color: colors.primary, fontWeight: '700' }]}>
                   ₹{booking.total_fee}
                 </Text>
               </>
             )}
           </View>
        </View>
      </View>
      
      <View style={styles.ticketTrailing}>
         {isActive ? (
           <TouchableOpacity 
             style={[styles.quickActionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
             onPress={(e) => {
               e.stopPropagation();
               onDownload();
             }}
           >
             <Ionicons name="qr-code-outline" size={16} color={colors.primary} />
             <Text style={[styles.quickActionText, { color: colors.primary }]}>View Pass</Text>
           </TouchableOpacity>
         ) : (
           <View style={styles.timeWrapper}>
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>ENTRY</Text>
              <Text style={[styles.timeValue, { color: colors.textPrimary }]}>
                {new Date(booking.entry_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
           </View>
         )}
         <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={{ opacity: 0.5 }} />
      </View>
    </ProfessionalCard>
  );
}

interface DetailBlockProps {
  label: string;
  value: string | number | React.ReactNode;
  colors: {
    textSecondary: string;
    textPrimary: string;
  };
}

function DetailBlock({ label, value, colors }: DetailBlockProps) {
  return (
    <View style={styles.gridItem}>
       <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>{label}</Text>
       <Text style={[styles.gridValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { zIndex: 100 },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12, marginBottom: 16 },
  headerInfoSection: { flex: 1 },
  headerLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  activeBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  activeBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  
  segmentsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    padding: 2,
    borderRadius: 8,
    gap: 2,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
  },

  scrollContent: { padding: 20, paddingBottom: 120 },
  ticketCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderRadius: 12, 
    marginBottom: 12, 
    padding: 16 
  },
  ticketMain: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconWrapper: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  ticketLabelContent: { flex: 1 },
  facilityLabel: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  vehicleLabel: { fontSize: 12, fontWeight: '400' },
  metaDot: { fontSize: 12 },
  rateLabel: { fontSize: 12 },
  
  ticketTrailing: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quickActionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8, 
    borderWidth: 1 
  },
  quickActionText: { fontSize: 11, fontWeight: '700' },
  timeWrapper: { alignItems: 'flex-end' },
  timeLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  timeValue: { fontSize: 13, fontWeight: '700' },
  
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100, paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontWeight: '800', marginTop: 16, letterSpacing: -0.3 },
  emptySubtext: { fontSize: 13, fontWeight: '400', textAlign: 'center', marginTop: 8, lineHeight: 18, opacity: 0.8 },
  dismissOverlay: { ...StyleSheet.absoluteFillObject },
  overlayContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalTicket: { borderRadius: 16, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalHeaderInfo: { flex: 1, marginRight: 12 },
  modalFacility: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  modalAddress: { fontSize: 13, fontWeight: '400' },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusTagText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  qrSection: { alignItems: 'center', marginBottom: 24 },
  qrFrame: { padding: 12, borderWidth: 1, borderRadius: 16, marginBottom: 12, backgroundColor: '#FFFFFF' },
  qrHint: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textAlign: 'center' },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24, justifyContent: 'space-between' },
  gridItem: { width: '45%' },
  gridLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' },
  gridValue: { fontSize: 14, fontWeight: '700' },
});
