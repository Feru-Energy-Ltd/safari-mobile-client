import { useColorScheme } from '@/components/useColorScheme';
import { getProfile, UserProfile } from '@/services/auth.service';
import { cancelReservation, getActiveReservation, Reservation } from '@/services/charger.service';
import { router } from 'expo-router';
import { Battery, Clock, Fuel, RefreshCcw, XCircle } from 'lucide-react-native';
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

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const userProfile = await getProfile();
      setProfile(userProfile);

      if (userProfile && userProfile.phone) {
        const reservation = await getActiveReservation(userProfile.phone);
        setActiveReservation(reservation);
      }
    } catch (error) {
      // console.error('Failed to fetch charging data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData(false);
  };

  const handleCancel = async () => {
    if (!activeReservation) return;

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
          <View>
            <View className="bg-white dark:bg-[#2A2D35] rounded-[40px] p-8 border border-gray-100 dark:border-gray-800 shadow-sm mb-6">
              <View className="flex-row items-center justify-between mb-8">
                <View className="bg-[#01B764]/10 px-4 py-2 rounded-full">
                  <Text className="text-[#01B764] font-bold text-xs uppercase">{activeReservation.status}</Text>
                </View>
                <TouchableOpacity onPress={onRefresh}>
                  <RefreshCcw size={20} color="#01B764" />
                </TouchableOpacity>
              </View>

              <View className="items-center mb-8">
                <View className="w-40 h-40 rounded-full border-[10px] border-[#01B764] items-center justify-center">
                  <Text className="text-4xl font-bold text-gray-900 dark:text-white">{activeReservation.batteryLevel}%</Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-xs font-medium mt-1">BATTERY LEVEL</Text>
                </View>
              </View>

              <View className="space-y-6">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl items-center justify-center mr-4">
                    <Fuel size={24} color="#01B764" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase mb-0.5">Charger ID</Text>
                    <Text className="text-lg font-bold text-gray-900 dark:text-white">{activeReservation.chargeBoxId}</Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl items-center justify-center mr-4">
                    <Clock size={24} color="#01B764" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase mb-0.5">Expires At</Text>
                    <Text className="text-lg font-bold text-gray-900 dark:text-white">
                      {new Date(activeReservation.expiryDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl items-center justify-center mr-4">
                    <Battery size={24} color="#01B764" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase mb-0.5">Amount Charged</Text>
                    <Text className="text-lg font-bold text-gray-900 dark:text-white">RWF {activeReservation.reservationAmount}</Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleCancel}
              disabled={isCancelling}
              className="flex-row items-center justify-center h-16 bg-[#F75555]/10 rounded-2xl border border-[#F75555]/20"
            >
              {isCancelling ? (
                <ActivityIndicator color="#F75555" />
              ) : (
                <>
                  <XCircle size={20} color="#F75555" />
                  <Text className="text-[#F75555] font-bold text-lg ml-2">Cancel Reservation</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
