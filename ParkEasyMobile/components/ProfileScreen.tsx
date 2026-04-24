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
  StatusBar
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
import { useThemeStore } from '../store/themeStore';
import { useThemeColors } from '../hooks/useThemeColors';
import { useHaptics } from '../hooks/useHaptics';
import { useToast } from './Toast';
import { ProfessionalCard } from './ui/ProfessionalCard';
import { Skeleton } from './ui/SkeletonLoader';


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
  const colors = useThemeColors();
  const haptics = useHaptics();
  const { theme, setTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const { showToast } = useToast();
  const userName = user?.full_name || 'GUEST USER';
  const role = user?.role?.toUpperCase() || 'USER';
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
    haptics.impactLight();
    if (isProvider) {
      router.push('/(provider)/earnings');
    } else {
      router.push('/payments');
    }
  };

  const toggleTheme = () => {
    haptics.impactMedium();
    const nextTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
    setTheme(nextTheme);
  };

  const handleLogout = async () => {
    haptics.impactLight();
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Sign Out', 
        style: 'destructive',
        onPress: async () => {
          haptics.impactLight();
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
          <Skeleton width="100%" height={80} borderRadius={28} />
        </View>
      );
    }

    let statItems: { label: string; value: string | number; icon: string }[] = [];
    if (isProvider) {
      const s = stats as ProviderStats;
      statItems = [
        { label: 'REVENUE', value: `₹${((Number(s.revenue?.month || 0)) / 1000).toFixed(1)}k`, icon: 'cash-outline' },
        { label: 'ACTIVE', value: s.active_bookings || 0, icon: 'flash-outline' },
        { label: 'CAPACITY', value: `${s.occupancy || 0}%`, icon: 'business-outline' },
      ];
    } else {
      const s = stats as CustomerStats;
      statItems = [
        { label: 'BOOKINGS', value: s.bookings || 0, icon: 'ticket-outline' },
        { label: 'PARKED', value: `${s.parked_hours || 0}h`, icon: 'time-outline' },
        { label: 'SAVINGS', value: `₹${s.savings || 0}`, icon: 'wallet-outline' },
      ];
    }

    return (
      <Animated.View entering={FadeInDown.delay(300).duration(800)} style={[styles.statsRow, { borderColor: colors.border }]}>
        <BlurView intensity={20} tint={colors.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        {statItems.map((item, index) => (
          <React.Fragment key={item.label}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{item.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{item.label}</Text>
            </View>
            {index < statItems.length - 1 && <View style={[styles.statDivider, { backgroundColor: colors.border }]} />}
          </React.Fragment>
        ))}
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      
      {/* Dynamic Ambiance */}
      <View style={styles.bgContainer}>
        <LinearGradient
          colors={colors.isDark ? ['#080a0f', '#020617'] : ['#F8FAFC', '#E2E8F0']}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.glowPoint, { top: '5%', left: '-20%', backgroundColor: colors.primary, opacity: colors.isDark ? 0.08 : 0.04 }]} />
        <View style={[styles.glowPoint, { bottom: '15%', right: '-30%', backgroundColor: colors.secondary || colors.primary, opacity: colors.isDark ? 0.06 : 0.03 }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Master Interface */}
        <Animated.View entering={FadeIn.duration(1000)} style={styles.masterHeader}>
          <View style={styles.avatarMasterWrapper}>
            <LinearGradient
              colors={[colors.primary, colors.secondary || colors.primary]}
              style={styles.avatarMasterBorder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={[styles.avatarMasterInner, { backgroundColor: colors.surface }]}>
                <Text style={[styles.avatarMasterText, { color: colors.textPrimary }]}>{userName.charAt(0).toUpperCase()}</Text>
              </View>
            </LinearGradient>
            <Animated.View 
              entering={ZoomIn.delay(500)} 
              style={[styles.avatarMasterGlow, { backgroundColor: colors.primary, opacity: colors.isDark ? 0.2 : 0.1 }]} 
            />
            <TouchableOpacity 
              style={[styles.cameraBtn, { borderColor: colors.border }]} 
              activeOpacity={0.7}
              onPress={() => {
                haptics.impactLight();
                showToast('Camera functionality coming soon', 'info');
              }}
            >
              <BlurView intensity={30} tint={colors.isDark ? 'dark' : 'light'} style={styles.cameraBtnBlur}>
                <Ionicons name="camera" size={14} color={colors.textPrimary} />
              </BlurView>
            </TouchableOpacity>
          </View>

          <View style={styles.identitySuite}>
            <Text style={[styles.sectionLabel, { color: colors.primary }]}>USER ACCOUNT</Text>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>{userName.toUpperCase()}</Text>
            <View style={[styles.roleBadge, { borderColor: colors.primary + '30' }]}>
              <LinearGradient
                colors={[colors.primary + '15', 'transparent']}
                style={styles.roleGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="shield-checkmark" size={10} color={colors.primary} />
                <Text style={[styles.roleText, { color: colors.primary }]}>{role} ACCESS</Text>
              </LinearGradient>
            </View>
          </View>

          {renderStats()}
        </Animated.View>

        <View style={styles.interfaceBody}>
          {/* Central Asset Ledger */}
          <Animated.View entering={FadeInDown.delay(400)}>
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={handleWalletAction}
            >
              <ProfessionalCard style={[styles.walletCard, { borderColor: colors.border }]}>
                <LinearGradient
                  colors={[colors.primary + '10', 'transparent']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <View style={styles.walletHeader}>
                  <View style={[styles.walletIconBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="wallet-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.walletInfo}>
                    <Text style={[styles.walletLabel, { color: colors.textMuted }]}>{isProvider ? 'TOTAL EARNINGS' : 'WALLET BALANCE'}</Text>
                    <Text style={[styles.walletValue, { color: colors.textPrimary }]}>
                      ₹{isProvider 
                        ? ((stats as ProviderStats)?.revenue?.total || '0.00') 
                        : ((stats as CustomerStats)?.wallet?.balance || '0.00')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </View>
              </ProfessionalCard>
            </TouchableOpacity>
          </Animated.View>

          <SettingsSection title="ACCOUNT SETTINGS" colors={colors}>
            <SettingsOption 
              icon="finger-print" 
              label="Biometric Verification" 
              onPress={() => haptics.impactLight()} 
              colors={colors}
            />
            <SettingsOption 
              icon={isProvider ? "construct" : "car-sport"} 
              label={isProvider ? "Manage Facilities" : "My Vehicles"} 
              onPress={() => {
                haptics.impactLight();
                router.push(isProvider ? '/(provider)/(tabs)' : '/vehicles');
              }} 
              colors={colors}
            />
            <SettingsOption 
              icon="card" 
              label="Payment Methods" 
              onPress={() => {
                haptics.impactLight();
                router.push('/payments');
              }} 
              colors={colors}
            />
            <SettingsOption 
              icon="notifications" 
              label="System Alerts" 
              isLast
              colors={colors}
            />
          </SettingsSection>

          <SettingsSection title="PREFERENCES" colors={colors}>
            <SettingsOption 
              icon="color-palette" 
              label="App Theme" 
              value={theme.toUpperCase()}
              onPress={toggleTheme}
              colors={colors}
            />
            <SettingsOption 
              icon="globe" 
              label="Region" 
              value="India" 
              isLast
              colors={colors}
            />
          </SettingsSection>

          <SettingsSection title="SUPPORT" colors={colors}>
            <SettingsOption 
              icon="help-buoy" 
              label="Help Center & FAQ" 
              onPress={() => {
                haptics.impactMedium();
                router.push('/(customer)/support/faq');
              }} 
              colors={colors} 
            />
            <SettingsOption 
              icon="chatbubbles" 
              label="Contact Support" 
              onPress={() => {
                haptics.impactMedium();
                router.push('/(customer)/support/contact');
              }} 
              colors={colors} 
            />
            <SettingsOption 
              icon="document-text" 
              label="Terms & Privacy" 
              isLast 
              colors={colors} 
            />
          </SettingsSection>

          <TouchableOpacity 
            style={[styles.logoutBtn, { borderColor: colors.error + '30' }]} 
            onPress={handleLogout} 
            activeOpacity={0.8}
          >
            <BlurView intensity={20} tint={colors.isDark ? 'dark' : 'light'} style={styles.logoutBlur}>
              <Ionicons name="power" size={20} color={colors.error} />
              <Text style={[styles.logoutLabel, { color: colors.error }]}>SIGN OUT</Text>
            </BlurView>
          </TouchableOpacity>

          <Text style={[styles.versionLabel, { color: colors.textMuted }]}>PARKEASY v2.8.5</Text>
          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function SettingsSection({ title, children, colors }: any) {
  return (
    <View style={styles.settingsSection}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title}</Text>
      <BlurView intensity={10} tint={colors.isDark ? 'dark' : 'light'} style={[styles.sectionSheet, { borderColor: colors.border }]}>
        {children}
      </BlurView>
    </View>
  );
}

function SettingsOption({ icon, label, onPress, isLast, value, colors }: any) {
  const content = (
    <View style={[
      styles.menuRow, 
      !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border + '15' },
      !onPress && { opacity: 0.5 }
    ]}>
      <View style={styles.menuLeft}>
        <View style={[styles.iconInnerBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name={icon} size={18} color={colors.textSecondary} />
        </View>
        <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{label}</Text>
      </View>
      <View style={styles.menuRight}>
        {value && <Text style={[styles.valueTag, { color: colors.primary }]}>{value}</Text>}
        {onPress && <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />}
      </View>
    </View>
  );

  if (!onPress) return content;

  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glowPoint: {
    position: 'absolute',
    width: 450,
    height: 450,
    borderRadius: 225,
  },
  scrollContent: {
    flexGrow: 1,
  },
  masterHeader: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingHorizontal: 24,
    paddingBottom: 44,
  },
  avatarMasterWrapper: {
    position: 'relative',
    marginBottom: 28,
  },
  avatarMasterBorder: {
    width: 110,
    height: 110,
    borderRadius: 38,
    padding: 3,
  },
  avatarMasterInner: {
    flex: 1,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMasterText: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  avatarMasterGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 38,
    zIndex: -1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cameraBtnBlur: {
    padding: 10,
  },
  identitySuite: {
    alignItems: 'center',
    marginBottom: 36,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  roleBadge: {
    marginTop: 14,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  roleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 28,
    paddingVertical: 22,
    overflow: 'hidden',
    borderWidth: 1,
  },
  statsSkeleton: {
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 6,
  },
  statDivider: {
    width: 1,
    height: 28,
    alignSelf: 'center',
    opacity: 0.2,
  },
  interfaceBody: {
    paddingHorizontal: 20,
  },
  walletCard: {
    borderRadius: 32,
    padding: 26,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 32,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
    borderWidth: 1,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 6,
  },
  walletValue: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  settingsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.5,
    marginBottom: 16,
    marginLeft: 10,
  },
  sectionSheet: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconInnerBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
    borderWidth: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  valueTag: {
    fontSize: 12,
    fontWeight: '900',
    opacity: 0.9,
  },
  logoutBtn: {
    marginTop: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  logoutBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 14,
  },
  logoutLabel: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  versionLabel: {
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 40,
    opacity: 0.5,
  },
});
