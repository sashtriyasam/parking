import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert, 
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { post } from '../../../services/api';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const scanAreaSize = width * 0.7;

export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);

    try {
      // Data is usually a JSON string with ticketId
      let ticketId = data;
      try {
        const parsed = JSON.parse(data);
        ticketId = parsed.ticketId || data;
      } catch (e) {
        // Fallback to raw data
      }

      const response = await post('/bookings/end', { ticket_id: ticketId });

      if (response.status === 200 || response.data?.status === 'success') {
        Alert.alert(
          'Check-out Successful',
          'The parking slot has been marked as FREE.',
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
      } else {
        throw new Error(response.data?.message || 'Failed to check out');
      }
    } catch (error: any) {
      console.error('Scan Error:', error);
      Alert.alert(
        'Check-out Failed',
        error.message || 'Invalid QR code or booking not found.',
        [{ text: 'Retry', onPress: () => setScanned(false) }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.surface} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan Ticket</Text>
          </View>

          <View style={styles.scanWrapper}>
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={colors.surface} />
                  <Text style={styles.loadingText}>Processing...</Text>
                </View>
              )}
            </View>
            <Text style={styles.hint}>Align the QR code within the frame</Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.torchButton, scanned && styles.buttonDisabled]} 
              onPress={() => setScanned(false)}
              disabled={!scanned}
            >
              <Ionicons name="refresh" size={24} color={colors.surface} />
              <Text style={styles.torchText}>Reset Scanner</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  scanWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    width: scanAreaSize,
    height: scanAreaSize,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: colors.primary,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  hint: {
    color: 'white',
    marginTop: 30,
    fontSize: 16,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 60,
    alignItems: 'center',
  },
  torchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  torchText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  text: {
    color: colors.textPrimary,
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 14,
  }
});
