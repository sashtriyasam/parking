import React, { useState, useEffect, ComponentProps } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

import { useBookingFlowStore } from '../../../store/bookingFlowStore';
import { get } from '../../../services/api';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useHaptics } from '../../../hooks/useHaptics';
import { Vehicle, VehicleType } from '../../../types';
import { ProfessionalCard } from '../../../components/ui/ProfessionalCard';
import { ProfessionalButton } from '../../../components/ui/ProfessionalButton';
import { useToast } from '../../../components/Toast';

const withAlpha = (hex: string, alpha: number): string => {
  if (!hex || !hex.startsWith('#')) return hex;
  let normalized = hex.slice(1);
  if (normalized.length === 3 || normalized.length === 4) {
    normalized = normalized.split('').map(c => c + c).join('');
  }
  const alphaHex = Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, '0').toUpperCase();
  if (normalized.length === 8) {
    return `#${normalized.slice(0, 6).toUpperCase()}${alphaHex}`;
  } else if (normalized.length === 6) {
    return `#${normalized.toUpperCase()}${alphaHex}`;
  }
  return hex;
};

export default function SelectVehicleScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const haptics = useHaptics();
  const { setVehicle, selected_vehicle, vehicle_number, vehicle_type: storeVehicleType } = useBookingFlowStore();
  
  const [fetchError, setFetchError] = useState(false);
  const { showToast } = useToast();
  
  const [savedVehicles, setSavedVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Local selections
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(selected_vehicle || null);
  const [manualNumber, setManualNumber] = useState(selected_vehicle ? '' : (vehicle_number || ''));
  const [manualType, setManualType] = useState<VehicleType | null>(selected_vehicle ? null : (storeVehicleType || null));

  const vehicleTypes: { label: string; value: VehicleType; icon: ComponentProps<typeof Ionicons>['name'] }[] = [
    { label: 'Car', value: 'car', icon: 'car-outline' },
    { label: 'Bike', value: 'bike', icon: 'bicycle-outline' },
    { label: 'Scooter', value: 'scooter', icon: 'bicycle' },
    { label: 'Truck', value: 'truck', icon: 'cube-outline' },
  ];

  const fetchVehicles = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const res = await get('/customer/vehicles');
      const list = res.data.data || [];
      setSavedVehicles(list);
      // Pre-select store vehicle if it matches
      if (selected_vehicle) {
        const found = list.find((v: Vehicle) => v.id === selected_vehicle.id);
        if (found) setSelectedVehicle(found);
      }
    } catch (e) {
      console.error('Error fetching vehicles', e);
      showToast('Could not load your vehicles', 'error');
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleSavedSelect = (vehicle: Vehicle) => {
    haptics.impactMedium();
    setSelectedVehicle(vehicle);
    // Clear manual inputs
    setManualNumber('');
    setManualType(null);
  };

  const handleManualInputActive = () => {
    if (selectedVehicle) {
      setSelectedVehicle(null);
    }
  };

  const handleContinue = () => {
    if (selectedVehicle) {
      haptics.impactMedium();
      setVehicle(selectedVehicle, selectedVehicle.vehicle_number, selectedVehicle.vehicle_type);
      router.push('/(customer)/booking/payment');
    } else if (isManualValid) {
      haptics.impactMedium();
      setVehicle(null, manualNumber.trim().toUpperCase(), manualType);
      router.push('/(customer)/booking/payment');
    }
  };

  const isManualValid = manualNumber.trim().length > 0 && manualType !== null;
  const isSelectionActive = selectedVehicle !== null || isManualValid;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Navigation Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.navBtn, { backgroundColor: colors.surface }]} 
            onPress={() => {
              haptics.impactLight();
              router.back();
            }}
          >
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleBox}>
             <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>BOOKING PIPELINE</Text>
             <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Identify Vehicle</Text>
          </View>
        </View>

        {/* 3-Step Apple Progress Bar */}
        <View style={[styles.progressBarContainer, { borderBottomColor: colors.border }]}>
          <View style={styles.progressRow}>
            <View style={styles.stepContainer}>
              <View style={[styles.stepCircle, { backgroundColor: colors.primary }]}>
                <Ionicons name="car-sport" size={14} color="#FFFFFF" />
              </View>
              <Text style={[styles.stepText, { color: colors.primary, fontWeight: '700' }]}>Vehicle</Text>
            </View>
            
            <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
            
            <View style={styles.stepContainer}>
              <View style={[styles.stepCircle, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
                <Text style={[styles.stepNumber, { color: colors.textSecondary }]}>2</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>Duration</Text>
            </View>
            
            <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
            
            <View style={styles.stepContainer}>
              <View style={[styles.stepCircle, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
                <Text style={[styles.stepNumber, { color: colors.textSecondary }]}>3</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>Payment</Text>
            </View>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Info */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={[styles.instruction, { color: colors.textSecondary }]}>
              Choose a registered vehicle from your fleet or specify temporary credentials below.
            </Text>
          </Animated.View>

          {/* Section: Saved Fleet */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>AUTHORIZED VEHICLES</Text>
            {loading ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : fetchError ? (
              <TouchableOpacity onPress={fetchVehicles} style={styles.retryContainer}>
                 <Ionicons name="refresh" size={16} color={colors.primary} />
                 <Text style={[styles.retryText, { color: colors.primary }]}>Retry loading fleet</Text>
              </TouchableOpacity>
            ) : savedVehicles.length > 0 ? (
              <View style={styles.savedList}>
                {savedVehicles.map((vehicle, i) => {
                  const isSelected = selectedVehicle?.id === vehicle.id;
                  const iconName = vehicleTypes.find(t => t.value === vehicle.vehicle_type)?.icon || 'car-outline';
                  return (
                    <Animated.View key={vehicle.id} entering={FadeInDown.delay(i * 50).duration(400)}>
                      <TouchableOpacity 
                        onPress={() => handleSavedSelect(vehicle)} 
                        activeOpacity={0.8}
                      >
                        <ProfessionalCard 
                          style={[
                            styles.vehicleCard, 
                            isSelected && {
                              borderColor: colors.primary,
                              backgroundColor: withAlpha(colors.primary, 0.08),
                            }
                          ]}
                          hasVibrancy={true}
                        >
                          <View style={styles.cardContentRow}>
                            <View style={[
                              styles.vehicleIcon, 
                              { 
                                backgroundColor: isSelected ? withAlpha(colors.primary, 0.15) : colors.surface,
                                borderColor: isSelected ? colors.primary : colors.border
                              }
                            ]}>
                              <Ionicons 
                                name={iconName} 
                                size={22} 
                                color={isSelected ? colors.primary : colors.textSecondary} 
                              />
                            </View>
                            
                            <View style={styles.vehicleDetails}>
                              <Text style={[styles.vehicleNumber, { color: colors.textPrimary }]}>
                                {vehicle.vehicle_number}
                              </Text>
                              <Text style={[styles.vehicleNick, { color: colors.textSecondary }]}>
                                {vehicle.nickname || 'Personal Vehicle'}
                              </Text>
                            </View>

                            <View style={[
                              styles.radioCircle, 
                              { borderColor: isSelected ? colors.primary : colors.border },
                              isSelected && { backgroundColor: colors.primary }
                            ]}>
                              {isSelected && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                            </View>
                          </View>
                        </ProfessionalCard>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            ) : (
              <ProfessionalCard style={styles.emptyCard}>
                <Ionicons name="car-outline" size={24} color={colors.textSecondary} style={{ opacity: 0.5, marginBottom: 8 }} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No saved vehicles in fleet</Text>
              </ProfessionalCard>
            )}
          </View>

          {/* Section: Manual Input */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>MANUAL SPECIFICATION</Text>
            <ProfessionalCard style={styles.manualCard}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>VEHICLE REGISTRATION NUMBER</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    color: colors.textPrimary, 
                    borderColor: colors.border,
                    backgroundColor: colors.surface
                  }
                ]}
                placeholder="Ex: MH12AB1234"
                placeholderTextColor={colors.textSecondary}
                value={manualNumber}
                onChangeText={(val) => {
                  handleManualInputActive();
                  setManualNumber(val.replace(/\s+/g, '').toUpperCase());
                }}
                autoCapitalize="characters"
                maxLength={10}
              />
              
              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 24 }]}>CLASSIFICATION</Text>
              <View style={styles.typeGrid}>
                {vehicleTypes.map(type => {
                  const isActive = manualType === type.value && !selectedVehicle;
                  return (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.typeChip,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        isActive && { borderColor: colors.primary, backgroundColor: withAlpha(colors.primary, 0.08) }
                      ]}
                      onPress={() => {
                        haptics.impactLight();
                        handleManualInputActive();
                        setManualType(type.value);
                      }}
                    >
                      <Ionicons 
                        name={type.icon} 
                        size={16} 
                        color={isActive ? colors.primary : colors.textSecondary} 
                      />
                      <Text style={[styles.typeText, { color: colors.textSecondary }, isActive && { color: colors.textPrimary }]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ProfessionalCard>
          </View>
          <View style={{ height: 160 }} />
        </ScrollView>

        {/* Sticky Bottom Actions */}
        <View style={styles.footer}>
          <BlurView intensity={30} tint={colors.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={[styles.footerInner, { borderTopWidth: 0.5, borderTopColor: colors.border }]}>
            <ProfessionalButton 
              label="Proceed to Duration" 
              onPress={handleContinue} 
              disabled={!isSelectionActive}
              variant="primary"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingHorizontal: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 16, 
    marginBottom: 16 
  },
  navBtn: { 
    width: 38, 
    height: 38, 
    borderRadius: 19, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  headerTitleBox: { flex: 1 },
  headerLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  progressBarContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepContainer: {
    alignItems: 'center',
    gap: 4,
    width: 60,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 10,
    fontWeight: '500',
  },
  stepLine: {
    flex: 1,
    height: 1,
    marginHorizontal: 8,
    marginTop: -16,
  },
  scrollContent: { paddingVertical: 16, paddingHorizontal: 20 },
  instruction: { fontSize: 14, fontWeight: '400', lineHeight: 20, marginBottom: 24 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 11, fontWeight: '700', marginBottom: 12, letterSpacing: 1.2 },
  savedList: { gap: 12 },
  vehicleCard: { 
    borderRadius: 12, 
    borderWidth: 1,
    padding: 16,
  },
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  vehicleIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1,
  },
  vehicleDetails: { flex: 1 },
  vehicleNumber: { fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  vehicleNick: { fontSize: 12, fontWeight: '400', marginTop: 2 },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: { alignSelf: 'flex-start', marginVertical: 12 },
  retryContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  retryText: { fontSize: 12, fontWeight: '600' },
  emptyCard: { padding: 24, alignItems: 'center', borderRadius: 12, borderStyle: 'dashed' },
  emptyText: { fontSize: 13, fontWeight: '500' },
  manualCard: { borderRadius: 12, padding: 16 },
  inputLabel: { fontSize: 10, fontWeight: '700', marginBottom: 8, letterSpacing: 1 },
  input: { 
    height: 48,
    borderRadius: 8, 
    paddingHorizontal: 16, 
    fontSize: 16, 
    fontWeight: '700', 
    letterSpacing: 2, 
    borderWidth: 1 
  },
  typeGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeChip: { 
    flex: 1, 
    minWidth: '45%', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    gap: 8 
  },
  typeText: { fontWeight: '600', fontSize: 13 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 96 },
  footerInner: { flex: 1, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 32 : 16, justifyContent: 'center' },
});
