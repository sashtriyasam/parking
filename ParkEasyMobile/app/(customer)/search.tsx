import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  SlideInUp,
  LinearTransition
} from 'react-native-reanimated';
import { get } from '../../services/api';
import { searchLocation, LocationSuggestion } from '../../services/geocoding';
import { ParkingFacilityCard } from '../../components/ParkingFacilityCard';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptics } from '../../hooks/useHaptics';
import { useToast } from '../../components/Toast';
import { ParkingFacility, VehicleType } from '../../types';
import { EmptyState } from '../../components/EmptyState';

type SearchMode = 'NAME' | 'COORD';
const INVALID_COORDINATES_ERROR = 'Invalid coordinates received from suggestion';

const VEHICLE_FILTERS: { label: string; value: VehicleType; icon: any }[] = [
  { label: 'Bike', value: 'bike', icon: 'bicycle' },
  { label: 'Scooter', value: 'scooter', icon: 'bicycle-outline' },
  { label: 'Car', value: 'car', icon: 'car' },
  { label: 'Truck', value: 'truck', icon: 'bus' },
];

export default function SearchScreen() {
  const colors = useThemeColors();
  const haptics = useHaptics();
  const { showToast } = useToast();
  const router = useRouter();
  
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('COORD');
  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  
  const [results, setResults] = useState<ParkingFacility[]>([]);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  const handleSearch = useCallback(async (q: string, m: SearchMode, type: VehicleType | null) => {
    if (!q) {
      setResults([]);
      setSuggestions([]);
      return;
    }
    
    setLoading(true);
    try {
      if (m === 'NAME') {
        let url = `/parking/search?query=${encodeURIComponent(q)}`;
        if (type) url += `&vehicle_type=${type}`;
        const res = await get(url);
        setResults(res.data.data || []);
      } else {
        const locs = await searchLocation(q);
        setSuggestions(locs);
      }
    } catch (e) {
      console.error('Search error', e);
      haptics.notificationError();
      showToast('Search failed — please try again', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query, mode, vehicleType);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, mode, vehicleType, handleSearch]);

  const toggleMode = (m: SearchMode) => {
    haptics.impactLight();
    setMode(m);
    setQuery('');
    setResults([]);
    setSuggestions([]);
    searchInputRef.current?.focus();
  };

  const handleSuggestionPress = async (suggestion: LocationSuggestion) => {
    haptics.impactMedium();
    setLoading(true);
    try {
      const lat = parseFloat(suggestion.lat);
      const lon = parseFloat(suggestion.lon);
      
      if (isNaN(lat) || isNaN(lon)) {
        throw new Error(INVALID_COORDINATES_ERROR);
      }

      const url = `/parking/search?lat=${lat}&lon=${lon}&limit=10`;
      const res = await get(url);
      setResults(res.data.data || []);
      setSuggestions([]);
      setMode('NAME'); 
      setQuery(suggestion.display_name.split(',')[0]);
    } catch (e: any) {
      console.error('Suggestion fetch error', e);
      haptics.notificationError();
      const errorMsg = e.message === INVALID_COORDINATES_ERROR 
        ? "Unable to find location"
        : "Failed to fetch parking data";
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = useMemo(() => {
    return results.filter(f => {
      if (onlyAvailable && f.available_slots <= 0) return false;
      if (maxPrice !== null && (f.price_per_hour || 0) > maxPrice) return false;
      return true;
    });
  }, [results, onlyAvailable, maxPrice]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View entering={SlideInUp.duration(400)} style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
               <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Find Parking</Text>
          </View>

          {/* Segmented Mode Selector */}
          <View style={[styles.segmentedControl, { backgroundColor: colors.surface, borderColor: colors.border }]}>
             <TouchableOpacity 
                onPress={() => toggleMode('COORD')}
                style={[styles.segment, mode === 'COORD' && { backgroundColor: colors.background }]}
             >
                <Text style={[styles.segmentText, { color: mode === 'COORD' ? colors.primary : colors.textSecondary }]}>By Location</Text>
             </TouchableOpacity>
             <TouchableOpacity 
                onPress={() => toggleMode('NAME')}
                style={[styles.segment, mode === 'NAME' && { backgroundColor: colors.background }]}
             >
                <Text style={[styles.segmentText, { color: mode === 'NAME' ? colors.primary : colors.textSecondary }]}>By Name</Text>
             </TouchableOpacity>
          </View>

          {/* Search Field */}
          <View style={styles.searchContainer}>
             <View style={[styles.searchField, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name={mode === 'COORD' ? "location-outline" : "search-outline"} size={18} color={colors.textSecondary} />
                <TextInput
                   ref={searchInputRef}
                   style={[styles.input, { color: colors.textPrimary }]}
                   placeholder={mode === 'COORD' ? "Enter destination..." : "Enter parking name..."}
                   placeholderTextColor={colors.textMuted}
                   value={query}
                   onChangeText={setQuery}
                   selectionColor={colors.primary}
                />
                {loading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : query.length > 0 ? (
                  <TouchableOpacity onPress={() => setQuery('')}>
                     <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
             </View>
          </View>

          {/* Combined Filters Row */}
          <View style={styles.filtersWrapper}>
             <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterContent}
             >
                {/* Available Only Toggle */}
                <TouchableOpacity 
                   onPress={() => {
                      haptics.impactLight();
                      setOnlyAvailable(!onlyAvailable);
                   }}
                   style={[
                     styles.filterChip, 
                     { backgroundColor: colors.surface, borderColor: colors.border },
                     onlyAvailable && { backgroundColor: colors.primary, borderColor: colors.primary }
                   ]}
                >
                   <Ionicons name={onlyAvailable ? "checkmark-circle" : "ellipse-outline"} size={14} color={onlyAvailable ? '#FFF' : colors.textSecondary} />
                   <Text style={[styles.filterText, { color: onlyAvailable ? '#FFF' : colors.textSecondary }]}>Available Only</Text>
                </TouchableOpacity>

                {/* Price Limit Toggle */}
                <TouchableOpacity 
                   onPress={() => {
                      haptics.impactLight();
                      setMaxPrice(maxPrice === null ? 100 : maxPrice === 100 ? 200 : null);
                   }}
                   style={[
                     styles.filterChip, 
                     { backgroundColor: colors.surface, borderColor: colors.border },
                     maxPrice !== null && { backgroundColor: colors.primary, borderColor: colors.primary }
                   ]}
                >
                   <Ionicons name="pricetag-outline" size={14} color={maxPrice !== null ? '#FFF' : colors.textSecondary} />
                   <Text style={[styles.filterText, { color: maxPrice !== null ? '#FFF' : colors.textSecondary }]}>
                     {maxPrice === null ? 'Any Price' : `< ₹${maxPrice}`}
                   </Text>
                </TouchableOpacity>

                {/* Divider in scroll */}
                <View style={{ width: 1, backgroundColor: colors.border, height: 20, alignSelf: 'center' }} />

                {/* Vehicle Types */}
                {VEHICLE_FILTERS.map((item) => {
                   const active = vehicleType === item.value;
                   return (
                      <TouchableOpacity 
                         key={item.value}
                         onPress={() => {
                            haptics.impactLight();
                            setVehicleType(active ? null : item.value);
                         }}
                         style={[
                           styles.filterChip, 
                           { backgroundColor: colors.surface, borderColor: colors.border },
                           active && { backgroundColor: colors.primary, borderColor: colors.primary }
                         ]}
                      >
                         <Ionicons name={item.icon} size={14} color={active ? '#FFF' : colors.textSecondary} />
                         <Text style={[styles.filterText, { color: active ? '#FFF' : colors.textSecondary }]}>{item.label}</Text>
                      </TouchableOpacity>
                   );
                })}
             </ScrollView>
          </View>
        </Animated.View>

        {mode === 'COORD' && suggestions.length > 0 ? (
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id.toString()}
            contentContainerStyle={styles.suggestionList}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(index * 40)}>
                <TouchableOpacity 
                   style={[styles.suggestionRow, { borderBottomColor: colors.border }]}
                   onPress={() => handleSuggestionPress(item)}
                >
                   <View style={[styles.suggestionIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Ionicons name="location" size={18} color={colors.primary} />
                   </View>
                   <View style={styles.suggestionInfo}>
                      <Text style={[styles.suggestionPrimary, { color: colors.textPrimary }]} numberOfLines={1}>
                         {item.display_name.split(',')[0]}
                      </Text>
                      <Text style={[styles.suggestionSecondary, { color: colors.textSecondary }]} numberOfLines={1}>
                         {item.display_name.split(',').slice(1).join(',')}
                      </Text>
                   </View>
                   <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </Animated.View>
            )}
          />
        ) : filteredResults.length > 0 ? (
          <FlatList
            data={filteredResults}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.resultsContent}
            renderItem={({ item, index }) => (
              <Animated.View
                layout={LinearTransition.springify()}
                entering={FadeInDown.delay(index * 60)}
                style={styles.resultCard}
              >
                <ParkingFacilityCard
                  facility={item}
                  distance={item.distance}
                  onPress={() => router.push(`/(customer)/facility/${item.id}`)}
                />
              </Animated.View>
            )}
            ListHeaderComponent={
              <Text style={[styles.metaTitle, { color: colors.textSecondary }]}>{filteredResults.length} PLACES MATCHING</Text>
            }
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <EmptyState
              icon={query.length > 0 ? "search-outline" : "map-outline"}
              title={query.length > 0 ? "No matches found" : "Ready to explore?"}
              subtitle={query.length > 0
                ? "Try clearing some of your filters or changing search terms."
                : "Search a destination or facility name to see options."}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { zIndex: 100, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: Platform.OS === 'ios' ? 50 : 20, marginBottom: 12 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  headerTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  segmentedControl: { flexDirection: 'row', marginHorizontal: 20, borderRadius: 10, padding: 2, height: 38, marginBottom: 12, borderWidth: 1 },
  segment: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  segmentText: { fontSize: 13, fontWeight: '500' },
  searchContainer: { paddingHorizontal: 20, marginBottom: 12 },
  searchField: { flexDirection: 'row', alignItems: 'center', height: 46, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1 },
  input: { flex: 1, marginLeft: 8, fontSize: 16, fontWeight: '400' },
  filtersWrapper: { marginBottom: 12 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 32, borderRadius: 8, borderWidth: 1, gap: 6 },
  filterText: { fontSize: 12, fontWeight: '500' },
  suggestionList: { paddingHorizontal: 20 },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  suggestionIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1 },
  suggestionInfo: { flex: 1 },
  suggestionPrimary: { fontSize: 15, fontWeight: '600' },
  suggestionSecondary: { fontSize: 12, marginTop: 2 },
  resultsContent: { padding: 20, paddingBottom: 60 },
  metaTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 16 },
  resultCard: { marginBottom: 12 },
});
