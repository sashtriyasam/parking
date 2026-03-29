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

export default function AddFacility() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showMap, setShowMap] = useState(false);
  
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
    if (!formData.name || !formData.address || !formData.latitude || !formData.longitude) {
      showToast('Please fill in all required fields and verify location.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
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

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Register Facility</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Facility Name *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="business-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="e.g. Downtown Metro Parking"
            />
          </View>
        </View>

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

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.input}
              value={formData.city}
              onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
              placeholder="e.g. Pune"
            />
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Total Slots *</Text>
            <TextInput
              style={styles.input}
              value={formData.total_slots}
              onChangeText={(text) => setFormData(prev => ({ ...prev, total_slots: text }))}
              keyboardType="numeric"
            />
          </View>
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
            <Text style={styles.coordText}>Coordinates: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}</Text>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          </View>
        ) : null}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Operating Hours</Text>
          <TextInput
            style={styles.input}
            value={formData.operating_hours}
            onChangeText={(text) => setFormData(prev => ({ ...prev, operating_hours: text }))}
            placeholder="e.g. 24/7 or 9AM - 9PM"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Any special instructions or details about safety, security, etc."
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.footer}>
          <Button 
            label="Register Facility" 
            onPress={handleSubmit} 
            loading={loading}
          />
          <Button 
            label="Cancel" 
            variant="outline" 
            onPress={() => router.back()} 
            style={{ marginTop: 12 }} 
          />
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: 24,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    height: 80,
    textAlignVertical: 'top',
    padding: 12,
  },
  verifyButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
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
    marginBottom: 20,
    gap: 8,
    backgroundColor: colors.success + '10',
    padding: 8,
    borderRadius: 6,
  },
  coordText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  footer: {
    marginTop: 12,
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
    paddingTop: 40,
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
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: 'white',
  },
  mapHint: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  }
});
