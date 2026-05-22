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
      backgroundColor: colors.surface,
      borderColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
        android: { elevation: 2 }
      })
    },
    style
  ];

  const content = (
    <View style={styles.childContainer}>
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
    <View style={cardStyle}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    borderRadius: 12,
    borderWidth: 1,
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


