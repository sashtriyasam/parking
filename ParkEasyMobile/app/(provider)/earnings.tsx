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
  Modal,
  TextInput,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  ZoomIn
} from 'react-native-reanimated';
import { get, post } from '../../services/api';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useHaptics } from '../../hooks/useHaptics';
import { LineChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';
import { useToast } from '../../components/Toast';
import { ProfessionalCard } from '../../components/ui/ProfessionalCard';
import { ProfessionalButton } from '../../components/ui/ProfessionalButton';
import { ProfessionalInput } from '../../components/ui/ProfessionalInput';

const { width } = Dimensions.get('window');

export default function EarningsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const haptics = useHaptics();
  const { showToast } = useToast();

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
  const [fetchError, setFetchError] = useState(false);

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

  const resetForm = () => {
    setWithdrawAmount('');
    setPayoutMethod('UPI');
    setPayoutDetails({ upiId: '', accNo: '', ifsc: '' });
  };

  const closeWithdrawModal = () => {
    haptics.impactLight();
    setShowModal(false);
    resetForm();
  };

  const fetchEarnings = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setFetchError(false);
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
      setFetchError(true);
      showToast("Network error: Could not sync earnings.", "error");
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
    haptics.impactLight();
    fetchEarnings(false);
  };

  const handleWithdraw = () => {
    haptics.impactMedium();
    if (stats.withdrawable < 100) {
      showToast("Minimum withdrawal threshold is ₹100.", "error");
      return;
    }
    setWithdrawAmount(stats.withdrawable.toString());
    setShowModal(true);
  };

  const submitWithdrawal = async () => {
    haptics.impactMedium();
    const amountNum = parseFloat(withdrawAmount);
    if (!amountNum || amountNum <= 0 || amountNum > stats.withdrawable) {
      showToast("Invalid amount requested.", "error");
      return;
    }

    if (payoutMethod === 'UPI') {
      if (!payoutDetails.upiId || !/^[\w.-]+@[\w]+$/.test(payoutDetails.upiId)) {
        showToast("Invalid UPI ID provided.", "error");
        return;
      }
    } else if (payoutMethod === 'BANK') {
      if (!/^\d{9,18}$/.test(payoutDetails.accNo)) {
        showToast("Invalid bank account number.", "error");
        return;
      }
      if (!/^[A-Z]{4}[0-9A-Z]{7}$/.test(payoutDetails.ifsc)) {
        showToast("Invalid IFSC code.", "error");
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
        haptics.notificationSuccess();
        showToast("Withdrawal initiated.", "success");
        closeWithdrawModal();
        await fetchEarnings();
      } else {
        haptics.notificationError();
        showToast(res.data?.message || "Internal error.", "error");
      }
    } catch (error: any) {
      haptics.notificationError();
      showToast(error.response?.data?.message || "Server error: Try again later.", "error");
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
    color: (opacity = 1) => colors.primary + `${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
    labelColor: (opacity = 1) => colors.textMuted + `${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
    strokeWidth: 3,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: {
      r: '4',
      strokeWidth: '0',
      fill: colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '0',
      stroke: colors.border + '20',
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (fetchError && !refreshing) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
        
        <Animated.View entering={FadeInDown} style={styles.errorContent}>
          <Ionicons name="alert-circle-outline" size={80} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Oops! Failed to load financial data.</Text>
          <ProfessionalButton 
            label="Retry Connection" 
            onPress={() => fetchEarnings()}
            style={styles.retryBtn}
          />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.isDark ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
         <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
         </TouchableOpacity>
         <View style={styles.headerTitleSection}>
            <Text style={[styles.headerLabel, { color: colors.textMuted }]}>ACCOUNT BALANCE</Text>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Financials</Text>
         </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Apple Style Balance Card */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <ProfessionalCard style={styles.heroCard} hasVibrancy={true}>
             <Text style={[styles.heroLabel, { color: colors.textMuted }]}>WITHDRAWABLE</Text>
             <Text style={[styles.heroValue, { color: colors.textPrimary }]}>₹{stats.withdrawable.toLocaleString()}</Text>
             
             <ProfessionalButton 
                label="Withdraw Funds" 
                onPress={handleWithdraw} 
                variant="primary"
                style={styles.heroBtn}
             />

             <View style={styles.heroStats}>
                <View style={styles.heroStatItem}>
                   <Text style={[styles.hsLabel, { color: colors.textMuted }]}>TOTAL VOLUME</Text>
                   <Text style={[styles.hsValue, { color: colors.textPrimary }]}>₹{stats.totalEarnings.toLocaleString()}</Text>
                </View>
                <View style={styles.heroStatItem}>
                   <Text style={[styles.hsLabel, { color: colors.textMuted }]}>PENDING</Text>
                   <Text style={[styles.hsValue, { color: colors.textPrimary }]}>₹{stats.pending.toLocaleString()}</Text>
                </View>
             </View>
          </ProfessionalCard>
        </Animated.View>

        {/* Chart Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>REVENUE PERFORMANCE</Text>
          <Animated.View entering={FadeInDown.delay(200)}>
            <ProfessionalCard style={styles.chartCard} hasVibrancy={true}>
              <LineChart
                data={{
                  labels: trend.labels,
                  datasets: [{ data: trend.data }]
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
        </View>

        {/* History Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>TRANSACTION LOGS</Text>
          {history.length > 0 ? (
            history.map((item, idx) => (
              <Animated.View 
                 key={idx} 
                 entering={FadeInRight.delay(idx * 50).duration(600)}
              >
                <ProfessionalCard style={styles.txCard} hasVibrancy={true}>
                  <View style={styles.txLeft}>
                    <View style={[styles.txIcon, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                       <Ionicons 
                          name={item.status === 'SUCCESS' ? 'checkmark-circle' : 'time'} 
                          size={20} 
                          color={item.status === 'SUCCESS' ? colors.success : colors.warning} 
                        />
                    </View>
                    <View>
                       <Text style={[styles.txTitle, { color: colors.textPrimary }]}>{item.method} Transfer</Text>
                       <Text style={[styles.txDate, { color: colors.textMuted }]}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    </View>
                  </View>
                  <View style={styles.txRight}>
                     <Text style={[styles.txAmount, { color: colors.textPrimary }]}>₹{item.amount}</Text>
                     <Text style={[styles.txStatus, { color: item.status === 'SUCCESS' ? colors.success : colors.warning }]}>{item.status}</Text>
                  </View>
                </ProfessionalCard>
              </Animated.View>
            ))
          ) : (
             <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No transactions yet</Text>
             </View>
          )}
        </View>
      </ScrollView>

      {/* Withdrawal Modal (High-Fidelity) */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={closeWithdrawModal}>
        <BlurView intensity={90} tint="dark" style={styles.modalOverlay}>
           <Animated.View entering={ZoomIn} style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                 <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Withdraw Funds</Text>
                 <TouchableOpacity onPress={closeWithdrawModal}>
                    <Ionicons name="close" size={24} color={colors.textPrimary} />
                 </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <ProfessionalInput 
                   label="Amount to Withdraw"
                   placeholder="0.00"
                   value={withdrawAmount}
                   onChangeText={setWithdrawAmount}
                   keyboardType="numeric"
                   icon="wallet-outline"
                />

                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Payout Method</Text>
                <View style={styles.methodTabs}>
                   {['UPI', 'BANK'].map((m: any) => (
                      <TouchableOpacity 
                         key={m}
                         style={[
                           styles.methodTab, 
                           { backgroundColor: payoutMethod === m ? colors.primary : colors.surface }
                         ]}
                         onPress={() => setPayoutMethod(m)}
                      >
                         <Text style={[styles.methodTabText, { color: payoutMethod === m ? '#FFF' : colors.textPrimary }]}>{m}</Text>
                      </TouchableOpacity>
                   ))}
                </View>

                {payoutMethod === 'UPI' ? (
                   <ProfessionalInput 
                      label="UPI Address"
                      placeholder="username@bank"
                      value={payoutDetails.upiId}
                      onChangeText={v => setPayoutDetails(p => ({ ...p, upiId: v }))}
                      icon="flash-outline"
                   />
                ) : (
                   <>
                      <ProfessionalInput 
                        label="Account Number"
                        value={payoutDetails.accNo}
                        onChangeText={v => setPayoutDetails(p => ({ ...p, accNo: v }))}
                        icon="card-outline"
                      />
                      <ProfessionalInput 
                        label="IFSC Code"
                        value={payoutDetails.ifsc}
                        onChangeText={v => setPayoutDetails(p => ({ ...p, ifsc: v.toUpperCase() }))}
                        icon="business-outline"
                      />
                   </>
                )}

                <ProfessionalButton 
                   label={submitting ? "Processing..." : "Confirm Request"} 
                   onPress={submitWithdrawal}
                   loading={submitting}
                   variant="primary"
                   style={{ marginTop: 20 }}
                />
              </ScrollView>
           </Animated.View>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 70,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 20
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleSection: { flex: 1 },
  headerLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  scrollContent: { padding: 24, paddingBottom: 100 },
  heroCard: { padding: 30, borderRadius: 36, alignItems: 'center' },
  heroLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
  heroValue: { fontSize: 48, fontWeight: '900', marginBottom: 30, letterSpacing: -2 },
  heroBtn: { width: '100%', height: 60, borderRadius: 18, marginBottom: 30 },
  heroStats: { flexDirection: 'row', width: '100%', gap: 20 },
  heroStatItem: { flex: 1, alignItems: 'center' },
  hsLabel: { fontSize: 9, fontWeight: '900', opacity: 0.6, marginBottom: 4 },
  hsValue: { fontSize: 18, fontWeight: '900' },
  section: { marginTop: 32 },
  sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 16, marginLeft: 4 },
  chartCard: { padding: 24, paddingLeft: 10, borderRadius: 32 },
  chart: { borderRadius: 16 },
  txCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: 24, marginBottom: 12 },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  txIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  txTitle: { fontSize: 15, fontWeight: '900' },
  txDate: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 17, fontWeight: '900' },
  txStatus: { fontSize: 10, fontWeight: '900', marginTop: 4 },
  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyText: { marginTop: 12, fontSize: 14, fontWeight: '700' },
  errorContent: { padding: 40, alignItems: 'center' },
  errorTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center', marginTop: 24 },
  retryBtn: { marginTop: 30, width: 200 },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 36, padding: 30, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  modalScroll: { flex: 1 },
  inputLabel: { fontSize: 13, fontWeight: '800', marginBottom: 12, textTransform: 'uppercase', opacity: 0.7, marginLeft: 4 },
  methodTabs: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  methodTab: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  methodTabText: { fontSize: 14, fontWeight: '900' },
});
