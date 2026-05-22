import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuthStore } from '../../store/authStore';
import { post } from '../../services/api';
import { useToast } from '../../components/Toast';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptics } from '../../hooks/useHaptics';
import { User } from '../../types';
import { ProfessionalInput } from '../../components/ui/ProfessionalInput';
import { ProfessionalButton } from '../../components/ui/ProfessionalButton';

export default function LoginScreen() {
  const colors = useThemeColors();
  const haptics = useHaptics();
  const router = useRouter();
  const { login } = useAuthStore();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (isSubmitting) return;
    haptics.impactMedium();

    if (!email || !password) {
      showToast('Credentials required', 'info');
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
      let msg = 'Authentication failed';
      
      if (e.response) {
        const status = e.response.status;
        if (status === 401 || status === 403) {
          msg = 'Invalid credentials';
        } else if (status === 429) {
          msg = 'Too many attempts. Try again later.';
        } else if (status >= 500) {
          msg = e.response.data?.message || 'Server error - Try again later';
        } else {
          msg = e.response.data?.message || 'Invalid authorization';
        }
      } else if (e.request) {
        msg = 'Network error - Check your connection';
      }
      
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity 
          onPress={() => {
            haptics.impactLight();
            router.back();
          }}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Title */}
          <Animated.View 
            entering={FadeInDown.delay(100).duration(600)} 
            style={styles.header}
          >
            <Text style={[styles.title, { color: colors.textPrimary }]}>Welcome back.</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign in to manage your parking spaces or reserves.
            </Text>
          </Animated.View>

          {/* Form Fields */}
          <Animated.View 
            entering={FadeInDown.delay(200).duration(600)}
            style={styles.formContainer}
          >
            <ProfessionalInput
              label="Email Address"
              placeholder="name@example.com"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
            />

            <View style={styles.passwordWrapper}>
              <ProfessionalInput
                label="Password"
                placeholder="Required"
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureText}
                autoComplete="password"
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setSecureText(!secureText)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={secureText ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>

            <ProfessionalButton
              label={isSubmitting ? "Signing In..." : "Sign In"}
              onPress={handleLogin}
              variant="primary"
              loading={isSubmitting}
              style={styles.signInButton}
            />
          </Animated.View>

          {/* Footer Link */}
          <Animated.View 
            entering={FadeInDown.delay(300).duration(600)}
            style={styles.footer}
          >
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={[styles.signUpLink, { color: colors.primary }]}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  backText: {
    fontSize: 17,
    marginLeft: -4,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  header: {
    marginBottom: 36,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
  },
  passwordWrapper: {
    position: 'relative',
    width: '100%',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 38,
    padding: 4,
    zIndex: 10,
  },
  signInButton: {
    marginTop: 12,
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 48,
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 15,
  },
  signUpLink: {
    fontSize: 15,
    fontWeight: '600',
  },
});
