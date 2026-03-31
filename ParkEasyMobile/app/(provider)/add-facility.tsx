import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Animated, { FadeIn, FadeInUp, SlideInRight } from 'react-native-reanimated';
import { post } from '../../services/api';
import { useToast } from '../../components/Toast';

const { height } = Dimensions.get('window');

export default function AddFacility() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: 'Pune',
    latitude: '',
    longitude: '',
    total_slots: '20',
    operating_hours: '24/7',
    description: '',
  });

  const [mapRegion, setMapRegion] = useState({
    latitude: 18.5204,
    longitude: 73.8567,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const totalSteps = 3;

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.total_slots) {
        showToast('Please fill in facility name and slots.', 'error');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.latitude || !formData.longitude) {
        showToast('Please verify the location on map.', 'error');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleVerifyLocation = async () => {
    if (!formData.address) {
      showToast('Please enter an address first.', 'error');
      return;
    }

    setVerifying(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast('Permission to access location was denied', 'error');
        setVerifying(false);
        return;
      }

      const fullAddress = `${formData.address}, ${formData.city}`;
      const result = await Location.geocodeAsync(fullAddress);

      if (result.length > 0) {
        const { latitude, longitude } = result[0];
        setFormData(prev => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        }));
        setMapRegion(prev => ({
          ...prev,
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }));
        setShowMap(true);
      } else {
        showToast('Could not find location. Please check the address.', 'error');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      showToast('Error verifying location. Try manual entry.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleMapConfirm = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setFormData(prev => ({
      ...prev,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        total_floors: 1,
        total_slots: parseInt(formData.total_slots, 10),
        operating_hours: formData.operating_hours,
        description: formData.description,
        is_active: true,
      };

      await post('/provider/facilities', payload);
      showToast('Facility added successfully.', 'success');
      router.back();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to add facility', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    if (currentStep === 1) return 'Basic Details';
    if (currentStep === 2) return 'Location & Map';
    return 'Final Review';
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.bgWrapper}>
        <LinearGradient
          colors={['#0f1219', '#080a0f']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <BlurView intensity={20} tint="dark" style={styles.iconBlur}>
              <Ionicons name="chevron-back" size={24} color="white" />
            </BlurView>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerSubtitle}>New Location</Text>
            <Text style={styles.headerTitle}>{getStepTitle()}</Text>
          </View>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{currentStep} of {totalSteps}</Text>
          </View>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: `${(currentStep / totalSteps) * 100}%` }
            ]}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 1 && (
          <Animated.View entering={FadeInUp} style={styles.formContainer}>
            <Text style={styles.formTitle}>General Information</Text>
            <Text style={styles.formSubtitle}>Provide the essential details about your parking facility.</Text>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Facility Name</Text>
              <BlurView intensity={10} tint="dark" style={styles.inputBox}>
                <Ionicons name="business-outline" size={20} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  placeholder="Example: Central Plaza Parking"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                />
              </BlurView>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputSection, { flex: 1, marginRight: 15 }]}>
                <Text style={styles.label}>Total Slots</Text>
                <BlurView intensity={10} tint="dark" style={styles.inputBox}>
                  <TextInput
                    style={styles.input}
                    value={formData.total_slots}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, total_slots: text }))}
                    keyboardType="numeric"
                    placeholder="20"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                  />
                </BlurView>
              </View>
              <View style={[styles.inputSection, { flex: 1 }]}>
                <Text style={styles.label}>Operating Hours</Text>
                <BlurView intensity={10} tint="dark" style={styles.inputBox}>
                  <TextInput
                    style={styles.input}
                    value={formData.operating_hours}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, operating_hours: text }))}
                    placeholder="24/7"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                  />
                </BlurView>
              </View>
            </View>
          </Animated.View>
        )}

        {currentStep === 2 && (
          <Animated.View entering={SlideInRight} style={styles.formContainer}>
            <Text style={styles.formTitle}>Location Details</Text>
            <Text style={styles.formSubtitle}>Help users find your facility with accurate map coordinates.</Text>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Full Address</Text>
              <BlurView intensity={10} tint="dark" style={[styles.inputBox, { height: 100, alignItems: 'flex-start', paddingTop: 12 }]}>
                <TextInput
                  style={[styles.input, { height: '100%', textAlignVertical: 'top' }]}
                  value={formData.address}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                  placeholder="Enter the complete building/street address"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  multiline
                />
              </BlurView>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>City</Text>
              <BlurView intensity={10} tint="dark" style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  value={formData.city}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                  placeholder="Pune"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                />
              </BlurView>
            </View>

            <TouchableOpacity
              style={styles.verifyBtn}
              onPress={handleVerifyLocation}
              disabled={verifying}
            >
              {verifying ? (
                <ActivityIndicator size="small" color="black" />
              ) : (
                <>
                  <Ionicons name="location-outline" size={20} color="black" />
                  <Text style={styles.verifyBtnText}>Verify Location on Map</Text>
                </>
              )}
            </TouchableOpacity>

            {formData.latitude && formData.longitude ? (
              <BlurView intensity={15} tint="dark" style={styles.verifiedBox}>
                <Ionicons name="checkmark-circle" size={18} color="#34d399" />
                <Text style={styles.verifiedText}>Location Verified: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}</Text>
              </BlurView>
            ) : null}
          </Animated.View>
        )}

        {currentStep === 3 && (
          <Animated.View entering={FadeIn} style={styles.formContainer}>
            <Text style={styles.formTitle}>Final Review</Text>
            <Text style={styles.formSubtitle}>Add a short description and review the registry entry.</Text>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Facility Description</Text>
              <BlurView intensity={10} tint="dark" style={[styles.inputBox, { height: 120, alignItems: 'flex-start', paddingTop: 12 }]}>
                <TextInput
                  style={[styles.input, { height: '100%', textAlignVertical: 'top' }]}
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                  placeholder="Describe your facility, security, or special instructions..."
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  multiline
                />
              </BlurView>
            </View>

            <BlurView intensity={10} tint="dark" style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Name</Text>
                <Text style={styles.summaryVal}>{formData.name || 'Not provided'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Capacity</Text>
                <Text style={styles.summaryVal}>{formData.total_slots} Slots</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>City</Text>
                <Text style={styles.summaryVal}>{formData.city}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Address</Text>
                <Text style={styles.summaryVal} numberOfLines={1}>{formData.address || 'Not provided'}</Text>
              </View>
            </BlurView>
          </Animated.View>
        )}

        <View style={styles.footer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={prevStep}>
              <Text style={styles.secondaryBtnText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, currentStep === 1 && { flex: 1 }]}
            onPress={currentStep < 3 ? nextStep : handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="black" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {currentStep < 3 ? 'Continue' : 'Add Facility'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Map Verification Modal */}
      <Modal visible={showMap} animationType="slide" transparent>
        <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Confirm Location</Text>
                <Text style={styles.modalSubtitle}>Drag the marker to the exact entrance</Text>
              </View>
              <TouchableOpacity onPress={() => setShowMap(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.mapHost}>
              <MapView
                style={styles.map}
                region={mapRegion}
                onRegionChangeComplete={setMapRegion}
                customMapStyle={darkMapStyle}
              >
                <Marker
                  coordinate={{
                    latitude: parseFloat(formData.latitude) || 18.5204,
                    longitude: parseFloat(formData.longitude) || 73.8567
                  }}
                  draggable
                  onDragEnd={handleMapConfirm}
                >
                  <View style={styles.markerContainer}>
                    <View style={styles.markerCircle} />
                  </View>
                </Marker>
              </MapView>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.confirmMapBtn} onPress={() => setShowMap(false)}>
                <Text style={styles.confirmMapText}>Lock Coordinates</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#080a0f" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#ffffff" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#080a0f" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1e222b" }] }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080a0f',
  },
  bgWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(8, 10, 15, 0.8)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  iconBlur: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 2,
  },
  stepBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  progressTrack: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 30,
    paddingBottom: 60,
  },
  formContainer: {
    marginBottom: 30,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    lineHeight: 20,
    marginBottom: 30,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 10,
    marginLeft: 4,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    overflow: 'hidden',
    minHeight: 56,
  },
  inputIcon: {
    paddingLeft: 18,
  },
  input: {
    flex: 1,
    paddingHorizontal: 18,
    fontSize: 15,
    color: 'white',
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
  },
  verifyBtn: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 18,
    gap: 10,
    marginTop: 5,
  },
  verifyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'black',
  },
  verifiedBox: {
    marginTop: 20,
    padding: 15,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
    overflow: 'hidden',
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#34d399',
  },
  summaryCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
    overflow: 'hidden',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 15,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 20,
  },
  summaryKey: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  summaryVal: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: 'white',
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    gap: 15,
    paddingTop: 10,
  },
  secondaryBtn: {
    flex: 1,
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  primaryBtn: {
    flex: 2,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'black',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    backgroundColor: '#0f1219',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    height: height * 0.85,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapHost: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  modalFooter: {
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  confirmMapBtn: {
    backgroundColor: 'white',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
  },
  confirmMapText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '700',
  }
});
