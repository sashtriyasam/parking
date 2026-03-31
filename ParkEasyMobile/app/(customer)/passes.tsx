import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Dimensions,
  Modal,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  Layout,
  SlideInUp,
  FadeIn
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { useToast } from '../../components/Toast';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/ui/SkeletonLoader';
import { useQuery } from '@tanstack/react-query';
import { get } from '../../services/api';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface Pass {
  id: string;
  facility: {
    id: string;
    name: string;
    address: string;
    image_url: string;
  };
  vehicle_type: string;
  start_date: string;
  end_date: string;
  price: number;
  status: 'ACTIVE' | 'EXPIRED';
}

function getDaysRemaining(endDate: string): number {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatPassDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });
}

function formatPassEndDate(pass: Pass | null): string {
  if (!pass || !pass.end_date) return '';
  return formatPassDate(pass.end_date).toUpperCase();
}

export default function PassesScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [selectedPass, setSelectedPass] = useState<Pass | null>(null);
  const { showToast } = useToast();

  const { data: passes, isLoading, refetch } = useQuery({
    queryKey: ['myPasses'],
    queryFn: async () => {
      const res = await get('/passes/me');
      return res.data.data as Pass[];
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleShowPass = (pass: Pass) => {
    if (pass.status !== 'ACTIVE') {
      showToast('This pass has expired.', 'error');
      return;
    }
    setSelectedPass(pass);
    setShowQR(true);
  };

  const handleRenew = (pass: Pass) => {
    if (pass.facility.id) {
      router.push(`/(customer)/facility/${pass.facility.id}`);
    } else {
      router.push('/(customer)');
    }
  };

  const renderPass = ({ item, index }: { item: Pass; index: number }) => {
    const isActive = item.status === 'ACTIVE';
    const daysLeft = getDaysRemaining(item.end_date);
    const isExpiringSoon = isActive && daysLeft <= 7;

    return (
      <Animated.View entering={FadeInDown.delay(index * 100).springify().damping(12)}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleShowPass(item)}
          style={!isActive && { opacity: 0.6 }}
        >
          <BlurView
            intensity={isActive ? 40 : 15}
            tint="dark"
            style={[
              styles.passCard,
              isActive && { borderColor: colors.premium.primary + '30', borderWidth: 1 }
            ]}
          >
            {isActive ? (
              <LinearGradient
                colors={[colors.premium.primary + '20', colors.premium.secondary + '20']}
                style={styles.passGradientTop}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.passTopContent}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.facilityNameLight}>{item.facility.name.toUpperCase()}</Text>
                    <Text style={styles.facilityAddressLight} numberOfLines={1}>{item.facility.address}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeBadgeText}>ACTIVE</Text>
                  </View>
                </View>

                <View style={styles.passStatsRow}>
                  <View style={styles.passStat}>
                    <Text style={styles.passStatVal}>{daysLeft}</Text>
                    <Text style={styles.passStatLabel}>DAYS LEFT</Text>
                  </View>
                  <View style={styles.passStatDiv} />
                  <View style={styles.passStat}>
                    <Text style={styles.passStatVal}>{item.vehicle_type.toUpperCase()}</Text>
                    <Text style={styles.passStatLabel}>VEHICLE</Text>
                  </View>
                  <View style={styles.passStatDiv} />
                  <View style={styles.passStat}>
                    <Text style={[styles.passStatVal, { color: colors.premium.tertiary }]}>₹{item.price}</Text>
                    <Text style={styles.passStatLabel}>CREDITS</Text>
                  </View>
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.expiredTop}>
                <View style={styles.passTopContent}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.facilityNameDark}>{item.facility.name.toUpperCase()}</Text>
                    <Text style={styles.facilityAddressDark} numberOfLines={1}>{item.facility.address}</Text>
                  </View>
                  <View style={styles.expiredBadge}>
                    <Text style={styles.expiredBadgeText}>EXPIRED</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.passActions}>
              <View style={styles.dateRange}>
                <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.4)" />
                <Text style={styles.dateText}>
                  {formatPassDate(item.start_date)}
                  {' → '}
                  {formatPassDate(item.end_date)}
                </Text>
              </View>

              <View style={styles.actionRow}>
                {isExpiringSoon && (
                  <TouchableOpacity style={styles.renewBtn} onPress={() => handleRenew(item)}>
                    <Text style={styles.renewBtnText}>RENEW</Text>
                    <Ionicons name="refresh" size={14} color={colors.premium.primary} />
                  </TouchableOpacity>
                )}
                {isActive && (
                  <View style={styles.tagWrapper}>
                    <Ionicons name="finger-print-outline" size={12} color="rgba(255,255,255,0.4)" />
                  </View>
                )}
              </View>
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
        <View style={[styles.glowPoint, { top: '20%', left: '-10%', backgroundColor: colors.premium.primary, opacity: 0.1 }]} />
        <View style={[styles.glowPoint, { bottom: '20%', right: '-30%', backgroundColor: colors.premium.secondary, opacity: 0.05 }]} />
      </View>

      <Animated.View entering={SlideInUp.duration(600)} style={styles.header}>
        <BlurView intensity={30} tint="dark" style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerLabel}>SUBSCRIPTIONS</Text>
            <Text style={styles.headerTitle}>SECURE PASSES</Text>
          </View>
          <View style={{ width: 44 }} />
        </BlurView>
      </Animated.View>

      {isLoading ? (
        <View style={styles.listContent}>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} width="100%" height={200} borderRadius={30} style={{ marginBottom: 20 }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={passes}
          keyExtractor={(item) => item.id}
          renderItem={renderPass}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.premium.primary} />
          }
          ListEmptyComponent={
            <Animated.View entering={FadeIn.delay(400)}>
              <EmptyState
                icon="card-outline"
                title="No Active Passes"
                subtitle="Get a monthly pass at any partner facility to start seamless access."
                actionLabel="Find Parking"
                onAction={() => router.push('/(customer)')}
              />
            </Animated.View>
          }
        />
      )}

      {/* QR Code Modal for Show Pass */}
      <Modal
        visible={showQR}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQR(false)}
      >
        <BlurView intensity={60} tint="dark" style={styles.modalOverlay}>
          <Animated.View entering={ZoomIn.duration(400).springify()}>
            <BlurView intensity={40} tint="dark" style={styles.qrModalCard}>
              <View style={styles.qrHeader}>
                <Text style={styles.qrTitle}>HOLOGRAPHIC PASS</Text>
                <TouchableOpacity onPress={() => setShowQR(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={22} color="white" />
                </TouchableOpacity>
              </View>

              <View style={styles.qrWrapper}>
                <View style={styles.qrCornerLT} />
                <View style={styles.qrCornerRT} />
                <View style={styles.qrCornerLB} />
                <View style={styles.qrCornerRB} />
                <View style={styles.qrContent}>
                  {selectedPass && (
                    <QRCode
                      value={selectedPass.id}
                      size={200}
                      color="white"
                      backgroundColor="#000"
                      quietZone={10}
                    />
                  )}
                </View>
              </View>

              <View style={styles.qrDetails}>
                <Text style={styles.qrFacilityName}>{selectedPass?.facility.name.toUpperCase()}</Text>
                <Text style={styles.qrVehicleInfo}>
                  {selectedPass?.vehicle_type.toUpperCase()} • VALID UNTIL {formatPassEndDate(selectedPass)}
                </Text>
                <View style={styles.qrIdContainer}>
                  <Text style={styles.qrIdLabel}>PASS TOKEN: </Text>
                  <Text style={styles.qrIdValue}>{selectedPass?.id.substring(0, 14).toUpperCase()}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.qrCloseBtn}
                onPress={() => setShowQR(false)}
              >
                <Text style={styles.qrCloseBtnText}>TERMINATE VIEW</Text>
              </TouchableOpacity>
            </BlurView>
          </Animated.View>
        </BlurView>
      </Modal>

      <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.fab}>
        <TouchableOpacity
          style={styles.fabBtn}
          onPress={() => router.push('/(customer)')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.premium.primary, colors.premium.secondary]}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.fabText}>INITIALIZE NEW PASS</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
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
    paddingBottom: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 3,
    marginTop: 4,
    textAlign: 'center',
  },
  listContent: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 150,
  },
  passCard: {
    borderRadius: 30,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  passGradientTop: {
    padding: 24,
  },
  expiredTop: {
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  passTopContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  facilityNameLight: {
    fontSize: 18,
    fontWeight: '900',
    color: 'white',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  facilityAddressLight: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  facilityNameDark: {
    fontSize: 16,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 6,
  },
  facilityAddressDark: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.premium.tertiary,
    // iOS shadow
    shadowColor: colors.premium.tertiary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    // Android elevation (limited glow effect)
    elevation: 4,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 1,
  },
  expiredBadge: {
    backgroundColor: colors.error + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  expiredBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.error,
    letterSpacing: 1,
  },
  passStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passStat: {
    flex: 1,
    alignItems: 'center',
  },
  passStatVal: {
    fontSize: 22,
    fontWeight: '900',
    color: 'white',
  },
  passStatLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  passStatDiv: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  passActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  dateRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  renewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(28, 116, 233, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(28, 116, 233, 0.2)',
  },
  renewBtnText: {
    color: colors.premium.primary,
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 1,
  },
  tagWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  fabBtn: {
    borderRadius: 22,
    overflow: 'hidden',
    height: 64,
  },
  fabGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  fabText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  qrModalCard: {
    width: width - 40,
    borderRadius: 40,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
  },
  qrTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 4,
    opacity: 0.8,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrWrapper: {
    width: 260,
    height: 260,
    padding: 20,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  qrContent: {
    width: 220,
    height: 220,
    borderRadius: 20,
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
  qrDetails: {
    alignItems: 'center',
    marginBottom: 40,
  },
  qrFacilityName: {
    fontSize: 18,
    fontWeight: '900',
    color: 'white',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  qrVehicleInfo: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  qrIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  qrIdLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.3)',
  },
  qrIdValue: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.premium.primary,
    letterSpacing: 2,
  },
  qrCloseBtn: {
    width: '100%',
    height: 58,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  qrCloseBtnText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
  },
});
