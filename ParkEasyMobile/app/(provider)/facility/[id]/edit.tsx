import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { get, put } from '../../../../services/api';
import { useToast } from '../../../../components/Toast';
import { useThemeColors } from '../../../../hooks/useThemeColors';
import { useHaptics } from '../../../../hooks/useHaptics';
import { ProfessionalButton } from '../../../../components/ui/ProfessionalButton';
import { ProfessionalInput } from '../../../../components/ui/ProfessionalInput';

export default function EditFacility() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colors = useThemeColors();
  const haptics = useHaptics();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    total_slots: '',
    operating_hours: '',
  });

  useEffect(() => {
    const fetchFacility = async () => {
      try {
        const res = await get(`/provider/facilities/${id}`);
        if (res.data?.data) {
          const f = res.data.data.facility;
          setFormData({
            name: f.name || '',
            address: f.address || '',
            description: f.description || '',
            total_slots: String(f.total_slots || ''),
            operating_hours: f.operating_hours || '',
          });
        }
      } catch (error) {
        console.error('Error fetching facility:', error);
        showToast('Failed to load facility data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchFacility();
  }, [id]);

  const handleSave = async () => {
    haptics.impactMedium();
    if (!formData.name || !formData.address) {
      showToast('Name and Address are required', 'error');
      return;
    }

    setSaving(true);
    try {
      await put(`/provider/facilities/${id}`, {
        ...formData,
        total_slots: parseInt(formData.total_slots, 10),
      });
      haptics.notificationSuccess();
      showToast('Facility updated successfully', 'success');
      router.back();
    } catch (error: any) {
      haptics.notificationError();
      showToast(error.response?.data?.message || 'Failed to update facility', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingHost, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      
      <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
        <BlurView intensity={20} tint={colors.isDark ? 'dark' : 'light'} style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            
            <View style={styles.headerInfoSection}>
               <Text style={[styles.headerLabel, { color: colors.textMuted }]}>MANAGEMENT • SETTINGS</Text>
               <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Edit Location</Text>
            </View>

            <View style={[styles.liveBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
               <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
               <Text style={[styles.liveText, { color: colors.textPrimary }]}>SECURED</Text>
            </View>
          </View>
        </BlurView>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Facility Overview</Text>
          <Text style={[styles.sectionSubheading, { color: colors.textSecondary }]}>Updates here will reflect live for all customers looking for parking.</Text>

          <ProfessionalInput
            label="FACILITY NAME"
            value={formData.name}
            onChangeText={(text) => setFormData(p => ({ ...p, name: text }))}
            placeholder="Official Location Title"
            icon="business-outline"
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
               <ProfessionalInput
                 label="HOURS"
                 value={formData.operating_hours}
                 onChangeText={(text) => setFormData(p => ({ ...p, operating_hours: text }))}
                 placeholder="24/7"
                 icon="time-outline"
               />
            </View>
            <View style={{ width: 16 }} />
            <View style={{ flex: 1 }}>
               <ProfessionalInput
                 label="CAPACITY"
                 value={formData.total_slots}
                 onChangeText={(text) => setFormData(p => ({ ...p, total_slots: text }))}
                 keyboardType="numeric"
                 placeholder="20"
                 icon="grid-outline"
               />
            </View>
          </View>

          <ProfessionalInput
            label="STREET ADDRESS"
            value={formData.address}
            onChangeText={(text) => setFormData(p => ({ ...p, address: text }))}
            placeholder="Physical storefront/lot address"
            icon="location-outline"
            multiline
            style={{ height: 80 }}
          />

          <ProfessionalInput
            label="PUBLIC DESCRIPTION"
            value={formData.description}
            onChangeText={(text) => setFormData(p => ({ ...p, description: text }))}
            placeholder="Highlights, security info, or entrance guide..."
            icon="document-text-outline"
            multiline
            style={{ height: 120 }}
          />

          <View style={styles.footer}>
             <ProfessionalButton
                label="Save Changes"
                onPress={handleSave}
                variant="primary"
                loading={saving}
                style={{ flex: 2 }}
             />
             <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
                <Text style={[styles.cancelTxt, { color: colors.textSecondary }]}>Cancel</Text>
             </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingHost: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { zIndex: 100 },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, gap: 12 },
  navBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  headerInfoSection: { flex: 1 },
  headerLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1 },
  liveText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  scrollContent: { padding: 24, paddingBottom: 100 },
  sectionHeading: { fontSize: 28, fontWeight: '900', letterSpacing: -1, marginBottom: 8 },
  sectionSubheading: { fontSize: 15, lineHeight: 22, fontWeight: '600', marginBottom: 32 },
  row: { flexDirection: 'row' },
  footer: { marginTop: 32, gap: 16, flexDirection: 'row-reverse' },
  cancelBtn: { flex: 1, height: 60, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cancelTxt: { fontSize: 16, fontWeight: '800' },
});
