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
  const { created_ticket_id, facility_name = 'City Center Parking', vehicle_number = 'MH-01-AB-1234', resetBookingFlow } = useBookingFlowStore();
  const qrRef = useRef<View>(null);

  const [status, requestPermission] = MediaLibrary.usePermissions();
  const iconScale = useSharedValue(0);

  useEffect(() => {
    if (status === null) {
      requestPermission();
    }
    iconScale.value = withSpring(1, { damping: 10, stiffness: 300 });
    haptics.notificationSuccess();
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  if (!created_ticket_id) {
    return (
      <View style={[styles.centerError, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.primary} />
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>SESSION EXPIRED</Text>
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
              <Ionicons name="checkmark-sharp" size={80} color={colors.success} />
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
           >
              <Ionicons name="cloud-download-outline" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.textPrimary }]}>Export Pass</Text>
           </TouchableOpacity>
           <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleShare}
           >
              <Ionicons name="share-social-outline" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.textPrimary }]}>Broadcast</Text>
           </TouchableOpacity>
        </View>

        <View style={{ height: FOOTER_SPACER_HEIGHT }} />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Platform.OS === 'ios' ? 40 : 20, borderTopColor: colors.border }]}>
         <ProfessionalButton 
            label="Dismiss and Audit Tickets" 
            onPress={handleDone} 
            variant="primary"
         />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingVertical: 40 },
  topSection: { alignItems: 'center', paddingHorizontal: 30, marginBottom: 30 },
  iconContainer: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 5 },
  subtitle: { fontSize: 13, fontWeight: '600', textAlign: 'center', opacity: 0.7, lineHeight: 20 },
  ticketSection: { paddingHorizontal: 25, marginBottom: 25 },
  ticketWrapper: { borderRadius: 32, overflow: 'hidden' },
  passCard: { padding: 0, borderRadius: 32, overflow: 'hidden' },
  passBranding: { flexDirection: 'row', alignItems: 'center', padding: 24 },
  brandingIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  brandingText: { fontSize: 15, fontWeight: '900', flex: 1, letterSpacing: -0.2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  divider: { height: 0.5, opacity: 0.3 },
  passInfo: { padding: 24 },
  infoLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 6 },
  infoValue: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  qrArea: { alignItems: 'center', paddingVertical: 20 },
  qrWrapper: { padding: 16, borderRadius: 24, borderWidth: 1 },
  detachableDivider: { height: 30, flexDirection: 'row', alignItems: 'center' },
  notchi: { position: 'absolute', width: 22, height: 22, borderRadius: 11, top: 4 },
  dash: { flex: 1, height: 0.5, borderStyle: 'dashed', marginHorizontal: 20, borderWidth: 1, borderColor: 'transparent', borderBottomColor: '#888', opacity: 0.2 },
  passDetails: { padding: 24 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  detailItem: { gap: 4 },
  dLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, opacity: 0.6 },
  dValue: { fontSize: 16, fontWeight: '900' },
  footerHint: { fontSize: 9, fontWeight: '900', textAlign: 'center', marginTop: 8, letterSpacing: 1.5, opacity: 0.5 },
  actions: { flexDirection: 'row', paddingHorizontal: 25, gap: 15 },
  actionBtn: { flex: 1, height: 56, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, gap: 10 },
  actionText: { fontSize: 13, fontWeight: '800' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 25, paddingTop: 20, borderTopWidth: 0.5 },
  centerError: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorText: { fontSize: 18, fontWeight: '900', marginTop: 20 }
});
