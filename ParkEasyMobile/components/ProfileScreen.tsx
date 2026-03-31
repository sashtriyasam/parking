import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Dimensions, 
  Platform,
  StatusBar,
  ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  FadeIn, 
  SlideInUp, 
  Layout, 
  ZoomIn 
} from 'react-native-reanimated';
import { get } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Button } from './ui/Button';
import { GlassCard } from './ui/GlassCard';
import { Skeleton } from './ui/SkeletonLoader';
import { colors } from '../constants/colors';

const { width, height } = Dimensions.get('window');

interface ProviderStats {
  revenue?: {
    month: number;
    total: string | number;
  };
  active_bookings?: number;
  occupancy?: number;
}

interface CustomerStats {
  bookings?: number;
  parked_hours?: number;
  savings?: number;
  wallet?: {
    balance: string | number;
  };
}

type ProfileStats = ProviderStats | CustomerStats;

export function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const userName = user?.full_name || 'GUEST OPERATOR';
  const role = user?.role?.toUpperCase() || 'EXTERNAL NODE';
  const isProvider = role === 'PROVIDER';

  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const endpoint = isProvider ? '/provider/dashboard/stats' : '/customer/stats';
        const res = await get(endpoint);
        setStats(res.data.data);
      } catch (e) {
        console.error('Error fetching profile stats', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isProvider]);

  const handleWalletAction = () => {
    if (isProvider) {
      router.push('/(provider)/earnings');
    } else {
      Alert.alert(
        "WALLET ENCRYPTION",
        "Direct fund injection is temporarily locked. Universal Payment Interface (UPI) is available at transaction endpoints.",
        [{ text: "ACKNOWLEDGE" }]
      );
    }
  };

  const handleLogout = async () => {
    Alert.alert('SYSTEM DE-AUTHORIZATION', 'Confirm permanent disconnection from current session?', [
      { text: 'ABORT', style: 'cancel' },
      { 
        text: 'DISCONNECT', 
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        }
      }
    ]);
  };

  const renderStats = () => {
    if (loading || !stats) {
      return (
        <View style={styles.statsSkeleton}>
          <Skeleton width="100%" height={70} borderRadius={20} />
        </View>
      );
    }

    let statItems: { label: string; value: string | number; icon: string }[] = [];
    if (isProvider) {
      const s = stats as ProviderStats;
      statItems = [
        { label: 'REVENUE', value: `₹${((s.revenue?.month || 0) / 1000).toFixed(1)}k`, icon: 'cash-outline' },
        { label: 'ACTIVE', value: s.active_bookings || 0, icon: 'flash-outline' },
        { label: 'CAPACITY', value: `${s.occupancy || 0}%`, icon: 'business-outline' },
      ];
    } else {
      const s = stats as CustomerStats;
      statItems = [
        { label: 'LOGS', value: s.bookings || 0, icon: 'ticket-outline' },
        { label: 'UPTIME', value: `${s.parked_hours || 0}h`, icon: 'time-outline' },
        { label: 'CREDITS', value: `₹${s.savings || 0}`, icon: 'wallet-outline' },
      ];
    }

    return (
      <Animated.View entering={FadeInDown.delay(300).duration(800)} style={styles.statsRow}>
        <BlurView intensity={15} tint="light" style={StyleSheet.absoluteFill} />
        {statItems.map((item, index) => (
          <React.Fragment key={item.label}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
            {index < statItems.length - 1 && <View style={styles.statDivider} />}
          </React.Fragment>
        ))}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Layer */}
      <View style={styles.bgContainer}>
        <LinearGradient
          colors={['#080a0f', '#020617']}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.glowPoint, { top: '10%', left: '-20%', backgroundColor: colors.premium.primary, opacity: 0.1 }]} />
        <View style={[styles.glowPoint, { bottom: '20%', right: '-30%', backgroundColor: colors.premium.secondary, opacity: 0.08 }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Identity Header */}
        <Animated.View entering={FadeIn.duration(1000)} style={styles.headerArea}>
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={[colors.premium.primary, colors.premium.secondary]}
              style={styles.avatarBorder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.avatarInner}>
                <Text style={styles.avatarText}>{userName.charAt(0)}</Text>
              </View>
            </LinearGradient>
            <Animated.View entering={ZoomIn.delay(500)} style={styles.avatarGlow} />
            <TouchableOpacity 
              style={styles.editBtn} 
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Edit profile photo"
              accessibilityHint="Opens the camera or gallery to update your avatar"
            >
              <BlurView accessible={false} intensity={40} tint="dark" style={styles.editBlur}>
                <Ionicons name="camera-outline" size={16} color="white" />
              </BlurView>
            </TouchableOpacity>
          </View>

          <View style={styles.identityText}>
            <Text style={styles.identityLabel}>AUTHORIZED OPERATOR</Text>
            <Text style={styles.identityName}>{userName.toUpperCase()}</Text>
            <View style={styles.securityTag}>
              <LinearGradient
                colors={['rgba(0, 242, 255, 0.15)', 'rgba(0, 242, 255, 0.05)']}
                style={styles.tagGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="shield-checkmark" size={10} color={colors.premium.primary} />
                <Text style={styles.tagText}>{role}</Text>
              </LinearGradient>
            </View>
          </View>

          {renderStats()}
        </Animated.View>

        <View style={styles.mainBody}>
          {/* Asset Monitor Card */}
          <Animated.View entering={FadeInDown.delay(500).springify()}>
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={handleWalletAction}
              accessibilityRole="button"
              accessibilityLabel={isProvider ? "View operational revenue" : "View network credits"}
            >
              <BlurView intensity={25} tint="dark" style={styles.walletCard}>
                <LinearGradient
                  colors={[colors.premium.primary + '15', 'transparent']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={styles.assetHeader}>
                  <View style={styles.assetIconBox}>
                    <Ionicons name="diamond-outline" size={22} color={colors.premium.primary} />
                  </View>
                  <View style={styles.assetInfo}>
                    <Text style={styles.assetLabel}>{isProvider ? 'OPERATIONAL REVENUE' : 'NETWORK CREDITS'}</Text>
                    <Text style={styles.assetValue}>
                      ₹{isProvider 
                        ? ((stats as ProviderStats)?.revenue?.total || '0.00') 
                        : ((stats as CustomerStats)?.wallet?.balance || '0.00')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
                </View>
              </BlurView>
            </TouchableOpacity>
          </Animated.View>

          <Section title="PROTOCOL SETTINGS">
            <MenuOption 
              icon="finger-print-outline" 
              label="Bio-Identity & Access" 
              onPress={() => router.push('/settings/personal-info')} 
            />
            <MenuOption 
              icon={isProvider ? "construct-outline" : "car-sport-outline"} 
              label={isProvider ? "Node Management" : "Vehicle Signatures"} 
              onPress={() => router.push(isProvider ? '/(provider)/(tabs)' : '/vehicles')} 
            />
            <MenuOption 
              icon="flash-outline" 
              label="Payment Protocols" 
              onPress={() => router.push('/payments')} 
            />
            <MenuOption 
              icon="notifications-outline" 
              label="System Alerts" 
              isLast
            />
          </Section>

          <Section title="ENVIRONMENT">
            <MenuOption 
              icon="color-palette-outline" 
              label="Interface Theme" 
              value="KINETIC ETHER"
            />
            <MenuOption 
              icon="globe-outline" 
              label="Regional Node" 
              value="IN-NORTH-01" 
              isLast
            />
          </Section>

          <Section title="SUPPORT & CLEARANCE">
            <MenuOption icon="help-buoy-outline" label="Documentation" onPress={() => router.push('/(customer)/support/faq')} />
            <MenuOption icon="chatbubbles-outline" label="Comms Channel" onPress={() => router.push('/(customer)/support/contact')} />
            <MenuOption icon="document-text-outline" label="Terms of Service" isLast />
          </Section>

          <TouchableOpacity 
            style={styles.deAuthAction} 
            onPress={handleLogout} 
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Terminate session"
          >
            <BlurView intensity={20} tint="dark" style={styles.deAuthBlur}>
              <Ionicons name="power-outline" size={20} color="#FF5B5B" />
              <Text style={styles.deAuthLabel}>TERMINATE SESSION</Text>
            </BlurView>
          </TouchableOpacity>

          <Text style={styles.buildTag}>SYSTEM CORE v2.4.0-STABLE</Text>
          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <BlurView intensity={10} tint="dark" style={styles.sectionCard}>
        {children}
      </BlurView>
    </View>
  );
}

interface MenuOptionProps {
  icon: any; // Using any for icon name compatibility with Ionicons
  label: string;
  onPress?: () => void;
  isLast?: boolean;
  value?: string | number;
}

function MenuOption({ icon, label, onPress, isLast, value }: MenuOptionProps) {
  return (
    <TouchableOpacity 
      style={[styles.menuItem, !isLast && styles.menuBorder]} 
      onPress={onPress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={`${label}${value ? `, current value: ${value}` : ''}`}
    >
      <View style={styles.menuLeft}>
        <View style={styles.menuIconContainer}>
          <Ionicons name={icon} size={18} color="rgba(255,255,255,0.6)" />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <View style={styles.menuRight}>
        {value && <Text style={styles.menuValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.2)" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080a0f',
  },
  bgContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glowPoint: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerArea: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 24,
  },
  avatarBorder: {
    width: 104,
    height: 104,
    borderRadius: 52,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    flex: 1,
    width: '100%',
    borderRadius: 50,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarText: {
    fontSize: 44,
    fontWeight: '900',
    color: 'white',
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  avatarGlow: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.premium.primary,
    opacity: 0.2,
    zIndex: -1,
    // iOS Shadow for Glow
    shadowColor: colors.premium.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    // Android elevation (simulated glow)
    elevation: 8,
  },
  editBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    borderRadius: 18,
    overflow: 'hidden',
  },
  editBlur: {
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  identityText: {
    alignItems: 'center',
    marginBottom: 32,
  },
  identityLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.premium.primary,
    letterSpacing: 3,
    marginBottom: 8,
  },
  identityName: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -0.5,
  },
  securityTag: {
    marginTop: 12,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 255, 0.2)',
  },
  tagGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.premium.primary,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 24,
    paddingVertical: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statsSkeleton: {
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: 'white',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignSelf: 'center',
  },
  mainBody: {
    paddingHorizontal: 20,
  },
  walletCard: {
    borderRadius: 28,
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetIconBox: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  assetInfo: {
    flex: 1,
  },
  assetLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    marginBottom: 4,
  },
  assetValue: {
    fontSize: 22,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 0.5,
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2.5,
    marginBottom: 16,
    marginLeft: 8,
  },
  sectionCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  menuBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.premium.primary,
    opacity: 0.8,
  },
  deAuthAction: {
    marginTop: 40,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 91, 91, 0.2)',
  },
  deAuthBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 12,
  },
  deAuthLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FF5B5B',
    letterSpacing: 1.5,
  },
  buildTag: {
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 2,
    marginTop: 32,
  },
});
