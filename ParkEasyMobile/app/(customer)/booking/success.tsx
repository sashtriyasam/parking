import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Share, 
  Alert, 
  TouchableOpacity, 
  Platform, 
  Dimensions,
  ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import { useBookingFlowStore } from '../../../store/bookingFlowStore';
import { Button } from '../../../components/ui/Button';
import { GlassCard } from '../../../components/ui/GlassCard';
import { colors } from '../../../constants/colors';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  withSpring,
  interpolateColor,
  FadeInDown,
  FadeIn
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function BookingSuccessScreen() {
  const router = useRouter();
  const { created_ticket_id, facility_name, vehicle_number, resetBookingFlow } = useBookingFlowStore();
  const qrRef = useRef<View>(null);

  const [status, requestPermission] = MediaLibrary.usePermissions();

  // Premium Animations
  const glow = useSharedValue(0);
  const iconScale = useSharedValue(0);

  useEffect(() => {
    if (status === null) {
      requestPermission();
    }
    
    // Start animations
    glow.value = withRepeat(withTiming(1, { duration: 2000 }), -1, true);
    iconScale.value = withSpring(1, { damping: 10, stiffness: 100 });
  }, [status]);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    shadowColor: interpolateColor(glow.value, [0, 1], [colors.primary, colors.secondary]),
    shadowOpacity: 0.3 + (glow.value * 0.4),
    shadowRadius: 10 + (glow.value * 20),
    transform: [{ scale: 1 + (glow.value * 0.02) }]
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  if (!created_ticket_id) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={64} color={colors.danger} />
        <Text style={styles.errorText}>No ticket found. Return to home.</Text>
        <Button label="Go Home" onPress={() => router.replace('/(customer)/')} style={{marginTop: 24}} />
      </View>
    );
  }

  const handleDone = () => {
    resetBookingFlow();
    router.replace('/(customer)/tickets');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `My ParkEasy ticket for ${facility_name}\nVehicle: ${vehicle_number}\nTicket ID: ${created_ticket_id}`,
      });
    } catch (error: any) {
      Alert.alert('Share Failed', error.message);
    }
  };

  const handleSave = async () => {
    if (status?.status !== 'granted') {
      const { status: newStatus } = await requestPermission();
      if (newStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Need storage permission to save ticket.');
        return;
      }
    }

    try {
      const localUri = await captureRef(qrRef, {
        format: 'png',
        quality: 1,
      });

      await MediaLibrary.saveToLibraryAsync(localUri);
      Alert.alert('Success', 'Ticket saved to your gallery!');
    } catch (error) {
      console.error(error);
      Alert.alert('Save Failed', 'Could not save the image.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FFFFFF', '#F0F9FF']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '100%', backgroundColor: colors.success }]} />
        </View>
        <Text style={[styles.progressLabel, { color: colors.success }]}>Booking Complete</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(800).springify()} style={styles.alignCenter}>
          <Animated.View style={[styles.successIconContainer, animatedIconStyle]}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark" size={50} color="white" />
            </View>
          </Animated.View>
          
          <Text style={styles.title}>All Set!</Text>
          <Text style={styles.subtitle}>Your space at {facility_name} is reserved.</Text>

          <View ref={qrRef} collapsable={false} style={styles.ticketWrapper}>
            <Animated.View style={[styles.passContainer, animatedGlowStyle]}>
              <View style={styles.passHeader}>
                <Text style={styles.passTitle}>PARKING PASS</Text>
                <View style={styles.passIndicator} />
              </View>
              
              <View style={styles.qrSection}>
                <View style={styles.qrInner}>
                  <QRCode
                    value={created_ticket_id}
                    size={160}
                    color={colors.textPrimary}
                    backgroundColor="transparent"
                  />
                </View>
              </View>

              <View style={styles.passDivider}>
                <View style={[styles.notch, styles.notchLeft]} />
                <View style={styles.dashedLine} />
                <View style={[styles.notch, styles.notchRight]} />
              </View>

              <View style={styles.passFooter}>
                <View style={styles.footerRow}>
                  <View style={styles.footerItem}>
                    <Text style={styles.footerLabel}>VEHICLE</Text>
                    <Text style={styles.footerValue}>{vehicle_number}</Text>
                  </View>
                  <View style={styles.footerItem}>
                    <Text style={styles.footerLabel}>TICKET ID</Text>
                    <Text style={styles.footerValue}>#{created_ticket_id.substring(0, 8)}...</Text>
                  </View>
                </View>
                <Text style={styles.instructions}>Scan this code at the entrance</Text>
              </View>
            </Animated.View>
          </View>

          <View style={styles.actionGrid}>
            <GlassCard style={styles.actionCard} onPress={handleSave}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="download-outline" size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionText}>Save to Gallery</Text>
            </GlassCard>
            
            <GlassCard style={styles.actionCard} onPress={handleShare}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="share-social-outline" size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionText}>Share Ticket</Text>
            </GlassCard>
          </View>
        </Animated.View>
        <View style={{ height: 120 }} />
      </ScrollView>

      <GlassCard style={styles.bottomBar} intensity={90}>
        <Button 
          label="View My Tickets" 
          onPress={handleDone} 
          size="lg"
          variant="primary"
        />
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'white',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    backgroundColor: colors.surface,
    paddingBottom: 20,
    ...colors.shadows.sm,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingVertical: 32,
  },
  alignCenter: {
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...colors.shadows.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    fontWeight: '500',
    marginBottom: 40,
  },
  ticketWrapper: {
    width: width * 0.85,
    marginBottom: 40,
  },
  passContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...colors.shadows.lg,
  },
  passHeader: {
    backgroundColor: colors.textPrimary,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  passIndicator: {
    width: 30,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  qrSection: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  qrInner: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  passDivider: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'white',
  },
  notch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.background,
    position: 'absolute',
  },
  notchLeft: {
    left: -15,
  },
  notchRight: {
    right: -15,
  },
  // The conditional borderStyle (Platform.OS === 'android' ? 'solid' : 'dashed') is an 
  // intentional workaround for a React Native Android rendering limitation where 
  // borderStyle: 'dashed' does not display correctly. Using 'solid' preserves the 
  // layout on Android. Consider an SVG-based approach (e.g. react-native-svg) 
  // for uniform dashed lines if visual parity is required later.
  dashedLine: {
    flex: 1,
    marginHorizontal: 20,
    height: 1,
    borderRadius: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: Platform.OS === 'android' ? 'solid' : 'dashed',
  },
  passFooter: {
    padding: 24,
    backgroundColor: 'white',
    borderTopWidth: 0,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  footerItem: {
    gap: 4,
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  footerValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  instructions: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
    textAlign: 'center',
    opacity: 0.7,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 24,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    gap: 12,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 0,
    borderTopWidth: 1,
  },
});
