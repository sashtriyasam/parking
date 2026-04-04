import React, { useState } from 'react';
import { 
  StyleSheet, 
  TextInput, 
  View, 
  Text, 
  TextInputProps,
  ViewStyle,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  Platform
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  interpolateColor
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useThemeColors } from '../../hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';

interface ProfessionalInputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  containerStyle?: ViewStyle;
}

export const ProfessionalInput: React.FC<ProfessionalInputProps> = ({
  label,
  icon,
  error,
  containerStyle,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusProgress = useSharedValue(0);
  const colors = useThemeColors();

  const handleFocus = (e: any) => {
    setIsFocused(true);
    focusProgress.value = withTiming(1, { duration: 250 });
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusProgress.value = withTiming(0, { duration: 250 });
    onBlur?.(e);
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      [colors.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)', colors.primary]
    ),
    borderWidth: 1, // Ultra-clean
  }));

  return (
    <View style={[styles.root, containerStyle]}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      
      <Animated.View 
        style={[
          styles.container, 
          { backgroundColor: colors.isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.7)' },
          animatedContainerStyle
        ]}
      >
        <BlurView 
            intensity={20} 
            tint={colors.isDark ? 'dark' : 'light'} 
            style={StyleSheet.absoluteFill} 
        />
        
        {icon && (
          <Ionicons 
            name={icon} 
            size={20} 
            color={isFocused ? colors.primary : colors.textMuted} 
            style={styles.icon} 
          />
        )}
        
        <TextInput
          style={[styles.input, { color: colors.textPrimary }, props.style]}
          placeholderTextColor={colors.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={colors.primary}
          autoCapitalize="none"
          {...props}
        />
      </Animated.View>
      
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase', // Apple style info label
    opacity: 0.7,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
  },
  icon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '600',
  }
});

// Alias
