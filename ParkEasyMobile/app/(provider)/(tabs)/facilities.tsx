import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, Layout, SlideInUp } from 'react-native-reanimated';
import { get } from '../../../services/api';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { useHaptics } from '../../../hooks/useHaptics';
import { ParkingFacility } from '../../../types';
import { useToast } from '../../../components/Toast';
import { Skeleton } from '../../../components/ui/SkeletonLoader';

const { width } = Dimensions.get('window');

export default function ProviderFacilities() {
  const router = useRouter();
  const colors = useThemeColors();
  const haptics = useHaptics();
  const { showToast } = useToast();
  const [facilities, setFacilities] = useState<ParkingFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);

  const fetchFacilities = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setIsError(false);
    try {
      const res = await get('/provider/facilities');
      if (res.data?.data) {
        setFacilities(res.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching facilities:', error);
      setIsError(true);

      let message = 'Sync failure: check network connection';
      if (error.response) {
        const { status, data, statusText } = error.response;
        if (status === 401) message = 'Session expired: please log in again';
        else if (status === 403) message = 'Access denied: restricted facility';
        else if (status >= 500) message = 'Server error: try again later';
        else message = data?.message || statusText || `Sync error: status ${status}`;
      } else if (error.message) {
        message = error.message;
      }

      showToast(message, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    haptics.impactLight();
    fetchFacilities(false);
  };

  const renderFacility = ({ item, index }: { item: ParkingFacility; index: number }) => {
    const isVerified = item.verified;
    
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
        layout={Layout.springify()}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            haptics.impactMedium();
            router.push(`/(provider)/facility/${item.id}`);
          }}
        >
          <BlurView 
            intensity={colors.isDark ? 30 : 50} 
            tint={colors.isDark ? 'dark' : 'light'} 
            style={[styles.facilityCard, { borderColor: colors.border }]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.nameContainer}>
                <Text style={[styles.facilityName, { color: colors.textPrimary }]}>{item.name}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={12} color={colors.textMuted} />
                  <Text style={[styles.locationText, { color: colors.textMuted }]} numberOfLines={1}>{item.address}</Text>
                </View>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: isVerified ? colors.success + '15' : colors.warning + '15', borderColor: isVerified ? colors.success + '30' : colors.warning + '30' }
              ]}>
                <View style={[styles.statusDot, { backgroundColor: isVerified ? colors.success : colors.warning }]} />
                <Text style={[styles.statusText, { color: isVerified ? colors.success : colors.warning }]}>
                  {isVerified ? 'ACTIVE' : 'PENDING'}
                </Text>
              </View>
            </View>

            <View style={styles.metricsContainer}>
              <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>CAPACITY</Text>
                <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{item.total_slots || 0} SLOTS</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>PRICING</Text>
                <Text style={[styles.metricValue, { color: colors.textPrimary }]}>₹{item.price_per_hour ?? 0}/hr</Text>
              </View>
            </View>

            <View style={[styles.cardActions, { borderTopColor: colors.border, backgroundColor: colors.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
              <TouchableOpacity
                style={styles.cardActionBtn}
                onPress={() => {
                  haptics.impactLight();
                  router.push(`/(provider)/bookings?facilityId=${item.id}`);
                }}
              >
                <Ionicons name="receipt-outline" size={18} color={colors.primary} />
                <Text style={[styles.cardActionText, { color: colors.textPrimary }]}>ACTIVITY</Text>
              </TouchableOpacity>
              <View style={[styles.actionDivider, { backgroundColor: colors.border }]} />
              <TouchableOpacity
                style={styles.cardActionBtn}
                onPress={() => {
                  haptics.impactLight();
                  router.push(`/(provider)/facility/${item.id}`);
                }}
              >
                <Ionicons name="settings-outline" size={18} color={colors.primary} />
                <Text style={[styles.cardActionText, { color: colors.textPrimary }]}>SETTINGS</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.bgWrapper}>
        <LinearGradient
          colors={colors.isDark ? ['#0f1219', '#080a0f'] : ['#F8FAFC', '#E2E8F0']}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.glowPoint, { top: '10%', right: '-30%', backgroundColor: colors.primary, opacity: colors.isDark ? 0.1 : 0.05 }]} />
      </View>

      <Animated.View entering={SlideInUp.duration(600)} style={styles.header}>
        <BlurView intensity={30} tint={colors.isDark ? 'dark' : 'light'} style={[styles.headerContent, { borderColor: colors.border }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.headerLabel, { color: colors.textMuted }]}>NETWORK</Text>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>MY FACILITIES</Text>
            </View>
            <TouchableOpacity
              style={[styles.addBtn, { borderColor: colors.border }]}
              onPress={() => {
                haptics.impactMedium();
                router.push('/(provider)/add-facility');
              }}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={styles.addGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="add" size={24} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>

      {loading ? (
        <View style={styles.listContent}>
           {[1, 2, 3].map(i => (
            <Skeleton key={i} width="100%" height={220} borderRadius={30} style={{ marginBottom: 20 }} />
          ))}
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={64} color={colors.error} style={{ opacity: 0.5 }} />
          <Text style={[styles.errorTitle, { color: colors.error }]}>SYNC FAILED</Text>
          <Text style={[styles.errorSub, { color: colors.textMuted }]}>Failed to connect to the service. Please check your internet connection.</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
               haptics.impactLight();
               fetchFacilities();
            }}
          >
            <Text style={[styles.retryBtnText, { color: colors.textPrimary }]}>RETRY</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={facilities}
          keyExtractor={(item) => item.id}
          renderItem={renderFacility}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconBg, { backgroundColor: colors.surface }]}>
                <Ionicons name="business-outline" size={48} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>NO FACILITIES FOUND</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>Add your first facility to start using ParkEasy.</Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => {
                  haptics.impactMedium();
                  router.push('/(provider)/add-facility');
                }}
              >
                <LinearGradient
                   colors={[colors.primary, colors.secondary]}
                   style={styles.createBtnGradient}
                   start={{ x: 0, y: 0 }}
                   end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.createBtnText}>ADD NEW FACILITY</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgWrapper: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glowPoint: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  header: {
    zIndex: 100,
  },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  addBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
  },
  addGradient: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 120,
  },
  facilityCard: {
    borderRadius: 30,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameContainer: {
    flex: 1,
    marginRight: 12,
  },
  facilityName: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  cardActionText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  actionDivider: {
    width: 1,
    height: '100%',
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    fontWeight: '500',
  },
  createBtn: {
    marginTop: 32,
    width: '100%',
    height: 60,
    borderRadius: 20,
    overflow: 'hidden',
  },
  createBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  errorContainer: {
    flex: 1,
    paddingTop: 100,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 24,
    letterSpacing: 3,
  },
  errorSub: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    fontWeight: '500',
  },
  retryBtn: {
    marginTop: 40,
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 24,
    borderWidth: 1,
  },
  retryBtnText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
