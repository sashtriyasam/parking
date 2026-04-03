import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  Alert, 
  Platform, 
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { 
  FadeInDown, 
  Layout, 
  SlideInUp, 
  ZoomIn,
  FadeIn
} from 'react-native-reanimated';

import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptics } from '../../hooks/useHaptics';
import { EmptyState } from '../../components/EmptyState';
import { get, post, del } from '../../services/api';
import { Vehicle, VehicleType } from '../../types';
import { VEHICLE_TYPE_COLORS } from '../../constants/colors';
import { ProfessionalCard } from '../../components/ui/ProfessionalCard';
import { ProfessionalButton } from '../../components/ui/ProfessionalButton';
import { ProfessionalInput } from '../../components/ui/ProfessionalInput';

const { height } = Dimensions.get('window');

const VEHICLE_TYPES: { type: VehicleType; icon: any; label: string }[] = [
  { type: 'car', icon: 'car', label: 'CAR' },
  { type: 'bike', icon: 'bicycle', label: 'BIKE' },
  { type: 'scooter', icon: 'moped', label: 'SCOOTER' },
  { type: 'truck', icon: 'bus', label: 'OTHER' },
];

const INITIAL_VEHICLE_STATE = {
  vehicle_number: '',
  vehicle_type: 'car' as VehicleType,
  nickname: '',
};

export default function VehiclesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const haptics = useHaptics();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newVehicle, setNewVehicle] = useState(INITIAL_VEHICLE_STATE);

  const handleCloseModal = () => {
    setModalVisible(false);
    setNewVehicle(INITIAL_VEHICLE_STATE);
  };

  const fetchVehicles = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    
    try {
      const res = await get('/customer/vehicles');
      setVehicles(res.data.data || []);
    } catch (e) {
      console.error('Error fetching vehicles', e);
    } finally {
      if (showLoading) setLoading(false);
      else setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleAddVehicle = async () => {
    if (!newVehicle.vehicle_number) {
      haptics.notificationError();
      Alert.alert('Incomplete Form', 'Please provide a valid vehicle registration number.');
      return;
    }
    
    setIsSubmitting(true);
    haptics.impactMedium();
    try {
      await post('/customer/vehicles', newVehicle);
      haptics.notificationSuccess();
      handleCloseModal();
      fetchVehicles(false);
    } catch (e: any) {
      haptics.notificationError();
      Alert.alert('Registration Failed', e.response?.data?.message || 'Failed to add vehicle to your profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVehicle = (id: string) => {
    haptics.impactMedium();
    Alert.alert(
      'Remove Vehicle', 
      'Are you sure you want to remove this vehicle from your profile?', 
      [
        { text: 'Keep Vehicle', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await del(`/customer/vehicles/${id}`);
              haptics.notificationSuccess();
              fetchVehicles(false);
            } catch (e) {
              haptics.notificationError();
              Alert.alert('Error', 'Failed to remove vehicle.');
            }
          }
        }
      ]
    );
  };

  const renderVehicle = ({ item, index }: { item: Vehicle; index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 100).duration(600)}
      layout={Layout.springify()}
    >
      <ProfessionalCard style={styles.vehicleCard} hasVibrancy={true}>
        <View style={[styles.vehicleIconWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
           <Ionicons 
             name={(VEHICLE_TYPES.find(t => t.type === item.vehicle_type)?.icon || 'car') as any} 
             size={24} 
             color={VEHICLE_TYPE_COLORS[item.vehicle_type]} 
           />
           <View style={[styles.statusIndicator, { backgroundColor: VEHICLE_TYPE_COLORS[item.vehicle_type] }]} />
        </View>
        <View style={styles.vehicleInfo}>
           <Text style={[styles.plateNumber, { color: colors.textPrimary }]}>{item.vehicle_number.toUpperCase()}</Text>
           <Text style={[styles.nicknameLabel, { color: colors.textMuted }]}>
             {item.nickname || item.vehicle_type.toUpperCase()}
           </Text>
        </View>
        <TouchableOpacity 
           onPress={() => handleDeleteVehicle(item.id)}
           style={styles.trashBtn}
        >
           <Ionicons name="trash-outline" size={18} color={colors.error + '95'} />
        </TouchableOpacity>
      </ProfessionalCard>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      
      <Animated.View entering={SlideInUp.duration(600)} style={styles.header}>
        <BlurView intensity={20} tint={colors.isDark ? 'dark' : 'light'} style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            
            <View style={styles.headerTitleBox}>
               <Text style={[styles.headerLabel, { color: colors.textMuted }]}>MY PROFILE • GARAGE</Text>
               <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Saved Vehicles</Text>
            </View>

            <TouchableOpacity style={styles.headerAddBtn} onPress={() => setModalVisible(true)}>
               <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={vehicles}
          renderItem={renderVehicle}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onRefresh={() => fetchVehicles(false)}
          refreshing={refreshing}
          ListEmptyComponent={
            <EmptyState
              icon="car-outline"
              title="NO VEHICLES ADDED"
              subtitle="Register your vehicle to experience seamless entry and exit at all ParkEasy locations."
              actionLabel="Add Vehicle"
              onAction={() => setModalVisible(true)}
            />
          }
        />
      )}

      {!modalVisible && (
        <Animated.View entering={FadeInDown.delay(800)} style={styles.stickyCta}>
          <ProfessionalButton
             label="Register New Vehicle"
             onPress={() => setModalVisible(true)}
             variant="primary"
             icon="add-circle-outline"
          />
        </Animated.View>
      )}

      {/* Add Vehicle Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={handleCloseModal}>
        <BlurView intensity={80} tint={colors.isDark ? 'dark' : 'light'} style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
            <Animated.View entering={SlideInUp.duration(500)} style={styles.modalContent}>
               <ProfessionalCard style={styles.formCard}>
                  <View style={styles.formHeader}>
                    <View>
                      <Text style={[styles.formLabel, { color: colors.textMuted }]}>SECURE REGISTRATION</Text>
                      <Text style={[styles.formTitle, { color: colors.textPrimary }]}>New Vehicle</Text>
                    </View>
                    <TouchableOpacity onPress={handleCloseModal} style={styles.dismissBtn}>
                      <Ionicons name="close" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.formBody} showsVerticalScrollIndicator={false}>
                     <ProfessionalInput
                        label="Registration Number"
                        value={newVehicle.vehicle_number}
                        onChangeText={(text) => setNewVehicle({...newVehicle, vehicle_number: text.toUpperCase()})}
                        placeholder="MH12AB1234"
                        icon="barcode-outline"
                        autoCapitalize="characters"
                     />
                     
                     <ProfessionalInput
                        label="Vehicle Nickname"
                        value={newVehicle.nickname}
                        onChangeText={(text) => setNewVehicle({...newVehicle, nickname: text})}
                        placeholder="e.g. Blue Sedan"
                        icon="bookmark-outline"
                     />

                     <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>VEHICLE CLASSIFICATION</Text>
                     <View style={styles.classGrid}>
                        {VEHICLE_TYPES.map((v) => (
                           <TouchableOpacity 
                             key={v.type}
                             onPress={() => {
                                haptics.impactLight();
                                setNewVehicle({...newVehicle, vehicle_type: v.type});
                             }}
                             activeOpacity={0.8}
                             style={[
                                styles.classItem,
                                { backgroundColor: colors.surface, borderColor: colors.border },
                                newVehicle.vehicle_type === v.type && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                             ]}
                           >
                              <Ionicons 
                                 name={v.icon} 
                                 size={24} 
                                 color={newVehicle.vehicle_type === v.type ? colors.primary : colors.textMuted} 
                              />
                              <Text style={[styles.classLabel, { color: newVehicle.vehicle_type === v.type ? colors.textPrimary : colors.textMuted }]}>
                                 {v.label}
                              </Text>
                           </TouchableOpacity>
                        ))}
                     </View>

                     <ProfessionalButton
                        label={isSubmitting ? "Processing..." : "Confirm Registration"}
                        onPress={handleAddVehicle}
                        variant="primary"
                        loading={isSubmitting}
                        style={{ marginTop: 12 }}
                     />
                     <View style={{ height: 40 }} />
                  </ScrollView>
               </ProfessionalCard>
            </Animated.View>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { zIndex: 100 },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, gap: 12 },
  navBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  headerTitleBox: { flex: 1 },
  headerLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  headerAddBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 24, paddingBottom: 120 },
  vehicleCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 32, marginBottom: 16 },
  vehicleIconWrapper: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, position: 'relative' },
  statusIndicator: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#FFF' },
  vehicleInfo: { flex: 1, marginLeft: 16 },
  plateNumber: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  nicknameLabel: { fontSize: 12, fontWeight: '700', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  trashBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stickyCta: { position: 'absolute', bottom: 40, left: 24, right: 24 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  keyboardView: { flex: 1, justifyContent: 'center', padding: 24 },
  modalContent: { width: '100%' },
  formCard: { padding: 32, borderRadius: 40 },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  formLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  formTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  dismissBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  formBody: {maxHeight: height * 0.6},
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 12, marginBottom: 16, marginLeft: 4 },
  classGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  classItem: { flex: 1, minWidth: '45%', height: 90, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  classLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
});
