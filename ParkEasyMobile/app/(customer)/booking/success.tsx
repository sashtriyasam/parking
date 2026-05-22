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
  ScrollView,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as MediaLibrary from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  FadeInDown,
  FadeInUp
} from 'react-native-reanimated';

import { useBookingFlowStore } from '../../../store/bookingFlowStore';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useHaptics } from '../../../hooks/useHaptics';
import { ProfessionalCard } from '../../../components/ui/ProfessionalCard';
import { ProfessionalButton } from '../../../components/ui/ProfessionalButton';

const { width } = Dimensions.get('window');
const FOOTER_SPACER_HEIGHT = 160;

export default function BookingSuccessScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const haptics = useHaptics();
  const { created_ticket_id, facility_name, vehicle_number, resetBookingFlow } = useBookingFlowStore();
  const qrRef = useRef<View>(null);

  const [status, requestPermission] = MediaLibrary.usePermissions();
  const iconScale = useSharedValue(0);

  // Only trigger animations and haptics once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (status === null) {
      requestPermission();
    }
    iconScale.value = withSpring(1, { damping: 10, stiffness: 300 });
    haptics.notificationSuccess();
  }, []);

  // Reset booking flow state when leaving the success screen
  // Uses cleanup function so data is still available while on this screen
  useEffect(() => {
    return () => resetBookingFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  if (!created_ticket_id || !facility_name || !vehicle_number) {
    return (
      <View style={[styles.centerError, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.primary} />
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>DATA RECOVERY ERROR</Text>
        <ProfessionalButton label="Return to Home" onPress={() => router.replace('/(customer)/')} style={{marginTop: 32, width: 220}} />
      </View>
    );
  }

  const handleDone = () => {
    haptics.impactLight();
    resetBookingFlow();
    router.replace('/(customer)/tickets');
  };

  const handleShare = async () => {
    haptics.impactLight();
    try {
      await Share.share({
        message: `ParkEasy Confirmation: My parking ticket for ${facility_name}\nVehicle: ${vehicle_number}\nTicket ID: ${created_ticket_id}`,
      });
    } catch (error: any) {
      Alert.alert('ERROR', error.message);
    }
  };

  const handleSave = async () => {
    haptics.impactLight();
    if (status?.status !== 'granted') {
      const { status: newStatus } = await requestPermission();
      if (newStatus !== 'granted') {
        Alert.alert('ACCESS DENIED', 'Storage permission required to save ticket.');
        return;
      }
    }

    try {
      const localUri = await captureRef(qrRef, { format: 'png', quality: 1 });
      await MediaLibrary.saveToLibraryAsync(localUri);
      Alert.alert('SUCCESS', 'Parking Pass saved to your gallery.');
    } catch (error) {
      console.error(error);
      Alert.alert('ERROR', 'Could not save the ticket.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topSection}>
           <Animated.View style={[styles.iconContainer, { backgroundColor: colors.success + '15' }, animatedIconStyle]}>
              <Ionicons name="checkmark-sharp" size={52} color={colors.success} />
           </Animated.View>
           <Animated.Text entering={FadeInDown.delay(200)} style={[styles.title, { color: colors.textPrimary }]}>Securely Booked</Animated.Text>
           <Animated.Text entering={FadeInDown.delay(300)} style={[styles.subtitle, { color: colors.textMuted }]}>Your digital parking pass is active and verified for {facility_name}.</Animated.Text>
        </View>

        <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.ticketSection}>
          <View ref={qrRef} collapsable={false} style={styles.ticketWrapper}>
            <ProfessionalCard style={styles.passCard}>
              {/* Pass Top Branding */}
              <View style={styles.passBranding}>
                 <View style={[styles.brandingIcon, { backgroundColor: colors.primary }]}>
                    <Ionicons name="car-sport" size={14} color="#FFF" />
                 </View>
                 <Text style={[styles.brandingText, { color: colors.textPrimary }]}>ParkEasy Universal Pass</Text>
                 <View style={[styles.statusBadge, { backgroundColor: colors.success + '15' }]}>
                    <Text style={[styles.statusLabel, { color: colors.success }]}>ACTIVE</Text>
                 </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Facility Info */}
              <View style={styles.passInfo}>
                 <Text style={[styles.infoLabel, { color: colors.textMuted }]}>FACILITY IDENTIFIER</Text>
                 <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{facility_name}</Text>
              </View>

              <View style={styles.qrArea}>
                 <View style={[styles.qrWrapper, { borderColor: colors.border, backgroundColor: '#FFF' }]}>
                    <QRCode
                       value={created_ticket_id}
                       size={180}
                       color="#000"
                       backgroundColor="#FFF"
                    />
                 </View>
              </View>

              <View style={styles.detachableDivider}>
                 <View style={[styles.notchi, { backgroundColor: colors.background, left: -10, borderRightWidth: 0.5, borderColor: colors.border }]} />
                 <View style={[styles.dash, { borderBottomColor: colors.border }]} />
                 <View style={[styles.notchi, { backgroundColor: colors.background, right: -10, borderLeftWidth: 0.5, borderColor: colors.border }]} />
              </View>

              <View style={styles.passDetails}>
                 <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                       <Text style={[styles.dLabel, { color: colors.textMuted }]}>ENTITY ID</Text>
                       <Text style={[styles.dValue, { color: colors.textPrimary }]}>{vehicle_number}</Text>
                    </View>
                    <View style={styles.detailItem}>
                       <Text style={[styles.dLabel, { color: colors.textMuted }]}>SEQUENCE</Text>
                       <Text style={[styles.dValue, { color: colors.textPrimary }]}>{created_ticket_id.substring(0, 10).toUpperCase()}</Text>
                    </View>
                 </View>
                 <Text style={[styles.footerHint, { color: colors.textMuted }]}>PRESENT ENCRYPTED QR AT TERMINAL</Text>
              </View>
            </ProfessionalCard>
          </View>
        </Animated.View>

        <View style={styles.actions}>
           <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleSave}
              accessibilityLabel="Export pass"
              accessibilityRole="button"
           >
              <Ionicons name="cloud-download-outline" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.textPrimary }]}>Export Pass</Text>
           </TouchableOpacity>
           <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleShare}
              accessibilityLabel="Broadcast pass"
              accessibilityRole="button"
           >
              <Ionicons name="share-social-outline" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.textPrimary }]}>Broadcast</Text>
           </TouchableOpacity>
        </View>

        <View style={{ height: FOOTER_SPACER_HEIGHT }} />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Platform.OS === 'ios' ? 40 : 20, borderTopColor: colors.border }]}>
         <ProfessionalButton 
            label="View My Tickets" 
            onPress={handleDone} 
            variant="primary"
         />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingVertical: 24 },
  topSection: { alignItems: 'center', paddingHorizontal: 20, marginBottom: 24 },
  iconContainer: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 13, fontWeight: '400', textAlign: 'center', opacity: 0.8, lineHeight: 18 },
  ticketSection: { paddingHorizontal: 16, marginBottom: 20 },
  ticketWrapper: { borderRadius: 16, overflow: 'hidden' },
  passCard: { padding: 0, borderRadius: 16, overflow: 'hidden' },
  passBranding: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  brandingIcon: { width: 28, height: 28, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  brandingText: { fontSize: 14, fontWeight: '700', flex: 1, letterSpacing: -0.2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  divider: { height: 0.5, opacity: 0.3 },
  passInfo: { padding: 20 },
  infoLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  infoValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  qrArea: { alignItems: 'center', paddingVertical: 16 },
  qrWrapper: { padding: 12, borderRadius: 16, borderWidth: 1 },
  detachableDivider: { height: 24, flexDirection: 'row', alignItems: 'center' },
  notchi: { position: 'absolute', width: 18, height: 18, borderRadius: 9, top: 3 },
  dash: { flex: 1, height: 0.5, borderStyle: 'dashed', marginHorizontal: 16, borderWidth: 1, borderColor: 'transparent', borderBottomColor: '#888', opacity: 0.2 },
  passDetails: { padding: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  detailItem: { gap: 2 },
  dLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, opacity: 0.6 },
  dValue: { fontSize: 15, fontWeight: '700' },
  footerHint: { fontSize: 9, fontWeight: '700', textAlign: 'center', marginTop: 4, letterSpacing: 1, opacity: 0.5 },
  actions: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  actionBtn: { flex: 1, height: 44, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, gap: 8 },
  actionText: { fontSize: 13, fontWeight: '600' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 0.5 },
  centerError: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorText: { fontSize: 18, fontWeight: '900', marginTop: 20 }
});
