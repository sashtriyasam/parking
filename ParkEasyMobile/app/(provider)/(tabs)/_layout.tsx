import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StyleSheet, View, Platform } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useThemeColors } from '../../../hooks/useThemeColors';

const TAB_BAR_RADIUS = 32;

interface TabIconProps {
  name: any;
  outlineName: any;
  size: number;
  color: string;
  focused: boolean;
}

const TabIcon = ({ name, outlineName, size, color, focused }: TabIconProps) => {
  const colors = useThemeColors();
  return (
    <View style={styles.iconContainer}>
      <Ionicons name={focused ? name : outlineName} size={size} color={color} />
      {focused && (
        <Animated.View 
          entering={ZoomIn.duration(300)}
          style={[styles.activeGlow, { backgroundColor: colors.primary + '30' }]} 
        />
      )}
    </View>
  );
};

export default function ProviderTabLayout() {
  const colors = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 34 : 24,
          left: 20,
          right: 20,
          height: 68,
          borderRadius: TAB_BAR_RADIUS,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          paddingBottom: 0,
        },
        tabBarBackground: () => (
          <View style={[styles.tabBarBackgroundContainer, { backgroundColor: colors.isDark ? 'rgba(15, 18, 25, 0.8)' : 'rgba(255, 255, 255, 0.8)' }]}>
            <BlurView 
              intensity={40} 
              tint={colors.isDark ? 'dark' : 'light'} 
              style={[StyleSheet.absoluteFill, styles.tabBarBlur]} 
            />
            <View style={[styles.tabBarBorder, { borderColor: colors.border }]} />
          </View>
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="stats-chart" outlineName="stats-chart-outline" size={22} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="facilities"
        options={{
          title: 'Facilities',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="business" outlineName="business-outline" size={22} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.scanIconWrapper, { backgroundColor: colors.primary }]}>
              <Ionicons name="qr-code" size={24} color="white" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="journal" outlineName="journal-outline" size={22} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person-circle" outlineName="person-circle-outline" size={24} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBackgroundContainer: {
    flex: 1,
    borderRadius: TAB_BAR_RADIUS,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  tabBarBlur: {
    borderRadius: TAB_BAR_RADIUS,
  },
  tabBarBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: TAB_BAR_RADIUS,
    borderWidth: 1.5,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
  activeGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    zIndex: -1,
  },
  scanIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 4,
  }
});
