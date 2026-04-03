import React from 'react';
import { StyleSheet, View, ViewStyle, Pressable, Platform, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring 
} from 'react-native-reanimated';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptics } from '../../hooks/useHaptics';

export interface ProfessionalCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  intensity?: number;
  hasVibrancy?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ProfessionalCard: React.FC<ProfessionalCardProps> = ({ 
  children, 
  style, 
  onPress, 
  intensity = 20,
  hasVibrancy = true 
}) => {
  const scale = useSharedValue(1);
  const colors = useThemeColors();
  const haptics = useHaptics();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handlePressIn = () => {
    haptics.impactLight(); // Use haptics for touch feedback
    scale.value = withSpring(0.98, { damping: 20, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const cardStyle = [
    styles.outerContainer,
    { 
      backgroundColor: hasVibrancy 
        ? (colors.isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.7)')
        : colors.surface,
      borderColor: colors.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      // True Apple-style soft shadow
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: colors.isDark ? 0.4 : 0.08,
          shadowRadius: 20,
        },
        android: { elevation: 6 }
      })
    },
    animatedStyle,
    style
  ];

  const content = (
    <View style={styles.childContainer}>
      {hasVibrancy && (
        <BlurView 
          intensity={intensity} 
          tint={colors.isDark ? 'dark' : 'light'} 
          style={StyleSheet.absoluteFill} 
        />
      )}
      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        style={cardStyle}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View style={cardStyle}>
      {content}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    borderRadius: 28,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  childContainer: {
    width: '100%',
  },
  contentContainer: {
    padding: 20,
    width: '100%',
  }
});


