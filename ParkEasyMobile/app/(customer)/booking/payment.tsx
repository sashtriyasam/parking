import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

import { useBookingFlowStore } from '../../../store/bookingFlowStore';
import { post } from '../../../services/api';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useHaptics } from '../../../hooks/useHaptics';
import { PaymentSheet } from '../../../components/PaymentSheet';
import { useToast } from '../../../components/Toast';
import { ProfessionalCard } from '../../../components/ui/ProfessionalCard';
import { ProfessionalButton } from '../../../components/ui/ProfessionalButton';

const withAlpha = (hex: string, alpha: number): string => {
  if (!hex || !hex.startsWith('#')) return hex;
  let normalized = hex.slice(1);
  if (normalized.length === 3 || normalized.length === 4) {
    normalized = normalized.split('').map(c => c + c).join('');
  }
  const alphaHex = Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, '0').toUpperCase();
  if (normalized.length === 8) {
    return `#${normalized.slice(0, 6).toUpperCase()}${alphaHex}`;
  } else if (normalized.length === 6) {
    return `#${normalized.toUpperCase()}${alphaHex}`;
  }
  return hex;
};

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
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 minutes hold timer

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatHoldTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Fallbacks if user navigated directly without data
  if (!facility_id || !selected_slot) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.primary} />
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>
          Session recovery failed. Please re-initiate your booking flow.
        </Text>
        <ProfessionalButton 
          label="Return to Home" 
          onPress={() => router.replace('/(customer)/')} 
          style={{ marginTop: 24, width: 220 }} 
        />
      </View>
    );
  }

  const costPerHour = selected_slot.price_per_hour || 0;
  const totalCost = costPerHour * duration;

  const handleProceedToPayment = () => {
    if (secondsLeft <= 0) {
      showToast('Hold reservation expired. Please restart selection.', 'error');
      return;
    }
    haptics.impactMedium();
    if (!facility_id || !selected_slot || !vehicle_number) {
      showToast('Missing booking details.', 'error');
      return;
    }
    setShowPaymentSheet(true);
  };

  const handlePaymentSuccess = async () => {
    setLoading(true);
    try {
      const payload = {
        facility_id,
        slot_id: selected_slot.id,
        vehicle_number,
        vehicle_type: vehicle_type || 'car',
        payment_method: selected_payment_method || 'upi',
        duration,
        start_time: new Date().toISOString()
      };

      const res = await post('/bookings', payload);
      const booking = res.data.data;

      setCreatedTicket(booking.id);
      haptics.notificationSuccess();
      router.replace('/(customer)/booking/success');
    } catch (e: any) {
      console.error('Booking Creation Error', e);
      showToast(e.response?.data?.message || 'Booking failed. Please contact support.', 'error');
      setLoading(false);
      setShowPaymentSheet(false);
    }
  };

  const durations = [1, 2, 4, 8, 12, 24];
  const bookingRef = useMemo(() => Math.random().toString(36).substring(7).toUpperCase(), []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.navBtn, { backgroundColor: colors.surface }]} 
          onPress={() => {
            haptics.impactLight();
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleBox}>
           <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>BOOKING PIPELINE</Text>
           <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Secure Checkout</Text>
        </View>
      </View>

      {/* 3-Step Apple Progress Bar */}
      <View style={[styles.progressBarContainer, { borderBottomColor: colors.border }]}>
        <View style={styles.progressRow}>
          <View style={styles.stepContainer}>
            <View style={[styles.stepCircle, { backgroundColor: withAlpha(colors.primary, 0.15) }]}>
              <Ionicons name="checkmark" size={14} color={colors.primary} />
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>Vehicle</Text>
          </View>
          
          <View style={[styles.stepLine, { backgroundColor: colors.primary }]} />
          
          <View style={styles.stepContainer}>
            <View style={[styles.stepCircle, { backgroundColor: colors.primary }]}>
              <Ionicons name="time" size={14} color="#FFFFFF" />
            </View>
            <Text style={[styles.stepText, { color: colors.primary, fontWeight: '700' }]}>Duration</Text>
          </View>
          
          <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
          
          <View style={styles.stepContainer}>
            <View style={[styles.stepCircle, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
              <Text style={[styles.stepNumber, { color: colors.textSecondary }]}>3</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>Payment</Text>
          </View>
        </View>
      </View>

      {/* Yellow / Orange Countdown Banner */}
      <View style={[
        styles.timerBanner, 
        { 
          backgroundColor: withAlpha(colors.warning, 0.08), 
          borderColor: withAlpha(colors.warning, 0.2) 
        }
      ]}>
        <Ionicons name="hourglass-outline" size={14} color={colors.warning} />
        <Text style={[styles.timerText, { color: colors.warning }]}>
          Holding slot <Text style={{ fontWeight: '700' }}>{selected_slot.slot_number}</Text> for next <Text style={{ fontWeight: '700' }}>{formatHoldTime(secondsLeft)}</Text>
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)}>
          {/* Order Summary Card */}
          <ProfessionalCard style={styles.summaryCard} hasVibrancy={true}>
            <View style={styles.badgeRow}>
              <View style={[styles.summaryBadge, { backgroundColor: withAlpha(colors.primary, 0.1) }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>SECURE SESSION</Text>
              </View>
              <Text style={[styles.timestamp, { color: colors.textSecondary }]}>REF: {bookingRef}</Text>
            </View>

            <Text style={[styles.facilityName, { color: colors.textPrimary }]}>{facility_name}</Text>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>ALLOCATED SLOT</Text>
                <Text style={[styles.value, { color: colors.textPrimary }]}>{selected_slot.slot_number}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>VEHICLE REG.</Text>
                <Text style={[styles.value, { color: colors.textPrimary }]}>{vehicle_number}</Text>
              </View>
            </View>
          </ProfessionalCard>

          {/* Section: Duration Selector */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DURATION PREFERENCE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.durationScroll}>
              {durations.map((d) => {
                const isSelected = duration === d;
                return (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.durationPill, 
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => {
                      haptics.impactLight();
                      setDuration(d);
                    }}
                  >
                    <Text style={[
                      styles.durationText, 
                      { color: colors.textSecondary }, 
                      isSelected && { color: '#FFFFFF' }
                    ]}>
                      {d}H
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Section: Financial Summary */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>FINANCIAL SUMMARY</Text>
            <ProfessionalCard style={styles.costCard}>
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, { color: colors.textSecondary }]}>Rate / Cycle</Text>
                <Text style={[styles.costValue, { color: colors.textPrimary }]}>₹{Number(costPerHour).toFixed(2)}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, { color: colors.textSecondary }]}>Duration Multiplier (x{duration})</Text>
                <Text style={[styles.costValue, { color: colors.textPrimary }]}>₹{totalCost.toFixed(2)}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, { color: colors.textSecondary }]}>Convenience Fee</Text>
                <Text style={[styles.costValue, { color: colors.textPrimary }]}>₹0.00</Text>
              </View>
              
              <View style={[styles.costDivider, { backgroundColor: colors.border }]} />
              
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>TOTAL DUE</Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>₹{totalCost.toFixed(2)}</Text>
              </View>
            </ProfessionalCard>
          </View>

          <View style={styles.infoSection}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Secure encrypted payments powered by Razorpay.
            </Text>
          </View>
        </Animated.View>
        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.footer}>
        <BlurView intensity={30} tint={colors.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[styles.footerInner, { borderTopColor: colors.border, borderTopWidth: 0.5 }]}>
          <ProfessionalButton
            label="Initialize Secure Payment"
            onPress={handleProceedToPayment}
            loading={loading || secondsLeft <= 0}
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
  header: { 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingHorizontal: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 16, 
    marginBottom: 16 
  },
  navBtn: { 
    width: 38, 
    height: 38, 
    borderRadius: 19, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerTitleBox: { flex: 1 },
  headerLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  progressBarContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepContainer: {
    alignItems: 'center',
    gap: 4,
    width: 60,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 10,
    fontWeight: '500',
  },
  stepLine: {
    flex: 1,
    height: 1,
    marginHorizontal: 8,
    marginTop: -16,
  },
  timerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scrollContent: { paddingVertical: 16, paddingHorizontal: 20 },
  summaryCard: { padding: 20, borderRadius: 12, marginBottom: 24 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  summaryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  timestamp: { fontSize: 10, fontWeight: '600' },
  facilityName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 16 },
  divider: { height: 0.5, marginBottom: 16, opacity: 0.3 },
  grid: { flexDirection: 'row' },
  gridItem: { flex: 1 },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  value: { fontSize: 18, fontWeight: '800' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '700', marginBottom: 12, letterSpacing: 1.2 },
  durationScroll: { gap: 10 },
  durationPill: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  durationText: { fontSize: 14, fontWeight: '700' },
  costCard: { padding: 20, borderRadius: 12 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  costLabel: { fontSize: 13, fontWeight: '500' },
  costValue: { fontSize: 13, fontWeight: '700' },
  costDivider: { height: 0.5, marginTop: 8, marginBottom: 16, opacity: 0.2 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  totalValue: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  infoSection: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, marginTop: 4 },
  infoText: { fontSize: 12, fontWeight: '400', flex: 1 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 96 },
  footerInner: { flex: 1, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 32 : 16, justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorText: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginTop: 16, lineHeight: 24 },
});
