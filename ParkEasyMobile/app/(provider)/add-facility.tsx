import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import Animated, { 
  FadeIn, 
  FadeInUp, 
  SlideInRight, 
  FadeInDown
} from 'react-native-reanimated';
import * as Location from 'expo-location';

import { post } from '../../services/api';
import { useToast } from '../../components/Toast';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptics } from '../../hooks/useHaptics';
import { ProfessionalCard } from '../../components/ui/ProfessionalCard';
import { ProfessionalButton } from '../../components/ui/ProfessionalButton';
import { ProfessionalInput } from '../../components/ui/ProfessionalInput';

import { MapView, Marker } from '../../components/MapPlaceholder';

const { width, height } = Dimensions.get('window');

export default function AddFacility() {
  const router = useRouter();
  const colors = useThemeColors();
  const haptics = useHaptics();
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
    haptics.impactLight();
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

  const prevStep = () => {
    haptics.impactLight();
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleVerifyLocation = async () => {
    haptics.impactMedium();
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
        haptics.notificationSuccess();
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
        haptics.notificationError();
        showToast('Could not find location. Please check the address.', 'error');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      haptics.notificationError();
      showToast('Error verifying location. Try manual entry.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleMapConfirm = (e: any) => {
    haptics.impactLight();
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setFormData(prev => ({
      ...prev,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    }));
  };

  const handleSubmit = async () => {
    haptics.impactMedium();
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
      haptics.notificationSuccess();
      showToast('Facility added successfully.', 'success');
      router.back();
    } catch (error: any) {
      haptics.notificationError();
      showToast(error.response?.data?.message || 'Failed to add facility', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    if (currentStep === 1) return 'Basic Details';
    if (currentStep === 2) return 'Location';
    return 'Final Review';
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      
      <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
        <BlurView intensity={20} tint={colors.isDark ? 'dark' : 'light'} style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            
            <View style={styles.headerInfo}>
              <Text style={[styles.headerLabel, { color: colors.textMuted }]}>NEW LOCATION • STEP {currentStep}</Text>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{getStepTitle()}</Text>
            </View>

            <View style={[styles.stepBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.stepBadgeText, { color: colors.textPrimary }]}>{currentStep}/{totalSteps}</Text>
            </View>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border + '20' }]}>
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: colors.primary, width: `${(currentStep / totalSteps) * 100}%` }
              ]}
            />
          </View>
        </BlurView>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 1 && (
          <Animated.View entering={FadeInUp} style={styles.formContainer}>
            <Text style={[styles.stepHeading, { color: colors.textPrimary }]}>Facility Details</Text>
            <Text style={[styles.stepSubheading, { color: colors.textSecondary }]}>Provide the baseline metrics for your new parking location.</Text>

            <ProfessionalInput
              label="FACILITY NAME"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="e.g. Royal Plaza P1"
              icon="business-outline"
            />

            <View style={styles.row}>
               <View style={{ flex: 1 }}>
                  <ProfessionalInput
                    label="TOTAL SLOTS"
                    value={formData.total_slots}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, total_slots: text }))}
                    keyboardType="numeric"
                    placeholder="20"
                    icon="grid-outline"
                  />
               </View>
               <View style={{ width: 16 }} />
               <View style={{ flex: 1 }}>
                  <ProfessionalInput
                    label="HOURS"
                    value={formData.operating_hours}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, operating_hours: text }))}
                    placeholder="24/7"
                    icon="time-outline"
                  />
               </View>
            </View>
          </Animated.View>
        )}

        {currentStep === 2 && (
          <Animated.View entering={SlideInRight} style={styles.formContainer}>
            <Text style={[styles.stepHeading, { color: colors.textPrimary }]}>Where is it located?</Text>
            <Text style={[styles.stepSubheading, { color: colors.textSecondary }]}>Enter the address precisely to help drivers navigate seamlessly.</Text>

            <ProfessionalInput
              label="FULL STREET ADDRESS"
              value={formData.address}
              onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
              placeholder="123 Park Lane, Sector 4..."
              icon="location-outline"
              multiline
              style={{ height: 100 }}
            />

            <ProfessionalInput
              label="CITY / REGION"
              value={formData.city}
              onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
              placeholder="Pune"
              icon="map-outline"
            />

            <ProfessionalButton
               label={verifying ? "VERIFYING..." : "Verify on Map"}
               onPress={handleVerifyLocation}
               variant="primary"
               style={{ marginTop: 24 }}
               loading={verifying}
            />

            {formData.latitude ? (
              <Animated.View entering={FadeInDown} style={[styles.verifiedStatus, { backgroundColor: colors.success + '10' }]}>
                 <Ionicons name="checkmark-done-circle" size={18} color={colors.success} />
                 <Text style={[styles.verifiedTxt, { color: colors.success }]}>Geocoding Active: {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}</Text>
              </Animated.View>
            ) : null}
          </Animated.View>
        )}

        {currentStep === 3 && (
          <Animated.View entering={FadeIn} style={styles.formContainer}>
            <Text style={[styles.stepHeading, { color: colors.textPrimary }]}>Final Review</Text>
            <Text style={[styles.stepSubheading, { color: colors.textSecondary }]}>Add a brief description and verify before going live.</Text>

            <ProfessionalInput
              label="ABOUT THIS FACILITY"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Mention security features, EV charging, etc."
              icon="document-text-outline"
              multiline
              style={{ height: 120 }}
            />

            <ProfessionalCard style={styles.summaryCard} hasVibrancy={true}>
               <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Review Draft</Text>
               <View style={[styles.divider, { backgroundColor: colors.border }]} />
               
               <View style={styles.summaryRow}>
                  <Text style={[styles.sKey, { color: colors.textMuted }]}>Title</Text>
                  <Text style={[styles.sVal, { color: colors.textPrimary }]}>{formData.name}</Text>
               </View>
               <View style={styles.summaryRow}>
                  <Text style={[styles.sKey, { color: colors.textMuted }]}>Capacity</Text>
                  <Text style={[styles.sVal, { color: colors.textPrimary }]}>{formData.total_slots} Slots</Text>
               </View>
               <View style={styles.summaryRow}>
                  <Text style={[styles.sKey, { color: colors.textMuted }]}>Region</Text>
                  <Text style={[styles.sVal, { color: colors.textPrimary }]}>{formData.city}</Text>
               </View>
            </ProfessionalCard>
          </Animated.View>
        )}

        <View style={styles.footer}>
           {currentStep > 1 && (
             <TouchableOpacity style={[styles.backBtnFooter, { backgroundColor: colors.surface }]} onPress={prevStep}>
                <Text style={[styles.backBtnTxt, { color: colors.textSecondary }]}>Previous</Text>
             </TouchableOpacity>
           )}
           <View style={{ flex: currentStep === 1 ? 0 : 1, width: currentStep === 1 ? 0 : 16 }} />
           <ProfessionalButton
              label={currentStep === 3 ? "Launch Facility" : "Continue"}
              onPress={currentStep < 3 ? nextStep : handleSubmit}
              variant="primary"
              style={{ flex: 2 }}
              loading={loading}
           />
        </View>
      </ScrollView>

      {/* Map Verification Modal */}
      <Modal visible={showMap} animationType="slide" transparent>
        <BlurView intensity={100} tint={colors.isDark ? 'dark' : 'light'} style={styles.modalOverlay}>
           <Animated.View entering={SlideInRight} style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                 <View>
                    <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Confirm Pin</Text>
                    <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>Drag the marker to the exact hotspot</Text>
                 </View>
                 <TouchableOpacity onPress={() => setShowMap(false)} style={styles.modalClose}>
                    <Ionicons name="close" size={24} color={colors.textPrimary} />
                 </TouchableOpacity>
              </View>

              <View style={[styles.mapHost, { borderColor: colors.border }]}>
                 {Platform.OS !== 'web' ? (
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
                     />
                   </MapView>
                 ) : (
                   <View style={styles.webPlaceholder}>
                      <Text style={{ color: colors.textMuted }}>Map native preview only</Text>
                   </View>
                 )}
              </View>

              <ProfessionalButton
                 label="Set This Location"
                 onPress={() => setShowMap(false)}
                 variant="primary"
                 style={{ marginTop: 24 }}
              />
           </Animated.View>
        </BlurView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { zIndex: 100 },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16 },
  navBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1, marginLeft: 12 },
  headerLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  stepBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  stepBadgeText: { fontSize: 11, fontWeight: '800' },
  progressBar: { height: 2, width: '100%' },
  progressFill: { height: '100%' },
  scrollContent: { padding: 24, paddingBottom: 100 },
  formContainer: { marginBottom: 40 },
  stepHeading: { fontSize: 28, fontWeight: '900', letterSpacing: -1, marginBottom: 8 },
  stepSubheading: { fontSize: 15, lineHeight: 22, fontWeight: '600', marginBottom: 32 },
  row: { flexDirection: 'row' },
  verifiedStatus: { marginTop: 20, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  verifiedTxt: { fontSize: 12, fontWeight: '800' },
  summaryCard: { borderRadius: 32, padding: 24, marginTop: 20 },
  summaryTitle: { fontSize: 18, fontWeight: '900', marginBottom: 16 },
  divider: { height: 1, marginBottom: 16, opacity: 0.2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sKey: { fontSize: 14, fontWeight: '600' },
  sVal: { fontSize: 14, fontWeight: '800' },
  footer: { flexDirection: 'row', paddingTop: 20, paddingBottom: 40 },
  backBtnFooter: { flex: 1, height: 60, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  backBtnTxt: { fontSize: 16, fontWeight: '800' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 40, borderTopRightRadius: 40, height: height * 0.85, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  modalSubtitle: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  modalClose: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  mapHost: { flex: 1, borderRadius: 32, overflow: 'hidden', borderWidth: 1 },
  map: { flex: 1 },
  webPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
