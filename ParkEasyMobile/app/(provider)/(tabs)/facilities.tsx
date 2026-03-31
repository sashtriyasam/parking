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
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { get } from '../../../services/api';
import { colors } from '../../../constants/colors';
import { ParkingFacility } from '../../../types';
import { useToast } from '../../../components/Toast';

const { width } = Dimensions.get('window');

export default function ProviderFacilities() {
  const router = useRouter();
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

      let message = 'Network error: check connection';
      if (error.response) {
        const { status, data, statusText } = error.response;
        if (status === 401) message = 'Unauthorized: please sign in';
        else if (status === 403) message = 'Access denied';
        else if (status >= 500) message = 'Server error: try again later';
        else message = data?.message || statusText || `Fetch error: status ${status}`;
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
    fetchFacilities(false);
  };

  const renderFacility = ({ item, index }: { item: ParkingFacility; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      layout={Layout.springify()}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push(`/(provider)/facility/${item.id}`)}
      >
        <BlurView intensity={20} tint="dark" style={styles.facilityCard}>
          <View style={styles.cardHeader}>
            <View style={styles.nameContainer}>
              <Text style={styles.facilityName}>{item.name}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={12} color="rgba(255,255,255,0.4)" />
                <Text style={styles.locationText} numberOfLines={1}>{item.address}</Text>
              </View>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.verified ? `${colors.success}26` : `${colors.warning}26` }
            ]}>
              <View style={[styles.statusDot, { backgroundColor: item.verified ? colors.success : colors.warning }]} />
              <Text style={[styles.statusText, { color: item.verified ? colors.success : colors.warning }]}>
                {item.verified ? 'Active' : 'Pending'}
              </Text>
            </View>
          </View>

          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Capacity</Text>
              <Text style={styles.metricValue}>{item.total_slots || 0} slots</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Pricing</Text>
              <Text style={styles.metricValue}>₹{item.price_per_hour ?? 0}/hr</Text>
            </View>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.cardActionBtn}
              onPress={() => router.push(`/(provider)/bookings?facilityId=${item.id}`)}
            >
              <Ionicons name="receipt-outline" size={18} color="white" />
              <Text style={styles.cardActionText}>View Activity</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity
              style={styles.cardActionBtn}
              onPress={() => router.push(`/(provider)/facility/${item.id}`)}
            >
              <Ionicons name="settings-outline" size={18} color="white" />
              <Text style={styles.cardActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.bgWrapper}>
        <LinearGradient
          colors={['#0f1219', '#080a0f']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>My Facilities</Text>
            <Text style={styles.headerSubtitle}>Manage your parking spaces</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(provider)/add-facility')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Add facility"
            accessibilityHint="Navigate to add facility screen"
            testID="add-facility-button"
          >
            <BlurView accessible={false} intensity={30} tint="light" style={styles.addBlur}>
              <Ionicons accessible={false} name="add" size={24} color="white" />
            </BlurView>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color="white" />
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={64} color={colors.danger} style={{ opacity: 0.5 }} />
          <Text style={styles.errorTitle}>Sync failed</Text>
          <Text style={styles.errorSub}>We couldn't connect right now. Please try again.</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchFacilities()}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Retry sync"
            accessibilityHint="Attempts to reconnect and fetch facilities"
            testID="retry-sync-button"
          >
            <Text style={styles.retryBtnText}>Try again</Text>
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={64} color="rgba(255,255,255,0.1)" />
              <Text style={styles.emptyTitle}>No Facilities Found</Text>
              <Text style={styles.emptySub}>You haven't added any parking spaces yet.</Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => router.push('/(provider)/add-facility')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Add facility"
                accessibilityHint="Navigate to add facility screen"
                testID="add-facility-button-empty-state"
              >
                <Text style={styles.createBtnText}>Add Your First Facility</Text>
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
    backgroundColor: '#080a0f',
  },
  bgWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(8, 10, 15, 0.8)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  addBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  addBlur: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 120,
  },
  facilityCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 20,
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
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  metricLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  cardActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'white',
  },
  actionDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginTop: 20,
  },
  emptySub: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  createBtn: {
    marginTop: 30,
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  createBtnText: {
    color: '#080a0f',
    fontSize: 15,
    fontWeight: '600',
  },
  errorContainer: {
    paddingTop: 100,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.danger,
    marginTop: 24,
    letterSpacing: 2,
  },
  errorSub: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
    fontWeight: '500',
  },
  retryBtn: {
    marginTop: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  retryBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
