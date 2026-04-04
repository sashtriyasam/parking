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
  Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

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

export default function LoginScreen() {
  const colors = useThemeColors();
  const haptics = useHaptics();
  const router = useRouter();
  const { login } = useAuthStore();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleForgotPassword = () => {
    haptics.impactLight();
    Alert.alert(
      "Secure Access",
      "Credential recovery tools are managed by our secondary security layer. Please contact your system administrator.",
      [{ text: "Acknowledge", style: "default" }]
    );
  };

  const handleLogin = async () => {
    if (isSubmitting) return;
    haptics.impactMedium();

    if (!email || !password) {
      showToast('CREDENTIALS REQUIRED', 'info');
      return;
    }

    // BYPASS LOGIC
    if ((email === '1' && password === '1') || (email === 'customer' && password === 'admin')) {
      const mockUser: User = {
        id: 'mock-customer-id',
        full_name: 'Alex Rivera',
        email: 'alex@parkeasy.premium',
        phone_number: '',
        role: 'customer'
      };
      await login(mockUser, 'mock-token', 'mock-refresh');
      haptics.notificationSuccess();
      router.replace('/(customer)');
      return;
    }

    if ((email === '2' && password === '2') || (email === 'provider' && password === 'admin')) {
      const mockUser: User = {
        id: 'mock-provider-id',
        full_name: 'Sarah Chen',
        email: 'sarah@parkeasy.partner',
        phone_number: '',
        role: 'provider'
      };
      await login(mockUser, 'mock-token', 'mock-refresh');
      haptics.notificationSuccess();
      router.replace('/(provider)/(tabs)');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await post('/auth/login', { email, password });
      if (response.data?.data) {
        const { user, accessToken, refreshToken } = response.data.data;
        const mappedUser: User = {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone_number: user.phone_number || '',
          role: user.role
        };
        await login(mappedUser, accessToken, refreshToken);
        haptics.notificationSuccess();
        if (mappedUser.role === 'customer') {
          router.replace('/(customer)');
        } else if (mappedUser.role === 'provider') {
          router.replace('/(provider)/(tabs)');
        }
      }
    } catch (e: any) {
      haptics.notificationError();
      let msg = 'AUTHENTICATION FAILED';
      if (e.response) {
        msg = e.response.data?.message || 'INVALID AUTHORIZATION';
      }
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
            <Text style={[styles.title, { color: colors.textPrimary }]}>ParkEasy</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>PREMIUM PARKING ECOSYSTEM</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(1000)}>
            <ProfessionalCard style={styles.card}>
              <View style={styles.formHeader}>
                <Ionicons name="lock-closed-outline" size={12} color={colors.primary} />
                <Text style={[styles.formLabelText, { color: colors.textMuted }]}>SECURE ACCESS</Text>
              </View>

              <ProfessionalInput
                label="Email Address"
                placeholder="identity@parkeasy.com"
                icon="mail-outline"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />

              <ProfessionalInput
                label="Security Key"
                placeholder="••••••••"
                icon="key-outline"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity style={styles.forgotPass} onPress={handleForgotPassword} activeOpacity={0.7}>
                <Text style={[styles.forgotPassText, { color: colors.primary }]}>RECOVER ACCESS</Text>
              </TouchableOpacity>

              <ProfessionalButton
                label={isSubmitting ? "Authenticating..." : "Sign In"}
                onPress={handleLogin}
                variant="primary"
                loading={isSubmitting}
                style={styles.loginBtn}
              />

              <View style={styles.divider}>
                <View style={[styles.line, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textMuted }]}>ALTERNATIVE METHODS</Text>
                <View style={[styles.line, { backgroundColor: colors.border }]} />
              </View>

              <View style={styles.socialRow}>
                <SocialButton icon="logo-google" label="Google (Coming soon)" onPress={() => {}} disabled={true} colors={colors} />
                <SocialButton icon="logo-apple" label="Apple (Coming soon)" onPress={() => {}} disabled={true} colors={colors} />
              </View>
            </ProfessionalCard>
          </Animated.View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>NEW TO THE ECOSYSTEM? </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={[styles.signUpLink, { color: colors.primary }]}>GENERATE ACCOUNT</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const SocialButton = ({ icon, label, onPress, colors, disabled }: any) => (
  <TouchableOpacity 
    style={[styles.socialBtn, disabled && { opacity: 0.5 }]} 
    onPress={onPress} 
    activeOpacity={disabled ? 0.5 : 0.7}
    disabled={disabled}
  >
    <BlurView intensity={10} tint={colors.isDark ? 'dark' : 'light'} style={[styles.socialBlur, { borderColor: colors.border, borderWidth: 1, borderRadius: 20 }]}>
      <Ionicons name={icon} size={18} color={colors.textPrimary} />
      <Text style={[styles.socialText, { color: colors.textPrimary }]}>{label}</Text>
    </BlurView>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 28, paddingTop: height * 0.1, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: 48 },
  logoOutline: { width: 88, height: 88, borderRadius: 28, padding: 1, marginBottom: 24 },
  logoCard: { flex: 1, borderRadius: 26, justifyContent: 'center', alignItems: 'center', padding: 0 },
  logoLetter: { fontSize: 44, fontWeight: '900', letterSpacing: -2 },
  title: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 10, fontWeight: '900', marginTop: 10, letterSpacing: 2, opacity: 0.6 },
  card: { padding: 32, borderRadius: 40 },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32 },
  formLabelText: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  forgotPass: { alignSelf: 'flex-end', marginBottom: 32, paddingVertical: 4 },
  forgotPassText: { fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  loginBtn: { height: 60, borderRadius: 20, marginBottom: 32 },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  line: { flex: 1, height: 1, opacity: 0.1 },
  dividerText: { paddingHorizontal: 16, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: { flex: 1, height: 56 },
  socialBlur: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  socialText: { fontSize: 12, fontWeight: '700', letterSpacing: -0.2 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 48, gap: 4 },
  footerText: { fontSize: 11, fontWeight: '600', opacity: 0.8 },
  signUpLink: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
});
