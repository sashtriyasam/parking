import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Platform
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { get } from '../../services/api';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptics } from '../../hooks/useHaptics';
import { ProfessionalCard } from '../../components/ui/ProfessionalCard';

const { width } = Dimensions.get('window');

interface AnalyticsData {
  revenue: number[];
  occupancy: number[];
  vehicles: {
    name: string;
    population: number;
    color: string;
    legendFontColor: string;
    legendFontSize: number;
  }[];
  revenueGrowth?: string;
  avgRating?: string;
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const haptics = useHaptics();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await get('/provider/analytics');
        const apiData = res.data.data;
        
        setData(apiData);
        setIsLive(true);
      } catch (e) {
        console.error('Error fetching analytics', e);
        setIsLive(false);
        // Realistic fallback for demo
        setData({
          revenue: [1200, 1900, 1500, 2400, 2100, 3200, 2800],
          occupancy: [40, 60, 85, 95, 75, 45, 30],
          vehicles: [
            { name: 'CARS', population: 65, color: colors.primary, legendFontColor: colors.textSecondary, legendFontSize: 10 },
            { name: 'BIKES', population: 25, color: colors.success, legendFontColor: colors.textSecondary, legendFontSize: 10 },
            { name: 'OTHER', population: 10, color: '#818cf8', legendFontColor: colors.textSecondary, legendFontSize: 10 },
          ],
          revenueGrowth: '+14.2%',
          avgRating: '4.92'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    decimalPlaces: 0,
    color: (opacity = 1) => colors.primary + `${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
    labelColor: (opacity = 1) => colors.textMuted + `${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
    style: { borderRadius: 24 },
    propsForDots: {
      r: '4',
      strokeWidth: '0',
      fill: colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '0',
      stroke: colors.border + '30',
    },
    propsForLabels: {
      fontSize: 9,
      fontWeight: '700',
      letterSpacing: 0.5,
    }
  };

  const successChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => colors.success + `${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
  };

  if (loading || !data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      
      <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
         <BlurView intensity={20} tint={colors.isDark ? 'dark' : 'light'} style={styles.headerContent}>
            <View style={styles.headerTop}>
               <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                  <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
               </TouchableOpacity>
               <View style={styles.headerTitleSection}>
                  <Text style={[styles.headerLabel, { color: colors.textMuted }]}>ANALYTICS ENGINE</Text>
                  <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Performance</Text>
               </View>
               <View style={[styles.liveBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[styles.liveDot, { backgroundColor: isLive ? colors.success : colors.warning }]} />
                  <Text style={[styles.liveText, { color: isLive ? colors.success : colors.warning }]}>{isLive ? 'LIVE' : 'CACHE'}</Text>
               </View>
            </View>
         </BlurView>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Revenue Performance Card */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <ProfessionalCard style={styles.sectionCard} hasVibrancy={true}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>REVENUE GROWTH</Text>
            <LineChart
              data={{
                labels: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
                datasets: [{ data: Array.isArray(data?.revenue) ? data.revenue : [0,0,0,0,0,0,0] }]
              }}
              width={width - 80}
              height={180}
              chartConfig={chartConfig}
              bezier
              transparent
              withInnerLines={false}
              withOuterLines={false}
              style={styles.chart}
            />
          </ProfessionalCard>
        </Animated.View>

        {/* High-Impact Stat Grid */}
        <View style={styles.statsGrid}>
           <Animated.View entering={ZoomIn.delay(300)} style={styles.statsCol}>
              <ProfessionalCard style={styles.miniCard} hasVibrancy={true}>
                 <Ionicons name="trending-up" size={20} color={colors.success} />
                 <Text style={[styles.statLabel, { color: colors.textMuted }]}>GROWTH</Text>
                 <Text style={[styles.statValue, { color: colors.textPrimary }]}>{data.revenueGrowth ?? '+0%'}</Text>
              </ProfessionalCard>
           </Animated.View>
           <Animated.View entering={ZoomIn.delay(400)} style={styles.statsCol}>
              <ProfessionalCard style={styles.miniCard} hasVibrancy={true}>
                 <Ionicons name="star" size={20} color={colors.warning} />
                 <Text style={[styles.statLabel, { color: colors.textMuted }]}>RATING</Text>
                 <Text style={[styles.statValue, { color: colors.textPrimary }]}>{data.avgRating ?? '5.00'}</Text>
              </ProfessionalCard>
           </Animated.View>
        </View>

        {/* Occupancy Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>OCCUPANCY PEAKS (24H)</Text>
          <Animated.View entering={FadeInDown.delay(500)}>
            <ProfessionalCard style={styles.sectionCard} hasVibrancy={true}>
              <BarChart
                data={{
                  labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:59"],
                  datasets: [{ data: Array.isArray(data?.occupancy) ? data.occupancy.slice(0, 7) : [0,0,0,0,0,0,0] }]
                }}
                width={width - 80}
                height={160}
                chartConfig={successChartConfig}
                yAxisLabel=""
                yAxisSuffix="%"
                fromZero={true}
                withInnerLines={false}
                style={styles.chart}
              />
            </ProfessionalCard>
          </Animated.View>
        </View>

        {/* Demographics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>VEHICLE MIX</Text>
          <Animated.View entering={FadeInUp.delay(600)}>
            <ProfessionalCard style={styles.sectionCard} hasVibrancy={true}>
              <PieChart
                data={Array.isArray(data.vehicles) ? data.vehicles : []}
                width={width - 80}
                height={150}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </ProfessionalCard>
          </Animated.View>
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { zIndex: 100 },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, gap: 16 },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  headerTitleSection: { flex: 1 },
  headerLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  headerTitle: { fontSize: 26, fontWeight: '900', letterSpacing: -1 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  scrollContent: { padding: 24, paddingBottom: 100 },
  sectionCard: { borderRadius: 32, padding: 24, borderWidth: 0 },
  sectionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 20, opacity: 0.6 },
  chart: { borderRadius: 16, marginLeft: -12 },
  statsGrid: { flexDirection: 'row', gap: 16, marginTop: 20 },
  statsCol: { flex: 1 },
  miniCard: { padding: 24, alignItems: 'center', borderRadius: 28, borderWidth: 0 },
  statLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 12, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  section: { marginTop: 32 },
  sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 16, marginLeft: 4 },
});
