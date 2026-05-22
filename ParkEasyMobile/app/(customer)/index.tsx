import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mapAppearance, darkMapAppearance } from '../../constants/mapAppearance';
import { ProfessionalCard } from '../../components/ui/ProfessionalCard';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { ParkingFacilityCard } from '../../components/ParkingFacilityCard';
import { get } from '../../services/api';
import { ParkingFacility } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptics } from '../../hooks/useHaptics';

import { MapView, Marker, PROVIDER_GOOGLE } from '../../components/MapPlaceholder';
const { width } = Dimensions.get('window');
const DASHBOARD_HEIGHT = 240;
const CARD_WIDTH = width * 0.82;
const CARD_GAP = 16;
const NEAR_ME_DISTANCE_KM = 5;
const LOW_PRICE_THRESHOLD = 100;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const haptics = useHaptics();
  const mapRef = useRef<React.ElementRef<typeof MapView>>(null);
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState<ParkingFacility[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredFacilities = useMemo(() => {
    if (activeFilter === 'All') return facilities;
    
    return facilities.filter(f => {
      switch (activeFilter) {
        case 'Near Me':
          return (f.distance || 0) <= NEAR_ME_DISTANCE_KM;
        case 'Low Price':
          return (f.price_per_hour || 0) <= LOW_PRICE_THRESHOLD;
        case 'Valet':
          return f.amenities?.some(a => a.toLowerCase().includes('valet'));
        case 'EV':
          return f.amenities?.some(a => a.toLowerCase().includes('ev'));
        default:
          return true;
      }
    });
  }, [facilities, activeFilter]);

  useEffect(() => {
    initLocationAndFetch();
  }, []);

  // Animate map to location when it's first available
  useEffect(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000);
    }
  }, [location]);

  const initLocationAndFetch = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      fetchFacilities();
      return;
    }

    try {
      const loc = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Location timeout')), 5000)
        )
      ]);
      setLocation(loc);
      fetchFacilities(loc.coords.latitude, loc.coords.longitude);
    } catch (error) {
      fetchFacilities();
    }
  };

  const fetchFacilities = async (lat?: number, lon?: number) => {
    try {
      setLoading(true);
      const url = lat && lon ? `/parking/search?lat=${lat}&lon=${lon}&limit=12` : `/parking/search?limit=12`;
      const res = await get(url);
      setFacilities(res?.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const centerOnLocation = () => {
    haptics.impactLight();
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const filters = ['All', 'Near Me', 'Low Price', 'Valet', 'EV'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />

      {Platform.OS !== 'web' ? (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          customMapStyle={colors.isDark ? darkMapAppearance : mapAppearance}
          initialRegion={{
            latitude: location?.coords?.latitude || 19.0760,
            longitude: location?.coords?.longitude || 72.8777,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {filteredFacilities.filter(f => f.latitude != null && f.longitude != null).map((f) => (
            <Marker
              key={f.id}
              coordinate={{ latitude: Number(f.latitude), longitude: Number(f.longitude) }}
              onPress={() => {
                haptics.impactLight();
                router.push(`/(customer)/facility/${f.id}`);
              }}
            >
              <View style={styles.markerWrapper}>
                <View style={[styles.markerBody, { backgroundColor: colors.primary }]}>
                   <Text style={styles.markerPrice}>{f.available_slots} slots</Text>
                </View>
                <View style={[styles.markerTip, { borderTopColor: colors.primary }]} />
              </View>
            </Marker>
          ))}
        </MapView>
      ) : (
        <View style={[styles.webPlaceholder, { backgroundColor: colors.background }]}>
          <Ionicons name="map-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.webText, { color: colors.textMuted }]}>Interactive map available on mobile</Text>
        </View>
      )}

      {/* Modern High-Fidelity Floating Header */}
      <View style={[styles.floatingHeader, { top: insets.top + 8 }]}>
         {/* Welcome & Profile Row */}
         <View style={styles.welcomeRow}>
            <View>
               <Text style={[styles.welcomeGreeting, { color: colors.textPrimary }]}>
                  Hello, {user?.full_name ? user.full_name.split(' ')[0] : 'Driver'}
               </Text>
               <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
                  Find your spot today
               </Text>
            </View>
            <TouchableOpacity 
               onPress={() => {
                  haptics.impactLight();
                  router.push('/(customer)/profile');
               }}
               style={[styles.profileButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
               activeOpacity={0.8}
            >
               <Ionicons name="person" size={16} color={colors.primary} />
            </TouchableOpacity>
         </View>

         {/* Search Bar Input Trigger */}
         <TouchableOpacity 
            onPress={() => {
                haptics.impactLight();
                router.push('/(customer)/search');
            }}
            style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.9}
         >
            <View style={styles.searchInner}>
               <Ionicons name="search" size={18} color={colors.textSecondary} />
               <Text style={[styles.searchPlaceholder, { color: colors.textMuted }]}>Search parking locations...</Text>
            </View>
         </TouchableOpacity>

         <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterBar}
            contentContainerStyle={styles.filterContent}
         >
            {filters.map((f, i) => (
               <Animated.View key={f} entering={FadeInDown.delay(200 + i * 50)}>
                  <TouchableOpacity
                     onPress={() => {
                        haptics.selection();
                        setActiveFilter(activeFilter === f ? 'All' : f);
                     }}
                     style={[
                        styles.filterChip,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        activeFilter === f && { backgroundColor: colors.primary, borderColor: colors.primary }
                     ]}
                  >
                     <Text style={[
                        styles.chipText,
                        { color: colors.textPrimary },
                        activeFilter === f && { color: '#FFFFFF' }
                     ]}>{f}</Text>
                  </TouchableOpacity>
               </Animated.View>
            ))}
         </ScrollView>
      </View>

      <View style={[styles.fabWrapper, { bottom: DASHBOARD_HEIGHT + insets.bottom + 10 }]}>
         <TouchableOpacity 
            style={[styles.fab, { backgroundColor: colors.surface, borderColor: colors.border }]} 
            onPress={centerOnLocation}
         >
            <Ionicons name="navigate" size={22} color={colors.primary} />
         </TouchableOpacity>
      </View>

      {/* Discovery Dashboard Bottom Sheet */}
      <View style={[styles.bottomDashboard, { paddingBottom: insets.bottom + 12 }]}>
         <View style={styles.dashboardHeader}>
            <Text style={[styles.dashboardHeadline, { color: colors.textMuted }]}>EXPLORE NEARBY</Text>
            <TouchableOpacity onPress={() => router.push('/(customer)/search')}>
               <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
         </View>

         <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.facilityList}
            snapToInterval={CARD_WIDTH + CARD_GAP}
            decelerationRate="fast"
            disableIntervalMomentum
         >
            {loading ? (
               <View style={{ width: width, height: 160, justifyContent: 'center' }}>
                  <ActivityIndicator color={colors.primary} />
               </View>
            ) : filteredFacilities.length > 0 ? (
               filteredFacilities.map((f, i) => (
                  <Animated.View key={f.id} entering={FadeInUp.delay(Math.min(300 + i * 50, 600))}>
                     <ParkingFacilityCard
                        facility={f}
                        distance={f.distance}
                        onPress={() => {
                           haptics.impactMedium();
                           router.push(`/(customer)/facility/${f.id}`);
                        }}
                        style={{ width: CARD_WIDTH, marginRight: CARD_GAP }}
                     />
                  </Animated.View>
               ))
            ) : (
               <View style={styles.noData}>
                  <Text style={[styles.noDataText, { color: colors.textMuted }]}>No results available in this area.</Text>
               </View>
            )}
         </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  webPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  webText: { fontSize: 16, fontWeight: '600' },
  markerWrapper: { alignItems: 'center' },
  markerBody: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1.5, borderColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  markerPrice: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  markerTip: { width: 0, height: 0, borderStyle: 'solid', borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent', alignSelf: 'center', marginTop: -2 },
  floatingHeader: { position: 'absolute', left: 0, right: 0, paddingHorizontal: 16, zIndex: 100 },
  welcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
  welcomeGreeting: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  welcomeSubtitle: { fontSize: 13, fontWeight: '400', marginTop: 2 },
  searchBar: { height: 48, borderRadius: 10, borderWidth: 1, justifyContent: 'center' },
  searchInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  searchPlaceholder: { fontSize: 15, fontWeight: '400', marginLeft: 8 },
  profileButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  filterBar: { marginTop: 10 },
  filterContent: { paddingRight: 16, gap: 8 },
  filterChip: { height: 32, paddingHorizontal: 14, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '500' },
  fabWrapper: { position: 'absolute', right: 16, zIndex: 30 },
  fab: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  bottomDashboard: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'transparent' },
  dashboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  dashboardHeadline: { fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  seeAll: { fontSize: 13, fontWeight: '600' },
  facilityList: { paddingHorizontal: 20, paddingBottom: 16 },
  noData: { width: width - 40, height: 140, justifyContent: 'center', alignItems: 'center' },
  noDataText: { fontSize: 13, fontWeight: '500' }
});
