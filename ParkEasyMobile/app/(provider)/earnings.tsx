import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  ZoomIn
} from 'react-native-reanimated';
import { get, post } from '../../services/api';
import { colors } from '../../constants/colors';
import { LineChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';
import { useToast } from '../../components/Toast';

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
    labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'],
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
  const { showToast } = useToast();

  const resetForm = () => {
    setWithdrawAmount('');
    setPayoutMethod('UPI');
    setPayoutDetails({ upiId: '', accNo: '', ifsc: '' });
  };

  const closeWithdrawModal = () => {
    setShowModal(false);
    resetForm();
  };

  const fetchEarnings = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await get('/provider/earnings');
      if (res.data?.data) {
        const d = res.data.data;
        setStats({
          totalEarnings: d.totalRevenue || 0,
          withdrawable: d.withdrawableBalance || 0,
          pending: d.pendingSettlements || 0,
          thisMonth: d.thisMonthRevenue || 0,
        });
        setHistory(d.history || []);
        if (d.trend) {
          const { labels, data } = d.trend;
          if (Array.isArray(labels) && Array.isArray(data) && labels.length > 0) {
            setTrend({
              labels: labels.map((l: string) => l.toUpperCase()),
              data: data.map((v: any) => parseFloat(v) || 0)
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
      const msg = error instanceof Error ? error.message : 'Failed to synchronize earnings data.';
      showToast(msg, 'error');
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
      Alert.alert("Insufficient Balance", "Minimum withdrawal threshold is ₹100.");
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

    if (payoutMethod === 'UPI') {
      if (!payoutDetails.upiId || !/^[\w.-]+@[\w]+$/.test(payoutDetails.upiId)) {
        Alert.alert("Validation Error", "Please enter a valid UPI ID.");
        return;
      }
    } else if (payoutMethod === 'BANK') {
      if (!/^\d{9,18}$/.test(payoutDetails.accNo)) {
        Alert.alert("Validation Error", "Invalid bank account number.");
        return;
      }
      if (!/^[A-Z]{4}[0-9A-Z]{7}$/.test(payoutDetails.ifsc)) {
        Alert.alert("Validation Error", "Invalid IFSC code.");
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
        Alert.alert("Withdrawal Initiated", "Transfer has been started. Settlement expected within 4 hours.");
        closeWithdrawModal();
        await fetchEarnings();
      } else {
        Alert.alert("Error", res.data?.message || "Failed to process withdrawal.");
      }
    } catch (error: any) {
      Alert.alert("System Error", error.response?.data?.message || "Failed to process request.");
    } finally {
      setSubmitting(false);
    }
  };

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.4})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: {
      r: '4',
      strokeWidth: '0',
      fill: 'white',
    },
    propsForBackgroundLines: {
      strokeDasharray: '0',
      stroke: 'rgba(255,255,255,0.05)',
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: '#080a0f' }]}>
        <ActivityIndicator size="small" color="white" />
      </View>
    );
  }

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
            <Text style={styles.headerTitle}>Earnings</Text>
            <Text style={styles.headerSubtitle}>Manage your payouts</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="white" />}
      >
        <Animated.View entering={FadeInDown.delay(100)}>
          <BlurView intensity={20} tint="dark" style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available to withdraw</Text>
            <Text style={styles.balanceValue}>₹{stats.withdrawable.toLocaleString()}</Text>

            <TouchableOpacity
              style={styles.withdrawBtn}
              onPress={handleWithdraw}
              activeOpacity={0.8}
            >
              <Text style={styles.withdrawText}>Withdraw Funds</Text>
              <Ionicons name="arrow-forward" size={18} color="#080a0f" />
            </TouchableOpacity>

            <View style={styles.balanceFooter}>
              <View style={styles.footerCol}>
                <Text style={styles.fLabel}>Pending Settlements</Text>
                <Text style={styles.fValue}>₹{stats.pending}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.footerCol}>
                <Text style={styles.fLabel}>Payout Status</Text>
                <Text style={[styles.fValue, { color: '#34d399' }]}>Secure</Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Trend</Text>
          <Animated.View entering={FadeInUp.delay(200)}>
            <BlurView intensity={15} tint="dark" style={styles.chartCard}>
              <LineChart
                data={{
                  labels: trend.labels,
                  datasets: [{ data: trend.data }]
                }}
                width={width - 50}
                height={180}
                chartConfig={chartConfig}
                bezier
                transparent
                style={styles.chart}
                withInnerLines={true}
                withOuterLines={false}
                withVerticalLines={false}
                withHorizontalLines={true}
              />
            </BlurView>
          </Animated.View>
        </View>

        <View style={styles.statsGrid}>
          <Animated.View entering={FadeInLeft.delay(300)} style={styles.statsCol}>
            <BlurView intensity={15} tint="dark" style={styles.miniStatCard}>
              <View style={[styles.miniIcon, { backgroundColor: 'rgba(52, 211, 153, 0.1)' }]}>
                <Ionicons name="calendar-outline" size={20} color="#34d399" />
              </View>
              <Text style={styles.miniLabel}>Month Earnings</Text>
              <Text style={styles.miniValue}>₹{stats.thisMonth.toLocaleString()}</Text>
            </BlurView>
          </Animated.View>
          <Animated.View entering={FadeInRight.delay(400)} style={styles.statsCol}>
            <BlurView intensity={15} tint="dark" style={styles.miniStatCard}>
              <View style={[styles.miniIcon, { backgroundColor: 'rgba(28, 116, 233, 0.1)' }]}>
                <Ionicons name="bar-chart-outline" size={20} color="#1c74e9" />
              </View>
              <Text style={styles.miniLabel}>Lifetime Earnings</Text>
              <Text style={styles.miniValue}>₹{stats.totalEarnings.toLocaleString()}</Text>
            </BlurView>
          </Animated.View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {history.length > 0 ? (
            history.map((item, idx) => {
              const normalizedStatus = (item.status || 'pending').toUpperCase();
              const isSuccess = normalizedStatus === 'SUCCESS';
              
              return (
                <Animated.View key={idx} entering={FadeInUp.delay(Math.min(500 + idx * 50, 1000))}>
                  <BlurView intensity={10} tint="dark" style={styles.transactionCard}>
                    <View style={styles.txIcon}>
                      <Ionicons
                        name={isSuccess ? 'checkmark-circle' : 'time'}
                        size={20}
                        color={isSuccess ? '#34d399' : '#fbbf24'}
                      />
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txMethod}>{item.method === 'UPI' ? 'UPI Payout' : 'Bank Transfer'}</Text>
                      <Text style={styles.txDate}>{new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                    </View>
                    <View style={styles.txEnd}>
                      <Text style={[styles.txAmount, { color: isSuccess ? '#34d399' : '#fbbf24' }]}>
                        ₹{item.amount}
                      </Text>
                      <Text style={[styles.txStatus, { color: isSuccess ? 'rgba(52, 211, 153, 0.5)' : 'rgba(251, 191, 36, 0.5)' }]}>
                        {normalizedStatus.toLowerCase()}
                      </Text>
                    </View>
                  </BlurView>
                </Animated.View>
              );
            })
          ) : (
            <BlurView intensity={10} tint="dark" style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={40} color="rgba(255,255,255,0.1)" />
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySub}>Your payout history will appear here.</Text>
            </BlurView>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={closeWithdrawModal}
      >
        <BlurView intensity={80} tint="dark" style={styles.modalOverlay}>
          <Animated.View entering={ZoomIn} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Withdraw Funds</Text>
                <Text style={styles.modalSubtitle}>Select your payout destination</Text>
              </View>
              <TouchableOpacity
                onPress={closeWithdrawModal}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Amount to withdraw (₹)</Text>
              <View style={styles.amountInputBox}>
                <TextInput
                  style={styles.amountInput}
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                />
                <Text style={styles.limitText}>Max: ₹{stats.withdrawable}</Text>
              </View>

              <Text style={styles.inputLabel}>Payout Method</Text>
              <View style={styles.methodGrid}>
                <TouchableOpacity
                  style={[styles.methodBtn, payoutMethod === 'UPI' && styles.methodBtnActive]}
                  onPress={() => setPayoutMethod('UPI')}
                >
                  <Ionicons name="send-outline" size={18} color={payoutMethod === 'UPI' ? 'black' : 'white'} />
                  <Text style={[styles.methodBtnText, payoutMethod === 'UPI' && styles.methodBtnTextActive]}>UPI</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.methodBtn, payoutMethod === 'BANK' && styles.methodBtnActive]}
                  onPress={() => setPayoutMethod('BANK')}
                >
                  <Ionicons name="business-outline" size={18} color={payoutMethod === 'BANK' ? 'black' : 'white'} />
                  <Text style={[styles.methodBtnText, payoutMethod === 'BANK' && styles.methodBtnTextActive]}>Bank</Text>
                </TouchableOpacity>
              </View>

              {payoutMethod === 'UPI' ? (
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>UPI ID</Text>
                  <TextInput
                    style={styles.textInput}
                    value={payoutDetails.upiId}
                    onChangeText={(v) => setPayoutDetails({ ...payoutDetails, upiId: v })}
                    placeholder="example@upi"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    autoCapitalize="none"
                  />
                </View>
              ) : (
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Bank Account Details</Text>
                  <TextInput
                    style={[styles.textInput, { marginBottom: 12 }]}
                    value={payoutDetails.accNo}
                    onChangeText={(v) => setPayoutDetails({ ...payoutDetails, accNo: v })}
                    keyboardType="numeric"
                    placeholder="Account Number"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                  />
                  <TextInput
                    style={styles.textInput}
                    value={payoutDetails.ifsc}
                    onChangeText={(v) => setPayoutDetails({ ...payoutDetails, ifsc: v.toUpperCase() })}
                    placeholder="IFSC Code"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    autoCapitalize="characters"
                  />
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={submitWithdrawal}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="black" />
                ) : (
                  <Text style={styles.submitBtnText}>Confirm Withdrawal</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </BlurView>
      </Modal>
    </View>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 1,
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
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  balanceCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    alignItems: 'center',
    marginBottom: 25,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 10,
  },
  balanceValue: {
    fontSize: 42,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -1,
    marginBottom: 25,
  },
  withdrawBtn: {
    width: '100%',
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    gap: 8,
    marginBottom: 25,
  },
  withdrawText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#080a0f',
  },
  balanceFooter: {
    flexDirection: 'row',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 20,
    gap: 20,
  },
  footerCol: {
    flex: 1,
    alignItems: 'center',
  },
  fLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 4,
  },
  fValue: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  chart: {
    marginLeft: -15,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 25,
  },
  statsCol: {
    flex: 1,
  },
  miniStatCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  miniIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  miniLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 4,
  },
  miniValue: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 10,
    overflow: 'hidden',
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    marginLeft: 15,
  },
  txMethod: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  txDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 2,
  },
  txEnd: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#34d399',
  },
  txStatus: {
    fontSize: 10,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  emptyCard: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: Platform.OS === 'android' ? 'solid' : 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginTop: 15,
  },
  emptySub: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.3)',
    marginTop: 5,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#0f1219',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 24,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 10,
  },
  amountInputBox: {
    marginBottom: 25,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
  },
  limitText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 8,
  },
  methodGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 25,
  },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  methodBtnActive: {
    backgroundColor: 'white',
    borderColor: 'white',
  },
  methodBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  methodBtnTextActive: {
    color: 'black',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 16,
    color: 'white',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  submitBtn: {
    backgroundColor: 'white',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '700',
  },
});
