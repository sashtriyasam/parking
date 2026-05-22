import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Dimensions,
  Modal,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInDown,
  ZoomIn,
  SlideInUp,
} from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptics } from '../../hooks/useHaptics';
import { useToast } from '../../components/Toast';
import { get, post, del } from '../../services/api';
import { ProfessionalCard } from '../../components/ui/ProfessionalCard';
import { ProfessionalButton } from '../../components/ui/ProfessionalButton';

const { width } = Dimensions.get('window');

interface Pass {
  id: string;
  facility: {
    id: string;
    name: string;
    address: string;
  };
  vehicle_type: string;
  start_date: string;
  end_date: string;
  price: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
}

interface AvailablePassOption {
  facility_id: string;
  facility_name: string;
  vehicle_type: string;
  monthly_price: number;
  hourly_rate?: number;
  daily_max?: number;
}

function getDaysRemaining(endDate: string): number {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatPassDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });
}

const mockPastPasses: Pass[] = [
  {
    id: 'past-pass-1',
    facility: {
      id: 'fac-1',
      name: 'Grand Central Parking',
      address: '123 Station Road, Sector 4'
    },
    vehicle_type: 'car',
    start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    price: 1200,
    status: 'EXPIRED'
  },
  {
    id: 'past-pass-2',
    facility: {
      id: 'fac-2',
      name: 'Regent Square Lot',
      address: '45 Mall Bypass, West Wing'
    },
    vehicle_type: 'bike',
    start_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    price: 450,
    status: 'CANCELLED'
  }
];

const fallbackAvailablePasses: AvailablePassOption[] = [
  {
    facility_id: 'mock-facility-1',
    facility_name: 'Metro Plaza Parking',
    vehicle_type: 'car',
    monthly_price: 1500,
    hourly_rate: 40,
    daily_max: 300
  },
  {
    facility_id: 'mock-facility-2',
    facility_name: 'Downtown Garage',
    vehicle_type: 'bike',
    monthly_price: 500,
    hourly_rate: 15,
    daily_max: 100
  },
  {
    facility_id: 'mock-facility-3',
    facility_name: 'Skyline Valet Hub',
    vehicle_type: 'car',
    monthly_price: 2500,
    hourly_rate: 60,
    daily_max: 500
  }
];

export default function PassesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const haptics = useHaptics();
  const { showToast } = useToast();

  const [refreshing, setRefreshing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [selectedPass, setSelectedPass] = useState<Pass | null>(null);
  const [pastPassesExpanded, setPastPassesExpanded] = useState(false);

  // Demo fallback lists
  const [localPurchasedPasses, setLocalPurchasedPasses] = useState<Pass[]>([]);
  const [localCancelledPasses, setLocalCancelledPasses] = useState<string[]>([]);
  const [purchasingOptionId, setPurchasingOptionId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // 1. Fetch user passes (Active only)
  const { data: serverPasses, isLoading: isLoadingMyPasses, refetch } = useQuery({
    queryKey: ['myPasses'],
    queryFn: async () => {
      const res = await get('/passes/me');
      return res.data.data as Pass[];
    }
  });

  // 2. Fetch available passes from facilities
  const { data: serverAvailablePasses, isLoading: isLoadingAvailable } = useQuery({
    queryKey: ['availablePasses'],
    queryFn: async () => {
      try {
        const facilitiesRes = await get('/parking/search?limit=6');
        const facilitiesList = facilitiesRes.data?.data || [];
        
        const allPasses: AvailablePassOption[] = [];
        for (const fac of facilitiesList) {
          try {
            const passesRes = await get(`/passes/available?facility_id=${fac.id}`);
            if (passesRes.data?.data) {
              allPasses.push(...passesRes.data.data);
            }
          } catch (e) {
            // No pricing rule setup or error for this facility
          }
        }
        return allPasses;
      } catch (err) {
        console.warn('Could not fetch available passes from API, using fallback.');
        return [];
      }
    }
  });

  const activePasses = React.useMemo(() => {
    const list = [...localPurchasedPasses, ...(serverPasses || [])];
    return list.filter(p => !localCancelledPasses.includes(p.id));
  }, [serverPasses, localPurchasedPasses, localCancelledPasses]);

  const cancelledPasses = React.useMemo(() => {
    const fromServerCancelled = (serverPasses || []).filter(p => localCancelledPasses.includes(p.id));
    const fromLocalCancelled = localPurchasedPasses.filter(p => localCancelledPasses.includes(p.id));
    
    return [
      ...fromLocalCancelled.map(p => ({ ...p, status: 'CANCELLED' as const })),
      ...fromServerCancelled.map(p => ({ ...p, status: 'CANCELLED' as const })),
      ...mockPastPasses
    ];
  }, [serverPasses, localPurchasedPasses, localCancelledPasses]);

  const availablePassOptions = React.useMemo(() => {
    if (serverAvailablePasses && serverAvailablePasses.length > 0) {
      return serverAvailablePasses;
    }
    return fallbackAvailablePasses;
  }, [serverAvailablePasses]);

  const onRefresh = async () => {
    setRefreshing(true);
    haptics.impactLight();
    await refetch();
    setRefreshing(false);
  };

  const handleShowPass = (pass: Pass) => {
    haptics.impactMedium();
    setSelectedPass(pass);
    setShowQR(true);
  };

  const handlePurchasePass = async (option: AvailablePassOption) => {
    haptics.impactMedium();
    const optId = `${option.facility_id}-${option.vehicle_type}`;
    setPurchasingOptionId(optId);
    
    try {
      if (option.facility_id.startsWith('mock-')) {
        await new Promise(resolve => setTimeout(resolve, 800));
        const newMockPass: Pass = {
          id: `mock-pass-${Date.now()}`,
          facility: {
            id: option.facility_id,
            name: option.facility_name,
            address: '123 Smart Park Boulevard, Downtown'
          },
          vehicle_type: option.vehicle_type,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          price: option.monthly_price,
          status: 'ACTIVE'
        };
        setLocalPurchasedPasses(prev => [newMockPass, ...prev]);
        showToast('Monthly pass purchased successfully!', 'success');
      } else {
        const res = await post('/passes/purchase', {
          facility_id: option.facility_id,
          vehicle_type: option.vehicle_type
        });
        showToast(res.data?.message || 'Monthly pass purchased successfully!', 'success');
        refetch();
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to purchase pass. Please try again.';
      showToast(errMsg, 'error');
    } finally {
      setPurchasingOptionId(null);
    }
  };

  const handleCancelPass = async (passId: string) => {
    haptics.impactMedium();
    setCancellingId(passId);
    try {
      if (passId.startsWith('mock-') || passId.startsWith('past-')) {
        await new Promise(resolve => setTimeout(resolve, 600));
        showToast('Pass subscription cancelled successfully', 'success');
        setLocalCancelledPasses(prev => [...prev, passId]);
        setShowQR(false);
      } else {
        const res = await del(`/passes/${passId}/cancel`);
        showToast(res.data?.message || 'Pass subscription cancelled successfully', 'success');
        setLocalCancelledPasses(prev => [...prev, passId]);
        refetch();
        setShowQR(false);
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to cancel pass. Please try again.';
      showToast(errMsg, 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const renderActivePass = (pass: Pass, index: number) => {
    const daysLeft = getDaysRemaining(pass.end_date);
    return (
      <Animated.View 
        key={pass.id} 
        entering={FadeInDown.delay(index * 100).duration(500)}
        style={styles.activePassWrapper}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleShowPass(pass)}
        >
          <ProfessionalCard style={styles.activePassCard}>
            <View style={styles.cardIndicatorLine} />
            <View style={styles.activePassContent}>
              <View style={styles.cardHeader}>
                <View style={styles.headerInfo}>
                  <Text style={[styles.facilityName, { color: colors.textPrimary }]}>{pass.facility.name}</Text>
                  <Text style={[styles.facilityAddress, { color: colors.textSecondary }]} numberOfLines={1}>
                    {pass.facility.address}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                  <Text style={[styles.statusText, { color: colors.primary }]}>ACTIVE</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{daysLeft}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>DAYS REMAINING</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.statBox}>
                  <View style={styles.vehicleTypeRow}>
                    <Ionicons 
                      name={pass.vehicle_type?.toLowerCase() === 'bike' ? 'bicycle-outline' : 'car-outline'} 
                      size={18} 
                      color={colors.textPrimary} 
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                      {(pass.vehicle_type || 'CAR').toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>VEHICLE TYPE</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>₹{pass.price}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>MONTHLY RATE</Text>
                </View>
              </View>

              <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                <View style={styles.validityRow}>
                  <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.validityText, { color: colors.textSecondary }]}>
                    Valid: {formatPassDate(pass.start_date)} — {formatPassDate(pass.end_date)}
                  </Text>
                </View>
                <View style={styles.tapActionRow}>
                  <Text style={[styles.tapActionText, { color: colors.primary }]}>Show QR</Text>
                  <Ionicons name="qr-code-outline" size={16} color={colors.primary} />
                </View>
              </View>
            </View>
          </ProfessionalCard>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderAvailablePass = (option: AvailablePassOption) => {
    const isCar = option.vehicle_type?.toLowerCase() === 'car';
    const optId = `${option.facility_id}-${option.vehicle_type}`;
    const isPurchasingThis = purchasingOptionId === optId;

    return (
      <View key={optId} style={styles.availableCardWrapper}>
        <ProfessionalCard style={styles.availableCard}>
          <View style={styles.availableHeader}>
            <View style={[styles.vehicleIconBg, { backgroundColor: colors.primary + '10' }]}>
              <Ionicons 
                name={isCar ? 'car-outline' : 'bicycle-outline'} 
                size={22} 
                color={colors.primary} 
              />
            </View>
            <View style={styles.availableBadge}>
              <Text style={[styles.availableBadgeText, { color: colors.textSecondary }]}>30-DAY PASS</Text>
            </View>
          </View>

          <Text style={[styles.availableFacility, { color: colors.textPrimary }]} numberOfLines={1}>
            {option.facility_name}
          </Text>
          
          <View style={styles.priceContainer}>
            <Text style={[styles.priceValue, { color: colors.textPrimary }]}>₹{option.monthly_price}</Text>
            <Text style={[styles.pricePeriod, { color: colors.textSecondary }]}>/month</Text>
          </View>

          <ProfessionalButton
            label={isPurchasingThis ? 'Buying...' : 'Buy Pass'}
            onPress={() => handlePurchasePass(option)}
            variant={isPurchasingThis ? 'secondary' : 'primary'}
            loading={isPurchasingThis}
            style={styles.buyBtn}
            textStyle={{ fontSize: 14 }}
          />
        </ProfessionalCard>
      </View>
    );
  };

  const renderPastPass = (pass: Pass, index: number) => {
    const isCancelled = pass.status === 'CANCELLED';
    const statusColor = isCancelled ? colors.warning : colors.textSecondary;
    return (
      <View key={pass.id} style={[styles.pastPassCard, { borderColor: colors.border }]}>
        <View style={styles.pastPassMain}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.pastFacilityName, { color: colors.textPrimary }]} numberOfLines={1}>
              {pass.facility.name}
            </Text>
            <Text style={[styles.pastPassSub, { color: colors.textSecondary }]}>
              {pass.vehicle_type?.toUpperCase()} • ₹{pass.price}
            </Text>
          </View>
          <View style={[styles.pastStatusBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.pastStatusText, { color: statusColor }]}>
              {pass.status}
            </Text>
          </View>
        </View>
        <Text style={[styles.pastPassDates, { color: colors.textSecondary }]}>
          {formatPassDate(pass.start_date)} — {formatPassDate(pass.end_date)}
        </Text>
      </View>
    );
  };

  const isLoading = isLoadingMyPasses && isLoadingAvailable;

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <StatusBar barStyle="light-content" />

      {/* iOS-Style Navigation Bar */}
      <Animated.View entering={SlideInUp.duration(600)} style={styles.header}>
        <BlurView intensity={20} tint="dark" style={[styles.headerContent, { borderBottomColor: colors.border }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerTitleSection}>
               <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>SUBSCRIPTIONS</Text>
               <Text style={styles.headerTitle}>Member Passes</Text>
            </View>

            <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(customer)')}>
               <Ionicons name="add" size={26} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Active Subscriptions Section */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Active Subscriptions</Text>
          
          {activePasses.length > 0 ? (
            <View style={styles.activeList}>
              {activePasses.map((pass, index) => renderActivePass(pass, index))}
            </View>
          ) : (
            <ProfessionalCard style={styles.emptyCard}>
              <Ionicons name="card-outline" size={32} color={colors.textSecondary} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTextTitle, { color: colors.textPrimary }]}>No Active Subscriptions</Text>
              <Text style={[styles.emptyTextSub, { color: colors.textSecondary }]}>
                Purchase a monthly pass to access rapid check-in and priority parking privileges.
              </Text>
            </ProfessionalCard>
          )}

          {/* Available Monthly Passes to Buy */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 32 }]}>Available Passes</Text>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
            decelerationRate="fast"
            snapToInterval={width * 0.64 + 16}
          >
            {availablePassOptions.map(renderAvailablePass)}
          </ScrollView>

          {/* Past Subscriptions Collapsible */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => {
              haptics.impactLight();
              setPastPassesExpanded(!pastPassesExpanded);
            }}
            style={[styles.collapsibleHeader, { borderTopColor: colors.border }]}
          >
            <View style={styles.collapsibleTitleRow}>
              <Text style={[styles.collapsibleTitle, { color: colors.textPrimary }]}>Past Subscriptions</Text>
              <View style={[styles.countBadge, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.countText, { color: colors.textSecondary }]}>{cancelledPasses.length}</Text>
              </View>
            </View>
            <Ionicons 
              name={pastPassesExpanded ? "chevron-up" : "chevron-down"} 
              size={18} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>

          {pastPassesExpanded && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.pastPassesContainer}>
              {cancelledPasses.length > 0 ? (
                cancelledPasses.map((pass, index) => renderPastPass(pass, index))
              ) : (
                <Text style={[styles.pastPassEmptyText, { color: colors.textSecondary }]}>
                  No past subscriptions found.
                </Text>
              )}
            </Animated.View>
          )}
        </ScrollView>
      )}

      {/* QR Authorization Code Modal */}
      <Modal visible={showQR} transparent animationType="fade" onRequestClose={() => setShowQR(false)}>
        <BlurView intensity={80} tint="dark" style={styles.modalBackdrop}>
          <Animated.View entering={ZoomIn.duration(400)}>
            <ProfessionalCard style={styles.qrCard}>
              <View style={styles.qrHeader}>
                <Text style={[styles.qrTitle, { color: colors.textSecondary }]}>AUTHORIZATION TOKEN</Text>
                <TouchableOpacity onPress={() => setShowQR(false)} style={styles.closeModalBtn}>
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.qrContainer}>
                 <View style={[styles.qrFrame, { borderColor: colors.primary }]}>
                    {selectedPass && (
                      <QRCode
                        value={JSON.stringify({ ticketId: selectedPass.id, type: 'PASS' })}
                        size={180}
                        color="#000000"
                        backgroundColor="#FFFFFF"
                        quietZone={10}
                      />
                    )}
                 </View>
              </View>

              <View style={styles.qrInfo}>
                <Text style={[styles.qrFacility, { color: colors.textPrimary }]}>{selectedPass?.facility.name}</Text>
                <Text style={[styles.qrValidity, { color: colors.textSecondary }]}>
                   VALID UNTIL {selectedPass && formatPassDate(selectedPass.end_date).toUpperCase()}
                </Text>
                <View style={[styles.tokenBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                   <Text style={[styles.tokenText, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="middle">
                     TOKEN ID: {selectedPass?.id.toUpperCase()}
                   </Text>
                </View>
              </View>

              <View style={styles.modalActions}>
                <ProfessionalButton
                   label="Close Pass"
                   onPress={() => setShowQR(false)}
                   variant="secondary"
                   style={{ flex: 1 }}
                />
                
                {selectedPass && (
                  <ProfessionalButton
                     label={cancellingId === selectedPass.id ? "Cancelling..." : "Cancel Pass"}
                     onPress={() => handleCancelPass(selectedPass.id)}
                     variant="danger"
                     loading={cancellingId === selectedPass.id}
                     style={{ flex: 1, marginLeft: 12 }}
                  />
                )}
              </View>
            </ProfessionalCard>
          </Animated.View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { zIndex: 100 },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12 },
  navBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginLeft: -10 },
  headerTitleSection: { flex: 1 },
  headerLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, color: '#FFFFFF' },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingVertical: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, paddingHorizontal: 20, marginBottom: 16 },
  activeList: { paddingHorizontal: 20, gap: 16 },
  activePassWrapper: { width: '100%' },
  activePassCard: { padding: 0, borderRadius: 12, overflow: 'hidden' },
  cardIndicatorLine: { width: 4, height: '100%', backgroundColor: '#007AFF', position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 10 },
  activePassContent: { padding: 20, paddingLeft: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerInfo: { flex: 1, marginRight: 8 },
  facilityName: { fontSize: 17, fontWeight: '700', letterSpacing: -0.4, marginBottom: 4 },
  facilityAddress: { fontSize: 13, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  vehicleTypeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginTop: 4, textAlign: 'center' },
  divider: { width: 1, height: 28, opacity: 0.4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTopWidth: 0.5 },
  validityRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  validityText: { fontSize: 12, fontWeight: '500' },
  tapActionRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tapActionText: { fontSize: 12, fontWeight: '600' },
  emptyCard: { marginHorizontal: 20, padding: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  emptyTextTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptyTextSub: { fontSize: 13, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 },
  horizontalScrollContent: { paddingLeft: 20, paddingRight: 12, gap: 16, paddingBottom: 8 },
  availableCardWrapper: { width: width * 0.64 },
  availableCard: { width: '100%', padding: 18, borderRadius: 12 },
  availableHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  vehicleIconBg: { width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  availableBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: '#2C2C2E' },
  availableBadgeText: { fontSize: 9, fontWeight: '700' },
  availableFacility: { fontSize: 16, fontWeight: '700', letterSpacing: -0.4, marginBottom: 8 },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  priceValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  pricePeriod: { fontSize: 12, fontWeight: '500', marginLeft: 2 },
  buyBtn: { height: 40, borderRadius: 8 },
  collapsibleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, marginTop: 32, borderTopWidth: 0.5 },
  collapsibleTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  collapsibleTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countText: { fontSize: 11, fontWeight: '700' },
  pastPassesContainer: { paddingHorizontal: 20, gap: 12, paddingBottom: 40 },
  pastPassCard: { padding: 16, borderRadius: 10, borderWidth: 1 },
  pastPassMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pastFacilityName: { fontSize: 15, fontWeight: '600', letterSpacing: -0.3 },
  pastPassSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  pastStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, borderWidth: 0.5 },
  pastStatusText: { fontSize: 9, fontWeight: '700' },
  pastPassDates: { fontSize: 11, fontWeight: '500' },
  pastPassEmptyText: { fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  qrCard: { width: width - 40, padding: 24, borderRadius: 16, alignItems: 'center' },
  qrHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20 },
  qrTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  closeModalBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  qrContainer: { width: 220, height: 220, padding: 16, backgroundColor: '#FFFFFF', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  qrFrame: { borderWidth: 1.5, borderRadius: 8, padding: 8, alignItems: 'center', justifyContent: 'center' },
  qrInfo: { alignItems: 'center', marginBottom: 24, width: '100%' },
  qrFacility: { fontSize: 18, fontWeight: '700', letterSpacing: -0.4, marginBottom: 4, textAlign: 'center' },
  qrValidity: { fontSize: 11, fontWeight: '700', opacity: 0.6, marginBottom: 12 },
  tokenBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 0.5, width: '100%', alignItems: 'center' },
  tokenText: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5 },
  modalActions: { flexDirection: 'row', width: '100%' }
});
