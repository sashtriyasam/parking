import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
  Layout
} from 'react-native-reanimated';
import { ParkingSlot } from '../types';
import { SLOT_STATUS_COLORS } from '../constants/colors';
import { BlurView } from 'expo-blur';
import { useThemeColors } from '../hooks/useThemeColors';
import { useHaptics } from '../hooks/useHaptics';

interface SlotGridProps {
  slots: ParkingSlot[];
  onSlotPress: (slot: ParkingSlot) => void;
  selectedSlotId: string | null;
  highlightedSlotId?: string | null;
}

const ANIMATION_CONFIG = {
  STAGGER_MS: 20,
  MAX_DELAY_MS: 300,
  DURATION_MS: 400,
};

const SlotItem: React.FC<{
  item: ParkingSlot;
  isSelected: boolean;
  isHighlighted: boolean;
  onPress: (slot: ParkingSlot) => void;
  index: number;
  width: number;
}> = ({ item, isSelected, isHighlighted, onPress, index, width }) => {
  const colors = useThemeColors();
  const haptics = useHaptics();
  const pulse = useSharedValue(1);
  const isSelectedSV = useSharedValue(isSelected);
  const isHighlightedSV = useSharedValue(isHighlighted);

  useEffect(() => {
    isSelectedSV.value = isSelected;
    isHighlightedSV.value = isHighlighted;
  }, [isSelected, isHighlighted]);

  useEffect(() => {
    if (isSelected || isHighlighted) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      pulse.value = 1;
    }
  }, [isSelected, isHighlighted]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const dynamicItemStyle = {
    borderColor: isSelected 
      ? colors.primary 
      : isHighlighted 
        ? colors.premium.primary 
        : colors.border,
    borderWidth: (isSelected || isHighlighted) ? 2 : 1,
  };

  const isFree = item.status.toUpperCase() === 'FREE' || item.status === 'free';
  const statusKey = item.status.toLowerCase() as keyof typeof SLOT_STATUS_COLORS;
  const statusColor = SLOT_STATUS_COLORS[statusKey] || colors.textSecondary;

  const staggeredDelay = Math.min(index * ANIMATION_CONFIG.STAGGER_MS, ANIMATION_CONFIG.MAX_DELAY_MS);

  return (
    <Animated.View
      entering={FadeInDown.delay(staggeredDelay).duration(ANIMATION_CONFIG.DURATION_MS)}
      layout={Layout.springify()}
      style={[styles.itemWrapper, { width }]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          haptics.impactLight();
          onPress(item);
        }}
        disabled={!isFree}
        style={styles.touchable}
      >
        <Animated.View style={[styles.slotContainer, { backgroundColor: colors.surface }, dynamicItemStyle, animatedStyle]}>
          <BlurView intensity={isSelected ? 30 : 10} tint={colors.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          {!isFree && <View style={[styles.disabledOverlay, { backgroundColor: statusColor, opacity: 0.1 }]} />}
          <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
          <Text style={[
            styles.slotNumber, 
            { color: colors.textMuted }, 
            isSelected && { color: colors.textPrimary },
            isHighlighted && { color: colors.premium.primary }
          ]}>
            {item.slot_number}
          </Text>
          {isSelected && (
            <Animated.View 
              entering={FadeInDown}
              style={[styles.selectionGlow, { backgroundColor: colors.primary, shadowColor: colors.primary }]} 
            />
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const SlotGrid: React.FC<SlotGridProps> = ({
  slots,
  onSlotPress,
  selectedSlotId,
  highlightedSlotId
}) => {
  const colors = useThemeColors();
  const { width: screenWidth } = useWindowDimensions();
  const COLUMNS = 5;
  const GAP = 12;
  const SCREEN_PADDING = 48; 
  const slotWidth = (screenWidth - SCREEN_PADDING - (GAP * (COLUMNS - 1))) / COLUMNS;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {slots.map((slot, index) => (
          <SlotItem
            key={slot.id}
            item={slot}
            isSelected={slot.id === selectedSlotId}
            isHighlighted={slot.id === highlightedSlotId}
            onPress={onSlotPress}
            index={index}
            width={slotWidth}
          />
        ))}
      </View>

      <View style={[styles.legendContainer, { borderTopColor: colors.border }]}>
        {Object.entries(SLOT_STATUS_COLORS).map(([status, color]) => (
          <View key={status} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={[styles.legendText, { color: colors.textMuted }]}>{status.toUpperCase()}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
  },
  itemWrapper: {
  },
  touchable: {
    aspectRatio: 1,
  },
  slotContainer: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
  },
  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 8,
    right: 8,
  },
  slotNumber: {
    fontSize: 12,
    fontWeight: '900',
  },
  selectionGlow: {
    position: 'absolute',
    bottom: -15,
    width: 30,
    height: 30,
    borderRadius: 15,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
    opacity: 0.5,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
