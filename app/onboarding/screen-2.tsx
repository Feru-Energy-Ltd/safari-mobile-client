import { Button } from '@/components/Button';
import { PaginationIndicator } from '@/components/PaginationIndicator';
import { useColorScheme } from '@/components/useColorScheme';
import { router } from 'expo-router';
import React from 'react';
import { Dimensions, Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function OnboardingScreen3() {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#181A20]">
            <View className="flex-1 px-6 pt-12 pb-8">
                {/* Image Container */}
                <View className="flex-[0.55] translate-y-[10px] items-center justify-center">
                    <Image
                        source={
                            isDarkMode
                                ? require('@/assets/images/onboarding-3-dark.png')
                                : require('@/assets/images/onboarding-3.png')
                        }
                        style={{ width: width * 1.3, height: width * 1.3 }}
                        resizeMode="contain"
                    />
                </View>

                {/* Text Container */}
                <View className="flex-[0.3] items-center mt-8">
                    <Text className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4 px-2">
                        Safe and secure payments for charging
                    </Text>
                    <Text className="text-base text-center text-gray-400 dark:text-gray-400 px-6 leading-6">
                        Enjoy a variety of secure payment methods for your convenience and peace of mind.
                    </Text>
                </View>

                {/* Pagination & Buttons Container */}
                <View className="flex-[0.15] justify-between">
                    <View className="items-center mb-8">
                        <PaginationIndicator totalDots={3} currentIndex={2} />
                    </View>

                    <View className="flex-row justify-between w-full space-x-4">
                        <Button
                            title="Skip"
                            type="secondary"
                            onPress={() => router.replace('/auth/welcome')}
                            className="flex-1"
                        />
                        <View className="w-4" />
                        <Button
                            title="Next"
                            type="primary"
                            onPress={() => router.push('/auth/welcome')}
                            className="flex-1"
                        />
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}
