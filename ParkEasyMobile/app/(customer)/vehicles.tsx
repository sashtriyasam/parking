import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  Alert, 
  Platform, 
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  Layout, 
  SlideInUp, 
  ZoomIn,
  FadeIn
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { Skeleton } from '../../components/ui/SkeletonLoader';
import { EmptyState } from '../../components/EmptyState';
import { get, post, del } from '../../services/api';
import { Vehicle, VehicleType } from '../../types';

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
      Alert.alert('LINKAGE FAILED', 'Please provide a valid vehicle plate identifier.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await post('/customer/vehicles', newVehicle);
      handleCloseModal();
      fetchVehicles(false);
    } catch (e: any) {
      Alert.alert('SYSTEM ERROR', e.response?.data?.message || 'Failed to sync vehicle data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVehicle = (id: string) => {
    Alert.alert(
      'DEACTIVATE NODE', 
      'Confirm permanent removal of this vehicle signature?', 
      [
        { text: 'CANCEL', style: 'cancel' },
        { 
          text: 'REMOVE', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await del(`/customer/vehicles/${id}`);
              fetchVehicles(false);
            } catch (e) {
              Alert.alert('ERROR', 'Deactivation failed.');
            }
          }
        }
      ]
    );
  };

  const renderVehicle = ({ item, index }: { item: Vehicle; index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 100).springify().damping(12)}
      layout={Layout.springify()}
    >
      <BlurView intensity={20} tint="dark" style={styles.vehicleCard}>
        <LinearGradient
          colors={[colors.premium.primary + '10', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.vehicleIconBox}>
          <Ionicons 
            name={(VEHICLE_TYPES.find(t => t.type === item.vehicle_type)?.icon || 'car') as any} 
            size={24} 
            color={colors.premium.primary} 
          />
          <View style={styles.iconGlow} />
        </View>
        <View style={styles.vehicleDetails}>
          <Text style={styles.vehiclePlate}>{item.vehicle_number.toUpperCase()}</Text>
          <Text style={styles.vehicleType}>{item.nickname || item.vehicle_type.toUpperCase()}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => handleDeleteVehicle(item.id)}
          style={styles.deleteBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color="rgba(255, 107, 107, 0.6)" />
        </TouchableOpacity>
      </BlurView>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Immersive Background */}
      <View style={styles.bgWrapper}>
        <LinearGradient
          colors={['#080a0f', '#020617']}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.glowPoint, { top: '30%', right: '-20%', backgroundColor: colors.premium.secondary, opacity: 0.1 }]} />
      </View>

      <Animated.View entering={SlideInUp.duration(600)} style={styles.header}>
        <BlurView intensity={30} tint="dark" style={styles.headerContent}>
          <View>
            <Text style={styles.headerLabel}>CORE STORAGE</Text>
            <Text style={styles.headerTitle}>SYSTEM GARAGE</Text>
          </View>
        </BlurView>
      </Animated.View>

      {loading ? (
        <View style={styles.list}>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} width="100%" height={90} borderRadius={24} style={{ marginBottom: 16 }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={vehicles}
          renderItem={renderVehicle}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={() => fetchVehicles(false)}
          refreshing={refreshing}
          ListEmptyComponent={
            <Animated.View entering={FadeIn.delay(400)}>
              <EmptyState
                icon="car-outline"
                title="GARAGE EMPTY"
                subtitle="Initialize your first vehicle node to begin proximity-based parking operations."
                actionLabel="REGISTER NODE"
                onAction={() => setModalVisible(true)}
              />
            </Animated.View>
          }
        />
      )}

      {!modalVisible && (
        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.fabContainer}>
          <TouchableOpacity 
            style={styles.fabBtn} 
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.premium.primary, colors.premium.secondary]}
              style={styles.fabGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="add" size={24} color="white" />
              <Text style={styles.fabText}>REGISTER NEW NODE</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={handleCloseModal}>
        <BlurView intensity={60} tint="dark" style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
            <Animated.View entering={SlideInUp.springify().damping(15)} style={styles.modalContent}>
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalLabel}>NODE INITIALIZATION</Text>
                  <Text style={styles.modalTitle}>LINK VEHICLE</Text>
                </View>
                <TouchableOpacity onPress={handleCloseModal} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>PLATE IDENTIFIER</Text>
                  <BlurView intensity={10} tint="light" style={styles.inputWrapper}>
                    <Ionicons name="barcode-outline" size={20} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="MH12AB1234"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={newVehicle.vehicle_number}
                      onChangeText={(text) => setNewVehicle({...newVehicle, vehicle_number: text.toUpperCase()})}
                      autoCapitalize="characters"
                    />
                  </BlurView>
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>SYSTEM ALIAS (OPTIONAL)</Text>
                  <BlurView intensity={10} tint="light" style={styles.inputWrapper}>
                    <Ionicons name="bookmark-outline" size={20} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. INTERCEPTOR"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={newVehicle.nickname}
                      onChangeText={(text) => setNewVehicle({...newVehicle, nickname: text})}
                    />
                  </BlurView>
                </View>

                <Text style={styles.inputLabel}>CHASSIS CLASSIFICATION</Text>
                <View style={styles.typeGrid}>
                  {VEHICLE_TYPES.map((v) => (
                    <TouchableOpacity 
                      key={v.type}
                      style={[styles.typeOption, newVehicle.vehicle_type === v.type && styles.typeOptionActive]}
                      onPress={() => setNewVehicle({...newVehicle, vehicle_type: v.type})}
                      activeOpacity={0.8}
                    >
                      <Ionicons 
                        name={v.icon} 
                        size={20} 
                        color={newVehicle.vehicle_type === v.type ? 'white' : 'rgba(255,255,255,0.3)'} 
                      />
                      <Text style={[styles.typeLabel, newVehicle.vehicle_type === v.type && styles.typeLabelActive]}>
                        {v.label}
                      </Text>
                      {newVehicle.vehicle_type === v.type && (
                        <Animated.View entering={ZoomIn} style={styles.typeOptionGlow} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity 
                  style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]} 
                  onPress={handleAddVehicle}
                  disabled={isSubmitting}
                >
                  <LinearGradient
                    colors={isSubmitting ? ['#1e293b', '#0f172a'] : [colors.premium.primary, colors.premium.secondary]}
                    style={styles.saveBtnGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.saveBtnText}>
                      {isSubmitting ? "SYNCING..." : "INITIALIZE NODE"}
                    </Text>
                    {!isSubmitting && <Ionicons name="arrow-forward" size={18} color="white" />}
                  </LinearGradient>
                </TouchableOpacity>
                <View style={{ height: 40 }} />
              </ScrollView>
            </Animated.View>
          </KeyboardAvoidingView>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080a0f',
  },
  bgWrapper: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glowPoint: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  header: {
    zIndex: 100,
  },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 3,
    marginTop: 4,
    textAlign: 'center',
  },
  list: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 150,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  vehicleIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  iconGlow: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.premium.primary,
    opacity: 0.15,
    // iOS shadow for glow
    shadowColor: colors.premium.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    // Android elevation
    elevation: 2,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehiclePlate: {
    fontSize: 18,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 1,
  },
  vehicleType: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 4,
    letterSpacing: 1,
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.1)',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  fabBtn: {
    borderRadius: 22,
    overflow: 'hidden',
    height: 64,
  },
  fabGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  fabText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContent: {
    backgroundColor: '#080a0f',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 32,
    paddingTop: 32,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    maxHeight: height * 0.8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  modalLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  inputIcon: {
    marginLeft: 20,
  },
  input: {
    flex: 1,
    padding: 18,
    paddingLeft: 12,
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  typeOption: {
    flex: 1,
    height: 90,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    position: 'relative',
    overflow: 'hidden',
  },
  typeOptionActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: colors.premium.primary + '50',
  },
  typeOptionGlow: {
    position: 'absolute',
    bottom: -10,
    width: '100%',
    height: 20,
    backgroundColor: colors.premium.primary,
    opacity: 0.2,
    // iOS shadow for glow
    shadowColor: colors.premium.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    // Android elevation
    elevation: 3,
  },
  typeLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1,
  },
  typeLabelActive: {
    color: 'white',
  },
  saveBtn: {
    borderRadius: 22,
    overflow: 'hidden',
    height: 64,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  saveBtnText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 2,
  }
});
