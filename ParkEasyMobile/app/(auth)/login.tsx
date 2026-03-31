import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Animated as RNAnimated, 
  Dimensions,
  ActivityIndicator,
  Pressable,
  Alert
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn, FadeIn, interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useAuthStore } from '../../store/authStore';
import { post } from '../../services/api';
import { colors } from '../../constants/colors';
import { useToast } from '../../components/Toast';
import { User } from '../../types';

const { width, height } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const shakeAnimation = useRef(new RNAnimated.Value(0)).current;
  const loginProgress = useSharedValue(0);

  const { login } = useAuthStore();
  const { showToast } = useToast();
  const router = useRouter();

  const triggerShake = () => {
    RNAnimated.sequence([
      RNAnimated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      RNAnimated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      RNAnimated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      RNAnimated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Credentials required to proceed.', 'info');
      triggerShake();
      return;
    }

    // BYPASS LOGIC
    if ((email === '1' && password === '1') || (email === 'customer' && password === 'admin')) {
      const mockUser: User = {
        id: 'mock-customer-id',
        full_name: 'Alex Rivera',
        email: 'alex@parkeasy.premium',
        phone_number: '9876543210',
        role: 'customer'
      };
      await login(mockUser, 'mock-token', 'mock-refresh');
      router.replace('/(customer)');
      return;
    }

    if ((email === '2' && password === '2') || (email === 'provider' && password === 'admin')) {
      const mockUser: User = {
        id: 'mock-provider-id',
        full_name: 'Sarah Chen',
        email: 'sarah@parkeasy.partner',
        phone_number: '9123456789',
        role: 'provider'
      };
      await login(mockUser, 'mock-token', 'mock-refresh');
      router.replace('/(provider)/(tabs)');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    loginProgress.value = withSpring(1);
    
    try {
      const response = await post('/auth/login', { email, password });
      
      if (response.data && response.data.data) {
        const { user, accessToken, refreshToken } = response.data.data;
        const mappedUser: User = {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone_number: user.phone_number || '',
          role: user.role
        };
        
        await login(mappedUser, accessToken, refreshToken);
        
        if (mappedUser.role === 'customer') {
          router.replace('/(customer)');
        } else if (mappedUser.role === 'provider') {
          router.replace('/(provider)/(tabs)');
        }
      }
    } catch (e: any) {
      loginProgress.value = withSpring(0);
      let msg = 'Unable to connect. Please check your network and try again.';
      const status = e.response?.status;

      if (e.response) {
        if (status === 401 || status === 403) {
          msg = e.response.data?.message || 'Invalid credentials. Please try again.';
        } else if (status >= 400 && status < 500) {
          msg = e.response.data?.message || 'Please check your information and try again.';
        } else if (status >= 500) {
          msg = 'Server error. Our team has been notified. Please try again later.';
        }
      }
        
      setError(msg);
      showToast(msg, 'error');
      triggerShake();
    } finally {
      setIsSubmitting(false);
    }
  };

  const btnScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(loginProgress.value, [0, 1], [1, 0.95]) }],
    opacity: interpolate(loginProgress.value, [0, 1], [1, 0.8])
  }));

  return (
    <View style={styles.container}>
      {/* Immersive Kinetic Background */}
      <View style={styles.bgWrapper}>
        <LinearGradient
          colors={['#080a0f', '#0b0e14', '#161a21']}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View 
          entering={FadeIn.delay(200).duration(2000)}
          style={[styles.bgCircle, styles.circlePrimary]} 
        />
        <Animated.View 
          entering={FadeIn.delay(500).duration(2000)}
          style={[styles.bgCircle, styles.circleSecondary]} 
        />
        <Animated.View 
          entering={FadeIn.delay(800).duration(2000)}
          style={[styles.bgCircle, styles.circleTertiary]} 
        />
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
          <Animated.View entering={FadeInUp.duration(1000).springify()} style={styles.headerSection}>
            <View style={styles.logoBadge}>
              <Ionicons name="navigate" size={42} color={colors.premium.primary} />
              <View style={styles.logoPulse} />
            </View>
            <Text style={styles.brandName}>ParkEasy</Text>
            <Text style={styles.brandSubtitle}>THE FUTURE OF URBAN MOBILITY</Text>
          </Animated.View>

          <RNAnimated.View style={[styles.mainForm, { transform: [{ translateX: shakeAnimation }] }]}>
            <Animated.View entering={FadeInDown.delay(300).duration(800).springify()}>
              <BlurView intensity={40} tint="dark" style={styles.formCard}>
                <Text style={styles.formTitle}>Authentication</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>IDENTITY / EMAIL</Text>
                  <View style={[
                    styles.inputField,
                    focusedField === 'email' && styles.inputFieldFocused
                  ]}>
                    <Ionicons 
                      name="mail-unread-outline" 
                      size={20} 
                      color={focusedField === 'email' ? colors.premium.primary : colors.premium.onSurfaceVariant} 
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="user@kinetic.ether"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (error) setError('');
                      }}
                      accessibilityLabel="Email address"
                      accessibilityHint="Enter your email address to sign in"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>SECURE ACCESS KEY</Text>
                  <View style={[
                    styles.inputField,
                    focusedField === 'password' && styles.inputFieldFocused
                  ]}>
                    <Ionicons 
                      name="shield-checkmark-outline" 
                      size={20} 
                      color={focusedField === 'password' ? colors.premium.primary : colors.premium.onSurfaceVariant} 
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="••••••••"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      secureTextEntry={!showPassword}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (error) setError('');
                      }}
                      accessibilityLabel="Secure access key"
                      accessibilityHint="Enter your password"
                    />
                    <TouchableOpacity 
                      onPress={() => setShowPassword(!showPassword)} 
                      style={styles.eyeIcon}
                      accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                      accessibilityHint="Toggles password visibility"
                      accessibilityRole="button"
                    >
                      <Ionicons 
                        name={showPassword ? "eye-off" : "eye"} 
                        size={20} 
                        color={colors.premium.onSurfaceVariant} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {error ? (
                  <Animated.View entering={ZoomIn} style={styles.statusBox}>
                    <Ionicons name="warning" size={16} color={colors.danger} />
                    <Text style={styles.statusText}>{error}</Text>
                  </Animated.View>
                ) : null}

                <TouchableOpacity style={styles.recoveryLink} activeOpacity={0.7}>
                  <Text style={styles.recoveryText}>Loss access key?</Text>
                </TouchableOpacity>

                <AnimatedPressable 
                  style={[styles.primaryAction, btnScaleStyle]} 
                  onPress={handleLogin}
                  disabled={isSubmitting}
                >
                  <LinearGradient
                    colors={colors.premium.neonPulse}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionGradient}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <Text style={styles.actionLabel}>ESTABLISH CONNECTION</Text>
                        <Ionicons name="chevron-forward" size={18} color="white" />
                      </>
                    )}
                  </LinearGradient>
                </AnimatedPressable>
              </BlurView>
            </Animated.View>
          </RNAnimated.View>

          {/* Social Authentication */}
          <Animated.View entering={FadeInDown.delay(500)} style={styles.socialFlow}>
            <View style={styles.dividerBox}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>OR CONTINUE WITH ENVIRONMENT</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={styles.socialCircle}
                onPress={() => Alert.alert('Coming Soon', 'Google authentication is currently being integrated.')}
              >
                <Ionicons name="logo-google" size={24} color="#ecedf6" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialCircle}
                onPress={() => Alert.alert('Coming Soon', 'Apple authentication is currently being integrated.')}
              >
                <Ionicons name="logo-apple" size={26} color="#ecedf6" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialCircle}
                onPress={() => Alert.alert('Biometrics Coming Soon', 'Fingerprint and FaceID initialization is coming in the next update.')}
              >
                <Ionicons name="finger-print" size={24} color={colors.premium.primary} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(700)} style={styles.authSwitch}>
            <Text style={styles.switchText}>Need an access node?</Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text style={styles.switchLink}>Initialize Account</Text>
              </TouchableOpacity>
            </Link>
          </Animated.View>
          
          <Animated.View entering={FadeInUp.delay(900)} style={styles.versionTag}>
            <Text style={styles.versionText}>KINETIC CORE V3.0 // SECURE NODE</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    overflow: 'hidden',
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.12,
  },
  circlePrimary: {
    width: 300,
    height: 300,
    top: -50,
    right: -50,
    backgroundColor: colors.premium.primary,
  },
  circleSecondary: {
    width: 400,
    height: 400,
    bottom: -100,
    left: -150,
    backgroundColor: colors.premium.secondary,
  },
  circleTertiary: {
    width: 250,
    height: 250,
    top: height * 0.3,
    left: -50,
    backgroundColor: colors.premium.tertiary,
    opacity: 0.08,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: height * 0.08,
    marginBottom: 32,
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(28, 116, 233, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoPulse: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(28, 116, 233, 0.1)',
  },
  brandName: {
    fontSize: 44,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -2,
  },
  brandSubtitle: {
    fontSize: 10,
    color: colors.premium.primary,
    fontWeight: '900',
    marginTop: 6,
    letterSpacing: 4,
    opacity: 0.8,
  },
  mainForm: {
    width: '100%',
  },
  formCard: {
    borderRadius: 36,
    padding: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 32,
    textAlign: 'center',
    letterSpacing: 1,
  },
  inputContainer: {
    marginBottom: 26,
  },
  label: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.premium.onSurfaceVariant,
    letterSpacing: 2,
    marginBottom: 12,
    marginLeft: 4,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    paddingHorizontal: 20,
    height: 64,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  inputFieldFocused: {
    borderColor: colors.premium.primary + '80',
    backgroundColor: 'rgba(28, 116, 233, 0.05)',
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 14,
  },
  eyeIcon: {
    padding: 10,
  },
  recoveryLink: {
    alignSelf: 'flex-end',
    marginBottom: 28,
    marginRight: 4,
  },
  recoveryText: {
    color: colors.premium.primary,
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.9,
  },
  primaryAction: {
    borderRadius: 22,
    overflow: 'hidden',
    height: 64,
  },
  actionGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  actionLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger + '15',
    padding: 14,
    borderRadius: 16,
    marginBottom: 24,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.danger + '30',
  },
  statusText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  socialFlow: {
    marginTop: 40,
  },
  dividerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dividerLabel: {
    marginHorizontal: 16,
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1.5,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authSwitch: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 48,
    gap: 10,
  },
  switchText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '600',
  },
  switchLink: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  versionTag: {
    alignItems: 'center',
    marginTop: 40,
  },
  versionText: {
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 2,
  },
});
