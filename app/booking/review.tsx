import { useColorScheme } from '@/components/useColorScheme';
import { createReservation } from '@/services/charger.service';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, Fuel, Info, MapPin } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function ReviewBookingScreen() {
    const params = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        chargeBoxId,
        connectorId,
        plateNumber,
        reservationDuration,
        currentBatteryLevel
    } = params;

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                chargeBoxId: chargeBoxId as string,
                connectorId: parseInt(connectorId as string),
                plateNumber: plateNumber as string,
                currentBatteryLevel: parseInt(currentBatteryLevel as string || '40'),
                reservationDuration: parseInt(reservationDuration as string)
            };

            const res = await createReservation(payload);
            if (res.status) {
                router.push({
                    pathname: '/booking/success',
                    params: {
                        reservationId: res.data.id.toString(),
                        expiryDateTime: res.data.expiryDateTime
                    }
                });
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Booking Failed',
                    text2: res.message || 'Something went wrong.'
                });
            }
        } catch (error: any) {
            console.error('Booking failed:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to complete booking.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-[#1C1F26]">
            <View className="px-6 pt-4 pb-2 flex-row items-center">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 items-center justify-center rounded-xl bg-white dark:bg-[#2A2D35] border border-gray-100 dark:border-gray-800"
                >
                    <Ionicons name="arrow-back" size={24} color={isDarkMode ? 'white' : 'black'} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900 dark:text-white ml-4">Review Summary</Text>
            </View>

            <View className="flex-1 px-6 pt-8">
                {/* Vehicle Info */}
                <View className="bg-white dark:bg-[#2A2D35] rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm mb-6">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-gray-500 dark:text-gray-400 font-medium">Vehicle</Text>
                        <CheckCircle2 size={16} color="#01B764" />
                    </View>
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl mr-3">
                            <Ionicons name="car" size={24} color="#01B764" />
                        </View>
                        <Text className="text-lg font-bold text-gray-900 dark:text-white">{plateNumber}</Text>
                    </View>
                </View>

                {/* Charger Info */}
                <View className="bg-white dark:bg-[#2A2D35] rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm mb-6">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-gray-500 dark:text-gray-400 font-medium">Charging Station</Text>
                        <MapPin size={16} color="#01B764" />
                    </View>
                    <View className="flex-row items-center">
                        <View className="w-10 h-10 items-center justify-center bg-[#01B764]/10 rounded-xl mr-3">
                            <Fuel size={20} color="#01B764" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>
                                {chargeBoxId}
                            </Text>
                            <Text className="text-sm text-gray-500 dark:text-gray-400">Connector {connectorId} • {currentBatteryLevel}% Battery</Text>
                        </View>
                    </View>
                </View>

                {/* Details List */}
                <View className="bg-white dark:bg-[#2A2D35] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm mb-8">
                    <View className="flex-row justify-between mb-4">
                        <Text className="text-gray-500 dark:text-gray-400">Booking Duration</Text>
                        <Text className="text-gray-900 dark:text-white font-bold">{reservationDuration} Minutes</Text>
                    </View>
                    <View className="flex-row justify-between mb-4">
                        <Text className="text-gray-500 dark:text-gray-400">Reservation Fee</Text>
                        <Text className="text-gray-900 dark:text-white font-bold">RWF 400.00</Text>
                    </View>
                    <View className="h-[1px] bg-gray-100 dark:bg-gray-800 my-2" />
                    <View className="flex-row justify-between mt-2">
                        <Text className="text-lg font-bold text-gray-900 dark:text-white">Total Amount</Text>
                        <Text className="text-lg font-bold text-[#01B764]">RWF 400.00</Text>
                    </View>
                </View>

                <View className="flex-row items-start bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl">
                    <Info size={18} color="#3B82F6" />
                    <Text className="flex-1 ml-3 text-blue-600 dark:text-blue-400 text-xs leading-relaxed">
                        The reservation fee will be deducted from your wallet balance. You have {reservationDuration} minutes to start your session.
                    </Text>
                </View>
            </View>

            <View className="px-6 pb-8">
                <TouchableOpacity
                    onPress={handleConfirm}
                    disabled={isSubmitting}
                    className={`h-16 rounded-[32px] items-center justify-center shadow-xl shadow-[#01B764]/30 ${isSubmitting ? 'bg-gray-400' : 'bg-[#01B764]'
                        }`}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Confirm Booking</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
