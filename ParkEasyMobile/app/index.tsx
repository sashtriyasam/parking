import React from 'react';
import { StyleSheet, View, Text, StatusBar, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeInDown,
} from 'react-native-reanimated';
import { useThemeColors } from '../hooks/useThemeColors';
import { useHaptics } from '../hooks/useHaptics';
import { ProfessionalButton } from '../components/ui/ProfessionalButton';

export default function LandingPage() {
  const router = useRouter();
  const colors = useThemeColors();
  const haptics = useHaptics();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.content}>
        <View style={styles.topGap} />
        
        {/* Logo and Typography */}
        <Animated.View 
          entering={FadeInDown.delay(200).duration(800).springify()}
          style={styles.logoAndText}
        >
          <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>P</Text>
          </View>
          
          <Text style={styles.title}>ParkEasy</Text>
          <Text style={styles.subtitle}>Find. Reserve. Park.</Text>
        </Animated.View>

        {/* Buttons and Terms Disclaimer */}
        <Animated.View 
          entering={FadeInDown.delay(400).duration(800)}
          style={styles.footer}
        >
          <ProfessionalButton
            label="Continue with Email"
            variant="primary"
            onPress={() => {
              haptics.impactMedium();
              router.push('/(auth)/login');
            }}
            style={styles.button}
          />

          <ProfessionalButton
            label="I'm a Parking Operator"
            variant="secondary"
            onPress={() => {
              haptics.impactLight();
              router.push('/(auth)/login');
            }}
            style={styles.button}
          />
          
          <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  topGap: {
    height: 40,
  },
  logoAndText: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoIcon: {
    width: 76,
    height: 76,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
  },
  title: {
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: -1,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.60)',
    textAlign: 'center',
  },
  footer: {
    width: '100%',
    paddingBottom: 24,
  },
  button: {
    marginVertical: 6,
    width: '100%',
  },
  disclaimerText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
});
