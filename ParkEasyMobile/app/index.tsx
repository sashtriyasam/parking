import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, StatusBar, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../hooks/useThemeColors';
import { useHaptics } from '../hooks/useHaptics';

const { width, height } = Dimensions.get('window');

export default function LandingPage() {
  const router = useRouter();
  const colors = useThemeColors();
  const haptics = useHaptics();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.isDark ? "light-content" : "dark-content"} />
      
      {/* Background: Professional Gradient */}
      <LinearGradient 
        colors={colors.isDark ? ['#0F172A', '#020617'] : ['#FFFFFF', '#F8FAFC']} 
        style={StyleSheet.absoluteFill} 
      />
      
      <View style={styles.content}>
        <Animated.View 
          entering={FadeInDown.delay(300).duration(1000).springify()}
          style={styles.logoContainer}
        >
          <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
             <Text style={styles.logoText}>P</Text>
          </View>
          <View style={styles.logoShadow} />
        </Animated.View>

        <View style={styles.textContainer}>
          <Animated.Text 
             entering={FadeInDown.delay(500).duration(800)}
             style={[styles.title, { color: colors.textPrimary }]}
          >
            ParkEasy
          </Animated.Text>
          <Animated.Text 
             entering={FadeInDown.delay(600).duration(800)}
             style={[styles.subtitle, { color: colors.textMuted }]}
          >
            Premium Parking Experience
          </Animated.Text>
          <Animated.View 
             entering={FadeInUp.delay(800).duration(800)}
             style={[styles.taglineBox, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
          >
             <Text style={[styles.tagline, { color: colors.textMuted }]}>
               Smart Solutions • Real-time Availability
             </Text>
          </Animated.View>
        </View>
      </View>

      <Animated.View entering={FadeInUp.delay(1000).duration(800)} style={styles.footer}>
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => {
            haptics.impactMedium();
            router.push('/(auth)/signup');
          }}
          style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
        >
           <Text style={styles.btnPrimaryText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => {
            haptics.impactLight();
            router.push('/(auth)/login');
          }}
          style={[styles.btnSecondary, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
           <Text style={[styles.btnSecondaryText, { color: colors.textPrimary }]}>Sign In</Text>
        </TouchableOpacity>
        
        <Text style={[styles.versionText, { color: colors.textMuted }]}>
          v2.0.4 • Secure & Reliable
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logoIcon: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      }
    })
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -2,
  },
  logoShadow: {
    position: 'absolute',
    bottom: -15,
    width: 60,
    height: 15,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.1)',
    filter: 'blur(8px)' as any,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  taglineBox: {
    marginTop: 32,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    padding: 40,
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
  },
  btnPrimary: {
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      }
    })
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  btnSecondary: {
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  btnSecondaryText: {
    fontSize: 17,
    fontWeight: '700',
  },
  versionText: {
    marginTop: 32,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.5,
  },
});
