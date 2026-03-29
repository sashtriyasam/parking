import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { get } from '../../../services/api';
import { Card } from '../../../components/ui/Card';
import { colors } from '../../../constants/colors';
import { ParkingFacility } from '../../../types';
import { EmptyState } from '../../../components/EmptyState';

export default function ProviderFacilities() {
  const router = useRouter();
  const [facilities, setFacilities] = useState<ParkingFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFacilities = async () => {
    try {
      // Assuming a specific endpoint for provider's own facilities
      const res = await get('/provider/facilities');
      if (res.data?.data) {
        setFacilities(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
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
    fetchFacilities();
  };

  const renderFacility = ({ item }: { item: ParkingFacility }) => (
    <Card style={styles.facilityCard}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.facilityName}>{item.name}</Text>
          <View style={[styles.statusBadge, item.verified ? styles.statusActive : styles.statusInactive]}>
            <Text style={[styles.statusText, item.verified ? styles.statusTextActive : styles.statusTextInactive]}>
              {item.verified ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        <Text style={styles.facilityAddress} numberOfLines={1}>{item.address}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.statRow}>
          <Ionicons name="car-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.statText}>0 / {item.total_slots} Slots</Text>
        </View>
        <View style={styles.statRow}>
          <Ionicons name="star" size={16} color={colors.warning} />
          <Text style={styles.statText}>{item.rating || 'New'}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
          <Ionicons name="create-outline" size={18} color={colors.primary} />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
          <Ionicons name="list-outline" size={18} color={colors.primary} />
          <Text style={styles.actionText}>Manage Slots</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Facilities</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(provider)/add-facility')}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={facilities}
        keyExtractor={(item) => item.id}
        renderItem={renderFacility}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="business-outline"
              title="No facilities yet"
              subtitle="Add your first parking facility to start earning."
              actionLabel="Add Facility"
              onAction={() => router.push('/(provider)/add-facility')}
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 48,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  listContent: {
    padding: 16,
  },
  facilityCard: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  facilityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: colors.success + '20',
  },
  statusInactive: {
    backgroundColor: colors.error + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextActive: {
    color: colors.success,
  },
  statusTextInactive: {
    color: colors.error,
  },
  facilityAddress: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  cardBody: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  actionText: {
    color: colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
