import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  Dimensions, 
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useBookingFlowStore } from '../../../store/bookingFlowStore';
import { get } from '../../../services/api';
import { Button } from '../../../components/ui/Button';
import { GlassCard } from '../../../components/ui/GlassCard';
import { colors, VEHICLE_TYPE_COLORS } from '../../../constants/colors';
import { Vehicle, VehicleType } from '../../../types';

const { width } = Dimensions.get('window');

export default function SelectVehicleScreen() {
  const router = useRouter();
  const { setVehicle, vehicle_number, vehicle_type: storeVehicleType } = useBookingFlowStore();
  
  const [savedVehicles, setSavedVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [manualNumber, setManualNumber] = useState(vehicle_number || '');
  const [manualType, setManualType] = useState<VehicleType | null>(storeVehicleType || null);

  const vehicleTypes: { label: string; value: VehicleType; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: 'Bike', value: 'bike', icon: 'bicycle' },
    { label: 'Scooter', value: 'scooter', icon: 'bicycle-outline' },
    { label: 'Car', value: 'car', icon: 'car' },
    { label: 'Truck', value: 'truck', icon: 'bus' },
  ];

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await get('/customer/vehicles');
        setSavedVehicles(res.data.data || []);
      } catch (e) {
        console.error('Error fetching vehicles', e);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  const handleSavedSelect = (vehicle: Vehicle) => {
    setVehicle(vehicle, vehicle.vehicle_number, vehicle.vehicle_type);
    router.push('/(customer)/booking/payment');
  };

  const handleManualContinue = () => {
    if (manualNumber.trim() && manualType) {
      setVehicle(null, manualNumber.trim().toUpperCase(), manualType);
      router.push('/(customer)/booking/payment');
    }
  };

  const isManualValid = manualNumber.trim().length > 0 && manualType !== null;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#FFFFFF', '#F8FAFC']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: '33%' }]} />
        </View>
        <Text style={styles.progressLabel}>Step 1 of 3: Vehicle Selection</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Select Vehicle</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Vehicles</Text>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ alignSelf: 'flex-start', marginLeft: 24 }} />
          ) : savedVehicles.length > 0 ? (
            <View style={styles.savedContainer}>
              {savedVehicles.map(vehicle => (
                <GlassCard 
                  key={vehicle.id} 
                  style={styles.vehicleCard}
                  onPress={() => handleSavedSelect(vehicle)}
                >
                  <View style={[styles.vehicleIconContainer, { backgroundColor: VEHICLE_TYPE_COLORS[vehicle.vehicle_type] + '15' }]}>
                    <Ionicons 
                      name={vehicleTypes.find(t => t.value === vehicle.vehicle_type)?.icon || 'car'} 
                      size={24} 
                      color={VEHICLE_TYPE_COLORS[vehicle.vehicle_type]} 
                    />
                  </View>
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleNumber}>{vehicle.vehicle_number}</Text>
                    <Text style={styles.vehicleNickname}>{vehicle.nickname || (vehicle.vehicle_type ? vehicle.vehicle_type.toUpperCase() : 'VEHICLE')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </GlassCard>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="car-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyText}>No saved vehicles yet.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Or enter manually</Text>
          <GlassCard style={styles.manualCard}>
            <Text style={styles.inputLabel}>License Plate Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. MH12AB1234"
              placeholderTextColor={colors.textMuted}
              value={manualNumber}
              onChangeText={(val) => setManualNumber(val.toUpperCase())}
              autoCapitalize="characters"
              maxLength={10}
            />
            
            <Text style={[styles.inputLabel, { marginTop: 20 }]}>Vehicle Type</Text>
            <View style={styles.typeSelectorRow}>
              {vehicleTypes.map(type => {
                const isActive = manualType === type.value;
                return (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeChip,
                      isActive && { backgroundColor: VEHICLE_TYPE_COLORS[type.value], borderColor: VEHICLE_TYPE_COLORS[type.value] }
                    ]}
                    onPress={() => setManualType(type.value)}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={type.icon as any} 
                      size={18} 
                      color={isActive ? 'white' : colors.textSecondary} 
                    />
                    <Text style={[styles.typeText, isActive && styles.typeTextActive]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      <GlassCard style={styles.footer} intensity={90}>
        <Button 
          label="Continue to Payment" 
          onPress={handleManualContinue} 
          disabled={!isManualValid}
          size="lg"
          variant="primary"
        />
      </GlassCard>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    backgroundColor: colors.surface,
    paddingBottom: 20,
    ...colors.shadows.sm,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingVertical: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textPrimary,
    paddingHorizontal: 24,
    marginBottom: 32,
    letterSpacing: -1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginHorizontal: 24,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  savedContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
  },
  vehicleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  vehicleNickname: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  emptyContainer: {
    marginHorizontal: 24,
    padding: 32,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: Platform.OS === 'android' ? 'solid' : 'dashed',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  manualCard: {
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 18,
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'white',
    gap: 8,
    ...colors.shadows.sm,
  },
  typeText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  typeTextActive: {
    color: 'white',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 0,
    borderTopWidth: 1,
  },
});
