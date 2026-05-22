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

interface ProfessionalInputProps extends Omit<TextInputProps, 'onFocus' | 'onBlur'> {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  containerStyle?: ViewStyle;
  onFocus?: (e: any) => void;
  onBlur?: (e: any) => void;
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
      [colors.border, colors.primary]
    ),
    borderWidth: focusProgress.value > 0 ? 1.5 : 1,
  }));

  return (
    <View style={[styles.root, containerStyle]}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      
      <Animated.View 
        style={[
          styles.container, 
          { 
            backgroundColor: colors.surface,
          },
          animatedContainerStyle
        ]}
      >
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
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 2,
    letterSpacing: -0.1,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 10,
    overflow: 'hidden',
  },
  icon: {
    marginLeft: 14,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
    fontWeight: '500',
  }
});

