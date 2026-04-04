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
    switch (variant) {
      case 'primary':
        return { 
          backgroundColor: colors.primary,
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
            },
            android: { elevation: 4 }
          })
        };
      case 'danger':
        return { backgroundColor: colors.danger };
      case 'vibrant':
      case 'secondary':
        return { 
          backgroundColor: colors.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          borderWidth: 0.5,
          borderColor: colors.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
          shadowOpacity: 0
        };
      default:
        return { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border };
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
        styles.button, 
        getVariantStyles(), 
        style, 
        (disabled || loading) && styles.disabled, 
        animatedStyle
      ]}
    >
      {variant === 'vibrant' && (
        <BlurView intensity={20} tint={colors.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      )}
      
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
  button: {
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    paddingHorizontal: 24,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  icon: {
    marginRight: 8,
  },
  disabled: {
    opacity: 0.5,
  }
});

// Aliases for backward compatibility
