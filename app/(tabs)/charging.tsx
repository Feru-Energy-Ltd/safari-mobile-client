import { CustomAlert } from '@/components/CustomAlert';
import { useColorScheme } from '@/components/useColorScheme';
import { getAccessToken } from '@/services/auth.service';
import { cancelReservation, getActiveReservation, Reservation, startCharging, stopCharging } from '@/services/charger.service';
import {
  ChargerStatus,
  ChargingSession,
  connectStomp,
  isstompConnected,
  subscribeToChargingSession,
  subscribeToChargingStatus,
  subscribeToReservation,
  subscribeToWalletBalance,
} from '@/services/stomp.service';
import { getWalletBalance } from '@/services/wallet.service';
import { logger } from '@/utils/logger';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

// ──────────────────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────────────────

function formatHMS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function eatToDate(dateStr: string): Date {
  // Backend sends EAT (UTC+3) without timezone suffix
  return new Date(dateStr.replace(' ', 'T') + '+03:00');
}

// ──────────────────────────────────────────────────────────
//  Component
// ──────────────────────────────────────────────────────────

export default function ChargingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  // ── Data ──────────────────────────────────────────────
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Charging state ────────────────────────────────────
  const [localIsCharging, setLocalIsCharging] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // ── STOMP live data ───────────────────────────────────
  const [liveSession, setLiveSession] = useState<ChargingSession | null>(null);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const stompSubs = useRef<{ unsubscribe: () => void }[]>([]);

  // ── Timers ────────────────────────────────────────────
  const [reservationCountdown, setReservationCountdown] = useState<number>(0); // seconds remaining
  const [chargingElapsed, setChargingElapsed] = useState<number>(0);           // seconds elapsed
  const chargingStartRef = useRef<number>(0);

  // ── UI state ──────────────────────────────────────────
  const [alertVisible, setAlertVisible] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [completionVisible, setCompletionVisible] = useState(false);
  const [finalCost, setFinalCost] = useState(0);

  // ── Pulse animation for charging ring ─────────────────
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ──────────────────────────────────────────────────────
  //  Derived
  // ──────────────────────────────────────────────────────

  const isCharging = localIsCharging
    || reservation?.status?.toLowerCase() === 'charging'
    || liveStatus === 'Charging';

  // ──────────────────────────────────────────────────────
  //  Data fetching
  // ──────────────────────────────────────────────────────

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const [walletInfo] = await Promise.all([getWalletBalance()]);
      if (walletInfo) {
        setWalletBalance(walletInfo.accountBalance ?? null);
        if (walletInfo.accountNumber) {
          const res = await getActiveReservation(walletInfo.accountNumber);
          setReservation(res);
        }
      }
    } catch (err: any) {
      logger.error('ChargingScreen: fetchData error', { err: err.message });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ──────────────────────────────────────────────────────
  //  STOMP — connect (if needed) then subscribe
  // ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!reservation) return;
    let cancelled = false;

    const setupStomp = async () => {
      try {
        if (!isstompConnected()) {
          const token = await getAccessToken();
          if (!token || cancelled) return;
          logger.info('ChargingScreen: STOMP not connected — connecting now...');
          await connectStomp(token);
        }

        if (cancelled) return;

        logger.info('ChargingScreen: subscribing to STOMP channels', {
          chargerId: reservation.chargeBoxId,
          connectorId: reservation.connectorId,
          transactionId: reservation.transactionId
        });

        const sub1 = subscribeToChargingSession(
          reservation.chargeBoxId,
          reservation.connectorId,
          (session: ChargingSession) => {
            console.log('[STOMP] Received ChargingSession message:', session);
            setLiveSession(session);
            if (session.status === 'Charging') setLocalIsCharging(true);
            if (session.status === 'Finishing' || session.status === 'Available') {
              setFinalCost(session.cost ?? reservation.chargingAmount ?? 0);
              setLocalIsCharging(false);
              setCompletionVisible(true);
              fetchData(false);
            }
          }
        );

        const sub2 = subscribeToChargingStatus(
          reservation.chargeBoxId,
          reservation.connectorId,
          (status: ChargerStatus) => {
            setLiveStatus(status.status);
            if (status.status === 'Finishing' || status.status === 'Available') {
              setLocalIsCharging(false);
              Toast.show({ type: 'info', text1: '⚡ Charging Complete', text2: 'Your EV session has ended.' });
              fetchData(false);
            }
          }
        );

        const sub3 = subscribeToWalletBalance((notif) => {
          Toast.show({ type: 'info', text1: '💳 Wallet Updated', text2: notif.message });
          fetchData(false);
        });

        const sub4 = subscribeToReservation((notif) => {
          Toast.show({ type: 'info', text1: '📋 Reservation Update', text2: notif.message });
          fetchData(false);
        });

        stompSubs.current = [sub1, sub2, sub3, sub4].filter(Boolean) as { unsubscribe: () => void }[];
      } catch (err: any) {
        logger.error('ChargingScreen: STOMP setup failed', { err: err.message });
      }
    };

    setupStomp();

    return () => {
      cancelled = true;
      stompSubs.current.forEach(s => s.unsubscribe());
      stompSubs.current = [];
    };
  }, [reservation?.id]);

  // ──────────────────────────────────────────────────────
  //  timers
  // ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!reservation?.expiryDateTime || isCharging) return;

    const tick = () => {
      const expiry = eatToDate(reservation.expiryDateTime).getTime();
      const diff = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setReservationCountdown(diff);
      if (diff === 0) fetchData(false);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [reservation?.expiryDateTime, isCharging]);

  useEffect(() => {
    if (!isCharging) return;

    const tick = () => {
      let startTs = 0;
      if (reservation?.startTime) {
        startTs = eatToDate(reservation.startTime).getTime();
      } else if (chargingStartRef.current) {
        startTs = chargingStartRef.current;
      } else {
        startTs = Date.now();
        chargingStartRef.current = startTs;
      }
      setChargingElapsed(Math.max(0, Math.floor((Date.now() - startTs) / 1000)));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isCharging, reservation?.startTime]);

  // ──────────────────────────────────────────────────────
  //  Pulse animation while charging
  // ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!isCharging) {
      pulseAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isCharging]);

  // ──────────────────────────────────────────────────────
  //  Handlers
  // ──────────────────────────────────────────────────────

  const handleStartCharging = async () => {
    if (!reservation) return;
    setIsStarting(true);
    try {
      const res = await startCharging(reservation.id);
      if (res.status) {
        Toast.show({ type: 'success', text1: '⚡ Charging Started!', text2: res.message });
        setLocalIsCharging(true);
        chargingStartRef.current = Date.now();
        setChargingElapsed(0);
        fetchData(false);
      } else {
        Toast.show({ type: 'error', text1: 'Failed to start', text2: res.message });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Could not start charging.' });
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopCharging = async () => {
    if (!reservation) return;
    setIsStopping(true);
    try {
      const res = await stopCharging(reservation.id);
      if (res.status) {
        Toast.show({ type: 'success', text1: 'Stopping…', text2: res.message });
        setFinalCost(liveSession?.cost ?? reservation.chargingAmount ?? reservation.reservationAmount ?? 0);
        setLocalIsCharging(false);
        chargingStartRef.current = 0;
        setCompletionVisible(true);
        fetchData(false);
      } else {
        Toast.show({ type: 'error', text1: 'Failed to stop', text2: res.message });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Could not stop charging.' });
    } finally {
      setIsStopping(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!reservation) return;
    setAlertVisible(false);
    setIsCancelling(true);
    try {
      const res = await cancelReservation(reservation.chargeBoxId, reservation.connectorId);
      if (res.status) {
        Toast.show({ type: 'success', text1: 'Reservation Cancelled', text2: res.message });
        setReservation(null);
      } else {
        Toast.show({ type: 'error', text1: 'Failed', text2: res.message });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Could not cancel.' });
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading && !isRefreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-[#1C1F26]">
        <ActivityIndicator size="large" color="#01B764" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-[#1C1F26]">
      {/* Header */}
      <View
        className="px-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex-row items-center justify-between"
        style={{ paddingTop: insets.top + 10 }}
      >
        <View>
          <Text className="text-2xl font-black text-gray-900 dark:text-white">
            Charging
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 font-medium text-xs">
            {isCharging ? 'Live session in progress' : 'Manage your active sessions'}
          </Text>
        </View>
        {isCharging && (
          <View className="bg-[#01B764]/10 px-3 py-1.5 rounded-full flex-row items-center border border-[#01B764]/20">
            <View className="w-2 h-2 rounded-full bg-[#01B764] mr-2" />
            <Text className="text-[#01B764] font-black text-[10px] uppercase tracking-tighter">Live</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchData(false); }} tintColor="#01B764" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Empty State ─────────────────────────────── */}
        {!reservation && !completionVisible && (
          <View className="flex-1 items-center justify-center py-24 px-10">
            <View className="w-32 h-32 rounded-[40px] bg-gray-50 dark:bg-[#252932] items-center justify-center mb-8 shadow-sm">
              <View className="w-20 h-20 rounded-[30px] bg-[#01B764]/10 items-center justify-center">
                <MaterialCommunityIcons name="ev-station" size={44} color="#01B764" />
              </View>
            </View>
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-3 text-center">No Active Sessions</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center leading-relaxed mb-10">
              When you book a charger, it will appear here for you to start and monitor your session.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)')}
              className="bg-[#01B764] w-full max-w-xs h-14 rounded-full items-center justify-center shadow-lg shadow-[#01B764]/30"
            >
              <Text className="text-white font-bold text-base">Find a Charger</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Active Reservation Card (pre-charging) ─── */}
        {reservation && !isCharging && (
          <View className="px-6 mt-6">
            {/* Main Info Card */}
            <View className="bg-white dark:bg-[#252932] rounded-[32px] p-6 mb-4 shadow-sm border border-gray-100 dark:border-gray-800">
              <View className="flex-row items-center mb-6">
                <View className="w-14 h-14 rounded-2xl bg-[#01B764]/10 items-center justify-center mr-4">
                  <MaterialCommunityIcons name="ev-station" size={32} color="#01B764" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                    {reservation.chargeBoxId}
                  </Text>
                  <Text className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Connector {reservation.connectorId} • {reservation.connectorType?.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>

              {/* Stats Grid */}
              <View className="flex-row gap-x-3">
                <View className="flex-1 bg-gray-50 dark:bg-[#1C1F26] rounded-2xl p-4">
                  <View className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 items-center justify-center mb-2">
                    <MaterialCommunityIcons name="battery-medium" size={18} color="#3B82F6" />
                  </View>
                  <Text className="text-base font-black text-gray-900 dark:text-white">{reservation.batteryLevel}%</Text>
                  <Text className="text-[10px] text-gray-400 uppercase font-black mt-0.5">Initial</Text>
                </View>
                <View className="flex-1 bg-gray-50 dark:bg-[#1C1F26] rounded-2xl p-4">
                  <View className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 items-center justify-center mb-2">
                    <MaterialCommunityIcons name="battery-high" size={18} color="#A855F7" />
                  </View>
                  <Text className="text-base font-black text-gray-900 dark:text-white">{reservation.batteryCapacity}</Text>
                  <Text className="text-[10px] text-gray-400 uppercase font-black mt-0.5">kWh Max</Text>
                </View>
                <View className="flex-1 bg-gray-50 dark:bg-[#1C1F26] rounded-2xl p-4">
                  <View className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 items-center justify-center mb-2">
                    <MaterialCommunityIcons name="cash" size={18} color="#F59E0B" />
                  </View>
                  <Text className="text-base font-black text-gray-900 dark:text-white">
                    {reservation.reservationAmount?.toLocaleString()}
                  </Text>
                  <Text className="text-[10px] text-gray-400 uppercase font-black mt-0.5">Hold</Text>
                </View>
              </View>
            </View>

            {/* Quick Info Bar */}
            <View className="flex-row gap-3 mb-8">
              <View className="flex-1 bg-white dark:bg-[#252932] rounded-2xl p-4 flex-row items-center border border-gray-100 dark:border-gray-800">
                <Ionicons name="time" size={20} color="#F59E0B" className="mr-3" />
                <View>
                  <Text className="text-sm font-black text-gray-900 dark:text-white">{formatHMS(reservationCountdown)}</Text>
                  <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Expires in</Text>
                </View>
              </View>
              <View className="flex-1 bg-white dark:bg-[#252932] rounded-2xl p-4 flex-row items-center border border-gray-100 dark:border-gray-800">
                <Ionicons name="wallet" size={20} color="#01B764" className="mr-3" />
                <View>
                  <Text className="text-sm font-black text-gray-900 dark:text-white" numberOfLines={1}>
                    {walletBalance != null ? `${walletBalance.toLocaleString()} RWF` : '—'}
                  </Text>
                  <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Wallet</Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <TouchableOpacity
              onPress={handleStartCharging}
              disabled={isStarting || isCancelling}
              className="w-full h-16 bg-[#01B764] rounded-3xl items-center justify-center flex-row shadow-lg shadow-[#01B764]/25"
              style={{ opacity: (isStarting || isCancelling) ? 0.7 : 1 }}
            >
              <Ionicons name="flash" size={22} color="#fff" style={{ marginRight: 10 }} />
              <Text className="text-white font-bold text-lg">Start Charging</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setAlertVisible(true)}
              disabled={isCancelling || isStarting}
              className="w-full py-6 items-center"
            >
              <Text className="text-red-500 font-bold text-sm uppercase tracking-widest">Cancel Reservation</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Live Charging View ─────────────────────── */}
        {reservation && isCharging && (
          <View className="mt-8 px-6 items-center">
            {/* Visual Dashboard Ring */}
            <View className="items-center justify-center mb-10">
              <Animated.View
                style={{ transform: [{ scale: pulseAnim }] }}
                className="w-64 h-64 rounded-full items-center justify-center"
              >
                <View
                  className="w-full h-full rounded-full items-center justify-center"
                  style={{
                    backgroundColor: isDark ? '#252932' : '#fff',
                    borderWidth: 12,
                    borderColor: '#01B764',
                    shadowColor: '#01B764',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.3,
                    shadowRadius: 20,
                    elevation: 15
                  }}
                >
                  <View className="items-center">
                    <Ionicons name="flash" size={32} color="#F59E0B" className="mb-2" />
                    <View className="flex-row items-end">
                      <Text className="text-6xl font-black text-gray-900 dark:text-white leading-[60px]">
                        {liveSession?.stateOfCharge != null
                          ? liveSession.stateOfCharge.toFixed(0)
                          : (reservation.batteryLevel ?? 0)}
                      </Text>
                      <Text className="text-2xl font-bold text-gray-400 dark:text-gray-500 mb-2 ml-1">%</Text>
                    </View>
                    <Text className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">SoC Level</Text>
                  </View>

                  {/* Smaller info bubbles around the ring could go here */}
                </View>
              </Animated.View>
            </View>

            {/* Metrics List */}
            <View className="w-full bg-white dark:bg-[#252932] rounded-[32px] p-4 flex-row flex-wrap border border-gray-100 dark:border-gray-800 shadow-sm mb-10">
              <View className="w-1/2 p-3 border-r border-b border-gray-50 dark:border-gray-800">
                <Text className="text-[10px] text-gray-400 font-black uppercase mb-1">Time Elapsed</Text>
                <Text className="text-lg font-black text-gray-900 dark:text-white">{formatHMS(chargingElapsed)}</Text>
              </View>
              <View className="w-1/2 p-3 border-b border-gray-50 dark:border-gray-800">
                <Text className="text-[10px] text-gray-400 font-black uppercase mb-1">Energy (kWh)</Text>
                <Text className="text-lg font-black text-gray-900 dark:text-white">
                  {liveSession?.energy != null ? liveSession.energy.toFixed(1) : '0.0'}
                </Text>
              </View>
              <View className="w-1/2 p-3 border-r border-gray-50 dark:border-gray-800">
                <Text className="text-[10px] text-gray-400 font-black uppercase mb-1">Time to Full</Text>
                <Text className="text-lg font-black text-gray-900 dark:text-white">
                  {liveSession?.timeToFullCharge != null ? `${liveSession.timeToFullCharge.toFixed(0)}m` : '—'}
                </Text>
              </View>
              <View className="w-1/2 p-3">
                <Text className="text-[10px] text-gray-400 font-black uppercase mb-1">Session Cost</Text>
                <Text className="text-lg font-black text-[#01B764]">
                  {liveSession?.cost != null
                    ? `${liveSession.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    : `${(reservation.chargingAmount ?? 0).toLocaleString()}`}
                  <Text className="text-[10px] font-bold"> RWF</Text>
                </Text>
              </View>
            </View>

            {/* Stop Action */}
            <TouchableOpacity
              onPress={handleStopCharging}
              disabled={isStopping}
              className="w-full h-16 bg-[#F75555] rounded-3xl items-center justify-center flex-row shadow-lg shadow-red-500/20"
              style={{ opacity: isStopping ? 0.7 : 1 }}
            >
              {isStopping ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="stop-circle" size={22} color="#fff" style={{ marginRight: 10 }} />
                  <Text className="text-white font-bold text-lg">Stop Charging</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Confirmation & Completion Overlays remain mostly same but standardized fonts */}
      <CustomAlert
        visible={alertVisible}
        type="confirm"
        title="Cancel Reservation?"
        message="This will release your reserved connector. Any held balance will be returned to your wallet."
        confirmText="Yes, Cancel"
        cancelText="Keep It"
        onClose={() => setAlertVisible(false)}
        onConfirm={handleCancelReservation}
      />

      <Modal visible={completionVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-white dark:bg-[#1C1F26] w-full rounded-[40px] p-8 items-center shadow-2xl">
            <View className="w-20 h-20 bg-[#01B764] rounded-full items-center justify-center mb-6">
              <Ionicons name="checkmark-circle" size={48} color="#fff" />
            </View>
            <Text className="text-2xl font-black text-gray-900 dark:text-white mb-2 text-center">Session Complete</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center mb-8">
              Your vehicle has been charged. Summary of your session:
            </Text>

            <View className="w-full bg-gray-50 dark:bg-[#252932] rounded-3xl p-6 mb-8">
              <View className="flex-row justify-between mb-4">
                <Text className="text-gray-500 font-bold">Energy</Text>
                <Text className="text-gray-900 dark:text-white font-black">{liveSession?.energy?.toFixed(1) || 0} kWh</Text>
              </View>
              <View className="flex-row justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                <Text className="text-gray-500 font-bold">Total Cost</Text>
                <Text className="text-[#01B764] font-black text-xl">{finalCost.toLocaleString()} RWF</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => { setCompletionVisible(false); setReservation(null); }}
              className="bg-[#01B764] w-full h-14 rounded-full items-center justify-center shadow-md shadow-[#01B764]/20"
            >
              <Text className="text-white font-bold text-base">OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
