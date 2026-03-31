import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  StatusBar
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, { FadeInUp, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { get } from '../../services/api';

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
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isDemoData, setIsDemoData] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await get('/provider/analytics');
        const apiData = res.data.data;
        
        // Runtime validation of the data shape
        const isValid = apiData && 
                       Array.isArray(apiData.revenue) && 
                       Array.isArray(apiData.occupancy) && 
                       Array.isArray(apiData.vehicles);

        if (!isValid) {
          throw new Error('Invalid analytics data structure');
        }

        setData(apiData);
        setIsLive(true);
        setIsDemoData(false);
      } catch (e) {
        console.error('Error fetching analytics', e);
        setIsLive(false);
        setIsDemoData(true);
        // Realistic fallback for demo/error
        setData({
          revenue: [1200, 1900, 1500, 2400, 2100, 3200, 2800],
          occupancy: [40, 60, 85, 95, 75, 45, 30],
          vehicles: [
            { name: 'Cars', population: 65, color: '#34d399', legendFontColor: 'rgba(255,255,255,0.6)', legendFontSize: 11 },
            { name: 'Bikes', population: 25, color: '#38bdf8', legendFontColor: 'rgba(255,255,255,0.6)', legendFontSize: 11 },
            { name: 'Other', population: 10, color: '#818cf8', legendFontColor: 'rgba(255,255,255,0.6)', legendFontSize: 11 },
          ],
          revenueGrowth: '+12.5%',
          avgRating: '4.9/5.0'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <View style={styles.loadingHost}>
        <LinearGradient
          colors={['#0f1219', '#080a0f']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="small" color="white" />
        <Text style={styles.loadingText}>Loading insights...</Text>
      </View>
    );
  }

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.4})`,
    style: { borderRadius: 24 },
    propsForDots: {
      r: '4',
      strokeWidth: '0',
      fill: 'white',
    },
    propsForBackgroundLines: {
      strokeDasharray: '0',
      stroke: 'rgba(255, 255, 255, 0.05)',
    },
    propsForLabels: {
      fontSize: 10,
      fontWeight: '500',
    }
  };

  const blueChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => `rgba(56, 189, 248, ${opacity})`,
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.bgWrapper}>
        <LinearGradient
          colors={['#0f1219', '#080a0f']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <BlurView intensity={20} tint="dark" style={styles.iconBlur}>
              <Ionicons name="chevron-back" size={24} color="white" />
            </BlurView>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerSubtitle}>Insights</Text>
            <Text style={styles.headerTitle}>Analytics Overview</Text>
          </View>
          {isLive && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isDemoData && (
          <Animated.View entering={FadeInDown} style={styles.demoBanner}>
            <Ionicons name="information-circle" size={16} color="rgba(255, 255, 255, 0.6)" />
            <Text style={styles.demoText}>Showing offline demo insights</Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue (Last 7 Days)</Text>
          <BlurView intensity={15} tint="dark" style={styles.chartCard}>
            <LineChart
              data={{
                labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                datasets: [{ data: data?.revenue ?? [0, 0, 0, 0, 0, 0, 0] }]
              }}
              width={width - 50}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={false}
              withHorizontalLines={true}
              withVerticalLines={false}
            />
          </BlurView>
        </Animated.View>

        <View style={styles.summaryGrid}>
          <Animated.View entering={ZoomIn.delay(300)} style={styles.summaryItem}>
            <BlurView intensity={15} tint="dark" style={styles.statCard}>
              <View style={styles.statIconBox}>
                <Ionicons name="trending-up" size={16} color="#34d399" />
              </View>
              <Text style={styles.statLabel}>Revenue Growth</Text>
              <Text style={[styles.statValue, { color: '#34d399' }]}>{data.revenueGrowth || '+0%'}</Text>
            </BlurView>
          </Animated.View>
          <Animated.View entering={ZoomIn.delay(400)} style={styles.summaryItem}>
            <BlurView intensity={15} tint="dark" style={styles.statCard}>
              <View style={styles.statIconBox}>
                <Ionicons name="star" size={16} color="#fbbf24" />
              </View>
              <Text style={styles.statLabel}>Avg. Rating</Text>
              <Text style={[styles.statValue, { color: '#fbbf24' }]}>{data.avgRating || '0.0/5.0'}</Text>
            </BlurView>
          </Animated.View>
        </View>
        
        <Animated.View entering={FadeInUp.delay(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Occupancy Peaks</Text>
          <BlurView intensity={15} tint="dark" style={styles.chartCard}>
            <BarChart
              data={{
                labels: ["08:00", "12:00", "16:00", "20:00"],
                datasets: [{ data: data.occupancy?.slice(0, 4) ?? [0, 0, 0, 0] }]
              }}
              width={width - 50}
              height={180}
              chartConfig={blueChartConfig}
              yAxisLabel=""
              yAxisSuffix="%"
              style={styles.chart}
              flatColor={true}
              fromZero={true}
              showBarTops={false}
              withInnerLines={false}
            />
          </BlurView>
        </Animated.View>

      <Animated.View entering={FadeInDown.delay(600)} style={[styles.section, { marginBottom: 40 }]}>
        <Text style={styles.sectionTitle}>Vehicle Types</Text>
        <BlurView intensity={15} tint="dark" style={styles.chartCard}>
          <PieChart
            data={(data.vehicles?.length ?? 0) > 0 ? data.vehicles : [
              { name: 'No data', population: 100, color: 'rgba(255,255,255,0.05)', legendFontColor: 'rgba(255,255,255,0.4)', legendFontSize: 12 }
            ]}
            width={width - 50}
            height={180}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </BlurView>
      </Animated.View>
    </ScrollView>
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080a0f',
  },
  bgWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingHost: {
    flex: 1,
    backgroundColor: '#080a0f',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(8, 10, 15, 0.8)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  iconBlur: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#34d399',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 25,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 15,
    paddingHorizontal: 4,
  },
  chartCard: {
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  chart: {
    marginLeft: -15,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 25,
  },
  summaryItem: {
    flex: 1,
  },
  statCard: {
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 16,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  demoText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  }
});
