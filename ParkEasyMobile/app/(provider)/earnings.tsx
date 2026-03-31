import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { get } from '../../services/api';
import { GlassCard } from '../../components/ui/GlassCard';
import { colors } from '../../constants/colors';
import { LineChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';
import { Modal, TextInput, ActivityIndicator } from 'react-native';
import { post } from '../../services/api';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function EarningsScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalEarnings: 0,
    withdrawable: 0,
    pending: 0,
    thisMonth: 0,
  });
  const [trend, setTrend] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    data: [0, 0, 0, 0, 0, 0],
  });
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Withdrawal Modal State
  const [showModal, setShowModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'UPI' | 'BANK'>('UPI');
  const [payoutDetails, setPayoutDetails] = useState({
    upiId: '',
    accNo: '',
    ifsc: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchEarnings = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await get('/provider/earnings');
      if (res.data?.data) {
        setStats({
          totalEarnings: res.data.data.totalRevenue || 0,
          withdrawable: res.data.data.withdrawableBalance || 0,
          pending: res.data.data.pendingSettlements || 0,
          thisMonth: res.data.data.thisMonthRevenue || 0,
        });
        setHistory(res.data.data.history || []);
        if (res.data.data.trend) {
          const { labels, data } = res.data.data.trend;
          const isValidTrend = Array.isArray(labels) &&
            Array.isArray(data) &&
            labels.length > 0 &&
            labels.length === data.length &&
            data.every((val: any) => !isNaN(parseFloat(val)));

          if (isValidTrend) {
            setTrend({
              labels,
              data: data.map((val: any) => parseFloat(val))
            });
          } else {
            console.warn('Earnings: Invalid trend data received, using safe defaults');
            setTrend({ labels: [], data: [] });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarnings(false);
  };

  const handleWithdraw = () => {
    if (stats.withdrawable < 100) {
      Alert.alert("Minimum Limit", "Minimum withdrawal amount is ₹100.");
      return;
    }
    setWithdrawAmount(stats.withdrawable.toString());
    setShowModal(true);
  };

  const submitWithdrawal = async () => {
    const amountNum = parseFloat(withdrawAmount);
    if (!amountNum || amountNum <= 0 || amountNum > stats.withdrawable) {
      Alert.alert("Invalid Amount", "Please enter a valid amount within your balance.");
      return;
    }

    // Validation
    if (payoutMethod === 'UPI') {
      if (!payoutDetails.upiId || !payoutDetails.upiId.includes('@')) {
        Alert.alert("Invalid UPI ID", "Please enter a valid UPI ID (e.g., name@okaxis)");
        return;
      }
    } else if (payoutMethod === 'BANK') {
      if (!payoutDetails.accNo || !/^\d{9,18}$/.test(payoutDetails.accNo)) {
        Alert.alert("Invalid Account Number", "Please enter a valid bank account number (9-18 digits).");
        return;
      }
      const ifscRegex = /^[A-Z]{4}[0-9A-Z]{7}$/;
      if (!payoutDetails.ifsc || !ifscRegex.test(payoutDetails.ifsc)) {
        Alert.alert("Invalid IFSC", "Please enter a valid 11-character IFSC code (e.g., SBIN0001234).");
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await post('/provider/withdrawals', {
        amount: amountNum,
        payout_method: payoutMethod,
        payout_details: payoutMethod === 'UPI' 
          ? { upi_id: payoutDetails.upiId } 
          : { acc_no: payoutDetails.accNo, ifsc: payoutDetails.ifsc }
      });

      if (res.data?.success) {
        Alert.alert("Request Submitted", "Your withdrawal request is being processed. It usually takes 2-4 hours.");
        
        // Reset form state
        setWithdrawAmount('');
        setPayoutDetails({
          upiId: '',
          accNo: '',
          ifsc: '',
        });
        
        setShowModal(false);
        fetchEarnings(); // Refresh balance and history
      } else {
        Alert.alert("Error", res.data?.message || "Withdrawal request failed. Please try again.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const chartData = {
    labels: trend.labels,
    datasets: [
      {
        data: trend.data,
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        strokeWidth: 3,
      }
    ],
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />}
      >
        {/* Hero Header */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.heroSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View>
              <Text style={styles.heroLabel}>EARNINGS</Text>
              <Text style={styles.heroTitle}>Revenue Center</Text>
            </View>
          </View>

          <Animated.View entering={FadeInDown.delay(200)}>
            <GlassCard style={styles.balanceCard} intensity={20}>
              <Text style={styles.balanceLabel}>WITHDRAWABLE BALANCE</Text>
              <Text style={styles.balanceValue}>₹{stats.withdrawable.toLocaleString()}</Text>

              <TouchableOpacity
                style={styles.withdrawBtn}
                activeOpacity={0.8}
                onPress={handleWithdraw}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,1)', 'rgba(230,240,255,1)']}
                  style={styles.withdrawGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="arrow-up-circle" size={18} color={colors.primary} />
                  <Text style={styles.withdrawBtnText}>Withdraw to Bank</Text>
                </LinearGradient>
              </TouchableOpacity>
            </GlassCard>
          </Animated.View>

          {/* Trend Chart */}
          <View style={{ marginTop: 24 }}>
            <Text style={styles.chartLabel}>6-MONTH TREND</Text>
            <LineChart
              data={chartData}
              width={width - 48}
              height={150}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: 'transparent',
                backgroundGradientTo: 'transparent',
                backgroundGradientFromOpacity: 0,
                backgroundGradientToOpacity: 0,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.7})`,
                style: { borderRadius: 16 },
                propsForDots: {
                  r: '5',
                  strokeWidth: '2',
                  stroke: 'white',
                  fill: colors.primary,
                }
              }}
              bezier
              style={styles.chart}
              withShadow={false}
            />
          </View>
        </LinearGradient>

        {/* Stat Tiles */}
        <View style={styles.statsRow}>
          <Animated.View entering={FadeInDown.delay(100)} style={styles.halfTile}>
            <GlassCard style={styles.statTile} intensity={10}>
              <View style={[styles.statIcon, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="trending-up" size={22} color={colors.success} />
              </View>
              <Text style={styles.statVal}>₹{stats.thisMonth.toLocaleString()}</Text>
              <Text style={styles.statLbl}>THIS MONTH</Text>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)} style={styles.halfTile}>
            <GlassCard style={styles.statTile} intensity={10}>
              <View style={[styles.statIcon, { backgroundColor: colors.info + '15' }]}>
                <Ionicons name="wallet" size={22} color={colors.info} />
              </View>
              <Text style={styles.statVal}>₹{stats.totalEarnings.toLocaleString()}</Text>
              <Text style={styles.statLbl}>ALL TIME</Text>
            </GlassCard>
          </Animated.View>
        </View>

        {/* Settlement History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SETTLEMENT LOG</Text>

          {history.length > 0 ? (
            history.map((item, idx) => (
              <Animated.View key={idx} entering={FadeInUp.delay(idx * 80)}>
                <GlassCard style={styles.settlementCard} intensity={5}>
                  <View style={[
                    styles.settlementIconBox,
                    { backgroundColor: item.status === 'SUCCESS' ? colors.success + '15' : colors.warning + '15' }
                  ]}>
                    <Ionicons
                      name={item.status === 'SUCCESS' ? 'checkmark-circle' : 'time'}
                      size={24}
                      color={item.status === 'SUCCESS' ? colors.success : colors.warning}
                    />
                  </View>
                  <View style={styles.settlementInfo}>
                    <Text style={styles.settlementTitle}>{item.method || 'Bank Transfer'}</Text>
                    <Text style={styles.settlementDate}>{new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</Text>
                  </View>
                  <Text style={[styles.settlementAmount, { color: item.status === 'SUCCESS' ? colors.success : colors.warning }]}>
                    +₹{item.amount}
                  </Text>
                </GlassCard>
              </Animated.View>
            ))
          ) : (
            <View style={styles.emptyLog}>
              <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyLogText}>No settlements yet</Text>
              <Text style={styles.emptyLogSub}>Completed payouts will appear here.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Withdrawal Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent} intensity={40}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Withdraw Funds</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close-circle" size={28} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>AMOUNT (₹)</Text>
              <TextInput
                style={styles.textInput}
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.balanceInfo}>Max: ₹{stats.withdrawable}</Text>
            </View>

            <View style={styles.methodToggle}>
              <TouchableOpacity
                style={[styles.methodBtn, payoutMethod === 'UPI' && styles.methodBtnActive]}
                onPress={() => setPayoutMethod('UPI')}
              >
                <Text style={[styles.methodBtnText, payoutMethod === 'UPI' && styles.methodBtnTextActive]}>UPI</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodBtn, payoutMethod === 'BANK' && styles.methodBtnActive]}
                onPress={() => setPayoutMethod('BANK')}
              >
                <Text style={[styles.methodBtnText, payoutMethod === 'BANK' && styles.methodBtnTextActive]}>BANK</Text>
              </TouchableOpacity>
            </View>

            {payoutMethod === 'UPI' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>UPI ID</Text>
                <TextInput
                  style={styles.textInput}
                  value={payoutDetails.upiId}
                  onChangeText={(val) => setPayoutDetails({ ...payoutDetails, upiId: val })}
                  placeholder="username@bank"
                  autoCapitalize="none"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ACCOUNT NUMBER</Text>
                  <TextInput
                    style={styles.textInput}
                    value={payoutDetails.accNo}
                    onChangeText={(val) => setPayoutDetails({ ...payoutDetails, accNo: val })}
                    keyboardType="numeric"
                    placeholder="Enter account number"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>IFSC CODE</Text>
                  <TextInput
                    style={styles.textInput}
                    value={payoutDetails.ifsc}
                    onChangeText={(val) => setPayoutDetails({ ...payoutDetails, ifsc: val.toUpperCase() })}
                    autoCapitalize="characters"
                    placeholder="e.g. SBIN0001234"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={submitWithdrawal}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Request</Text>
              )}
            </TouchableOpacity>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroSection: {
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingHorizontal: 24,
    paddingBottom: 48,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -0.5,
  },
  balanceCard: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 48,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -2,
    marginBottom: 24,
  },
  withdrawBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
  },
  withdrawGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  withdrawBtnText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  chartLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    marginBottom: 12,
    marginLeft: 4,
  },
  chart: {
    borderRadius: 20,
    marginLeft: -12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    padding: 24,
    paddingTop: 32,
    marginTop: -20,
  },
  halfTile: {
    flex: 1,
  },
  statTile: {
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statVal: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  statLbl: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: 16,
    marginLeft: 4,
  },
  settlementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  settlementIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settlementInfo: {
    flex: 1,
  },
  settlementTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  settlementDate: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  settlementAmount: {
    fontSize: 16,
    fontWeight: '900',
  },
  emptyLog: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyLogText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptyLogSub: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  balanceInfo: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'right',
  },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  methodBtnActive: {
    backgroundColor: colors.surface,
    ...colors.shadows.sm,
  },
  methodBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMuted,
  },
  methodBtnTextActive: {
    color: colors.primary,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
    ...colors.shadows.md,
  },
  submitBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
  },
});
