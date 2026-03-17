import { router } from 'expo-router';
import React from 'react';
import { Dimensions, Image, SafeAreaView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { PaginationIndicator } from '@/components/PaginationIndicator';

const { width } = Dimensions.get('window');

export default function OnboardingScreen1() {
    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 px-6 pt-12 pb-8">
                {/* Image Container */}
                <View className="flex-[0.55] items-center justify-center">
                    <Image
                        source={require('@/assets/images/onboarding-1.png')}
                        style={{ width: width * 1.2, height: width * 1.2 }}
                        resizeMode="contain"
                    />
                </View>

                {/* Text Container */}
                <View className="flex-[0.3] items-center mt-8">
                    <Text className="text-3xl font-bold text-center text-gray-900 mb-4 px-2">
                        Easily find EV charging stations around you
                    </Text>
                    <Text className="text-base text-center text-gray-400 px-6 leading-6">
                        Discover available chargers nearby in real-time, get directions, and start charging with ease.
                    </Text>
                </View>

                {/* Pagination & Buttons Container */}
                <View className="flex-[0.15] justify-between">
                    <View className="items-center mb-8">
                        <PaginationIndicator totalDots={3} currentIndex={0} />
                    </View>

                    <View className="flex-row justify-between w-full space-x-4">
                        <Button
                            title="Skip"
                            type="secondary"
                            onPress={() => router.replace('/(tabs)')}
                            className="flex-1"
                        />
                        <View className="w-4" />
                        <Button
                            title="Next"
                            type="primary"
                            onPress={() => router.push('/onboarding/screen-1')}
                            className="flex-1"
                        />
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}
