import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

import { useBookingFlowStore } from '../../../store/bookingFlowStore';
import { post } from '../../../services/api';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useHaptics } from '../../../hooks/useHaptics';
import { PaymentSheet } from '../../../components/PaymentSheet';
import { useToast } from '../../../components/Toast';
import { ProfessionalCard } from '../../../components/ui/ProfessionalCard';
import { ProfessionalButton } from '../../../components/ui/ProfessionalButton';

export default function PaymentScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const haptics = useHaptics();
  const { showToast } = useToast();
  const {
    facility_id,
    facility_name,
    selected_slot,
    vehicle_number,
    vehicle_type,
    setCreatedTicket,
    selected_payment_method,
    created_ticket_id
  } = useBookingFlowStore();

  const [loading, setLoading] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [duration, setDuration] = useState(1); // Default 1 hour

  // Fallbacks if user navigated directly without data
  if (!facility_id || !selected_slot) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.primary} />
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>Session recovery failed. Please re-initiate your booking flow from discovery.</Text>
        <ProfessionalButton label="Return to Home" onPress={() => router.replace('/(customer)/')} style={{ marginTop: 24, width: 220 }} />
      </View>
    );
  }

  const costPerHour = selected_slot.price_per_hour || 0;
  const totalCost = costPerHour * duration;

  const handleProceedToPayment = async () => {
    setLoading(true);
    haptics.impactMedium();
    try {
      const payload = {
        facility_id,
        slot_id: selected_slot.id,
        vehicle_number,
        vehicle_type: vehicle_type || 'car',
        payment_method: selected_payment_method || 'upi',
        duration_hours: duration,
        status: 'PENDING'
      };

      const res = await post('/bookings', payload);
      const booking = res.data.data;

      setCreatedTicket(booking.id);
      setShowPaymentSheet(true);

    } catch (e: any) {
      console.error('Booking Creation Error', e);
      showToast(e.response?.data?.message || 'Authorization failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    haptics.notificationSuccess();
    router.replace('/(customer)/booking/success');
  };

  const durations = [1, 2, 4, 8, 12, 24];
  const bookingRef = useMemo(() => Math.random().toString(36).substring(7).toUpperCase(), []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.navBtn} 
          onPress={() => {
            haptics.impactLight();
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleBox}>
           <Text style={[styles.headerLabel, { color: colors.textMuted }]}>RESERVATION • SUMMARY</Text>
           <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Complete Booking</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(600).springify()}>
          <ProfessionalCard style={styles.summaryCard} hasVibrancy={true}>
            <View style={styles.badgeRow}>
              <View style={[styles.summaryBadge, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>SECURE SESSION</Text>
              </View>
              <Text style={[styles.timestamp, { color: colors.textMuted }]}>REF: {bookingRef}</Text>
            </View>

            <Text style={[styles.facilityName, { color: colors.textPrimary }]}>{facility_name}</Text>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={[styles.label, { color: colors.textMuted }]}>ALLOCATED SLOT</Text>
                <Text style={[styles.value, { color: colors.textPrimary }]}>{selected_slot.slot_number}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={[styles.label, { color: colors.textMuted }]}>VEHICLE REG.</Text>
                <Text style={[styles.value, { color: colors.textPrimary }]}>{vehicle_number}</Text>
              </View>
            </View>
          </ProfessionalCard>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>DURATION PREFERENCE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.durationScroll}>
              {durations.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.durationPill, 
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    duration === d && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => {
                    haptics.impactLight();
                    setDuration(d);
                  }}
                >
                  <Text style={[styles.durationText, { color: colors.textMuted }, duration === d && { color: 'white' }]}>{d}H</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>FINANCIAL SUMMARY</Text>
            <ProfessionalCard style={styles.costCard}>
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, { color: colors.textSecondary }]}>Rate / Cycle</Text>
                <Text style={[styles.costValue, { color: colors.textPrimary }]}>₹{Number(costPerHour).toFixed(2)}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, { color: colors.textSecondary }]}>Estimated Duration (x{duration})</Text>
                <Text style={[styles.costValue, { color: colors.textPrimary }]}>₹{totalCost.toFixed(2)}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, { color: colors.textSecondary }]}>Regulatory Fees</Text>
                <Text style={[styles.costValue, { color: colors.textPrimary }]}>₹0.00</Text>
              </View>
              
              <View style={[styles.costDivider, { backgroundColor: colors.border }]} />
              
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>TOTAL PAYABLE</Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>₹{totalCost.toFixed(2)}</Text>
              </View>
            </ProfessionalCard>
          </View>

          <View style={styles.infoSection}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textMuted }]}>Your payment data is tokenized and never stored on our servers.</Text>
          </View>
        </Animated.View>
        <View style={{ height: 160 }} />
      </ScrollView>

      <View style={styles.footer}>
        <BlurView intensity={30} tint={colors.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[styles.footerInner, { borderTopColor: colors.border }]}>
          <ProfessionalButton
            label="Initialize Secure Payment"
            onPress={handleProceedToPayment}
            loading={loading}
            variant="primary"
          />
        </View>
      </View>

      <PaymentSheet
        visible={showPaymentSheet}
        onClose={() => setShowPaymentSheet(false)}
        onSuccess={handlePaymentSuccess}
        amount={totalCost}
        facilityName={facility_name || ''}
        bookingId={created_ticket_id || ''}
        slotId={selected_slot.id}
        vehicleNumber={vehicle_number || ''}
        vehicleType={vehicle_type || 'car'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  navBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerTitleBox: { flex: 1 },
  headerLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  scrollContent: { paddingVertical: 12 },
  summaryCard: { marginHorizontal: 24, padding: 24, borderRadius: 32, marginBottom: 32 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  summaryBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  timestamp: { fontSize: 10, fontWeight: '700', opacity: 0.7 },
  facilityName: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 24 },
  divider: { height: 0.5, marginBottom: 24, opacity: 0.5 },
  grid: { flexDirection: 'row' },
  gridItem: { flex: 1 },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 6 },
  value: { fontSize: 20, fontWeight: '900' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 10, fontWeight: '900', marginHorizontal: 28, marginBottom: 16, letterSpacing: 2 },
  durationScroll: { paddingHorizontal: 24, gap: 12 },
  durationPill: { width: 62, height: 62, borderRadius: 31, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  durationText: { fontSize: 15, fontWeight: '900' },
  costCard: { marginHorizontal: 24, padding: 24, borderRadius: 32 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  costLabel: { fontSize: 14, fontWeight: '600', opacity: 0.9 },
  costValue: { fontSize: 14, fontWeight: '900' },
  costDivider: { height: 0.5, marginTop: 10, marginBottom: 20, opacity: 0.3 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  totalValue: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  infoSection: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 28, marginTop: 8 },
  infoText: { fontSize: 12, fontWeight: '600', lineHeight: 18, flex: 1, opacity: 0.8 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  footerInner: { flex: 1, paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 20, justifyContent: 'center', borderTopWidth: 0.5 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorText: { fontSize: 18, fontWeight: '900', textAlign: 'center', marginTop: 20, lineHeight: 28 },
});
