import React, { ReactNode } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptics } from '../../hooks/useHaptics';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode | string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const scale = useSharedValue(1);
  const colors = useThemeColors();
  const haptics = useHaptics();
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    haptics.impactLight();
    onPress();
  };

  const isGhost = variant === 'ghost';
  
  const getContainerStyle = (): ViewStyle => {
    let styleObj: any = { ...styles.baseContainer, height: size === 'sm' ? 40 : size === 'lg' ? 56 : 48 };
    
    switch (variant) {
      case 'primary':
        styleObj = { ...styleObj, backgroundColor: colors.primary };
        break;
      case 'secondary':
        styleObj = { ...styleObj, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary };
        break;
      case 'glass':
        styleObj = { ...styleObj, backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder };
        break;
      case 'danger':
        styleObj = { ...styleObj, backgroundColor: colors.danger };
        break;
      case 'outline':
        styleObj = { ...styleObj, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary };
        break;
      case 'ghost':
        styleObj = { ...styleObj, backgroundColor: 'transparent' };
        break;
    }

    if (disabled || loading) {
      styleObj = { ...styleObj, opacity: 0.5 };
    }
    return styleObj;
  };

  const getTextStyle = (): TextStyle => {
    let styleObj: any = { 
      fontSize: size === 'sm' ? 14 : size === 'lg' ? 17 : 15,
      fontWeight: '700',
      color: variant === 'primary' || variant === 'danger' ? '#FFFFFF' : colors.primary
    };

    if (variant === 'glass') {
      styleObj.color = colors.textPrimary;
    }

    if (textStyle) {
      styleObj = { ...styleObj, ...textStyle };
    }
    return styleObj;
  };

  const iconColor = (variant === 'primary' || variant === 'danger') 
    ? '#FFFFFF' 
    : (variant === 'glass' ? colors.textPrimary : colors.primary);
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 24 : 20;

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return <Ionicons name={icon as any} size={iconSize} color={iconColor} />;
    }
    return icon;
  };

  return (
    <AnimatedTouchableOpacity
      style={[getContainerStyle(), animatedStyle, style]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
    >
      {renderIcon()}
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <Text style={getTextStyle()}>{label}</Text>
      )}
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
  },
});

