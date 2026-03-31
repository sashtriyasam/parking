import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
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
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { get, put } from '../../../../services/api';
import { useToast } from '../../../../components/Toast';


export default function EditFacility() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
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
      showToast('Facility updated successfully', 'success');
      router.back();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to update facility', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingHost}>
        <ActivityIndicator size="small" color="white" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0f1219', '#080a0f']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <BlurView intensity={20} tint="dark" style={styles.iconBlur}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </BlurView>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerSubtitle}>Facility Management</Text>
          <Text style={styles.headerTitle}>Edit Details</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp} style={styles.formSection}>
          <Text style={styles.sectionDesc}>Update the core configuration and descriptive details for this location.</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Facility Name</Text>
            <BlurView intensity={10} tint="dark" style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData(p => ({ ...p, name: text }))}
                placeholderTextColor="rgba(255,255,255,0.2)"
                accessibilityLabel="Facility Name"
                accessibilityHint="Enter the formal name of your parking facility"
                accessible={true}
              />
            </BlurView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Operating Hours</Text>
            <BlurView intensity={10} tint="dark" style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={formData.operating_hours}
                onChangeText={(text) => setFormData(p => ({ ...p, operating_hours: text }))}
                placeholder="e.g. 24/7"
                placeholderTextColor="rgba(255,255,255,0.2)"
                accessibilityLabel="Operating Hours"
                accessibilityHint="Specify the facility operational schedule, for example 24/7"
                accessible={true}
              />
            </BlurView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Total Slots</Text>
            <BlurView intensity={10} tint="dark" style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={formData.total_slots}
                onChangeText={(text) => setFormData(p => ({ ...p, total_slots: text }))}
                keyboardType="numeric"
                placeholderTextColor="rgba(255,255,255,0.2)"
                accessibilityLabel="Total Slots"
                accessibilityHint="Enter the total number of parking spaces available at this location"
                accessible={true}
              />
            </BlurView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Address</Text>
            <BlurView intensity={10} tint="dark" style={[styles.inputBox, styles.textAreaBox]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(text) => setFormData(p => ({ ...p, address: text }))}
                multiline
                placeholderTextColor="rgba(255,255,255,0.2)"
                accessibilityLabel="Full Address"
                accessibilityHint="Provide the complete physical address for GPS navigation"
                accessible={true}
              />
            </BlurView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <BlurView intensity={10} tint="dark" style={[styles.inputBox, styles.textAreaBox, { height: 120 }]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData(p => ({ ...p, description: text }))}
                multiline
                numberOfLines={4}
                placeholderTextColor="rgba(255,255,255,0.2)"
                accessibilityLabel="Description"
                accessibilityHint="Add extra details or instructions for customers using this facility"
                accessible={true}
              />
            </BlurView>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.primaryBtn, saving && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="black" />
              ) : (
                <Text style={styles.primaryBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, saving && { opacity: 0.5 }]}
              onPress={() => router.back()}
              disabled={saving}
            >
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080a0f',
  },
  loadingHost: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#080a0f',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  iconBlur: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 2,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  formSection: {
    flex: 1,
  },
  sectionDesc: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    lineHeight: 20,
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 10,
    marginLeft: 4,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    overflow: 'hidden',
    minHeight: 56,
  },
  textAreaBox: {
    minHeight: 100,
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 18,
    fontSize: 15,
    color: 'white',
    fontWeight: '500',
  },
  textArea: {
    textAlignVertical: 'top',
    height: '100%',
  },
  footer: {
    marginTop: 20,
    gap: 15,
  },
  primaryBtn: {
    height: 60,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'black',
  },
  secondaryBtn: {
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
