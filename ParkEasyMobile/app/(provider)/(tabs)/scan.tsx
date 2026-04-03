import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator,
  Platform,
  StatusBar
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
import { post } from '../../../services/api';
import { useToast } from '../../../components/Toast';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useHaptics } from '../../../hooks/useHaptics';
import { ProfessionalButton } from '../../../components/ui/ProfessionalButton';

const { width } = Dimensions.get('window');
const scanAreaSize = width * 0.75;

export default function QRScannerScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const haptics = useHaptics();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const { showToast } = useToast();
  const [result, setResult] = useState<{ status: 'success' | 'warning' | 'error', message: string, data?: any } | null>(null);
  
  const netInfo = useNetInfo();
  const isConnected = netInfo.isConnected ?? false;
  
  const scanLineY = useSharedValue(0);
  const resetTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
    
    scanLineY.value = withRepeat(
      withSequence(
        withTiming(scanAreaSize, { duration: 2500, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, [permission]);

  const animatedLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
    opacity: withTiming(scanned ? 0 : 1, { duration: 200 }),
  }));

  if (!permission || !permission.granted) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
        
        <Animated.View entering={ZoomIn.duration(600)} style={[styles.permissionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.permIconWrapper, { backgroundColor: colors.primary + '10' }]}>
            <Ionicons name="camera" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.permTitle, { color: colors.textPrimary }]}>Camera Access</Text>
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

      const response = await post('/bookings/checkout', { ticket_id: ticketId });
      const ticketData = response.data?.data;

      if (ticketData?.payment_status === 'PENDING') {
        haptics.notificationError();
        setResult({
          status: 'warning',
          message: `Caution: Payment is still pending for this session.`
        });
      } else {
        haptics.notificationSuccess();
        setResult({
          status: 'success',
          message: `Verified: Space ${ticketData?.slot?.slot_number || 'N/A'} is cleared for exit.`,
          data: ticketData
        });
      }
    } catch (error: any) {
      haptics.notificationError();
      setResult({
        status: 'error',
        message: error.response?.data?.message || 'Verification Error: Invalid or expired ticket.'
      });
    } finally {
      setLoading(false);
      resetTimer.current = setTimeout(() => {
        handleReset();
      }, 15000);
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
        <LinearGradient 
          colors={['rgba(0,0,0,0.8)', 'transparent', 'rgba(0,0,0,0.8)']} 
          style={StyleSheet.absoluteFill} 
        />
        
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
              <BlurView intensity={20} tint="dark" style={styles.navBlur}>
                <Ionicons name="chevron-back" size={24} color="#FFF" />
              </BlurView>
            </TouchableOpacity>
            
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>SCANNER</Text>
              <Text style={styles.headerSubtitle}>{isConnected ? 'SECURELY CONNECTED' : 'OFFLINE MODE'}</Text>
            </View>

            <TouchableOpacity 
              style={[styles.navBtn, torchEnabled && { backgroundColor: 'rgba(255,255,255,0.2)' }]} 
              onPress={() => {
                haptics.impactLight();
                setTorchEnabled(!torchEnabled);
              }}
            >
              <BlurView intensity={20} tint="dark" style={styles.navBlur}>
                <Ionicons name={torchEnabled ? "flashlight" : "flashlight-outline"} size={22} color="#FFF" />
              </BlurView>
            </TouchableOpacity>
          </View>

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
                  <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.processingText}>VERIFYING TICKET...</Text>
                </View>
              )}

              {result && (
                <Animated.View entering={ZoomIn.duration(400)} style={styles.resultMask}>
                  <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
                  <View style={styles.resultContent}>
                    <View style={[
                      styles.resultIconWrapper, 
                      { backgroundColor: result.status === 'success' ? colors.success + '20' : result.status === 'warning' ? '#FACC1520' : colors.error + '20' }
                    ]}>
                      <Ionicons 
                        name={result.status === 'success' ? 'shield-checkmark' : result.status === 'warning' ? 'alert-circle' : 'close-circle'} 
                        size={48} 
                        color={result.status === 'success' ? colors.success : result.status === 'warning' ? '#FACC15' : colors.error} 
                      />
                    </View>
                    <Text style={[
                      styles.resultStatus,
                      { color: result.status === 'success' ? colors.success : result.status === 'warning' ? '#FACC15' : colors.error }
                    ]}>
                      {result.status === 'success' ? 'ACCESS GRANTED' : result.status === 'warning' ? 'PAYMENT PENDING' : 'ACCESS DENIED'}
                    </Text>
                    <Text style={styles.resultDetails}>{result.message}</Text>
                    
                    <ProfessionalButton
                       label="Scan Next"
                       onPress={handleReset}
                       variant="primary"
                       style={{ width: '100%' }}
                    />
                  </View>
                </Animated.View>
              )}
            </View>
          </View>

          <View style={styles.footer}>
            {!result && !loading && (
              <Animated.View entering={FadeIn.delay(500)} style={styles.hintContainer}>
                 <Text style={styles.hintText}>POSITION TICKET WITHIN THE FRAME</Text>
              </Animated.View>
            )}
            <View style={styles.statusSection}>
               <View style={[styles.statusDot, { backgroundColor: isConnected ? colors.success : colors.warning }]} />
               <Text style={styles.statusLabel}>{isConnected ? 'LIVE CLOUD LINK' : 'POOR CONNECTION'}</Text>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
  },
  navBtn: { width: 44, height: 44, borderRadius: 18, overflow: 'hidden' },
  navBlur: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { alignItems: 'center' },
  headerTitle: { fontSize: 13, fontWeight: '900', color: '#FFF', letterSpacing: 3 },
  headerSubtitle: { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '800', marginTop: 4, letterSpacing: 1 },
  scanViewport: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  targetFrame: { width: scanAreaSize, height: scanAreaSize, position: 'relative', borderRadius: 40, overflow: 'hidden' },
  corner: { position: 'absolute', width: 40, height: 40, borderWidth: 3 },
  tl: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 40 },
  tr: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 40 },
  bl: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 40 },
  br: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 40 },
  scanLine: { width: '100%', height: 3, position: 'absolute', zIndex: 10 },
  lineGlow: { position: 'absolute', width: '100%', height: 16, top: -7, opacity: 0.4 },
  processingMask: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  processingText: { color: '#FFF', fontSize: 11, fontWeight: '900', marginTop: 24, letterSpacing: 2 },
  resultMask: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  resultContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  resultIconWrapper: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  resultStatus: { fontSize: 20, fontWeight: '900', marginBottom: 12, letterSpacing: -0.5 },
  resultDetails: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22, fontWeight: '600', marginBottom: 40 },
  footer: { paddingBottom: 60, alignItems: 'center' },
  hintContainer: { marginBottom: 32 },
  hintText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  statusSection: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: '900', letterSpacing: 1 },
  permissionContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  permissionCard: { width: '100%', padding: 40, borderRadius: 32, borderWidth: 1, alignItems: 'center' },
  permIconWrapper: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  permTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginBottom: 12, textAlign: 'center' },
  permSubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, fontWeight: '600', marginBottom: 40 },
});
