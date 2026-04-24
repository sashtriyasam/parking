import React, { useState, useEffect } from 'react';
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

import { get, post } from '../../../services/api';
import { ProfessionalButton } from '../../../components/ui/ProfessionalButton';
import { ProfessionalCard } from '../../../components/ui/ProfessionalCard';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useHaptics } from '../../../hooks/useHaptics';
import { useBookingFlowStore } from '../../../store/bookingFlowStore';
import { ParkingSlot } from '../../../types';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 420;

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
}

const formatReviewCount = (count?: number): string => {
  if (count == null) return 'OVER 2.4K';
  if (count < 1000) return count.toString();
  const kValue = count / 1000;
  const formatted = kValue % 1 === 0 ? kValue.toFixed(0) : kValue.toFixed(1);
  return `OVER ${formatted}K`;
};

export default function FacilityDetailsScreen() {
  const { id } = useLocalSearchParams();
  const facilityId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const colors = useThemeColors();
  const haptics = useHaptics();
  const { setFacility: setStoreFacility, setSlot, resetBookingFlow } = useBookingFlowStore();
  
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  
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
        ], { cancelable: false, onDismiss: () => router.back() });
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
      Alert.alert('Sharing Failed', 'Could not open share dialog.');
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
      [HEADER_HEIGHT - 120, HEADER_HEIGHT - 60],
      [0, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const handleBookNow = () => {
    if (!facility) return;
    setBookingLoading(true);
    try {
      haptics.impactMedium();
      
      // Initialize booking context
      resetBookingFlow();
      setStoreFacility(facility.id, facility.name);
      
      // Pre-select first available slot if present to avoid session errors
      if (facility.slots && facility.slots.length > 0) {
        const availableSlot = facility.slots.find(s => s.status === 'free');
        if (availableSlot) setSlot(availableSlot);
      }

      // Clear loading state synchronously before moving context to avoid unmount cleanup issues
      setBookingLoading(false);

      // Navigate to the structured booking flow
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
      
      {/* Dynamic Header Background */}
      <Animated.View style={[styles.headerImageContainer, headerAnimatedStyle]}>
        <Image 
          source={{ uri: facility.image_url || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80' }} 
          style={styles.headerImage}
          contentFit="cover"
          transition={1000}
        />
        <LinearGradient 
          colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.8)']} 
          style={styles.gradient}
        />
      </Animated.View>

      {/* Sticky Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]} 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <Animated.View style={[styles.navTitleContainer, navHeaderStyle]}>
           <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
           <Text style={styles.navTitle} numberOfLines={1}>{facility.name}</Text>
        </Animated.View>

        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]} 
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroSpacer} />
        
        <Animated.View entering={FadeInDown.delay(200).duration(800)} style={[styles.content, { backgroundColor: colors.background }]}>
          <View style={styles.indicator} />
          
          <View style={styles.titleSection}>
            <Text style={[styles.headerSub, { color: colors.primary }]}>PREMIUM FACILITY</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{facility.name}</Text>
            
            <View style={styles.metaRow}>
               <View style={styles.ratingBox}>
                  <Ionicons name="star" size={14} color="#FFB800" />
                  <Text style={[styles.ratingText, { color: colors.textPrimary }]}>{facility.rating || '4.9'}</Text>
               </View>
               <Text style={[styles.reviewCount, { color: colors.textMuted }]}>
                  • {formatReviewCount(facility.reviewCount)} REVIEWS
               </Text>
            </View>

            <View style={[styles.locationRow, { borderBottomColor: colors.border }]}>
               <Ionicons name="location-outline" size={20} color={colors.primary} />
               <Text style={[styles.addressText, { color: colors.textMuted }]}>{facility.address}</Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <InfoItem 
              icon="shield-checkmark-outline" 
              label="Secured" 
              value="24/7 CCTV" 
              colors={colors}
            />
            <InfoItem 
              icon="flash-outline" 
              label="EV READY" 
              value="LEVEL 3" 
              colors={colors}
            />
            <InfoItem 
              icon="layers-outline" 
              label="CAPACITY" 
              value={`${facility.available_slots} FREE`} 
              colors={colors}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Facility Overview</Text>
            <Text style={[styles.description, { color: colors.textMuted }]}>
              {facility.description || 'This high-integrity facility offers advanced automated parking solutions, reinforced 24/7 security, and climate-controlled environments for premium vehicle storage. Integrated with the ParkEasy grid for seamless entry and occupancy tracking.'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Amenities & Services</Text>
            <View style={styles.amenityContainer}>
               {(facility?.amenities ?? ['Automated Valet', 'EV Fast Charge', 'CCTV Grid', 'Climate Controlled', 'Underground']).map((item) => (
                 <View key={item} style={[styles.amenityPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.amenityText, { color: colors.textPrimary }]}>{item}</Text>
                 </View>
               ))}
            </View>
          </View>
          
          <View style={{ height: 160 }} />
        </Animated.View>
      </Animated.ScrollView>

      {/* Floating Price & Book Bar */}
      <View style={styles.footer}>
        <BlurView intensity={30} tint={colors.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[styles.footerInner, { borderTopColor: colors.border }]}>
          <View style={styles.priceBox}>
             <Text style={[styles.priceLabel, { color: colors.textMuted }]}>RATE / HOUR</Text>
             <Text style={[styles.priceValue, { color: colors.textPrimary }]}>₹{facility.hourly_rate}<Text style={styles.priceUnit}>.00</Text></Text>
          </View>
          <ProfessionalButton 
             label="Book Selection" 
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

interface InfoItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  colors: {
    primary: string;
    textMuted: string;
    textPrimary: string;
  };
}

function InfoItem({ icon, label, value, colors }: InfoItemProps) {
  return (
    <ProfessionalCard style={styles.infoCard} hasVibrancy={true}>
      <View style={[styles.iconBox, { backgroundColor: colors.primary + '10' }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{value}</Text>
    </ProfessionalCard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerImageContainer: { position: 'absolute', top: 0, width: width, height: HEADER_HEIGHT },
  headerImage: { width: '100%', height: '100%' },
  gradient: { ...StyleSheet.absoluteFillObject },
  topNav: { position: 'absolute', top: 0, left: 0, right: 0, height: 110, paddingTop: 50, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, zIndex: 10, gap: 12 },
  backButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  navTitleContainer: { flex: 1, height: 44, borderRadius: 22, overflow: 'hidden', justifyContent: 'center', paddingHorizontal: 20 },
  navTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', textAlign: 'center', letterSpacing: -0.2 },
  scrollContent: { flexGrow: 1 },
  heroSpacer: { height: HEADER_HEIGHT - 80 },
  content: { borderTopLeftRadius: 40, borderTopRightRadius: 40, overflow: 'hidden', paddingBottom: 40, marginTop: -20 },
  indicator: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.2)', alignSelf: 'center', marginTop: 12 },
  titleSection: { padding: 32, paddingBottom: 24 },
  headerSub: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -1, lineHeight: 40 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(255,184,0,0.1)' },
  ratingText: { fontSize: 14, fontWeight: '900' },
  reviewCount: { fontSize: 11, fontWeight: '700', opacity: 0.6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, paddingTop: 24, borderTopWidth: 0.5, gap: 10 },
  addressText: { fontSize: 14, fontWeight: '600', lineHeight: 22, flex: 1 },
  infoGrid: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 32 },
  infoCard: { flex: 1, padding: 20, alignItems: 'center', borderRadius: 28 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  infoLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.5 },
  infoValue: { fontSize: 13, fontWeight: '900', marginTop: 4, letterSpacing: -0.2 },
  section: { paddingHorizontal: 32, marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '900', marginBottom: 14, letterSpacing: -0.5 },
  description: { fontSize: 15, lineHeight: 26, fontWeight: '500', opacity: 0.8 },
  amenityContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amenityPill: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 16, borderWidth: 0.5 },
  amenityText: { fontSize: 12, fontWeight: '800' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  footerInner: { flex: 1, flexDirection: 'row', paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 20, justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 0.5 },
  priceBox: { flex: 1 },
  priceLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 4 },
  priceValue: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  priceUnit: { fontSize: 16, opacity: 0.5 },
  bookButton: { width: 220, height: 60 },
});
