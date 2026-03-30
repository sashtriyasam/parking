import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { colors } from '../../constants/colors';
import { Card } from '../../components/ui/Card';
import { get } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await get('/provider/analytics');
        setData(res.data.data);
      } catch (e) {
        console.error('Error fetching analytics', e);
        // Fallback to empty state but with proper structure
        setData({
          revenue: [0, 0, 0, 0],
          occupancy: [0, 0, 0],
          vehicles: []
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const chartConfig = {
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    labelColor: () => colors.textSecondary,
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: colors.primary
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Facility Analytics</Text>
        <Text style={styles.subtitle}>Insights and performance metrics</Text>
      </View>

      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>Revenue Growth (Last 7 Days)</Text>
        <LineChart
          data={{
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{ data: data.revenue }]
          }}
          width={width - 32}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </Card>

      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>Peak Occupancy (%)</Text>
        <BarChart
          data={{
            labels: ["8am", "10am", "12pm", "2pm", "4pm", "6pm", "8pm"],
            datasets: [{ data: data.occupancy }]
          }}
          width={width - 32}
          height={220}
          chartConfig={chartConfig}
          yAxisLabel=""
          yAxisSuffix="%"
          style={styles.chart}
          verticalLabelRotation={0}
        />
      </Card>

      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>Vehicle Distribution</Text>
        <PieChart
          data={data.vehicles}
          width={width - 32}
          height={200}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </Card>

      <View style={styles.summaryGrid}>
        <Card style={styles.summaryItem}>
          <Ionicons name="trending-up" size={24} color={colors.success} />
          <Text style={styles.summaryValue}>+12.5%</Text>
          <Text style={styles.summaryLabel}>Weekly Growth</Text>
        </Card>
        <Card style={styles.summaryItem}>
          <Ionicons name="star" size={24} color={colors.warning} />
          <Text style={styles.summaryValue}>4.8</Text>
          <Text style={styles.summaryLabel}>Avg Rating</Text>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingTop: 60,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  chartCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: colors.surface,
    ...colors.shadows.md,
    borderRadius: 20,
    overflow: 'hidden',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  summaryItem: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  }
});
