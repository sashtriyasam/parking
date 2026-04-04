import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Platform,
  StatusBar,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { 
  FadeInDown, 
  FadeIn, 
  SlideInUp, 
  Layout 
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptics } from '../../hooks/useHaptics';
import { useToast } from '../../components/Toast';
import { ProfessionalCard } from '../../components/ui/ProfessionalCard';
import { ProfessionalButton } from '../../components/ui/ProfessionalButton';

const { width } = Dimensions.get('window');

interface PaymentMethod {
  id: string;
  type: 'upi' | 'card' | 'wallet';
  label: string;
  value: string;
  expiry?: string;
  isDefault: boolean;
  icon: any;
  accent: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: '1', type: 'wallet', label: 'Apple Pay', value: 'Digital Wallet', isDefault: true, icon: 'logo-apple', accent: '#000000' },
  { id: '2', type: 'card', label: 'HDFC Priority Card', value: '•••• •••• •••• 4242', expiry: '12/28', isDefault: false, icon: 'card', accent: '#003366' },
];

export default function PaymentsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const haptics = useHaptics();
  const { showToast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(PAYMENT_METHODS);

  const handleDelete = (id: string) => {
    haptics.impactMedium();
    Alert.alert('Remove Method', 'Are you sure you want to remove this payment method from your account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        haptics.notificationSuccess();
        setPaymentMethods(prev => prev.filter(m => m.id !== id));
        showToast('Payment method removed', 'success');
      }}
    ]);
  };

  const handleSetDefault = (id: string) => {
    haptics.impactMedium();
    setPaymentMethods(prev => prev.map(m => ({ ...m, isDefault: m.id === id })));
    showToast('Default payment method updated', 'success');
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
            
            <View style={styles.headerTitleBox}>
               <Text style={[styles.headerLabel, { color: colors.textMuted }]}>ACCOUNT • PAYMENTS</Text>
               <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Wallet & Cards</Text>
            </View>

            <View style={[styles.secureBadge, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
               <Ionicons name="shield-checkmark" size={14} color={colors.success} />
               <Text style={[styles.secureText, { color: colors.success }]}>SECURE</Text>
            </View>
          </View>
        </BlurView>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Wallet Balance Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <ProfessionalCard style={styles.balanceCard} hasVibrancy={true}>
             <View style={styles.balanceHeader}>
                <View>
                   <Text style={[styles.balanceSub, { color: colors.textMuted }]}>AVAILABLE CREDITS</Text>
                   <Text style={[styles.balanceValue, { color: colors.textPrimary }]}>₹420.00</Text>
                </View>
                <View style={[styles.tokenIconBox, { backgroundColor: colors.primary + '15' }]}>
                   <Ionicons name="wallet-outline" size={28} color={colors.primary} />
                </View>
             </View>
             
             <View style={styles.balanceFooter}>
                <View style={[styles.usageTag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                   <Text style={[styles.usageText, { color: colors.textMuted }]}>AUTO-REFILL: OFF</Text>
                </View>
                <ProfessionalButton
                   label="Add Money"
                   onPress={() => showToast('Payment gateway offline', 'info')}
                   variant="primary"
                   style={{ minWidth: 120 }}
                />
             </View>
          </ProfessionalCard>
        </Animated.View>

        <View style={styles.sectionHeader}>
           <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PAYMENT METHODS</Text>
           <View style={[styles.titleLine, { backgroundColor: colors.border }]} />
        </View>

        {paymentMethods.map((method, index) => (
          <Animated.View 
            key={method.id} 
            entering={FadeInDown.delay(index * 100 + 400).duration(600)}
            layout={Layout.springify()}
          >
            <ProfessionalCard style={styles.methodCard} hasVibrancy={method.isDefault}>
              <View style={[styles.methodIconWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                 <Ionicons name={method.icon} size={24} color={method.accent || colors.textPrimary} />
              </View>

              <View style={styles.methodMain}>
                 <View style={styles.methodHeadRow}>
                    <Text style={[styles.methodName, { color: colors.textPrimary }]}>{method.label}</Text>
                    {method.isDefault && (
                       <View style={[styles.defaultTag, { backgroundColor: colors.primary + '15' }]}>
                          <Text style={[styles.defaultTagText, { color: colors.primary }]}>DEFAULT</Text>
                       </View>
                    )}
                 </View>
                 <Text style={[styles.methodDetail, { color: colors.textMuted }]}>{method.value}</Text>
              </View>

              <View style={styles.methodEndAction}>
                 {!method.isDefault ? (
                   <TouchableOpacity onPress={() => handleSetDefault(method.id)} style={styles.starBtn}>
                      <Ionicons name="star-outline" size={20} color={colors.textMuted} />
                   </TouchableOpacity>
                 ) : null}
                 <TouchableOpacity onPress={() => handleDelete(method.id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={20} color={colors.error + '95'} />
                 </TouchableOpacity>
              </View>
            </ProfessionalCard>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInDown.delay(700).duration(600)}>
          <TouchableOpacity 
            style={[styles.addMethodBox, { borderColor: colors.border }]} 
            onPress={() => showToast('Payment integration disabled', 'info')}
            activeOpacity={0.7}
          >
             <BlurView intensity={10} tint={colors.isDark ? 'dark' : 'light'} style={styles.addBlur}>
                <View style={[styles.plusCircle, { backgroundColor: colors.primary + '10' }]}>
                   <Ionicons name="add" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                   <Text style={[styles.addLabel, { color: colors.textPrimary }]}>Link New Payment Method</Text>
                   <Text style={[styles.addDescription, { color: colors.textMuted }]}>Add Credit Card, UPI, or Digital Wallet</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
             </BlurView>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(900).duration(800)} style={styles.securitySection}>
           <View style={[styles.securityIconBox, { backgroundColor: colors.success + '08' }]}>
              <Ionicons name="lock-closed-outline" size={24} color={colors.success} />
           </View>
           <View style={{ flex: 1 }}>
              <Text style={[styles.securityHeading, { color: colors.textPrimary }]}>End-to-End Encryption</Text>
              <Text style={[styles.securitySub, { color: colors.textSecondary }]}>
                Your payment information is tokenized and securely processed by our PCI-compliant partners. ParkEasy never stores your full card details.
              </Text>
           </View>
        </Animated.View>
      </ScrollView>

      <Animated.View entering={FadeInDown.delay(1000)} style={styles.stickyAction}>
         <ProfessionalButton
            label="Refresh Balances"
            onPress={() => showToast('Balances synchronized', 'success')}
            variant="outline"
            icon="sync-outline"
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
  headerTitleBox: { flex: 1 },
  headerLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  secureBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, gap: 6 },
  secureText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  scrollContent: { padding: 24, paddingBottom: 120 },
  balanceCard: { padding: 32, borderRadius: 40, marginBottom: 40 },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  balanceSub: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  balanceValue: { fontSize: 42, fontWeight: '900', letterSpacing: -1 },
  tokenIconBox: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  balanceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  usageTag: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  usageText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginRight: 16 },
  titleLine: { flex: 1, height: 1, opacity: 0.5 },
  methodCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 32, marginBottom: 16 },
  methodIconWrapper: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  methodMain: { flex: 1, marginLeft: 16 },
  methodHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  methodName: { fontSize: 16, fontWeight: '900', letterSpacing: -0.5 },
  defaultTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  defaultTagText: { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  methodDetail: { fontSize: 13, fontWeight: '600' },
  methodEndAction: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  starBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  addMethodBox: { marginTop: 16, borderRadius: 32, overflow: 'hidden', borderWidth: 1 },
  addBlur: { flexDirection: 'row', alignItems: 'center', padding: 24, gap: 16 },
  plusCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  addLabel: { fontSize: 15, fontWeight: '900', letterSpacing: -0.3 },
  addDescription: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  securitySection: { flexDirection: 'row', marginTop: 40, gap: 20, paddingHorizontal: 8 },
  securityIconBox: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  securityHeading: { fontSize: 15, fontWeight: '900', letterSpacing: -0.3, marginBottom: 6 },
  securitySub: { fontSize: 12, fontWeight: '600', lineHeight: 18 },
  stickyAction: { position: 'absolute', bottom: 40, left: 24, right: 24 },
});
