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
import { SafeAreaView } from 'react-native-safe-area-context';
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
        // Connect if not already connected (singleton — safe to call even if connected)
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
        });

        const sub1 = subscribeToChargingSession(
          reservation.chargeBoxId,
          reservation.connectorId,
          (session: ChargingSession) => {
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
        logger.info('ChargingScreen: STOMP subscriptions active ✓', { count: stompSubs.current.length });
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
  //  Timers
  // ──────────────────────────────────────────────────────

  // Reservation countdown
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

  // Charging elapsed timer
  useEffect(() => {
    if (!isCharging) return;

    if (!chargingStartRef.current) chargingStartRef.current = Date.now();
    const id = setInterval(() => {
      setChargingElapsed(Math.floor((Date.now() - chargingStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [isCharging]);

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
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
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

  // ──────────────────────────────────────────────────────
  //  Loading
  // ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-[#0F1117]">
        <ActivityIndicator size="large" color="#01B764" />
      </View>
    );
  }

  // ──────────────────────────────────────────────────────
  //  Render
  // ──────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-[#F4F6FB] dark:bg-[#0F1117]">
      {/* Header */}
      <View className="px-6 pt-4 pb-3 flex-row items-center justify-between">
        <Text className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          {isCharging ? 'Charging' : 'Active Session'}
        </Text>
        {reservation && (
          <View
            className={`px-3 py-1 rounded-full ${isCharging ? 'bg-[#01B764]/15' : 'bg-amber-100 dark:bg-amber-900/30'}`}
          >
            <Text className={`text-xs font-bold ${isCharging ? 'text-[#01B764]' : 'text-amber-600 dark:text-amber-400'}`}>
              {isCharging ? '● LIVE' : reservation.status?.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchData(false); }} tintColor="#01B764" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Empty State ─────────────────────────────── */}
        {!reservation && !completionVisible && (
          <View className="flex-1 items-center justify-center py-24">
            <View className="w-28 h-28 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-8">
              <MaterialCommunityIcons name="ev-station" size={52} color={isDark ? '#4B5563' : '#9CA3AF'} />
            </View>
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Active Booking</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center leading-relaxed mb-10 px-8">
              You don't have an active reservation.{'\n'}Find a charger on the map to book one.
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
          <View className="mt-2">
            {/* Station card */}
            <View className="bg-white dark:bg-[#1A1D27] rounded-3xl p-5 mb-4 shadow-sm border border-gray-100 dark:border-gray-800">
              <View className="flex-row items-center mb-4">
                <View className="w-12 h-12 rounded-2xl bg-[#01B764]/10 items-center justify-center mr-3">
                  <MaterialCommunityIcons name="ev-station" size={26} color="#01B764" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>{reservation.chargeBoxId}</Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{reservation.connectorType?.replace(/_/g, ' ')}</Text>
                </View>
                <View className="px-3 py-1 bg-[#01B764]/10 rounded-full">
                  <Text className="text-xs font-bold text-[#01B764]">Connector {reservation.connectorId}</Text>
                </View>
              </View>

              {/* Stats row */}
              <View className="flex-row gap-3">
                <View className="flex-1 bg-[#F4F6FB] dark:bg-[#0F1117] rounded-2xl p-4 items-center">
                  <MaterialCommunityIcons name="battery-medium" size={22} color="#6B7280" />
                  <Text className="text-lg font-black text-gray-900 dark:text-white mt-1">{reservation.batteryLevel}%</Text>
                  <Text className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Battery Now</Text>
                </View>
                <View className="flex-1 bg-[#F4F6FB] dark:bg-[#0F1117] rounded-2xl p-4 items-center">
                  <MaterialCommunityIcons name="battery-high" size={22} color="#6B7280" />
                  <Text className="text-lg font-black text-gray-900 dark:text-white mt-1">{reservation.batteryCapacity} kWh</Text>
                  <Text className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Capacity</Text>
                </View>
                <View className="flex-1 bg-[#F4F6FB] dark:bg-[#0F1117] rounded-2xl p-4 items-center">
                  <MaterialCommunityIcons name="cash" size={22} color="#6B7280" />
                  <Text className="text-[15px] font-black text-gray-900 dark:text-white mt-1" numberOfLines={1}>
                    {reservation.reservationAmount?.toLocaleString()}
                  </Text>
                  <Text className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">RWF Hold</Text>
                </View>
              </View>
            </View>

            {/* Countdown + wallet */}
            <View className="flex-row gap-3 mb-6">
              <View className="flex-1 bg-white dark:bg-[#1A1D27] rounded-2xl p-4 flex-row items-center border border-gray-100 dark:border-gray-800">
                <View className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/20 items-center justify-center mr-3">
                  <Ionicons name="time-outline" size={18} color="#D97706" />
                </View>
                <View>
                  <Text className="text-base font-black text-gray-900 dark:text-white">{formatHMS(reservationCountdown)}</Text>
                  <Text className="text-[11px] text-gray-400 dark:text-gray-500">Expires in</Text>
                </View>
              </View>
              <View className="flex-1 bg-white dark:bg-[#1A1D27] rounded-2xl p-4 flex-row items-center border border-gray-100 dark:border-gray-800">
                <View className="w-9 h-9 rounded-xl bg-[#01B764]/10 items-center justify-center mr-3">
                  <Ionicons name="wallet-outline" size={18} color="#01B764" />
                </View>
                <View>
                  <Text className="text-base font-black text-gray-900 dark:text-white">
                    {walletBalance != null ? `${walletBalance.toLocaleString()} RWF` : '—'}
                  </Text>
                  <Text className="text-[11px] text-gray-400 dark:text-gray-500">Wallet Balance</Text>
                </View>
              </View>
            </View>

            {/* CTA */}
            <TouchableOpacity
              onPress={handleStartCharging}
              disabled={isStarting || isCancelling}
              className="w-full h-14 bg-[#01B764] rounded-full items-center justify-center flex-row shadow-lg shadow-[#01B764]/25 mb-3"
              style={{ opacity: (isStarting || isCancelling) ? 0.7 : 1 }}
            >
              {isStarting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="flash" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text className="text-white font-bold text-base">Start Charging</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setAlertVisible(true)}
              disabled={isCancelling || isStarting}
              className="w-full py-3 items-center"
              style={{ opacity: (isCancelling || isStarting) ? 0.5 : 1 }}
            >
              {isCancelling
                ? <ActivityIndicator color="#EF4444" size="small" />
                : <Text className="text-[#EF4444] font-semibold text-sm">Cancel Reservation</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* ── Live Charging View ─────────────────────── */}
        {reservation && isCharging && (
          <View className="mt-2 items-center">
            {/* Big circle */}
            <Animated.View
              style={{ transform: [{ scale: pulseAnim }] }}
              className="mb-8"
            >
              {/* Outer glow ring */}
              <View
                className="w-64 h-64 rounded-full items-center justify-center"
                style={{
                  shadowColor: '#01B764',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.5,
                  shadowRadius: 30,
                  elevation: 20,
                  backgroundColor: isDark ? '#0F1117' : '#fff',
                  borderWidth: 8,
                  borderColor: '#01B764',
                }}
              >
                {/* Inner white circle for layered look */}
                <View
                  className="absolute inset-3 rounded-full"
                  style={{ backgroundColor: isDark ? '#0F1117' : '#fff', opacity: 0.6 }}
                />
                {/* Content */}
                <View className="items-center z-10">
                  <Ionicons name="flash" size={36} color="#F59E0B" style={{ marginBottom: 4 }} />
                  <View className="flex-row items-end">
                    <Text className="text-6xl font-black text-gray-900 dark:text-white">
                      {liveSession?.energy != null
                        ? liveSession.energy.toFixed(1)
                        : (reservation.batteryCapacity ?? 0)}
                    </Text>
                    <Text className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-2 ml-1">kWh</Text>
                  </View>
                  <Text className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Energy</Text>
                </View>
              </View>
            </Animated.View>

            {/* Stats card */}
            <View className="w-full bg-white dark:bg-[#1A1D27] rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 mb-8 shadow-sm">
              {/* Row 1 */}
              <View className="flex-row border-b border-gray-100 dark:border-gray-700">
                <View className="flex-1 py-5 items-center border-r border-gray-100 dark:border-gray-700">
                  <Text className="text-xl font-black text-gray-900 dark:text-white">{formatHMS(chargingElapsed)}</Text>
                  <Text className="text-[12px] text-gray-400 dark:text-gray-500 mt-1">Charging Time</Text>
                </View>
                <View className="flex-1 py-5 items-center">
                  <Text className="text-xl font-black text-gray-900 dark:text-white">
                    {liveSession?.stateOfCharge != null
                      ? `${liveSession.stateOfCharge.toFixed(0)}%`
                      : `${reservation.batteryLevel}%`}
                  </Text>
                  <Text className="text-[12px] text-gray-400 dark:text-gray-500 mt-1">Battery</Text>
                </View>
              </View>
              {/* Row 2 */}
              <View className="flex-row">
                <View className="flex-1 py-5 items-center border-r border-gray-100 dark:border-gray-700">
                  <Text className="text-xl font-black text-gray-900 dark:text-white">
                    {liveSession?.timeToFullCharge != null
                      ? `${liveSession.timeToFullCharge.toFixed(0)} min`
                      : '—'}
                  </Text>
                  <Text className="text-[12px] text-gray-400 dark:text-gray-500 mt-1">Time to Full</Text>
                </View>
                <View className="flex-1 py-5 items-center">
                  <Text className="text-xl font-black text-[#01B764]">
                    {liveSession?.cost != null
                      ? `${liveSession.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RWF`
                      : `${(reservation.chargingAmount ?? 0).toLocaleString()} RWF`}
                  </Text>
                  <Text className="text-[12px] text-gray-400 dark:text-gray-500 mt-1">Total Cost</Text>
                </View>
              </View>
            </View>

            {/* OCPP status badge */}
            {liveStatus && (
              <View className="mb-6 px-4 py-2 bg-[#01B764]/10 rounded-full">
                <Text className="text-sm font-semibold text-[#01B764]">
                  EVSE: {liveStatus}
                </Text>
              </View>
            )}

            {/* Stop button */}
            <TouchableOpacity
              onPress={handleStopCharging}
              disabled={isStopping}
              className="w-full h-14 bg-[#01B764] rounded-full items-center justify-center shadow-lg shadow-[#01B764]/25"
              style={{ opacity: isStopping ? 0.7 : 1 }}
            >
              {isStopping ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-base">Stop Charging</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── Cancel Confirmation Alert ────────────────── */}
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

      {/* ── Completion Modal ─────────────────────────── */}
      <Modal visible={completionVisible} transparent animationType="fade" onRequestClose={() => setCompletionVisible(false)}>
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-white dark:bg-[#1A1D27] w-full rounded-[32px] p-8 items-center shadow-2xl overflow-hidden">
            {/* Decorative dots */}
            <View className="absolute top-8 left-8 w-2.5 h-2.5 rounded-full bg-[#01B764]/30" />
            <View className="absolute top-16 right-10 w-4 h-4 rounded-full bg-[#01B764]/15" />
            <View className="absolute bottom-28 left-10 w-2 h-2 rounded-full bg-[#01B764]/50" />
            <View className="absolute bottom-20 right-8 w-3 h-3 rounded-full bg-[#01B764]/20" />

            <View className="w-24 h-24 bg-[#01B764] rounded-full items-center justify-center mt-2 mb-7 shadow-xl shadow-[#01B764]/30">
              <Ionicons name="battery-charging" size={44} color="#fff" />
            </View>

            <Text className="text-2xl font-black text-[#01B764] text-center">Charging 100%</Text>
            <Text className="text-2xl font-black text-[#01B764] text-center mb-5">Complete!</Text>

            <Text className="text-gray-600 dark:text-gray-400 text-center text-sm leading-relaxed mb-8">
              A total of{' '}
              <Text className="font-bold text-gray-800 dark:text-white">
                {finalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })} RWF
              </Text>
              {' '}has been charged from your e-wallet.
            </Text>

            <TouchableOpacity
              onPress={() => { setCompletionVisible(false); setReservation(null); }}
              className="bg-[#01B764] w-full h-14 rounded-full items-center justify-center shadow-md shadow-[#01B764]/20"
            >
              <Text className="text-white font-bold text-base">OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
