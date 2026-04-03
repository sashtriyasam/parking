import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { ProfessionalCard } from '../../components/ui/ProfessionalCard';
import { ProfessionalInput } from '../../components/ui/ProfessionalInput';
import { ProfessionalButton } from '../../components/ui/ProfessionalButton';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useToast } from '../../components/Toast';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptics } from '../../hooks/useHaptics';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const haptics = useHaptics();
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone_number || '',
  });
  const [loading, setLoading] = useState(false);

  const handleUpdate = () => {
    haptics.impactMedium();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      haptics.notificationSuccess();
      showToast('PROFILE UPDATED SUCCESSFULLY', 'success');
    }, 1500);
  };

  const handleInitializeAccountTermination = () => {
    haptics.notificationWarning();
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your ParkEasy account? This action is irreversible.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete My Account", 
          style: "destructive",
          onPress: () => {
            haptics.impactHeavy();
            showToast('DELETION REQUESTED', 'info');
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      
      <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
         <BlurView intensity={20} tint={colors.isDark ? 'dark' : 'light'} style={styles.headerContent}>
            <View style={styles.headerTop}>
               <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
                  <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
               </TouchableOpacity>
               <View style={styles.headerInfoSection}>
                  <Text style={[styles.headerLabel, { color: colors.textMuted }]}>ACCOUNT • PROFILE</Text>
                  <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Personal Info</Text>
               </View>
               <View style={[styles.shieldBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                  <Text style={[styles.shieldText, { color: colors.textPrimary }]}>SECURED</Text>
               </View>
            </View>
         </BlurView>
      </Animated.View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View entering={ZoomIn.delay(200)} style={styles.avatarSection}>
            <View style={styles.avatarHost}>
               <View style={[styles.avatarGlow, { backgroundColor: colors.primary + '20' }]} />
               <View style={[styles.avatarMain, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                     {(formData.name.trim().charAt(0) || user?.email?.charAt(0) || '?').toUpperCase()}
                  </Text>
               </View>
               <TouchableOpacity style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                  <Ionicons name="camera" size={14} color="#FFF" />
               </TouchableOpacity>
            </View>
            <Text style={[styles.idText, { color: colors.textMuted }]}>ACCOUNT ID: {user?.id?.slice(0, 8).toUpperCase()}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400)}>
            <ProfessionalCard style={styles.formCard} hasVibrancy={true}>
              <View style={styles.cardHeader}>
                 <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
                 <Text style={[styles.cardHeaderText, { color: colors.textMuted }]}>ENTITY INFORMATION</Text>
              </View>

              <ProfessionalInput 
                label="LEGAL FULL NAME" 
                value={formData.name}
                onChangeText={(t) => setFormData({...formData, name: t})}
                placeholder="Full Name"
                icon="person-outline"
              />

              <ProfessionalInput 
                label="REGISTERED EMAIL" 
                value={formData.email}
                editable={false}
                icon="mail-outline"
              />
              <Text style={[styles.hintTxt, { color: colors.textMuted }]}>Email is locked to your identity profile.</Text>

              <ProfessionalInput 
                label="CONTACT NUMBER" 
                value={formData.phone}
                onChangeText={(t) => setFormData({...formData, phone: t})}
                placeholder="+91 00000 00000"
                keyboardType="phone-pad"
                icon="call-outline"
              />

              <ProfessionalButton
                label="Update Profile"
                onPress={handleUpdate}
                variant="primary"
                loading={loading}
                style={{ marginTop: 24 }}
              />

              <TouchableOpacity 
                style={styles.deleteBtn}
                onPress={handleInitializeAccountTermination}
                activeOpacity={0.7}
              >
                <Text style={[styles.deleteTxt, { color: colors.error }]}>DEACTIVATE ACCOUNT</Text>
              </TouchableOpacity>
            </ProfessionalCard>
          </Animated.View>
          
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  shieldBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1 },
  shieldText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  content: { padding: 24 },
  avatarSection: { alignItems: 'center', marginBottom: 40, marginTop: 10 },
  avatarHost: { width: 110, height: 110, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  avatarGlow: { position: 'absolute', width: 100, height: 100, borderRadius: 50, opacity: 0.5 },
  avatarMain: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarInitial: { fontSize: 42, fontWeight: '900' },
  editBadge: { position: 'absolute', right: 0, bottom: 0, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  idText: { fontSize: 9, fontWeight: '900', letterSpacing: 2, marginTop: 20 },
  formCard: { padding: 24, borderRadius: 32 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  cardHeaderText: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  hintTxt: { fontSize: 9, fontWeight: '800', marginTop: -8, marginBottom: 20, marginLeft: 4, letterSpacing: 0.5, opacity: 0.6 },
  deleteBtn: { alignItems: 'center', marginTop: 32, paddingVertical: 10 },
  deleteTxt: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, opacity: 0.7 },
});
