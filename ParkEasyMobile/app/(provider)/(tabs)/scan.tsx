import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator,
  Platform,
  StatusBar,
  Modal
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useNetInfo } from '@react-native-community/netinfo';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { post, get } from '../../../services/api';
import { useToast } from '../../../components/Toast';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useHaptics } from '../../../hooks/useHaptics';
import { ProfessionalButton } from '../../../components/ui/ProfessionalButton';
import { ProfessionalCard } from '../../../components/ui/ProfessionalCard';

const { width, height } = Dimensions.get('window');
const scanAreaSize = width * 0.72;

interface ScanResult {
  status: 'success' | 'warning' | 'error';
  action?: 'ENTRY' | 'EXIT';
  message: string;
  ticket?: {
    id: string;
    vehicle_number: string;
    vehicle_type: string;
    status: string;
    entry_time?: string;
    exit_time?: string;
    total_fee?: number;
    slot?: {
      slot_number: string;
    };
    facility?: {
      name: string;
    };
  };
}

export default function QRScannerScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const haptics = useHaptics();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const { showToast } = useToast();
  const [result, setResult] = useState<ScanResult | null>(null);
  
  const netInfo = useNetInfo();
  const isConnected = netInfo.isConnected ?? false;
  
  const scanLineY = useSharedValue(0);
  const resetTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, [permission]);

  useEffect(() => {
    scanLineY.value = withRepeat(
      withSequence(
        withTiming(scanAreaSize - 4, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, []);

  const animatedLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
    opacity: withTiming(scanned ? 0 : 1, { duration: 200 }),
  }));

  if (!permission || !permission.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: '#000000' }]}>
        <StatusBar barStyle="light-content" />
        
        <Animated.View entering={ZoomIn.duration(600)} style={[styles.permissionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.permIconWrapper, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="camera" size={42} color={colors.primary} />
          </View>
          <Text style={[styles.permTitle, { color: colors.textPrimary }]}>Camera Access Required</Text>
          <Text style={[styles.permSubtitle, { color: colors.textSecondary }]}>
            Verify digital tickets by scanning secure QR codes at your facility entrance.
          </Text>
          <ProfessionalButton 
            label="Grant Permission" 
            onPress={() => {
              haptics.impactMedium();
              requestPermission();
            }} 
            variant="primary" 
            style={{ width: '100%' }}
          />
        </Animated.View>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    haptics.impactMedium();

    try {
      let ticketId = data;
      try {
        const parsed = JSON.parse(data);
        ticketId = parsed.ticketId || data;
      } catch (e) {}

      // Step 1: Verification Flow
      const verifyRes = await get(`/provider/verify-ticket/${ticketId}`);
      const { ticket, recommended_action } = verifyRes.data.data;

      if (recommended_action === 'ENTRY') {
        // Step 2a: Entry Flow
        const entryRes = await post(`/provider/bookings/${ticketId}/mark-entry`);
        haptics.notificationSuccess();
        setResult({
          status: 'success',
          action: 'ENTRY',
          message: `Entry confirmed for ${ticket.vehicle_number}. Spot assigned.`,
          ticket: entryRes.data.data || ticket
        });
      } else if (recommended_action === 'EXIT') {
        // Step 2b: Exit Flow
        const exitRes = await post('/bookings/checkout', { ticket_id: ticketId });
        const ticketData = exitRes.data?.data;

        if (ticketData?.payment_status === 'PENDING') {
          haptics.notificationWarning();
          setResult({
            status: 'warning',
            action: 'EXIT',
            message: `Checkout warning: Payment is still pending. Fee: ₹${ticketData.total_fee || ticket.total_fee || 0}.`,
            ticket: ticketData || ticket
          });
        } else {
          haptics.notificationSuccess();
          setResult({
            status: 'success',
            action: 'EXIT',
            message: `Exit confirmed for ${ticket.vehicle_number}. Space cleared.`,
            ticket: ticketData || ticket
          });
        }
      } else {
        haptics.notificationError();
        setResult({
          status: 'error',
          message: `This ticket is already ${ticket.status}.`,
          ticket: ticket
        });
      }
    } catch (error: any) {
      console.error('Scan error:', error);
      haptics.notificationError();
      const serverMsg = error.response?.data?.message;
      setResult({
        status: 'error',
        message: serverMsg || 'Invalid ticket: QR code not recognized.'
      });
    } finally {
      setLoading(false);
      resetTimer.current = setTimeout(() => {
        handleReset();
      }, 30000); // 30s timeout
    }
  };

  const handleReset = () => {
    haptics.impactLight();
    setScanned(false);
    setResult(null);
    setLoading(false);
    if (resetTimer.current) clearTimeout(resetTimer.current);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        enableTorch={torchEnabled}
      >
        {/* Dark translucent masking viewport */}
        <View style={styles.maskContainer}>
          <View style={styles.maskRow} />
          
          <View style={styles.maskMiddleRow}>
            <View style={styles.maskSide} />
            <View style={styles.cutout} />
            <View style={styles.maskSide} />
          </View>
          
          <View style={styles.maskRow} />
        </View>

        {/* Floating Overlay Controls & Labels */}
        <View style={styles.overlayContainer}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
              <BlurView intensity={25} tint="dark" style={styles.navBlur}>
                <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
              </BlurView>
            </TouchableOpacity>
            
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>TICKET SCANNER</Text>
              <Text style={styles.headerSubtitle}>{isConnected ? 'LIVE SYNCED' : 'OFFLINE MODE'}</Text>
            </View>

            <TouchableOpacity 
              style={styles.navBtn} 
              onPress={() => {
                haptics.impactLight();
                setTorchEnabled(!torchEnabled);
              }}
            >
              <BlurView intensity={25} tint="dark" style={styles.navBlur}>
                <Ionicons name={torchEnabled ? "flashlight" : "flashlight-outline"} size={20} color="#FFFFFF" />
              </BlurView>
            </TouchableOpacity>
          </View>

          {/* Centered Viewfinder frame indicators */}
          <View style={styles.scanViewport}>
            <View style={styles.targetFrame}>
              <View style={[styles.corner, styles.tl, { borderColor: colors.primary }]} />
              <View style={[styles.corner, styles.tr, { borderColor: colors.primary }]} />
              <View style={[styles.corner, styles.bl, { borderColor: colors.primary }]} />
              <View style={[styles.corner, styles.br, { borderColor: colors.primary }]} />

              {!scanned && (
                <Animated.View style={[styles.scanLine, animatedLineStyle]}>
                  <LinearGradient
                    colors={['transparent', colors.primary, 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={[styles.lineGlow, { backgroundColor: colors.primary }]} />
                </Animated.View>
              )}

              {loading && (
                <View style={styles.processingMask}>
                  <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.processingText}>VERIFYING...</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.footer}>
            {!result && !loading && (
              <Animated.View entering={FadeIn.delay(300)} style={styles.hintContainer}>
                 <Text style={styles.hintText}>POSITION QR CODE INSIDE FRAME</Text>
              </Animated.View>
            )}
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(0,0,0,0.6)', borderColor: 'rgba(255,255,255,0.15)' }]}>
               <View style={[styles.statusDot, { backgroundColor: isConnected ? colors.success : colors.warning }]} />
               <Text style={styles.statusLabel}>{isConnected ? 'LIVE CLOUD LINK' : 'CHECK CONNECTION'}</Text>
            </View>
          </View>
        </View>
      </CameraView>

      {/* Valid vs Invalid Overlay Card Modal */}
      <Modal visible={result !== null} transparent animationType="fade" onRequestClose={handleReset}>
        <BlurView intensity={70} tint="dark" style={styles.modalBackdrop}>
          <Animated.View entering={ZoomIn.duration(400)} style={styles.modalContainer}>
            {result && (
              <ProfessionalCard style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={[
                    styles.resultIconWrapper, 
                    { backgroundColor: result.status === 'success' ? colors.success + '15' : result.status === 'warning' ? colors.warning + '15' : colors.error + '15' }
                  ]}>
                    <Ionicons 
                      name={result.status === 'success' ? 'checkmark-circle-outline' : result.status === 'warning' ? 'alert-circle-outline' : 'close-circle-outline'} 
                      size={44} 
                      color={result.status === 'success' ? colors.success : result.status === 'warning' ? colors.warning : colors.error} 
                    />
                  </View>
                  <Text style={[
                    styles.resultStatus,
                    { color: result.status === 'success' ? colors.success : result.status === 'warning' ? colors.warning : colors.error }
                  ]}>
                    {result.status === 'success' ? 'ACCESS GRANTED' : result.status === 'warning' ? 'PAYMENT PENDING' : 'ACCESS DENIED'}
                  </Text>
                  <Text style={[styles.resultMsg, { color: colors.textSecondary }]}>{result.message}</Text>
                </View>

                {/* Booking stats grid */}
                {result.ticket && (
                  <View style={[styles.statsGrid, { borderColor: colors.border }]}>
                    <View style={styles.statRow}>
                      <View style={styles.statCell}>
                        <Text style={[styles.statLabelText, { color: colors.textSecondary }]}>VEHICLE</Text>
                        <Text style={[styles.statValueText, { color: colors.textPrimary }]}>
                          {result.ticket.vehicle_number}
                        </Text>
                      </View>
                      <View style={styles.statCell}>
                        <Text style={[styles.statLabelText, { color: colors.textSecondary }]}>SPOT</Text>
                        <Text style={[styles.statValueText, { color: colors.textPrimary }]}>
                          {result.ticket.slot?.slot_number || 'N/A'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.statRow}>
                      <View style={styles.statCell}>
                        <Text style={[styles.statLabelText, { color: colors.textSecondary }]}>TYPE</Text>
                        <Text style={[styles.statValueText, { color: colors.textPrimary }]}>
                          {result.ticket.vehicle_type?.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.statCell}>
                        <Text style={[styles.statLabelText, { color: colors.textSecondary }]}>TOTAL FEE</Text>
                        <Text style={[styles.statValueText, { color: colors.primary }]}>
                          ₹{result.ticket.total_fee || 0}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                <ProfessionalButton
                   label="Scan Next Ticket"
                   onPress={handleReset}
                   variant="primary"
                   style={styles.scanNextBtn}
                />
              </ProfessionalCard>
            )}
          </Animated.View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  maskContainer: { ...StyleSheet.absoluteFillObject },
  maskRow: { flex: 1, backgroundColor: 'rgba(0,0,0,0.68)' },
  maskMiddleRow: { height: scanAreaSize, flexDirection: 'row' },
  maskSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.68)' },
  cutout: { width: scanAreaSize, backgroundColor: 'transparent' },
  overlayContainer: { ...StyleSheet.absoluteFillObject },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
  },
  navBtn: { width: 40, height: 40, borderRadius: 12, overflow: 'hidden' },
  navBlur: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { alignItems: 'center' },
  headerTitle: { fontSize: 12, fontWeight: '900', color: '#FFFFFF', letterSpacing: 3 },
  headerSubtitle: { fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: '800', marginTop: 4, letterSpacing: 1 },
  scanViewport: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  targetFrame: { width: scanAreaSize, height: scanAreaSize, position: 'relative' },
  corner: { position: 'absolute', width: 28, height: 28, borderWidth: 3.5 },
  tl: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 16 },
  tr: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 16 },
  bl: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 16 },
  br: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 16 },
  scanLine: { width: '100%', height: 3, position: 'absolute', zIndex: 10 },
  lineGlow: { position: 'absolute', width: '100%', height: 12, top: -5, opacity: 0.35 },
  processingMask: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 50, borderRadius: 16, overflow: 'hidden' },
  processingText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', marginTop: 14, letterSpacing: 2 },
  footer: { paddingBottom: 60, alignItems: 'center' },
  hintContainer: { marginBottom: 24 },
  hintText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 0.5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 8, color: 'rgba(255,255,255,0.5)', fontWeight: '800', letterSpacing: 0.8 },
  permissionContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  permissionCard: { width: '100%', padding: 28, borderRadius: 16, borderWidth: 0.5, alignItems: 'center' },
  permIconWrapper: { width: 64, height: 64, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  permTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4, marginBottom: 8, textAlign: 'center' },
  permSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, fontWeight: '500', marginBottom: 28 },
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', maxWidth: 360 },
  resultCard: { padding: 24, borderRadius: 16, alignItems: 'center', width: '100%' },
  resultHeader: { alignItems: 'center', width: '100%', marginBottom: 20 },
  resultIconWrapper: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  resultStatus: { fontSize: 18, fontWeight: '800', marginBottom: 8, letterSpacing: -0.3 },
  resultMsg: { fontSize: 13, textAlign: 'center', fontWeight: '500', lineHeight: 18, paddingHorizontal: 8 },
  statsGrid: { borderTopWidth: 0.5, borderBottomWidth: 0.5, paddingVertical: 16, width: '100%', gap: 12, marginBottom: 24 },
  statRow: { flexDirection: 'row', width: '100%' },
  statCell: { flex: 1 },
  statLabelText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  statValueText: { fontSize: 15, fontWeight: '700' },
  scanNextBtn: { width: '100%' }
});
