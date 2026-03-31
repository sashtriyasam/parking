import React, { useState, useRef } from 'react';
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
  Pressable
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn, FadeIn, interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useAuthStore } from '../../store/authStore';
import { post } from '../../services/api';
import { colors } from '../../constants/colors';
import { useToast } from '../../components/Toast';
import { User } from '../../types';
import { addAlpha } from '../../utils/color';

const { width, height } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const shakeAnimation = useRef(new RNAnimated.Value(0)).current;
  const signupProgress = useSharedValue(0);

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

  const handleSignup = async () => {
    if (!name || !email || !password || !phone) {
      showToast('All fields are mandatory.', 'error');
      triggerShake();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address.', 'error');
      triggerShake();
      return;
    }

    const sanitizedPhone = phone.replace(/[^\d+]/g, '');
    const phoneRegex = /^\+?\d{7,15}$/;
    if (!phoneRegex.test(sanitizedPhone)) {
      showToast('Enter a valid phone number (7-15 digits).', 'error');
      triggerShake();
      return;
    }

    if (password.length < 6) {
      showToast('Password is too short (min 6 chars).', 'error');
      triggerShake();
      return;
    }

    setIsSubmitting(true);
    signupProgress.value = withSpring(1);
    
    try {
      const response = await post('/auth/register', {
        full_name: name,
        email,
        phone_number: sanitizedPhone,
        password
      });

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
        showToast('Welcome to ParkEasy!', 'success');
        router.replace('/(customer)');
      }
    } catch (e: any) {
      signupProgress.value = withSpring(0);
      const msg = e.response?.data?.message || 'Registration failed. Try again.';
      showToast(msg, 'error');
      triggerShake();
    } finally {
      setIsSubmitting(false);
    }
  };

  const btnScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(signupProgress.value, [0, 1], [1, 0.95]) }],
    opacity: interpolate(signupProgress.value, [0, 1], [1, 0.8])
  }));

  return (
    <View style={styles.container}>
      {/* Immersive Background */}
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
          entering={FadeIn.delay(600).duration(2000)}
          style={[styles.bgCircle, styles.circleSecondary]} 
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
          <Animated.View entering={FadeInUp.duration(1000).springify()} style={styles.header}>
            <Text style={styles.title}>Initialize Access</Text>
            <Text style={styles.subtitle}>CREATE YOUR SECURE KINETIC IDENTITY</Text>
          </Animated.View>

          <RNAnimated.View style={[styles.mainForm, { transform: [{ translateX: shakeAnimation }] }]}>
            <Animated.View entering={FadeInDown.delay(200).duration(800).springify()}>
              <BlurView intensity={40} tint="dark" style={styles.formCard}>
                <Text style={styles.formTitle}>New Connection</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>FULL NAME</Text>
                  <View style={[styles.inputField, focusedField === 'name' && styles.inputFieldFocused]}>
                    <Ionicons name="person-outline" size={20} color={focusedField === 'name' ? colors.premium.primary : colors.premium.onSurfaceVariant} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. John Doe"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>EMAIL ADDRESS</Text>
                  <View style={[styles.inputField, focusedField === 'email' && styles.inputFieldFocused]}>
                    <Ionicons name="mail-unread-outline" size={20} color={focusedField === 'email' ? colors.premium.primary : colors.premium.onSurfaceVariant} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="identity@kinetic.ether"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>PHONE NODE</Text>
                  <View style={[styles.inputField, focusedField === 'phone' && styles.inputFieldFocused]}>
                    <Ionicons name="call-outline" size={20} color={focusedField === 'phone' ? colors.premium.primary : colors.premium.onSurfaceVariant} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="+15550000000"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      keyboardType="phone-pad"
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      value={phone}
                      onChangeText={setPhone}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>ESTABLISH PASSWORD</Text>
                  <View style={[styles.inputField, focusedField === 'password' && styles.inputFieldFocused]}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={focusedField === 'password' ? colors.premium.primary : colors.premium.onSurfaceVariant} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="••••••••"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      secureTextEntry={!showPassword}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      <Ionicons 
                        name={showPassword ? "eye-off" : "eye"} 
                        size={20} 
                        color={colors.premium.onSurfaceVariant} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <AnimatedPressable 
                  style={[styles.primaryAction, btnScaleStyle]} 
                  onPress={handleSignup}
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
                        <Text style={styles.actionLabel}>INITIALIZE CONNECTION</Text>
                        <Ionicons name="chevron-forward" size={18} color="white" />
                      </>
                    )}
                  </LinearGradient>
                </AnimatedPressable>

                <View style={styles.switchBox}>
                  <Text style={styles.switchText}>Already authenticated?</Text>
                  <Link href="/(auth)/login" asChild>
                    <TouchableOpacity>
                      <Text style={styles.switchLink}>Sign In</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </BlurView>
            </Animated.View>
          </RNAnimated.View>

          <Text style={styles.policyText}>
            BY INITIALIZING, YOU CONSENT TO OUR KINETIC PROTOCOLS AND PRIVACY DIRECTIVES.
          </Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 40,
    paddingTop: 40,
  },
  header: {
    marginBottom: 40,
    marginTop: height * 0.05,
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -1.5,
  },
  subtitle: {
    fontSize: 10,
    color: colors.premium.primary,
    fontWeight: '900',
    marginTop: 8,
    letterSpacing: 4,
    opacity: 0.8,
  },
  mainForm: {
    width: '100%',
  },
  formCard: {
    borderRadius: 36,
    padding: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 8,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 28,
    textAlign: 'center',
    letterSpacing: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.premium.onSurfaceVariant,
    letterSpacing: 2,
    marginBottom: 10,
    marginLeft: 4,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    paddingHorizontal: 18,
    height: 60,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  inputFieldFocused: {
    borderColor: addAlpha(colors.premium.primary, 0.5),
    backgroundColor: 'rgba(28, 116, 233, 0.05)',
  },
  textInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 14,
  },
  eyeBtn: {
    padding: 8,
  },
  primaryAction: {
    borderRadius: 22,
    overflow: 'hidden',
    height: 64,
    marginTop: 20,
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
  switchBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
    gap: 8,
  },
  switchText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '600',
  },
  switchLink: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  policyText: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: 40,
    letterSpacing: 1.5,
    lineHeight: 16,
    paddingHorizontal: 20,
    fontWeight: '700',
  },
});
