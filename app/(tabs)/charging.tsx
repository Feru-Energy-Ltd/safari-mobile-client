import { CustomAlert } from '@/components/CustomAlert';
import { useColorScheme } from '@/components/useColorScheme';
import { getProfile, UserProfile } from '@/services/auth.service';
import { cancelReservation, getActiveReservation, Reservation } from '@/services/charger.service';
import { getWalletBalance } from '@/services/wallet.service';
import { logger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Fuel } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function ChargingScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [isAlertVisible, setIsAlertVisible] = useState(false);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const [userProfile, walletInfo] = await Promise.all([
        getProfile(),
        getWalletBalance()
      ]);
      setProfile(userProfile);

      logger.info('ChargingScreen: Profile and Wallet fetched', {
        hasProfile: !!userProfile,
        accountNumber: walletInfo?.accountNumber
      });

      if (walletInfo && walletInfo.accountNumber) {
        const reservation = await getActiveReservation(walletInfo.accountNumber);
        logger.info('ChargingScreen: Active reservation fetch result', { hasReservation: !!reservation });
        setActiveReservation(reservation);
      } else {
        logger.warn('ChargingScreen: No wallet accountNumber found', { walletInfo });
      }
    } catch (error: any) {
      logger.error('ChargingScreen: fetchData failed', { error: error.message });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!activeReservation?.expiryDateTime) return;

    const interval = setInterval(() => {
      // The backend returns times in UTC+3 (East Africa Time) without a timezone suffix.
      // We append '+03:00' to correctly calculate the countdown against the local device time (UTC+2 usually).
      const expiryStr = activeReservation.expiryDateTime.replace(' ', 'T') + '+03:00';
      const expiry = new Date(expiryStr).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, expiry - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setElapsedTime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );

      if (diff === 0) {
        clearInterval(interval);
        fetchData(false); // Refresh to see if it's gone or updated
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeReservation?.expiryDateTime]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData(false);
  };

  const handleCancelClick = () => {
    setIsAlertVisible(true);
  };

  const handleCancel = async () => {
    if (!activeReservation) return;
    setIsAlertVisible(false);
    setIsCancelling(true);
    try {
      const res = await cancelReservation(activeReservation.chargeBoxId, activeReservation.connectorId);
      if (res.status) {
        Toast.show({
          type: 'success',
          text1: 'Reservation Cancelled',
          text2: res.message
        });
        setActiveReservation(null);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Cancellation Failed',
          text2: res.message
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to cancel reservation.'
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-[#1C1F26]">
        <ActivityIndicator size="large" color="#01B764" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-[#1C1F26]">
      <View className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1C1F26]">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">Active Session</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#01B764" />
        }
      >
        {!activeReservation ? (
          <View className="flex-1 items-center justify-center py-20">
            <View className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center mb-6">
              <Fuel size={40} color={isDarkMode ? '#858E92' : '#9E9E9E'} />
            </View>
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Active Booking</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center mb-8 px-10">
              You don't have any active reservations. Select a charger on the map to book one.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)')}
              className="bg-[#01B764] px-8 py-4 rounded-2xl shadow-lg"
            >
              <Text className="text-white font-bold">Go to Map</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1">
            <View className="items-center mb-10 pt-4">
              {/* Premium Circle Battery Indicator */}
              <View className="w-64 h-64 rounded-full border-[6px] border-[#01B764] items-center justify-center bg-white dark:bg-[#1C1F26] shadow-2xl shadow-[#01B764]/20 relative">
                {/* Lightning Icon */}
                <View className="mb-2">
                  <Ionicons name="flash" size={32} color="#FACC15" />
                </View>

                {/* Energy Large text */}
                <View className="flex-row items-baseline">
                  <Text className="text-6xl font-black text-gray-900 dark:text-white">{activeReservation.batteryLevel}</Text>
                  <Text className="text-2xl font-bold text-gray-500 dark:text-gray-400 ml-1">%</Text>
                </View>

                <Text className="text-gray-400 dark:text-gray-500 font-bold tracking-widest text-sm mt-1 uppercase">Battery</Text>

                {/* Glow effect */}
                <View className="absolute inset-0 rounded-full border-[1px] border-[#01B764]/30 scale-110 opacity-50" />
              </View>
            </View>

            {/* Information Grid Container */}
            <View className="bg-white dark:bg-[#2A2D35] rounded-[32px] p-1 border border-gray-100 dark:border-gray-800 shadow-sm mb-10">
              {/* Grid 2x2 */}
              <View className="flex-row border-b border-gray-100 dark:border-gray-800">
                {/* Item 1: Charging Time */}
                <View className="flex-1 p-6 items-center border-r border-gray-100 dark:border-gray-800">
                  <Text className="text-lg font-black text-gray-900 dark:text-white mb-1">{elapsedTime}</Text>
                  <Text className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase">Reservation Time</Text>
                </View>

                {/* Item 2: Battery */}
                <View className="flex-1 p-6 items-center">
                  <Text className="text-lg font-black text-gray-900 dark:text-white mb-1">{activeReservation.batteryCapacity} kWh</Text>
                  <Text className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase">Battery Capacity</Text>
                </View>
              </View>

              <View className="flex-row">
                {/* Item 3: Station (ChargeBox + Connector) */}
                <View className="flex-1 p-6 items-center border-r border-gray-100 dark:border-gray-800">
                  <Text className="text-sm font-black text-gray-900 dark:text-white mb-1 text-center" numberOfLines={1}>
                    {activeReservation.chargeBoxId}
                  </Text>
                  <Text className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase text-center">
                    {activeReservation.connectorType}
                  </Text>
                </View>

                {/* Item 4: Total Fees */}
                <View className="flex-1 p-6 items-center">
                  <Text className="text-lg font-black text-[#01B764] mb-1">RWF {activeReservation.reservationAmount?.toLocaleString()}</Text>
                  <Text className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase">Total Fees</Text>
                </View>
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              onPress={handleCancelClick}
              disabled={isCancelling}
              className="h-16 bg-[#F75555] rounded-3xl items-center justify-center flex-row shadow-lg shadow-[#F75555]/30 mb-8"
            >
              {isCancelling ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={24} color="white" />
                  <Text className="text-white font-black text-lg ml-2">Cancel Reservation</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Custom confirmation alert */}
            <CustomAlert
              visible={isAlertVisible}
              type="confirm"
              title="Cancel Reservation?"
              message="Are you sure you want to cancel your current reservation?"
              confirmText="Confirm"
              cancelText="Cancel"
              onClose={() => setIsAlertVisible(false)}
              onConfirm={handleCancel}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
