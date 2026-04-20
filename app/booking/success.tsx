import { useColorScheme } from '@/components/useColorScheme';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, Home } from 'lucide-react-native';
import React from 'react';
import {
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SuccessBookingScreen() {
    const { reservationId, expiryDateTime } = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#1C1F26]">
            <View className="flex-1 items-center justify-center px-8">
                <Animated.View
                    entering={ZoomIn.duration(600)}
                    className="w-24 h-24 rounded-full bg-[#01B764] items-center justify-center mb-8 shadow-xl shadow-[#01B764]/50"
                >
                    <Check size={48} color="white" strokeWidth={3} />
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(300).duration(500)} className="items-center">
                    <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                        Booking Successful!
                    </Text>
                    <Text className="text-base text-gray-500 dark:text-gray-400 text-center mb-10">
                        Your reservation has been confirmed. You can view it in the Charging tab.
                    </Text>
                </Animated.View>

                <Animated.View
                    entering={FadeInUp.delay(500).duration(500)}
                    className="w-full bg-gray-50 dark:bg-[#2A2D35] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 mb-8"
                >
                    <View className="flex-row justify-between mb-4">
                        <Text className="text-gray-500 dark:text-gray-400">Reservation ID</Text>
                        <Text className="text-gray-900 dark:text-white font-bold">#{reservationId}</Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-gray-500 dark:text-gray-400">Expires At</Text>
                        <Text className="text-gray-900 dark:text-white font-bold">{expiryDateTime}</Text>
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(700).duration(500)} className="w-full space-y-4">
                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/charging')}
                        className="w-full h-16 bg-[#01B764] rounded-2xl items-center justify-center shadow-lg"
                    >
                        <Text className="text-white font-bold text-lg">View Active Booking</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.replace('/(tabs)')}
                        className="w-full h-16 flex-row items-center justify-center border border-gray-200 dark:border-gray-700 rounded-2xl mt-4"
                    >
                        <Home size={20} color={isDarkMode ? '#858E92' : '#9E9E9E'} />
                        <Text className="text-gray-500 dark:text-gray-400 font-bold text-lg ml-2">Back to Home</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </SafeAreaView>
    );
}
