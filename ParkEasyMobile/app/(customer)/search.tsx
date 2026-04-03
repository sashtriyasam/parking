import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  StatusBar,
  Dimensions
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
import { ParkingFacility, VehicleType } from '../../types';
import { EmptyState } from '../../components/EmptyState';
import { ProfessionalCard } from '../../components/ui/ProfessionalCard';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

type SearchMode = 'NAME' | 'COORD';

const VEHICLE_FILTERS: { label: string; value: VehicleType; icon: any }[] = [
  { label: 'Bike', value: 'bike', icon: 'bicycle' },
  { label: 'Scooter', value: 'scooter', icon: 'bicycle-outline' },
  { label: 'Car', value: 'car', icon: 'car' },
  { label: 'Truck', value: 'truck', icon: 'bus' },
];

export default function SearchScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const haptics = useHaptics();
  
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('COORD');
  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
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
      const lat = parseFloat(suggestion.lat as string);
      const lon = parseFloat(suggestion.lon as string);
      
      if (isNaN(lat) || isNaN(lon)) {
        throw new Error('Invalid coordinates received from suggestion');
      }

      const url = `/parking/search?lat=${lat}&lon=${lon}&limit=10`;
      const res = await get(url);
      setResults(res.data.data || []);
      setSuggestions([]);
      setMode('NAME'); 
      setQuery(suggestion.display_name.split(',')[0]);
    } catch (e) {
      console.error('Suggestion fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View entering={SlideInUp.duration(600)} style={styles.header}>
          <BlurView intensity={20} tint={colors.isDark ? 'dark' : 'light'} style={styles.headerBlur}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                 <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Find Parking</Text>
            </View>

            <View style={[styles.segmentedControl, { backgroundColor: colors.surface, borderColor: colors.border }]}>
               <TouchableOpacity 
                  onPress={() => toggleMode('COORD')}
                  style={[styles.segment, mode === 'COORD' && { backgroundColor: colors.background }]}
               >
                  <Text style={[styles.segmentText, { color: mode === 'COORD' ? colors.primary : colors.textMuted }]}>By Location</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                  onPress={() => toggleMode('NAME')}
                  style={[styles.segment, mode === 'NAME' && { backgroundColor: colors.background }]}
               >
                  <Text style={[styles.segmentText, { color: mode === 'NAME' ? colors.primary : colors.textMuted }]}>By Name</Text>
               </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
               <View style={[styles.searchField, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name={mode === 'COORD' ? "location-outline" : "search-outline"} size={20} color={colors.primary} />
                  <TextInput
                     ref={searchInputRef}
                     style={[styles.input, { color: colors.textPrimary }]}
                     placeholder={mode === 'COORD' ? "Destination..." : "Parking name..."}
                     placeholderTextColor={colors.textMuted}
                     value={query}
                     onChangeText={setQuery}
                     selectionColor={colors.primary}
                  />
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : query.length > 0 ? (
                    <TouchableOpacity onPress={() => setQuery('')}>
                       <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  ) : null}
               </View>
            </View>

            <View style={styles.filterBar}>
               <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={VEHICLE_FILTERS}
                  contentContainerStyle={styles.filterContent}
                  renderItem={({ item }) => {
                     const active = vehicleType === item.value;
                     return (
                        <TouchableOpacity 
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
                  }}
               />
            </View>
          </BlurView>
        </Animated.View>

        {mode === 'COORD' && suggestions.length > 0 ? (
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id.toString()}
            contentContainerStyle={styles.suggestionList}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(index * 50)}>
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
                      <Text style={[styles.suggestionSecondary, { color: colors.textMuted }]} numberOfLines={1}>
                         {item.display_name.split(',').slice(1).join(',')}
                      </Text>
                   </View>
                   <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </Animated.View>
            )}
          />
        ) : results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.resultsContent}
            renderItem={({ item, index }) => (
              <Animated.View
                layout={LinearTransition.springify()}
                entering={FadeInDown.delay(index * 100)}
                style={styles.resultCard}
              >
                <ParkingFacilityCard
                  facility={item}
                  distance={item.distance}
                  onPress={() => router.push(`/(customer)/facility/${item.id}`)}
                  style={{ width: '100%', marginRight: 0 }}
                />
              </Animated.View>
            )}
            ListHeaderComponent={
              <Text style={[styles.metaTitle, { color: colors.textMuted }]}>{results.length} PLACES FOUND</Text>
            }
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <EmptyState
              icon={query.length > 0 ? "search-outline" : "map-outline"}
              title={query.length > 0 ? "No results found" : "Ready to explore?"}
              subtitle={query.length > 0
                ? "Check your filters or try a different search term."
                : "Enter a destination to discover nearby parking opportunities."}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { zIndex: 100 },
  headerBlur: {
     paddingTop: Platform.OS === 'ios' ? 60 : 40,
     paddingBottom: 20,
     borderBottomWidth: 0.5,
     borderColor: 'rgba(0,0,0,0.1)',
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', marginLeft: -10 },
  headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  segmentedControl: { flexDirection: 'row', marginHorizontal: 24, borderRadius: 12, padding: 3, height: 42, marginBottom: 16, borderWidth: 1 },
  segment: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 9 },
  segmentText: { fontSize: 13, fontWeight: '800' },
  searchContainer: { paddingHorizontal: 24, marginBottom: 16 },
  searchField: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  input: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '700' },
  filterBar: { marginBottom: 8 },
  filterContent: { paddingHorizontal: 24, gap: 10 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 1, gap: 8 },
  filterText: { fontSize: 13, fontWeight: '800' },
  suggestionList: { padding: 24 },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 0.5 },
  suggestionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16, borderWidth: 1 },
  suggestionInfo: { flex: 1 },
  suggestionPrimary: { fontSize: 16, fontWeight: '700' },
  suggestionSecondary: { fontSize: 12, fontWeight: '600', marginTop: 2, opacity: 0.7 },
  resultsContent: { padding: 24, paddingBottom: 60 },
  metaTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 20 },
  resultCard: { marginBottom: 16 },
});
