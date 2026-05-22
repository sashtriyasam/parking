import React from 'react';
import { 
  StyleSheet, 
  Text, 
  Pressable, 
  ViewStyle, 
  TextStyle, 
  ActivityIndicator,
  View,
  Platform
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring 
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptics } from '../../hooks/useHaptics';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'vibrant' | 'outline';

interface ProfessionalButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ProfessionalButton: React.FC<ProfessionalButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle
}) => {
  const scale = useSharedValue(1);
  const colors = useThemeColors();
  const haptics = useHaptics();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handlePressIn = () => {
    haptics.impactLight();
    scale.value = withSpring(0.96, { damping: 20, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  const getVariantStyles = (): ViewStyle => {
    const isPrimaryOrDanger = variant === 'primary' || variant === 'danger';
    const height = isPrimaryOrDanger ? 50 : 44;
    const borderRadius = 10;

    const baseStyles: ViewStyle = {
      height,
      borderRadius,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      paddingHorizontal: 20,
    };

    switch (variant) {
      case 'primary':
        return { 
          ...baseStyles,
          backgroundColor: colors.primary,
        };
      case 'danger':
        return { 
          ...baseStyles,
          backgroundColor: colors.danger,
        };
      case 'secondary':
      case 'vibrant':
        return { 
          ...baseStyles,
          backgroundColor: colors.surfaceElevated,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'ghost':
        return { 
          ...baseStyles,
          backgroundColor: 'transparent',
        };
      case 'outline':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.primary,
        };
      default:
        return { 
          ...baseStyles,
          backgroundColor: colors.surface, 
          borderWidth: 1, 
          borderColor: colors.border 
        };
    }
  };

  const getTextColor = () => {
    if (variant === 'primary' || variant === 'danger') return '#FFFFFF';
    if (variant === 'ghost' || variant === 'outline') return colors.primary;
    return colors.textPrimary;
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        getVariantStyles(), 
        style, 
        (disabled || loading) && styles.disabled, 
        animatedStyle
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <View style={styles.content}>
          {icon && <Ionicons name={icon} size={18} color={getTextColor()} style={styles.icon} />}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{label}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  icon: {
    marginRight: 6,
  },
  disabled: {
    opacity: 0.4,
  }
});

// Aliases for backward compatibility
