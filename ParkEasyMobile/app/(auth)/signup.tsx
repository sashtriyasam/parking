import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { useAuthStore } from '../../store/authStore';
import { post } from '../../services/api';
import { useToast } from '../../components/Toast';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptics } from '../../hooks/useHaptics';
import { User } from '../../types';
import { ProfessionalCard } from '../../components/ui/ProfessionalCard';
import { ProfessionalInput } from '../../components/ui/ProfessionalInput';
import { ProfessionalButton } from '../../components/ui/ProfessionalButton';

const { height } = Dimensions.get('window');

export default function SignupScreen() {
  const colors = useThemeColors();
  const haptics = useHaptics();
  const router = useRouter();
  const { login } = useAuthStore();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTerms = () => {
    haptics.impactLight();
    Alert.alert(
      "Service Agreement",
      "By initializing an account, you agree to the ParkEasy ecosystem terms of service.",
      [{ text: "Acknowledge", style: "default" }]
    );
  };

  const handlePrivacy = () => {
    haptics.impactLight();
    Alert.alert(
      "Data Sovereignty",
      "All account metadata is end-to-end encrypted and stored in compliance with local privacy regulations.",
      [{ text: "Acknowledge", style: "default" }]
    );
  };

  const handleSignup = async () => {
    if (isSubmitting) return;
    haptics.impactMedium();

    if (!name || !email || !password || !phone) {
      showToast('ALL FIELDS MANDATORY', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('INVALID EMAIL FORMAT', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('PASSWORD TOO SHORT (MIN 6)', 'error');
      return;
    }

    const sanitizedPhone = phone.replace(/\D/g, '');
    if (sanitizedPhone.length < 10) {
      showToast('INVALID PHONE NUMBER', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await post('/auth/register', {
        full_name: name,
        email,
        phone_number: sanitizedPhone,
        password
      });

      if (response.data?.data) {
        const { user, accessToken, refreshToken } = response.data.data;
        const mappedUser: User = {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone_number: user.phone_number || phone || '',
          role: user.role
        };
        await login(mappedUser, accessToken, refreshToken);
        haptics.notificationSuccess();
        showToast('ACCOUNT INITIALIZED', 'success');
        router.replace('/(customer)');
      }
    } catch (e: any) {
      haptics.notificationError();
      const msg = e.response?.data?.message || 'REGISTRATION FAILED';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={ZoomIn.delay(200).duration(800)} style={styles.header}>
            <View style={[styles.logoOutline, { borderColor: colors.border }]}>
               <ProfessionalCard style={styles.logoCard} hasVibrancy={true}>
                  <Text style={[styles.logoLetter, { color: colors.primary }]}>P</Text>
               </ProfessionalCard>
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Onboarding</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>JOIN THE PREMIUM ECOSYSTEM</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(1000)}>
            <ProfessionalCard style={styles.card}>
              <View style={styles.formHeader}>
                <Ionicons name="sparkles-outline" size={12} color={colors.primary} />
                <Text style={[styles.formLabelText, { color: colors.textMuted }]}>USER PROFILE INITIALIZATION</Text>
              </View>

              <ProfessionalInput
                label="Full Name"
                placeholder="Identity Name"
                icon="person-outline"
                value={name}
                onChangeText={setName}
              />

              <ProfessionalInput
                label="Email Address"
                placeholder="identity@parkeasy.com"
                icon="mail-outline"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />

              <ProfessionalInput
                label="Mobile Number"
                placeholder="+91 00000 00000"
                icon="call-outline"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              
              <ProfessionalInput
                label="Security Key"
                placeholder="••••••••"
                icon="key-outline"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <ProfessionalButton 
                label={isSubmitting ? "Generating Account..." : "Create Account"} 
                onPress={handleSignup} 
                variant="primary"
                loading={isSubmitting}
                style={styles.actionBtn}
              />

              <View style={styles.switchBox}>
                <Text style={[styles.switchText, { color: colors.textMuted }]}>ALREADY AUTHENTICATED? </Text>
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity activeOpacity={0.7}>
                    <Text style={[styles.switchLink, { color: colors.primary }]}>SIGN IN</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </ProfessionalCard>
          </Animated.View>

          <View style={styles.policyHost}>
             <Text style={[styles.policyText, { color: colors.textMuted }]}>
               BY SIGNING UP, YOU AGREE TO OUR {' '}
               <Text 
                 style={[styles.link, { color: colors.primary }]} 
                 onPress={handleTerms}
               >TERMS</Text>
               {' '} AND {' '}
               <Text 
                 style={[styles.link, { color: colors.primary }]} 
                 onPress={handlePrivacy}
               >PRIVACY POLICY</Text>.
             </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 28, paddingTop: height * 0.06, paddingBottom: 60 },
  header: { marginBottom: 40, alignItems: 'center' },
  logoOutline: { width: 72, height: 72, borderRadius: 24, padding: 1, marginBottom: 20 },
  logoCard: { flex: 1, borderRadius: 22, justifyContent: 'center', alignItems: 'center', padding: 0 },
  logoLetter: { fontSize: 36, fontWeight: '900', letterSpacing: -2 },
  title: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 10, fontWeight: '900', marginTop: 10, letterSpacing: 2, opacity: 0.6 },
  card: { padding: 32, borderRadius: 40 },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  formLabelText: { fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  actionBtn: { height: 60, borderRadius: 20, marginTop: 12, marginBottom: 28 },
  switchBox: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 },
  switchText: { fontSize: 11, fontWeight: '600' },
  switchLink: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  policyHost: { marginTop: 44, paddingHorizontal: 20 },
  policyText: { fontSize: 11, textAlign: 'center', lineHeight: 18, fontWeight: '600' },
  link: { fontWeight: '900', textDecorationLine: 'underline' },
});
