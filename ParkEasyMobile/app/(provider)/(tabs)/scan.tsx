import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator,
  Vibration,
  Platform
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
  ZoomIn,
  SlideInUp
} from 'react-native-reanimated';
import { post } from '../../../services/api';
import { useToast } from '../../../components/Toast';

const { width, height } = Dimensions.get('window');
const scanAreaSize = width * 0.75;

const COLORS = {
  background: 'black',
  text: 'white',
  success: '#34d399',
  warn: '#fbbf24',
  danger: '#f87171',
  overlay: 'rgba(8, 10, 15, 0.4)',
  muted: 'rgba(255, 255, 255, 0.6)',
  subtext: 'rgba(255, 255, 255, 0.7)',
  quiet: 'rgba(255, 255, 255, 0.4)',
  subtle: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.1)',
  black: '#000000',
};

export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const { showToast } = useToast();
  const [result, setResult] = useState<{ status: 'success' | 'warning' | 'error', message: string, data?: any } | null>(null);
  
  const scanLineY = useSharedValue(0);
  const resetTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
    
    scanLineY.value = withRepeat(
      withSequence(
        withTiming(scanAreaSize, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.quad) })
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
    opacity: withTiming(scanned ? 0 : 0.8, { duration: 200 }),
  }));

  if (!permission || !permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.bgWrapper}>
          <LinearGradient
            colors={['#0f1219', '#080a0f']}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <Animated.View entering={ZoomIn} style={styles.permissionCard}>
          <View style={styles.permissionIconContainer}>
            <Ionicons name="camera" size={40} color={COLORS.text} />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionSub}>
            Please grant camera access to scan customer checkout QR codes.
          </Text>
          <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
            <Text style={styles.grantBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    Vibration.vibrate([0, 50, 10, 50]);

    try {
      let ticketId = data;
      try {
        const parsed = JSON.parse(data);
        ticketId = parsed.ticketId || data;
      } catch (e) {}

      const response = await post('/bookings/checkout', { ticket_id: ticketId });
      const ticketData = response.data?.data;

      if (ticketData?.payment_status === 'PENDING') {
        setResult({
          status: 'warning',
          message: `Payment Pending. Please collect ₹${ticketData.total_fee} from the customer.`,
          data: ticketData
        });
      } else {
        const successMsg = ticketData?.slot?.slot_number 
          ? `Checkout verified for Slot ${ticketData.slot.slot_number}.`
          : 'Checkout verified successfully.';
          
        setResult({
          status: 'success',
          message: successMsg,
          data: ticketData
        });
      }
    } catch (error: any) {
      setResult({
        status: 'error',
        message: error.response?.data?.message || 'Invalid or expired QR code.'
      });
      Vibration.vibrate(200);
    } finally {
      setLoading(false);
      resetTimer.current = setTimeout(() => {
        handleReset();
      }, 10000);
    }
  };

  const handleReset = () => {
    setScanned(false);
    setResult(null);
    setLoading(false);
    if (resetTimer.current) clearTimeout(resetTimer.current);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        enableTorch={torchEnabled}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <BlurView intensity={30} tint="dark" style={styles.backBlur}>
                <Ionicons name="chevron-back" size={24} color={COLORS.text} />
              </BlurView>
            </TouchableOpacity>
            
            <View style={styles.headerInfo}>
              <Text style={styles.headerText}>Exit Scanner</Text>
              <Text style={styles.headerSubtext}>Scan checkout QR code</Text>
            </View>

            <TouchableOpacity 
              style={[styles.torchBtn, torchEnabled && styles.torchActive]} 
              onPress={() => setTorchEnabled(!torchEnabled)}
            >
              <BlurView intensity={30} tint="dark" style={styles.backBlur}>
                <Ionicons name={torchEnabled ? "flashlight" : "flashlight-outline"} size={22} color={COLORS.text} />
              </BlurView>
            </TouchableOpacity>
          </View>

          <View style={styles.scanArea}>
            <View style={styles.frameContainer}>
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />

              {!scanned && (
                <Animated.View style={[styles.scanLine, animatedLineStyle]} />
              )}

              {loading && (
                <BlurView intensity={60} tint="dark" style={styles.stateOverlay}>
                  <ActivityIndicator size="large" color={COLORS.text} />
                  <Text style={styles.stateText}>Processing...</Text>
                </BlurView>
              )}

              {result && (
                <Animated.View entering={ZoomIn} style={styles.stateOverlay}>
                  <BlurView intensity={90} tint="dark" style={styles.resultCard}>
                    <View style={[
                      styles.resultIcon, 
                      { backgroundColor: result.status === 'success' ? COLORS.success : result.status === 'warning' ? COLORS.warn : COLORS.danger }
                    ]}>
                      <Ionicons 
                        name={result.status === 'success' ? 'checkmark' : result.status === 'warning' ? 'alert' : 'close'} 
                        size={32} 
                        color={COLORS.black} 
                      />
                    </View>
                    <Text style={styles.resultTitle}>
                      {result.status === 'success' ? 'Verified' : result.status === 'warning' ? 'Action Needed' : 'Error'}
                    </Text>
                    <Text style={styles.resultBody}>{result.message}</Text>
                    
                    <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                      <Text style={styles.resetBtnText}>Scan Again</Text>
                    </TouchableOpacity>
                  </BlurView>
                </Animated.View>
              )}
            </View>
          </View>

          <View style={styles.footer}>
            {!result && !loading && (
              <Animated.View entering={FadeIn} style={styles.helpBox}>
                <Text style={styles.helpText}>Center the QR code within the frame</Text>
              </Animated.View>
            )}
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  backBlur: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtext: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  torchBtn: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  torchActive: {
    backgroundColor: COLORS.success,
  },
  scanArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameContainer: {
    width: scanAreaSize,
    height: scanAreaSize,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.text,
    borderWidth: 3,
  },
  tl: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 12 },
  tr: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 12 },
  bl: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 12 },
  br: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 12 },
  scanLine: {
    width: '100%',
    height: 2,
    backgroundColor: COLORS.text,
    position: 'absolute',
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  stateOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 50,
  },
  stateText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 15,
  },
  resultCard: {
    width: '100%',
    height: '100%',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  resultBody: {
    fontSize: 15,
    color: COLORS.subtext,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  resetBtn: {
    backgroundColor: COLORS.text,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  resetBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
  },
  footer: {
    paddingBottom: 80,
    alignItems: 'center',
  },
  helpBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  helpText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  bgWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  permissionCard: {
    width: '100%',
    backgroundColor: COLORS.subtle,
    borderRadius: 32,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  permissionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 25,
    backgroundColor: COLORS.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  permissionSub: {
    fontSize: 15,
    color: COLORS.quiet,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 35,
  },
  grantBtn: {
    width: '100%',
    backgroundColor: COLORS.text,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  grantBtnText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '600',
  },
});
