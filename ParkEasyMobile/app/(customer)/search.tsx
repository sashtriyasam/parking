import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeIn,
  SlideInUp,
  Layout,
  LinearTransition,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { get } from '../../services/api';
import { ParkingFacilityCard } from '../../components/ParkingFacilityCard';
import { colors, VEHICLE_TYPE_COLORS } from '../../constants/colors';
import { ParkingFacility, VehicleType } from '../../types';
import { EmptyState } from '../../components/EmptyState';

const VEHICLE_FILTERS: { label: string; value: VehicleType; icon: any; color: string }[] = [
  { label: 'BIKE', value: 'bike', icon: 'bicycle', color: colors.premium.primary },
  { label: 'SCOOTER', value: 'scooter', icon: 'bicycle-outline', color: colors.premium.tertiary },
  { label: 'CAR', value: 'car', icon: 'car', color: colors.premium.secondary },
  { label: 'TRUCK', value: 'truck', icon: 'bus', color: colors.premium.quaternary },
];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
  const [results, setResults] = useState<ParkingFacility[]>([]);
  const [loading, setLoading] = useState(false);
  const searchProgress = useSharedValue(0);

  const search = useCallback(async (q: string, type: VehicleType | null) => {
    setLoading(true);
    searchProgress.value = withSpring(1);
    try {
      let url = `/parking/search?query=${encodeURIComponent(q)}`;
      if (type) url += `&vehicle_type=${type}`;
      const res = await get(url);
      setResults(res.data.data || []);
    } catch (e) {
      console.error('Search error', e);
    } finally {
      setLoading(false);
      searchProgress.value = withSpring(0);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query, vehicleType);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, vehicleType, search]);

  const loaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(searchProgress.value, [0, 1], [0, 1]),
    transform: [{ scale: interpolate(searchProgress.value, [0, 1], [0.8, 1]) }]
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Immersive Background */}
      <View style={styles.bgWrapper}>
        <LinearGradient
          colors={['#080a0f', '#020617']}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.glowPoint, { top: '10%', right: '-10%', backgroundColor: colors.premium.primary }]} />
        <View style={[styles.glowPoint, { bottom: '20%', left: '-20%', backgroundColor: colors.premium.secondary, opacity: 0.1 }]} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Kinetic Search Header */}
        <Animated.View entering={SlideInUp.duration(600)} style={styles.header}>
          <BlurView intensity={40} tint="dark" style={styles.headerContent}>
            <View style={styles.headerTop}>
              <TouchableOpacity 
                onPress={() => router.back()} 
                style={styles.backBtn}
                accessibilityLabel="Back"
                accessibilityRole="button"
              >
                <Ionicons name="chevron-back" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>SECURE TRACE</Text>
              <View style={{ width: 44 }} />
            </View>

            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.4)" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Target Area, Facility, or Node..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={query}
                  onChangeText={setQuery}
                  autoFocus
                  selectionColor={colors.premium.primary}
                />
                <Animated.View style={loaderStyle}>
                  <ActivityIndicator size="small" color={colors.premium.primary} />
                </Animated.View>
                {!loading && query.length > 0 && (
                  <TouchableOpacity 
                    onPress={() => setQuery('')} 
                    style={styles.clearBtn}
                    accessibilityLabel="Clear search"
                    accessibilityRole="button"
                  >
                    <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.filtersWrapper}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={VEHICLE_FILTERS}
                keyExtractor={(item) => item.value}
                contentContainerStyle={styles.filtersContent}
                renderItem={({ item, index }) => {
                  const isActive = vehicleType === item.value;
                  return (
                    <Animated.View entering={FadeInDown.delay(index * 50 + 400).springify()}>
                      <TouchableOpacity
                        onPress={() => setVehicleType(isActive ? null : item.value)}
                        activeOpacity={0.8}
                        accessibilityLabel={`Filter by ${item.label}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isActive }}
                      >
                        <BlurView
                          intensity={isActive ? 60 : 20}
                          tint="dark"
                          style={[
                            styles.filterChip,
                            isActive && { borderColor: item.color + '80' }
                          ]}
                        >
                          {isActive && (
                            <View style={[styles.activeDot, { backgroundColor: item.color }]} />
                          )}
                          <Ionicons
                            name={item.icon as any}
                            size={16}
                            color={isActive ? 'white' : 'rgba(255,255,255,0.4)'}
                          />
                          <Text style={[
                            styles.chipText,
                            isActive && { color: 'white', fontWeight: '900' }
                          ]}>
                            {item.label}
                          </Text>
                        </BlurView>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                }}
              />
            </View>
          </BlurView>
        </Animated.View>

        {loading && results.length === 0 ? (
          <Animated.View entering={FadeIn} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.premium.primary} />
            <Text style={[styles.resultsCount, { marginTop: 20, textAlign: 'center', opacity: 0.6 }]}>
              PENETRATING GRID...
            </Text>
          </Animated.View>
        ) : results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <Animated.View
                layout={LinearTransition.springify().damping(15)}
                entering={FadeInDown.delay(index < 10 ? index * 100 : 0).springify().damping(15)}
                style={styles.resultWrapper}
              >
                <ParkingFacilityCard
                  facility={item}
                  onPress={() => router.push(`/(customer)/facility/${item.id}`)}
                />
              </Animated.View>
            )}
            ListHeaderComponent={
              <Animated.Text entering={FadeIn.delay(600)} style={styles.resultsCount}>
                TRACE COMPLETE: {results.length} ACTIVE NODES DETECTED
              </Animated.Text>
            }
          />
        ) : (
          <Animated.View entering={FadeIn.delay(400)} style={{ flex: 1, justifyContent: 'center' }}>
            <EmptyState
              icon={query.length > 0 ? "eye-off-outline" : "wifi-outline"}
              title={query.length > 0 ? "TRACE ZEROED" : "INITIALIZE SCAN"}
              subtitle={query.length > 0
                ? "Keyword mismatch. Divert trace parameters."
                : "Scanning for nearby parking infrastructure..."}
              actionLabel={query.length > 0 ? "RESET TRACE" : undefined}
              onAction={query.length > 0 ? () => { setQuery(''); setVehicleType(null); } : undefined}
            />
          </Animated.View>
        )}
      </KeyboardAvoidingView>
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
    opacity: 0.15,
  },
  header: {
    zIndex: 100,
  },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 4,
    opacity: 0.8,
  },
  searchContainer: {
    paddingHorizontal: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 18,
    borderRadius: 22,
    height: 64,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 14,
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  clearBtn: {
    padding: 8,
  },
  filtersWrapper: {
    marginTop: 20,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: -2,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  resultsList: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
    alignItems: 'center',
  },
  resultsCount: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.premium.primary,
    letterSpacing: 3,
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.7,
  },
  resultWrapper: {
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
});
