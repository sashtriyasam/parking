import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  StatusBar,
  Pressable
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  useAnimatedScrollHandler,
  Extrapolate,
  FadeInDown,
  FadeInUp,
  FadeIn
} from 'react-native-reanimated';
import { ParkingFacilityCard } from '../../components/ParkingFacilityCard';
import { get } from '../../services/api';
import { colors } from '../../constants/colors';
import { ParkingFacility } from '../../types';
import { EmptyState } from '../../components/EmptyState';
import { useAuthStore } from '../../store/authStore';
import { mapAppearance } from '../../constants/mapAppearance';
import { Skeleton } from '../../components/ui/SkeletonLoader';

const { width, height } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 280;
const HEADER_MIN_HEIGHT = 120;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const mapRef = useRef<MapView>(null);

  // Animations
  const scrollY = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const headerStyle = useAnimatedStyle(() => {
    const h = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE],
      [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
      Extrapolate.CLAMP
    );
    return { height: h };
  });

  const headerTitleStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE * 0.5],
      [1, 0],
      Extrapolate.CLAMP
    );
    const scale = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE],
      [1, 0.9],
      Extrapolate.CLAMP
    );
    return { opacity, transform: [{ scale }] };
  });

  const stickyHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [HEADER_SCROLL_DISTANCE * 0.8, HEADER_SCROLL_DISTANCE],
      [0, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const animatedMarkerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.2], [1, 0.6]),
  }));

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nearbyFacilities, setNearbyFacilities] = useState<ParkingFacility[]>([]);
  const [recentFacilities, setRecentFacilities] = useState<ParkingFacility[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  const fetchFacilities = async (lat?: number, lon?: number) => {
    try {
      setLoading(true);
      const url = (lat && lon)
        ? `/parking/search?lat=${lat}&lon=${lon}&limit=10`
        : `/parking/search?limit=10`;
      const res = await get(url);
      setNearbyFacilities(res.data.data);

      const recentRes = await get('/customer/tickets');
      const tickets = recentRes.data.data || [];
      const recents: ParkingFacility[] = [];
      const seen = new Set();
      for (const t of tickets) {
        if (t.facility && !seen.has(t.facility.id) && recents.length < 3) {
          seen.add(t.facility.id);
          recents.push(t.facility);
        }
      }
      setRecentFacilities(recents);
    } catch (e) {
      console.error('Error fetching facilities', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const initLocationAndFetch = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      fetchFacilities();
      return;
    }

    try {
      // Enforce a 5s timeout on location fetching to prevent hanging on slow GPS
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Location timeout')), 5000)
      );

      const loc = await Promise.race([locationPromise, timeoutPromise]) as Location.LocationObject;
      setLocation(loc);
      fetchFacilities(loc.coords.latitude, loc.coords.longitude);
    } catch (error) {
      console.warn('Location fetch failed or timed out:', error);
      fetchFacilities();
    }
  };

  useEffect(() => {
    initLocationAndFetch();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    if (location) {
      fetchFacilities(location.coords.latitude, location.coords.longitude);
    } else {
      initLocationAndFetch();
    }
  };

  const centerOnLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'PHASE: MORNING';
    if (hour < 17) return 'PHASE: AFTERNOON';
    return 'PHASE: EVENING';
  };

  const categories = [
    { title: 'Airport', icon: 'airplane', color: colors.premium.primary },
    { title: 'Mall', icon: 'cart', color: colors.premium.secondary },
    { title: 'Office', icon: 'business', color: colors.premium.tertiary },
    { title: 'Hospital', icon: 'medkit', color: colors.premium.quinary },
  ];

  const renderMapView = () => (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: location?.coords.latitude || 28.6139,
          longitude: location?.coords.longitude || 77.2090,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        customMapStyle={mapAppearance}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {nearbyFacilities.map((facility) => (
          <Marker
            key={facility.id}
            coordinate={{
              latitude: Number(facility.latitude),
              longitude: Number(facility.longitude),
            }}
          >
            <View style={styles.customMarkerContainer}>
              <Animated.View style={[styles.markerPulse, animatedMarkerStyle]} />
              <View style={styles.markerInner}>
                <Text style={styles.markerText}>{(facility.address || '').length > 30 ? (facility.address || '').substring(0, 30) + '...' : (facility.address || '')}</Text>
              </View>
            </View>
            <Callout
              tooltip
              onPress={() => router.push(`/(customer)/facility/${facility.id}`)}
            >
              <BlurView intensity={80} tint="dark" style={styles.calloutBlur}>
                <Text style={styles.calloutTitle}>{facility.name}</Text>
                <Text style={styles.calloutSubtitle}>{(facility.address || '').length > 30 ? (facility.address || '').substring(0, 30) + '...' : (facility.address || '')}</Text>
                <View style={styles.calloutAction}>
                  <Text style={styles.calloutActionText}>ACCESS FACILITY</Text>
                  <Ionicons name="chevron-forward" size={14} color="white" />
                </View>
              </BlurView>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <BlurView intensity={30} tint="dark" style={styles.mapControls}>
        <TouchableOpacity style={styles.mapBtn} onPress={centerOnLocation}>
          <Ionicons name="locate" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapBtn} onPress={() => router.push('/(customer)/search')}>
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
      </BlurView>

      <View style={styles.mapOverlayBottom}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalFacilities}
          snapToInterval={width * 0.8 + 20}
          decelerationRate="fast"
        >
          {nearbyFacilities.map((facility) => (
            <ParkingFacilityCard
              key={facility.id}
              facility={facility}
              onPress={() => router.push(`/(customer)/facility/${facility.id}`)}
              style={styles.horizontalCard}
              distance={facility.distance}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderListView = () => (
    <View style={styles.listContainer}>
      <Animated.View style={[styles.header, headerStyle]}>
        <LinearGradient
          colors={['#0f172a', '#020617']}
          style={StyleSheet.absoluteFill}
        />

        {/* Immersive Background Elements */}
        <Animated.View style={[styles.bgCircle, styles.circlePrimary]} entering={FadeIn.duration(2000)} />

        <Animated.View style={[styles.headerContent, headerTitleStyle]}>
          <Text style={styles.greetingHeader}>{getGreeting()}</Text>
          <Text style={styles.userName}>Hello, {user?.full_name?.split(' ')[0] || 'Agent'}</Text>
          <Text style={styles.mainHeadline}>Where shall we{'\n'}secure your node?</Text>
        </Animated.View>

        <View style={styles.searchContainer}>
          <BlurView intensity={30} tint="dark" style={styles.searchGlass}>
            <Pressable
              style={styles.searchInner}
              onPress={() => router.push('/(customer)/search')}
            >
              <Ionicons name="search-outline" size={22} color="rgba(255,255,255,0.6)" />
              <Text style={styles.searchPlaceholder}>Trace for nearby access points...</Text>
              <LinearGradient
                colors={colors.premium.neonPulse}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.searchPulse}
              />
            </Pressable>
          </BlurView>
        </View>

        {/* Sticky Header Mini Content */}
        <AnimatedBlurView intensity={50} tint="dark" style={[styles.stickyHeader, stickyHeaderStyle]}>
          <Text style={styles.stickyTitle}>DISCOVERY MODE</Text>
        </AnimatedBlurView>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.premium.primary} />}
      >
        <Animated.View style={styles.categorySection} entering={FadeInDown.delay(200).duration(800)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
            {categories.map((cat, idx) => (
              <TouchableOpacity key={idx} style={styles.categoryItem} activeOpacity={0.7}>
                <BlurView intensity={20} tint="dark" style={styles.categoryGlass}>
                  <Ionicons name={cat.icon as any} size={24} color={cat.color} />
                </BlurView>
                <Text style={styles.categoryLabel}>{cat.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PROXIMITY NODES</Text>
            <TouchableOpacity onPress={() => setViewMode('map')} style={styles.mapToggleRow}>
              <Text style={styles.seeAllText}>VIEW RADAR</Text>
              <Ionicons name="navigate-outline" size={16} color={colors.premium.primary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.listContent}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 20 }}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={{ width: 300, gap: 15 }}>
                    <Skeleton width={300} height={160} borderRadius={28} />
                    <Skeleton width={220} height={24} />
                    <Skeleton width={160} height={16} />
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : nearbyFacilities.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listContent}>
              {nearbyFacilities.map((facility, idx) => (
                <Animated.View key={facility.id} entering={FadeInDown.delay(300 + idx * 100).springify()}>
                  <ParkingFacilityCard
                    facility={facility}
                    onPress={() => router.push(`/(customer)/facility/${facility.id}`)}
                    distance={facility.distance}
                  />
                </Animated.View>
              ))}
            </ScrollView>
          ) : (
            <EmptyState
              icon="navigate-outline"
              title="ZERO NODES DETECTED"
              subtitle="Initialize a broader search sequence."
              actionLabel="GLOBAL SEARCH"
              onAction={() => router.push('/(customer)/search')}
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>RECENT PROTOCOLS</Text>
          </View>

          {loading ? (
            <View style={styles.listContent}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 20 }}>
                {[1, 2].map((i) => (
                  <View key={i} style={{ width: 300, gap: 15 }}>
                    <Skeleton width={300} height={120} borderRadius={24} />
                    <Skeleton width={200} height={20} />
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : recentFacilities.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listContent}>
              {recentFacilities.map((facility, index) => (
                <Animated.View key={`${facility.id}-${index}`} entering={FadeInDown.delay(500 + index * 100).springify()}>
                  <ParkingFacilityCard
                    facility={facility}
                    onPress={() => router.push(`/(customer)/facility/${facility.id}`)}
                  />
                </Animated.View>
              ))}
            </ScrollView>
          ) : (
            <EmptyState
              icon="timer-outline"
              title="NO PREVIOUS LOGS"
              subtitle="Start your first encryption session."
            />
          )}
        </View>
        <View style={{ height: 120 }} />
      </Animated.ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {viewMode === 'list' ? renderListView() : renderMapView()}

      <Animated.View style={styles.viewToggleContainer} entering={FadeInUp.delay(1000).springify()}>
        <BlurView intensity={50} tint="dark" style={styles.toggleGlass}>
          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
            activeOpacity={0.8}
          >
            <View style={styles.toggleIconBox}>
              <Ionicons name={viewMode === 'list' ? 'map-outline' : 'list-outline'} size={20} color="white" />
            </View>
            <Text style={styles.toggleLabel}>{viewMode === 'list' ? 'RADAR VIEW' : 'LIST VIEW'}</Text>
          </TouchableOpacity>
        </BlurView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  listContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: HEADER_MAX_HEIGHT + 20,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: 'hidden',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerContent: {
    paddingTop: 70,
    paddingHorizontal: 28,
  },
  greetingHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.premium.primary,
    letterSpacing: 4,
    marginBottom: 8,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  mainHeadline: {
    fontSize: 34,
    fontWeight: '900',
    color: 'white',
    lineHeight: 40,
    letterSpacing: -1,
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.15,
  },
  circlePrimary: {
    width: 200,
    height: 200,
    top: -50,
    right: -20,
    backgroundColor: colors.premium.primary,
  },
  searchContainer: {
    position: 'absolute',
    bottom: 25,
    left: 28,
    right: 28,
  },
  searchGlass: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 12,
  },
  searchPlaceholder: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  searchPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: colors.premium.primary,
    shadowRadius: 10,
    shadowOpacity: 0.8,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
    zIndex: 200,
  },
  stickyTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 4,
  },
  categorySection: {
    marginTop: 10,
    paddingHorizontal: 28,
  },
  categoryList: {
    gap: 24,
    paddingVertical: 10,
  },
  categoryItem: {
    alignItems: 'center',
    gap: 10,
  },
  categoryGlass: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
  section: {
    marginTop: 36,
  },
  sectionHeader: {
    paddingHorizontal: 28,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 3,
    opacity: 0.8,
  },
  mapToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seeAllText: {
    fontSize: 10,
    color: colors.premium.primary,
    fontWeight: '900',
    letterSpacing: 1,
  },
  listContent: {
    paddingLeft: 28,
    paddingBottom: 20,
    gap: 20,
  },
  viewToggleContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    zIndex: 1000,
  },
  toggleGlass: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    ...colors.shadows.premium,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 12,
  },
  toggleIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.premium.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: {
    color: 'white',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapControls: {
    position: 'absolute',
    top: 70,
    right: 24,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  mapBtn: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  mapOverlayBottom: {
    position: 'absolute',
    bottom: 110,
    left: 0,
    right: 0,
  },
  horizontalFacilities: {
    paddingHorizontal: 28,
    gap: 20,
  },
  horizontalCard: {
    width: width * 0.8,
    marginRight: 0,
  },
  customMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPulse: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.premium.primary,
  },
  markerInner: {
    backgroundColor: colors.premium.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'white',
  },
  markerText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '900',
  },
  calloutBlur: {
    borderRadius: 24,
    padding: 20,
    width: 240,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: 'white',
    marginBottom: 4,
  },
  calloutSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 16,
    lineHeight: 16,
  },
  calloutAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 14,
  },
  calloutActionText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
