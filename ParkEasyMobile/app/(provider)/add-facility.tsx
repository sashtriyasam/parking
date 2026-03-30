import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableOpacity,
  Modal,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { post } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { colors } from '../../constants/colors';
import { useToast } from '../../components/Toast';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Animated, { FadeIn } from 'react-native-reanimated';

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
        total_floors: 1, // Defaulting to 1 for new facilities
        total_slots: parseInt(formData.total_slots, 10),
        operating_hours: formData.operating_hours,
        description: formData.description,
        is_active: true,
      };

      const res = await post('/provider/facilities', payload);
      showToast('Facility created successfully!', 'success');
      router.back();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to create facility', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={styles.stepIndicator}>
          <View style={[styles.stepCircle, currentStep >= s && styles.stepCircleActive]}>
            {currentStep > s ? (
              <Ionicons name="checkmark" size={16} color="white" />
            ) : (
              <Text style={[styles.stepNumber, currentStep >= s && styles.stepNumberActive]}>{s}</Text>
            )}
          </View>
          {s < 3 && <View style={[styles.stepLine, currentStep > s && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Register Facility</Text>
      </View>

      {renderProgressBar()}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {currentStep === 1 && (
          <Animated.View entering={FadeIn.duration(400)}>
            <View style={styles.glassCard}>
              <Text style={styles.stepTitle}>Basic Information</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Facility Name *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="business-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                    placeholder="e.g. Downtown Metro Parking"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Total Slots *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.total_slots}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, total_slots: text }))}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Operating Hours</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.operating_hours}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, operating_hours: text }))}
                    placeholder="e.g. 24/7"
                  />
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {currentStep === 2 && (
          <Animated.View entering={FadeIn.duration(400)}>
            <View style={styles.glassCard}>
              <Text style={styles.stepTitle}>Location Details</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Address *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.address}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                  placeholder="Full physical address"
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.city}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                  placeholder="e.g. Pune"
                />
              </View>

              <TouchableOpacity 
                style={styles.verifyButton} 
                onPress={handleVerifyLocation}
                disabled={verifying}
              >
                {verifying ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="map-outline" size={20} color="white" />
                    <Text style={styles.verifyButtonText}>Verify Location on Map</Text>
                  </>
                )}
              </TouchableOpacity>

              {formData.latitude ? (
                <View style={styles.coordDisplay}>
                  <Text style={styles.coordText}>Location Verified: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}</Text>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                </View>
              ) : null}
            </View>
          </Animated.View>
        )}

        {currentStep === 3 && (
          <Animated.View entering={FadeIn.duration(400)}>
            <View style={styles.glassCard}>
              <Text style={styles.stepTitle}>Final Touches</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                  placeholder="Add details about security, amenities, or special instructions."
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>Summary</Text>
                <Text style={styles.reviewText}>{formData.name}</Text>
                <Text style={styles.reviewTextSub}>{formData.total_slots} slots • {formData.operating_hours}</Text>
                <Text style={styles.reviewTextSub}>{formData.address}, {formData.city}</Text>
              </View>
            </View>
          </Animated.View>
        )}

        <View style={styles.footer}>
          {currentStep > 1 && (
            <Button 
              label="Previous" 
              variant="outline" 
              onPress={prevStep} 
              style={{ flex: 1, marginRight: 12 }} 
            />
          )}
          
          {currentStep < 3 ? (
            <Button 
              label="Continue" 
              onPress={nextStep} 
              style={{ flex: 1 }} 
            />
          ) : (
            <Button 
              label="Register Facility" 
              onPress={handleSubmit} 
              loading={loading}
              style={{ flex: 1 }} 
            />
          )}
        </View>
      </ScrollView>

      {/* Map Verification Modal */}
      <Modal visible={showMap} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Verify Location</Text>
            <TouchableOpacity onPress={() => setShowMap(false)}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <MapView
            style={styles.map}
            region={mapRegion}
            onRegionChangeComplete={setMapRegion}
          >
            <Marker 
              coordinate={{
                latitude: parseFloat(formData.latitude) || 18.5204,
                longitude: parseFloat(formData.longitude) || 73.8567
              }}
              draggable
              onDragEnd={handleMapConfirm}
              title={formData.name || 'Selected Location'}
            />
          </MapView>
          
          <View style={styles.modalFooter}>
            <Text style={styles.mapHint}>Drag the marker to pinpoint the exact entrance.</Text>
            <Button label="Confirm Location" onPress={() => setShowMap(false)} />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: colors.surface,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  stepNumberActive: {
    color: 'white',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  scrollContent: {
    padding: 20,
  },
  glassCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...colors.shadows.md,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
  },
  inputIcon: {
    paddingLeft: 12,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  verifyButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 16,
    gap: 8,
    ...colors.shadows.sm,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  coordDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.success + '10',
    padding: 12,
    borderRadius: 12,
  },
  coordText: {
    fontSize: 13,
    color: colors.success,
    fontWeight: '600',
  },
  reviewSection: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  reviewTextSub: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  map: {
    flex: 1,
  },
  modalFooter: {
    padding: 24,
    paddingBottom: 48,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: 'white',
  },
  mapHint: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  }
});
