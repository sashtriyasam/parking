import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  Share
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  useSharedValue, 
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

import { get } from '../../../services/api';
import { ProfessionalButton } from '../../../components/ui/ProfessionalButton';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useHaptics } from '../../../hooks/useHaptics';
import { useBookingFlowStore } from '../../../store/bookingFlowStore';
import { ParkingSlot } from '../../../types';
import { useToast } from '../../../components/Toast';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 300;

interface Facility {
  id: string;
  name: string;
  address: string;
  description?: string;
  base_price: number;
  hourly_rate: number;
  total_slots: number;
  available_slots: number;
  image_url?: string;
  amenities?: string[];
  rating?: number;
  reviewCount?: number;
  slots?: ParkingSlot[];
  distance?: number;
}

export default function FacilityDetailsScreen() {
  const { id } = useLocalSearchParams();
  const facilityId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const colors = useThemeColors();
  const haptics = useHaptics();
  const { showToast } = useToast();
  const { setFacility: setStoreFacility, setSlot, resetBookingFlow } = useBookingFlowStore();
  
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedSlot, setSelectedSlotInternal] = useState<ParkingSlot | null>(null);
  
  const scrollY = useSharedValue(0);

  useEffect(() => {
    if (facilityId) fetchFacility();
  }, [facilityId]);

  const fetchFacility = async () => {
    if (!facilityId) return;
    try {
      const res = await get(`/facilities/${facilityId}`);
      if (res.data?.data) {
        setFacility(res.data.data);
      } else {
        Alert.alert('Not Found', 'The requested parking facility could not be found.', [
          { text: 'Go Back', onPress: () => router.back() }
        ], { cancelable: false });
      }
    } catch (error) {
      console.error('Error fetching facility:', error);
      Alert.alert('System Error', 'Unable to retrieve facility telemetry.');
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });
  
  const handleShare = async () => {
    if (!facility) return;
    haptics.impactLight();
    try {
      const url = `https://parkeasy.app/facility/${facility.id}`;
      const message = `Check out ${facility.name} parking facility at ${facility.address}!`;
      await Share.share({
        message: Platform.OS === 'android' ? `${message} ${url}` : message,
        url,
        title: facility.name
      });
    } catch (error) {
      console.error('Sharing error:', error);
    }
  };

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-100, 0],
      [1.2, 1],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ scale }],
    };
  });

  const navHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [HEADER_HEIGHT - 100, HEADER_HEIGHT - 50],
      [0, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const slotsList = useMemo(() => {
    if (!facility) return [];
    if (facility.slots && facility.slots.length > 0) return facility.slots;
    
    // Generate high fidelity mock slots if not available in DB
    const generated: ParkingSlot[] = [];
    const statuses: ('FREE' | 'RESERVED' | 'OCCUPIED')[] = ['FREE', 'FREE', 'RESERVED', 'OCCUPIED', 'FREE'];
    for (let i = 1; i <= 20; i++) {
      generated.push({
        id: `mock-slot-${i}`,
        facility_id: facility.id,
        slot_number: `P-${i}`,
        vehicle_type: 'car',
        status: statuses[i % statuses.length],
      });
    }
    return generated;
  }, [facility]);

  const handleSelectSlot = (slot: ParkingSlot) => {
    const status = slot.status.toUpperCase();
    if (status === 'FREE') {
      haptics.impactLight();
      if (selectedSlot?.id === slot.id) {
        setSelectedSlotInternal(null);
      } else {
        setSelectedSlotInternal(slot);
      }
    } else {
      haptics.notificationError();
      showToast?.(`Slot ${slot.slot_number} is ${status.toLowerCase()}`, 'info');
    }
  };

  const handleBookNow = () => {
    if (!facility) return;
    if (!selectedSlot) {
      Alert.alert('Select a Slot', 'Please select an available parking slot from the grid below.');
      return;
    }
    setBookingLoading(true);
    try {
      haptics.impactMedium();
      resetBookingFlow();
      setStoreFacility(facility.id, facility.name);
      setSlot(selectedSlot);
      setBookingLoading(false);
      router.push(`/(customer)/booking/vehicle`);
    } catch (e) {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!facility) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Hero Image */}
      <Animated.View style={[styles.headerImageContainer, headerAnimatedStyle]}>
        <Image 
          source={{ uri: facility.image_url || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80' }} 
          style={styles.headerImage}
          contentFit="cover"
        />
        <LinearGradient 
          colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.7)']} 
          style={styles.gradient}
        />
      </Animated.View>

      {/* Header Overlays */}
      <View style={styles.topNav}>
        <TouchableOpacity 
          style={[styles.circleBtn, { backgroundColor: 'rgba(0,0,0,0.4)' }]} 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>
        
        <Animated.View style={[styles.navTitleContainer, navHeaderStyle]}>
           <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
           <Text style={styles.navTitle} numberOfLines={1}>{facility.name}</Text>
        </Animated.View>

        <TouchableOpacity 
          style={[styles.circleBtn, { backgroundColor: 'rgba(0,0,0,0.4)' }]} 
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroSpacer} />
        
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          <View style={styles.indicator} />
          
          <View style={styles.titleSection}>
            <Text style={[styles.headerSub, { color: colors.primary }]}>PREMIUM PARKING</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{facility.name}</Text>
            <Text style={[styles.addressText, { color: colors.textSecondary }]}>{facility.address}</Text>
          </View>

          {/* 3-Column Stats Grid */}
          <View style={[styles.statsGrid, { borderColor: colors.border }]}>
            <View style={styles.statsColumn}>
              <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>DISTANCE</Text>
              <Text style={[styles.statsValue, { color: colors.textPrimary }]}>
                {facility.distance ? `${facility.distance.toFixed(1)} km` : '1.2 km'}
              </Text>
            </View>
            <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statsColumn}>
              <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>TOTAL SLOTS</Text>
              <Text style={[styles.statsValue, { color: colors.textPrimary }]}>{facility.total_slots}</Text>
            </View>
            <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statsColumn}>
              <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>HOURS</Text>
              <Text style={[styles.statsValue, { color: colors.textPrimary }]}>24/7</Text>
            </View>
          </View>

          {/* Amenities Horizontal Scroll */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Amenities</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {(facility?.amenities ?? ['Automated Valet', 'EV Charging', 'CCTV Security', 'Climate Control']).map((item) => (
                <View key={item} style={[styles.amenityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons 
                    name={item.toLowerCase().includes('ev') ? 'flash' : item.toLowerCase().includes('valet') ? 'car-sport' : 'shield-checkmark'} 
                    size={20} 
                    color={colors.primary} 
                    style={{ marginBottom: 6 }}
                  />
                  <Text style={[styles.amenityCardText, { color: colors.textPrimary }]}>{item}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Interactive Slot Grid */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Select Parking Slot</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Tap an available green slot to reserve it.
            </Text>
            
            {/* Grid Map Legend */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { borderColor: colors.success }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Free</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { borderColor: colors.warning, backgroundColor: colors.warning + '20' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Reserved</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { borderColor: colors.error, backgroundColor: colors.error + '20' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Occupied</Text>
              </View>
            </View>

            <View style={styles.slotGrid}>
              {slotsList.map((slot) => {
                const isFree = slot.status.toUpperCase() === 'FREE';
                const isReserved = slot.status.toUpperCase() === 'RESERVED';
                const isOccupied = slot.status.toUpperCase() === 'OCCUPIED';
                const isSelected = selectedSlot?.id === slot.id;

                let borderC = colors.border;
                let bgC = colors.surface;
                let textC = colors.textSecondary;

                if (isFree) {
                  borderC = colors.success;
                  bgC = 'transparent';
                  textC = colors.success;
                } else if (isReserved) {
                  borderC = colors.warning;
                  bgC = colors.warning + '15';
                  textC = colors.warning;
                } else if (isOccupied) {
                  borderC = colors.error;
                  bgC = colors.error + '15';
                  textC = colors.error;
                }

                if (isSelected) {
                  borderC = colors.primary;
                  bgC = colors.primary;
                  textC = '#FFFFFF';
                }

                return (
                  <TouchableOpacity
                    key={slot.id}
                    onPress={() => handleSelectSlot(slot)}
                    style={[
                      styles.slotSquare, 
                      { 
                        borderColor: borderC, 
                        backgroundColor: bgC,
                      }
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.slotNumberText, { color: textC }]}>{slot.slot_number}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>About Facility</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {facility.description || 'Modern structural parking with high security, digital access control, and seamless interface integrations.'}
            </Text>
          </View>
          
          <View style={{ height: 140 }} />
        </View>
      </Animated.ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <View style={styles.footerInner}>
          <View style={styles.priceBox}>
             <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>RATE / HOUR</Text>
             <Text style={[styles.priceValue, { color: colors.textPrimary }]}>₹{facility.hourly_rate}<Text style={styles.priceUnit}>/hr</Text></Text>
          </View>
          <ProfessionalButton 
             label={selectedSlot ? `Book ${selectedSlot.slot_number}` : 'Select a Slot'} 
             onPress={handleBookNow} 
             loading={bookingLoading}
             style={styles.bookButton}
             variant="primary"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerImageContainer: { position: 'absolute', top: 0, width: width, height: HEADER_HEIGHT },
  headerImage: { width: '100%', height: '100%' },
  gradient: { ...StyleSheet.absoluteFillObject },
  topNav: { position: 'absolute', top: 0, left: 0, right: 0, height: 94, paddingTop: Platform.OS === 'ios' ? 44 : 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, zIndex: 10 },
  circleBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  navTitleContainer: { flex: 1, height: 38, borderRadius: 19, overflow: 'hidden', justifyContent: 'center', paddingHorizontal: 16, marginHorizontal: 12 },
  navTitle: { color: '#FFF', fontSize: 15, fontWeight: '600', textAlign: 'center', letterSpacing: -0.2 },
  scrollContent: { flexGrow: 1 },
  heroSpacer: { height: HEADER_HEIGHT - 30 },
  content: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', paddingBottom: 40 },
  indicator: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(120,120,120,0.3)', alignSelf: 'center', marginTop: 10 },
  titleSection: { paddingHorizontal: 20, paddingTop: 20, marginBottom: 16 },
  headerSub: { fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, marginBottom: 4 },
  addressText: { fontSize: 15, fontWeight: '400', lineHeight: 20 },
  statsGrid: { flexDirection: 'row', marginHorizontal: 20, borderWidth: 1, borderRadius: 10, paddingVertical: 12, marginBottom: 24 },
  statsColumn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statsLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  statsValue: { fontSize: 15, fontWeight: '600' },
  statsDivider: { width: 1, height: '60%', alignSelf: 'center' },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: 13, marginBottom: 12 },
  description: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  horizontalScroll: { gap: 8, paddingRight: 20 },
  amenityCard: { width: 110, height: 80, borderRadius: 10, borderWidth: 1, padding: 10, justifyContent: 'center' },
  amenityCardText: { fontSize: 11, fontWeight: '500' },
  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 3, borderWidth: 1.5 },
  legendText: { fontSize: 12 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotSquare: { width: (width - 40 - 30) / 4, height: 44, borderRadius: 6, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  slotNumberText: { fontSize: 13, fontWeight: '600' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: Platform.OS === 'ios' ? 98 : 78, borderTopWidth: StyleSheet.hairlineWidth },
  footerInner: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 12, justifyContent: 'space-between', alignItems: 'center' },
  priceBox: { flex: 1 },
  priceLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 1, marginBottom: 2 },
  priceValue: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  priceUnit: { fontSize: 14, fontWeight: '400' },
  bookButton: { width: 180 },
});
