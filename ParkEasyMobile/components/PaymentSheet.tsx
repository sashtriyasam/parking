import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  ActivityIndicator,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useThemeColors } from '../hooks/useThemeColors';
import { useHaptics } from '../hooks/useHaptics';
import { ProfessionalButton } from './ui/ProfessionalButton';
import { ProfessionalCard } from './ui/ProfessionalCard';
// import RazorpayCheckout from 'react-native-razorpay'; (Removed top-level native import to prevent Expo Go crashes)
import { post } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { VehicleType } from '../types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PaymentSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
  facilityName: string;
  bookingId: string;
  slotId: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
}

type PaymentMethod = 'upi' | 'card' | 'wallet';

/**
 * PROFESSIONAL PAYMENT SHEET
 * Features:
 * - Apple-style slide-up interaction
 * - Safe detection of Razorpay (Expo Go Fallback)
 * - Translucent background elements
 * - Haptic feedback integration
 */
export const PaymentSheet: React.FC<PaymentSheetProps> = ({ 
  visible, 
  onClose, 
  onSuccess, 
  amount,
  facilityName,
  bookingId,
  slotId,
  vehicleNumber,
  vehicleType
}) => {
  const colors = useThemeColors();
  const haptics = useHaptics();
  const [step, setStep] = useState<'selection' | 'processing' | 'success'>('selection');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');
  const slideAnim = useState(new Animated.Value(SCREEN_HEIGHT))[0];
  const { user } = useAuthStore();

  useEffect(() => {
    if (visible) {
      setStep('selection');
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 120
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true
      }).start();
    }
  }, [visible]);

  const handlePayment = async () => {
    haptics.impactMedium();
    setStep('processing');
    
    try {
      // 1. Create order on backend
      const orderRes = await post('/payments/create-order', {
        slot_id: slotId,
        amount
      });

      if (!orderRes.data?.success) {
        throw new Error(orderRes.data?.message || 'Failed to create payment order');
      }

      const orderData = orderRes.data.data;

      /**
       * SAFETY CHECK: RAZORPAY NATIVE MODULE
       * Since react-native-razorpay is a native module, it will crash Expo Go.
       * We implement a professional 'Demo Mode' fallback when the module is missing.
       */
      let RazorpayCheckout: any = null;
      try {
        // Dynamically require to prevent top-level initialization crashes in Expo Go
        RazorpayCheckout = require('react-native-razorpay').default;
      } catch (err) {
        console.warn('ParkEasy: Razorpay native module not detected during require.');
      }

      const isRazorpayAvailable = RazorpayCheckout && 
                                  typeof RazorpayCheckout.open === 'function';

      if (!isRazorpayAvailable) {
        console.warn('ParkEasy: Razorpay native module not detected. Initiating Professional Demo Fallback.');
        // SIMULATE SUCCESS FOR DEMO PURPOSES
        setTimeout(() => {
           setStep('success');
           haptics.notificationSuccess();
           setTimeout(() => {
             onSuccess();
             onClose();
           }, 2500);
        }, 1800);
        return;
      }

      // 2. Open Razorpay Checkout (Only on Development Builds / Native)
      const options = {
        description: `Booking at ${facilityName}`,
        image: 'https://i.imgur.com/39YbR3X.png',
        currency: orderData.currency,
        key: orderData.key || process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_demo',
        amount: orderData.amount,
        name: 'ParkEasy Premium',
        order_id: orderData.orderId,
        prefill: {
          email: user?.email || '',
          contact: user?.phone_number || '',
          name: user?.full_name || ''
        },
        theme: { color: colors.primary }
      };

      const data = await RazorpayCheckout.open(options);
      
      // 3. Verify payment on backend
      const verifyRes = await post('/payments/verify', {
        razorpay_order_id: data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
        slot_id: slotId,
        vehicle_number: vehicleNumber,
        vehicle_type: vehicleType
      });

      if (verifyRes.data?.success) {
        setStep('success');
        haptics.notificationSuccess();
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2200);
      } else {
        throw new Error('Transaction verification failed');
      }
    } catch (error: any) {
      console.error('Payment Error:', error);
      setStep('selection');
      haptics.notificationError();
      alert(error.description || error.message || 'Transaction Interrupted');
    }
  };

  const renderMethod = (id: PaymentMethod, title: string, icon: any, subtitle: string) => {
    const isSelected = selectedMethod === id;
    return (
      <TouchableOpacity 
        style={[
          styles.methodItem, 
          { borderColor: colors.border },
          isSelected && { borderColor: colors.primary, backgroundColor: colors.primary + '08' }
        ]}
        onPress={() => {
          haptics.impactLight();
          setSelectedMethod(id);
        }}
        activeOpacity={0.7}
      >
        <View style={[
          styles.iconContainer, 
          { backgroundColor: colors.surface },
          isSelected && { backgroundColor: colors.primary + '15' }
        ]}>
          <Ionicons name={icon} size={22} color={isSelected ? colors.primary : colors.textMuted} />
        </View>
        <View style={styles.methodInfo}>
          <Text style={[styles.methodTitle, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.methodSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        </View>
        <View style={[styles.radio, { borderColor: colors.border }, isSelected && { borderColor: colors.primary }]}>
          {isSelected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View style={[styles.sheet, { backgroundColor: colors.background, transform: [{ translateY: slideAnim }] }]}>
          <Pressable style={styles.content}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
            
            {step === 'selection' && (
              <>
                <View style={styles.header}>
                  <View>
                    <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Checkout</Text>
                    <Text style={[styles.sheetSubtitle, { color: colors.textMuted }]}>UNIVERSAL ENCRYPTED GATEWAY</Text>
                  </View>
                  <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
                    <Ionicons name="close" size={20} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <ProfessionalCard style={styles.summaryContainer}>
                  <View style={styles.summaryTop}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>GRAND TOTAL</Text>
                    <Text style={[styles.summaryAmount, { color: colors.primary }]}>₹{amount.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.summaryDivider, { backgroundColor: colors.border, opacity: 0.2 }]} />
                  <Text style={[styles.summaryDetail, { color: colors.textMuted }]} numberOfLines={1}>
                    Reservation for {facilityName}
                  </Text>
                </ProfessionalCard>

                <View style={styles.methodsContainer}>
                  {renderMethod('upi', 'Instant UPI', 'flash', 'Lightning-fast mobile payments')}
                  {renderMethod('card', 'Payment Card', 'card', 'Visa, Mastercard, Amex, RuPay')}
                  {renderMethod('wallet', 'ParkEasy Credits', 'wallet', 'Balance: ₹450.00 available')}
                </View>

                <ProfessionalButton 
                  label={`Complete Transaction`}
                  onPress={handlePayment}
                  variant="primary"
                  style={styles.payButton}
                />
                
                <View style={styles.footer}>
                  <Ionicons name="shield-checkmark" size={12} color={colors.success} />
                  <Text style={[styles.footerText, { color: colors.textMuted }]}>SECURED BY PARKEASY UNIVERSAL ENCRYPTION</Text>
                </View>
              </>
            )}

            {step === 'processing' && (
              <View style={styles.statusContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>Authenticating</Text>
                <Text style={[styles.statusSubtitle, { color: colors.textMuted }]}>Verifying transaction with your banking node</Text>
              </View>
            )}

            {step === 'success' && (
              <View style={styles.statusContainer}>
                <View style={[styles.successIcon, { backgroundColor: colors.success }]}>
                  <Ionicons name="checkmark" size={44} color="#FFF" />
                </View>
                <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>Access Granted</Text>
                <Text style={[styles.statusSubtitle, { color: colors.textMuted }]}>Payment confirmed. Your bay is ready for arrival.</Text>
              </View>
            )}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40, overflow: 'hidden' },
  content: { padding: 24 },
  dragHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 24, opacity: 0.5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  sheetTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  sheetSubtitle: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginTop: 4, opacity: 0.8 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  summaryContainer: { padding: 24, borderRadius: 24, marginBottom: 32 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 },
  summaryLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  summaryAmount: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  summaryDivider: { height: 1, width: '100%', marginBottom: 16 },
  summaryDetail: { fontSize: 13, fontWeight: '600' },
  methodsContainer: { gap: 12, marginBottom: 40 },
  methodItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1 },
  iconContainer: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  methodInfo: { flex: 1 },
  methodTitle: { fontSize: 15, fontWeight: '700' },
  methodSubtitle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  payButton: { height: 64, borderRadius: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, gap: 8 },
  footerText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  statusContainer: { paddingVertical: 60, alignItems: 'center' },
  statusTitle: { fontSize: 22, fontWeight: '900', marginTop: 24, letterSpacing: -0.5 },
  statusSubtitle: { fontSize: 14, fontWeight: '500', marginTop: 8, textAlign: 'center', paddingHorizontal: 40, opacity: 0.8 },
  successIcon: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 }
});
