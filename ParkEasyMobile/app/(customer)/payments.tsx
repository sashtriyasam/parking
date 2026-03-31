import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  FadeIn, 
  SlideInUp, 
  ZoomIn, 
  Layout 
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/Toast';


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
  { id: '1', type: 'upi', label: 'GOOGLE PAY', value: 'shivam@okaxis', isDefault: true, icon: 'logo-google', accent: '#4285F4' },
  { id: '2', type: 'card', label: 'HDFC CREDIT', value: '**** **** **** 4242', expiry: '12/28', isDefault: false, icon: 'card', accent: '#E30B5C' },
];

export default function PaymentsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(PAYMENT_METHODS);

  const handleDelete = (id: string) => {
    Alert.alert('PURGE METHOD', 'Are you sure you want to de-link this financial node?', [
      { text: 'KEEP', style: 'cancel' },
      { text: 'REMOVE', style: 'destructive', onPress: () => {
        setPaymentMethods(prev => prev.filter(m => m.id !== id));
      }}
    ]);
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(prev => prev.map(m => ({ ...m, isDefault: m.id === id })));
    showToast('Primary node synchronized', 'success');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Deep Space Background Layer */}
      <View style={styles.bgWrapper}>
        <LinearGradient
          colors={['#080a0f', '#020617']}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.glowPoint, { top: '30%', right: '-30%', backgroundColor: colors.premium.secondary, opacity: 0.1 }]} />
      </View>

      <Animated.View entering={SlideInUp.duration(600)} style={styles.header}>
        <BlurView intensity={30} tint="dark" style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerLabel}>FINANCIAL INTERFACE</Text>
            <Text style={styles.headerTitle}>CRYPTO & WALLET</Text>
          </View>
          <View style={styles.secureTag}>
            <View style={styles.secureDot} />
            <Text style={styles.secureText}>SAFE-MODE</Text>
          </View>
        </BlurView>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Holographic Balance Segment */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <BlurView intensity={25} tint="dark" style={styles.walletCard}>
            <LinearGradient
              colors={[colors.premium.primary + '20', colors.premium.secondary + '10']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.walletDetails}>
              <View>
                <Text style={styles.walletLabel}>NETWORK LIQUIDITY</Text>
                <Text style={styles.walletBalance}>₹0.00</Text>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardInfoText}>ACTIVE ASSETS: {paymentMethods.length}</Text>
                </View>
              </View>
              <View style={styles.iconContainer}>
                <Ionicons name="wallet-outline" size={32} color={colors.premium.primary} />
                <View style={[styles.glowRing, { borderColor: colors.premium.primary + '50' }]} />
              </View>
            </View>
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => showToast('Credit system offline', 'info')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.premium.primary, colors.premium.secondary]}
                style={styles.actionGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="flash-outline" size={16} color="white" />
                <Text style={styles.actionText}>INJECT CREDITS</Text>
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SYNCHRONIZED NODES</Text>
          <View style={styles.sectionLine} />
        </View>

        {paymentMethods.map((method, index) => (
          <Animated.View 
            key={method.id} 
            entering={FadeInDown.delay(index * 120 + 300).springify()}
            layout={Layout.springify()}
          >
            <BlurView intensity={15} tint="dark" style={styles.methodCard}>
              <LinearGradient
                colors={[method.accent + '15', 'transparent']}
                start={{ x: 0, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.methodIconBox, { borderColor: method.accent + '50' }]}>
                <Ionicons name={method.icon} size={20} color={method.accent} />
              </View>

              <View style={styles.methodTexts}>
                <View style={styles.methodHeader}>
                  <Text style={styles.methodLabel}>{method.label}</Text>
                  {method.isDefault && (
                    <BlurView intensity={20} tint="light" style={styles.activeTag}>
                      <Text style={styles.activeTagText}>PRIMARY</Text>
                    </BlurView>
                  )}
                </View>
                <Text style={styles.methodValue}>{method.value}</Text>
              </View>

              <View style={styles.methodActions}>
                {!method.isDefault && (
                  <TouchableOpacity
                    style={styles.ctrlBtn}
                    onPress={() => handleSetDefault(method.id)}
                  >
                    <Ionicons name="star-outline" size={18} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.ctrlBtn, styles.ctrlBtnDanger]}
                  onPress={() => handleDelete(method.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="rgba(255, 91, 91, 0.5)" />
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInDown.delay(600).springify()}>
          <TouchableOpacity 
            style={styles.addTrigger} 
            activeOpacity={0.8}
            onPress={() => showToast('Protocol creation locked', 'info')}
          >
            <BlurView intensity={10} tint="light" style={styles.addBlur}>
              <View style={styles.addIconBox}>
                <Ionicons name="add" size={24} color={colors.premium.primary} />
              </View>
              <View>
                <Text style={styles.addTitle}>REGISTER NEW PROTOCOL</Text>
                <Text style={styles.addSub}>ADD UPI, CARD OR SECURE LINK</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
            </BlurView>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(800)} style={styles.securitySeal}>
          <BlurView intensity={15} tint="dark" style={styles.sealBlur}>
            <View style={styles.sealIconBox}>
              <Ionicons name="finger-print-outline" size={26} color={colors.premium.primary} />
            </View>
            <View style={styles.sealContent}>
              <Text style={styles.sealTitle}>QUANTUM ENCRYPTION ACTIVE</Text>
              <Text style={styles.sealDescription}>Financial vectors are protected by E2E 256-bit encryption. PCI-DSS Level 4 Compliant Infrastructure.</Text>
            </View>
          </BlurView>
        </Animated.View>
      </ScrollView>
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
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  header: {
    zIndex: 100,
  },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  headerTitleBox: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 2,
    marginTop: 4,
  },
  secureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
  },
  secureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
    shadowColor: '#34d399',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  secureText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#34d399',
    letterSpacing: 1,
  },
  content: {
    padding: 20,
    paddingTop: 32,
    paddingBottom: 80,
  },
  walletCard: {
    borderRadius: 32,
    padding: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 40,
  },
  walletDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  walletLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.premium.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  walletBalance: {
    fontSize: 36,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -1,
  },
  cardInfo: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardInfoText: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    opacity: 0.2,
  },
  actionBtn: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  actionGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  actionText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
    marginRight: 16,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  methodIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
  },
  methodTexts: {
    flex: 1,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  methodLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 0.5,
  },
  activeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  activeTagText: {
    fontSize: 7,
    fontWeight: '900',
    color: colors.premium.primary,
    letterSpacing: 1,
  },
  methodValue: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  methodActions: {
    flexDirection: 'row',
    gap: 8,
  },
  ctrlBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  ctrlBtnDanger: {
    backgroundColor: 'rgba(255, 91, 91, 0.03)',
  },
  addTrigger: {
    marginTop: 16,
    marginBottom: 40,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  addBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  addIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.premium.primary + '30',
  },
  addTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 1.5,
  },
  addSub: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1,
    marginTop: 4,
  },
  securitySeal: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.1)',
  },
  sealBlur: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    gap: 16,
  },
  sealIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(52, 211, 153, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealContent: {
    flex: 1,
  },
  sealTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#34d399',
    letterSpacing: 2,
    marginBottom: 6,
  },
  sealDescription: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 18,
    fontWeight: '600',
  },
});
