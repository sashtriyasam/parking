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
import { EmptyState } from '../../components/EmptyState';
import { get } from '../../services/api';
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
  status: 'ACTIVE' | 'EXPIRED';
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

function withAlpha(color: string, opacity: number): string {
  // Simple hex to rgba conversion
  if (!color.startsWith('#')) return color;
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export default function PassesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const haptics = useHaptics();
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
    haptics.impactLight();
    await refetch();
    setRefreshing(false);
  };

  const handleShowPass = (pass: Pass) => {
    haptics.impactMedium();
    if (pass.status !== 'ACTIVE') {
      showToast('This pass has expired.', 'error');
      return;
    }
    setSelectedPass(pass);
    setShowQR(true);
  };

  const renderPass = ({ item, index }: { item: Pass; index: number }) => {
    const isActive = item.status === 'ACTIVE';
    const daysLeft = getDaysRemaining(item.end_date);

    return (
      <Animated.View entering={FadeInDown.delay(index * 100).duration(600)}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleShowPass(item)}
          disabled={!isActive}
        >
          <ProfessionalCard 
            style={[styles.passCard, !isActive && { opacity: 0.6 }]}
            hasVibrancy={isActive}
          >
            <View style={styles.cardHeader}>
              <View style={styles.headerInfo}>
                <Text style={[styles.facilityName, { color: colors.textPrimary }]}>{item.facility.name}</Text>
                <Text style={[styles.facilityAddress, { color: colors.textMuted }]} numberOfLines={1}>{item.facility.address}</Text>
              </View>
              <View style={[styles.statusBadge, { 
                backgroundColor: isActive ? withAlpha(colors.success, 0.08) : colors.surface, 
                borderColor: isActive ? withAlpha(colors.success, 0.2) : colors.border 
              }]}>
                <Text style={[styles.statusText, { color: isActive ? colors.success : colors.textMuted }]}>{isActive ? 'ACTIVE' : 'EXPIRED'}</Text>
              </View>
            </View>

            <View style={styles.statsContainer}>
               <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{daysLeft}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>DAYS LEFT</Text>
               </View>
               <View style={[styles.divider, { backgroundColor: colors.border }]} />
               <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                    {(item.vehicle_type || 'N/A').toUpperCase()}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>VEHICLE</Text>
               </View>
               <View style={[styles.divider, { backgroundColor: colors.border }]} />
               <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>₹{item.price}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>VALUE</Text>
               </View>
            </View>

            <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                <View style={styles.validityRow}>
                   <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                   <Text style={[styles.validityText, { color: colors.textMuted }]}>
                      {formatPassDate(item.start_date)} — {formatPassDate(item.end_date)}
                   </Text>
                </View>
                {isActive && (
                   <Ionicons name="finger-print" size={16} color={colors.primary} />
                )}
            </View>
          </ProfessionalCard>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />

      <Animated.View entering={SlideInUp.duration(600)} style={styles.header}>
        <BlurView intensity={20} tint={colors.isDark ? 'dark' : 'light'} style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            
            <View style={styles.headerTitleSection}>
               <Text style={[styles.headerLabel, { color: colors.textMuted }]}>SUBSCRIPTIONS</Text>
               <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Member Passes</Text>
            </View>

            <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(customer)')}>
               <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={passes}
          keyExtractor={(item) => item.id}
          renderItem={renderPass}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="card-outline"
              title="NO ACTIVE PASSES"
              subtitle="You don't have any subscription passes currently. Purchase one at any facility to enjoy priority parking."
              actionLabel="Explore Locations"
              onAction={() => router.push('/(customer)')}
            />
          }
        />
      )}

      {/* QR Code Authorization Modal */}
      <Modal visible={showQR} transparent animationType="fade" onRequestClose={() => setShowQR(false)}>
        <BlurView intensity={80} tint={colors.isDark ? 'dark' : 'light'} style={styles.modalBackdrop}>
          <Animated.View entering={ZoomIn.duration(400)}>
            <ProfessionalCard style={styles.qrCard}>
              <View style={styles.qrHeader}>
                <Text style={[styles.qrTitle, { color: colors.textMuted }]}>AUTHORIZATION TOKEN</Text>
                <TouchableOpacity onPress={() => setShowQR(false)} style={styles.closeModalBtn}>
                  <Ionicons name="close" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.qrContainer}>
                 <View style={[styles.qrFrame, { borderColor: colors.primary }]}>
                    {selectedPass && (
                      <QRCode
                        value={JSON.stringify({ ticketId: selectedPass.id, type: 'PASS' })}
                        size={200}
                        color={colors.textPrimary}
                        backgroundColor="transparent"
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
                <View style={[styles.tokenBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                   <Text style={[styles.tokenText, { color: colors.textMuted }]}>TOKEN ID: {selectedPass?.id.substring(0, 12).toUpperCase()}</Text>
                </View>
              </View>

              <ProfessionalButton
                 label="Close Pass"
                 onPress={() => setShowQR(false)}
                 variant="outline"
                 style={{ width: '100%' }}
              />
            </ProfessionalCard>
          </Animated.View>
        </BlurView>
      </Modal>

      <Animated.View entering={FadeInDown.delay(800)} style={styles.ctaWrapper}>
         <ProfessionalButton
            label="Purchase New Pass"
            onPress={() => router.push('/(customer)')}
            variant="primary"
            icon="add-circle-outline"
         />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { zIndex: 100 },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, gap: 12 },
  navBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  headerTitleSection: { flex: 1 },
  headerLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 24, paddingBottom: 120 },
  passCard: { padding: 24, borderRadius: 32, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  headerInfo: { flex: 1, marginRight: 12 },
  facilityName: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  facilityAddress: { fontSize: 12, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  statsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900', letterSpacing: -1 },
  statLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 1, marginTop: 4 },
  divider: { width: 1, height: 30, opacity: 0.5 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, borderTopWidth: 0.5 },
  validityRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  validityText: { fontSize: 11, fontWeight: '700' },
  ctaWrapper: { position: 'absolute', bottom: 40, left: 24, right: 24 },
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  qrCard: { width: width - 48, padding: 32, borderRadius: 40, alignItems: 'center' },
  qrHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 32 },
  qrTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  closeModalBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  qrContainer: { width: 240, height: 240, padding: 20, marginBottom: 32 },
  qrFrame: { flex: 1, borderWidth: 2, borderRadius: 24, padding: 16, alignItems: 'center', justifyContent: 'center' },
  qrInfo: { alignItems: 'center', marginBottom: 32 },
  qrFacility: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  qrValidity: { fontSize: 11, fontWeight: '800', opacity: 0.6, marginBottom: 16 },
  tokenBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  tokenText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
});
