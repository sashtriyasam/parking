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
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

import { useBookingFlowStore } from '../../../store/bookingFlowStore';
import { get } from '../../../services/api';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useHaptics } from '../../../hooks/useHaptics';
import { Vehicle, VehicleType } from '../../../types';
import { VEHICLE_TYPE_COLORS } from '../../../constants/colors';
import { ProfessionalCard } from '../../../components/ui/ProfessionalCard';
import { ProfessionalButton } from '../../../components/ui/ProfessionalButton';

const { height } = Dimensions.get('window');

export default function SelectVehicleScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const haptics = useHaptics();
  const { setVehicle, vehicle_number, vehicle_type: storeVehicleType } = useBookingFlowStore();
  
  const [savedVehicles, setSavedVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [manualNumber, setManualNumber] = useState(vehicle_number || '');
  const [manualType, setManualType] = useState<VehicleType | null>(storeVehicleType || null);

  const vehicleTypes: { label: string; value: VehicleType; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: 'Bike', value: 'bike', icon: 'bicycle-outline' },
    { label: 'Scooter', value: 'scooter', icon: 'bicycle' },
    { label: 'Car', value: 'car', icon: 'car-outline' },
    { label: 'Truck', value: 'truck', icon: 'bus-outline' },
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
    haptics.impactMedium();
    setVehicle(vehicle, vehicle.vehicle_number, vehicle.vehicle_type);
    router.push('/(customer)/booking/payment');
  };

  const handleManualContinue = () => {
    if (manualNumber.trim() && manualType) {
      haptics.impactMedium();
      setVehicle(null, manualNumber.trim().toUpperCase(), manualType);
      router.push('/(customer)/booking/payment');
    }
  };

  const isManualValid = manualNumber.trim().length > 0 && manualType !== null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.navBtn} 
            onPress={() => {
              haptics.impactLight();
              router.back();
            }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleBox}>
             <Text style={[styles.headerLabel, { color: colors.textMuted }]}>RESERVATION • STEP 1</Text>
             <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Identify Vehicle</Text>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.duration(600).springify()}>
             <Text style={[styles.instruction, { color: colors.textMuted }]}>
               PLEASE SELECT A PRE-AUTHORIZED VEHICLE OR SPECIFY A TEMPORARY IDENTITY FOR THIS SESSION.
             </Text>
          </Animated.View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>AUTHORIZED FLEET</Text>
            {loading ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : savedVehicles.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedScroll}>
                {savedVehicles.map((vehicle, i) => (
                  <Animated.View key={vehicle.id} entering={FadeInRight.delay(i * 100)}>
                    <TouchableOpacity onPress={() => handleSavedSelect(vehicle)} activeOpacity={0.7}>
                      <ProfessionalCard style={styles.vehicleCard} hasVibrancy={true}>
                        <View style={[styles.vehicleIcon, { backgroundColor: VEHICLE_TYPE_COLORS[vehicle.vehicle_type] + '15' }]}>
                          <Ionicons 
                            name={vehicleTypes.find(t => t.value === vehicle.vehicle_type)?.icon || 'car-outline'} 
                            size={24} 
                            color={VEHICLE_TYPE_COLORS[vehicle.vehicle_type]} 
                          />
                        </View>
                        <Text style={[styles.vehicleNumber, { color: colors.textPrimary }]}>{vehicle.vehicle_number}</Text>
                        <Text style={[styles.vehicleNick, { color: colors.textMuted }]}>{vehicle.nickname?.toUpperCase() || 'PRIMARY'}</Text>
                      </ProfessionalCard>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </ScrollView>
            ) : (
              <ProfessionalCard style={styles.emptyCard}>
                <Ionicons name="car-outline" size={32} color={colors.textMuted} style={{ opacity: 0.5, marginBottom: 16 }} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>NO AUTHORIZED VEHICLES FOUND</Text>
              </ProfessionalCard>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>MANUAL IDENTIFICATION</Text>
            <ProfessionalCard style={styles.manualCard}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>VEHICLE REGISTRATION NUMBER</Text>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="Ex: MH 12 AB 1234"
                placeholderTextColor={colors.textMuted}
                value={manualNumber}
                onChangeText={(val) => setManualNumber(val.toUpperCase())}
                autoCapitalize="characters"
                maxLength={10}
              />
              
              <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 32 }]}>VEHICLE CLASSIFICATION</Text>
              <View style={styles.typeGrid}>
                {vehicleTypes.map(type => {
                  const isActive = manualType === type.value;
                  return (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.typeChip,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        isActive && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                      ]}
                      onPress={() => {
                        haptics.impactLight();
                        setManualType(type.value);
                      }}
                    >
                      <Ionicons 
                        name={type.icon as any} 
                        size={20} 
                        color={isActive ? colors.primary : colors.textMuted} 
                      />
                      <Text style={[styles.typeText, { color: colors.textMuted }, isActive && { color: colors.textPrimary }]}>
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

        <View style={styles.footer}>
          <BlurView intensity={30} tint={colors.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={[styles.footerInner, { borderTopWidth: 0.5, borderTopColor: colors.border }]}>
            <ProfessionalButton 
              label="Initialize Session" 
              onPress={handleManualContinue} 
              disabled={!isManualValid}
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
  header: { paddingTop: 60, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  navBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  headerTitleBox: { flex: 1 },
  headerLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  scrollContent: { paddingVertical: 12 },
  instruction: { fontSize: 12, fontWeight: '600', lineHeight: 18, paddingHorizontal: 28, marginBottom: 32, opacity: 0.7 },
  section: { marginBottom: 40 },
  sectionTitle: { fontSize: 10, fontWeight: '900', marginHorizontal: 28, marginBottom: 16, letterSpacing: 2 },
  savedScroll: { paddingLeft: 24, paddingRight: 8, gap: 16 },
  vehicleCard: { width: 170, padding: 24, alignItems: 'center', borderRadius: 32 },
  vehicleIcon: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  vehicleNumber: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  vehicleNick: { fontSize: 10, fontWeight: '900', marginTop: 6, letterSpacing: 1.5, opacity: 0.6 },
  loader: { alignSelf: 'flex-start', marginLeft: 40 },
  emptyCard: { marginHorizontal: 24, padding: 40, alignItems: 'center', borderRadius: 32, borderStyle: 'dashed' },
  emptyText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, opacity: 0.5 },
  manualCard: { marginHorizontal: 24, borderRadius: 40, padding: 28 },
  inputLabel: { fontSize: 10, fontWeight: '900', marginBottom: 14, letterSpacing: 1.5, opacity: 0.7 },
  input: { borderRadius: 20, padding: 24, fontSize: 24, fontWeight: '900', letterSpacing: 4, textAlign: 'center', borderWidth: 0.5 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  typeChip: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 24, borderWidth: 0.5, gap: 12 },
  typeText: { fontWeight: '900', fontSize: 12 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  footerInner: { flex: 1, paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 20, justifyContent: 'center' },
});
