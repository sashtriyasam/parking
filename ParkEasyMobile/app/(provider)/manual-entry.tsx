import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ProfessionalCard } from '../../components/ui/ProfessionalCard';
import { ProfessionalInput } from '../../components/ui/ProfessionalInput';
import { ProfessionalButton } from '../../components/ui/ProfessionalButton';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptics } from '../../hooks/useHaptics';
import { get, post } from '../../services/api';

export default function ManualEntryScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const haptics = useHaptics();

  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [fetchingFacilities, setFetchingFacilities] = useState(true);

  const [formData, setFormData] = useState({
    facility_id: '',
    vehicle_number: '',
    vehicle_type: 'car' as 'car' | 'bike' | 'truck',
    slot_id: ''
  });

  useEffect(() => {
    const loadFacilities = async () => {
      try {
        const res = await get('/provider/facilities');
        if (res.data?.data) {
          setFacilities(res.data.data);
          if (res.data.data.length > 0) {
            setFormData((prev: any) => ({ ...prev, facility_id: res.data.data[0].id }));
          }
        }
      } catch (error) {
        console.error('Error loading facilities:', error);
      } finally {
        setFetchingFacilities(false);
      }
    };
    loadFacilities();
  }, []);

  const handleSubmit = async () => {
    if (!formData.facility_id) return Alert.alert('Error', 'Please select a facility');
    if (!formData.vehicle_number) return Alert.alert('Error', 'Please enter vehicle number');

    setLoading(true);
    haptics.impactMedium();

    try {
      const res = await post('/provider/bookings/offline', {
        facility_id: formData.facility_id,
        vehicle_number: formData.vehicle_number.toUpperCase().trim(),
        vehicle_type: formData.vehicle_type,
        slot_id: formData.slot_id || null
      });

      if (res.data?.status === 'success') {
        haptics.notificationSuccess();
        Alert.alert('Success', 'Offline check-in confirmed', [
            { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        haptics.notificationError();
        Alert.alert('Operation Failed', res.data?.message || 'The server rejected the manual check-in.');
      }
    } catch (error: any) {
      console.error('Offline check-in error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create offline booking');
    } finally {
      setLoading(false);
    }
  };

  const VehicleTypeBtn = ({ type, icon, label }: { type: 'car' | 'bike' | 'truck', icon: any, label: string }) => {
    const isActive = formData.vehicle_type === type;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          haptics.impactLight();
          setFormData((prev: any) => ({ ...prev, vehicle_type: type }));
        }}
        style={[
          styles.typeBtn,
          {
            backgroundColor: isActive ? colors.primary : (colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
            borderColor: isActive ? colors.primary : colors.border
          }
        ]}
      >
        <Ionicons name={icon} size={20} color={isActive ? '#FFF' : colors.textMuted} />
        <Text style={[styles.typeLabel, { color: isActive ? '#FFF' : colors.textPrimary }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  if (fetchingFacilities) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>FACILITY SELECTION</Text>
        <View style={styles.facilityGrid}>
          {facilities.length === 0 ? (
            <View style={styles.emptyContainer}>
               <Ionicons name="business-outline" size={32} color={colors.textMuted} />
               <Text style={[styles.emptyText, { color: colors.textMuted }]}>No Facilities Found</Text>
               <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>Link facilities to your account via provider console.</Text>
            </View>
          ) : (
            facilities.map((f: any) => (
              <ProfessionalCard 
                key={f.id}
                onPress={() => {
                  haptics.impactLight();
                  setFormData((prev: any) => ({ ...prev, facility_id: f.id }));
                }}
                style={[
                  styles.facilityCard, 
                  formData.facility_id === f.id && { borderColor: colors.primary, borderWidth: 2 }
                ]}
                hasVibrancy={true}
              >
                <View style={styles.facilityInfo}>
                  <Text style={[styles.facilityName, { color: colors.textPrimary }]}>{f.name}</Text>
                  <Text style={[styles.facilityAddr, { color: colors.textMuted }]}>{f.address}</Text>
                </View>
                {formData.facility_id === f.id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </ProfessionalCard>
            ))
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 32 }]}>VEHICLE DETAILS</Text>
        <ProfessionalCard style={styles.formCard} hasVibrancy={false}>
          <ProfessionalInput
            label="Registration Number"
            placeholder="MH 12 AB 1234"
            value={formData.vehicle_number}
            onChangeText={(v: string) => setFormData((p: any) => ({ ...p, vehicle_number: v }))}
            autoCapitalize="characters"
            icon="car-outline"
          />

          <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 12 }]}>Vehicle Category</Text>
          <View style={styles.typeRow}>
            <VehicleTypeBtn type="bike" icon="bicycle" label="Bike" />
            <VehicleTypeBtn type="car" icon="car" label="Car" />
            <VehicleTypeBtn type="truck" icon="bus" label="Truck" />
          </View>

          <View style={{ marginTop: 24 }}>
            <ProfessionalInput
              label="Direct Slot ID (Optional)"
              placeholder="e.g. SLT-001"
              value={formData.slot_id}
              onChangeText={(v: string) => setFormData((p: any) => ({ ...p, slot_id: v }))}
              icon="navigate-outline"
            />
          </View>
        </ProfessionalCard>

        <ProfessionalButton
          label="Confirm Entry"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitBtn}
          icon="checkmark-done-circle-outline"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 60, paddingTop: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 16 },
  facilityGrid: { gap: 12 },
  facilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 24,
    borderWidth: 0,
  },
  facilityInfo: { flex: 1 },
  facilityName: { fontSize: 17, fontWeight: '900', letterSpacing: -0.5 },
  facilityAddr: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  formCard: { borderRadius: 28, borderWidth: 0 },
  inputLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, marginBottom: 12, textTransform: 'uppercase', opacity: 0.7, marginLeft: 4 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1,
    height: 74,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 6
  },
  typeLabel: { fontSize: 12, fontWeight: '800' },
  submitBtn: {
    marginTop: 40,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 }
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.1)'
  },
  emptyText: { fontSize: 16, fontWeight: '900', marginTop: 12 },
  emptySubtext: { fontSize: 13, fontWeight: '500', textAlign: 'center', marginTop: 4, opacity: 0.8 }
});
