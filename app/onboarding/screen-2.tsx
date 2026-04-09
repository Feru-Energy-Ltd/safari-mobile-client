import { Button } from '@/components/Button';
import { PaginationIndicator } from '@/components/PaginationIndicator';
import { useColorScheme } from '@/components/useColorScheme';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Dimensions, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function OnboardingScreen3() {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    const imageOpacity = useSharedValue(0);
    const imageScale = useSharedValue(0.92);
    const titleOpacity = useSharedValue(0);
    const descOpacity = useSharedValue(0);
    const footerOpacity = useSharedValue(0);

    const easing = Easing.out(Easing.cubic);

    useEffect(() => {
        imageOpacity.value = withTiming(1, { duration: 700, easing });
        imageScale.value = withSpring(1, { damping: 14, stiffness: 90 });
        titleOpacity.value = withDelay(250, withTiming(1, { duration: 500, easing }));
        descOpacity.value = withDelay(420, withTiming(1, { duration: 500, easing }));
        footerOpacity.value = withDelay(580, withTiming(1, { duration: 500, easing }));
    }, []);

    const imageStyle = useAnimatedStyle(() => ({
        opacity: imageOpacity.value,
        transform: [{ scale: imageScale.value }],
    }));
    const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));
    const descStyle = useAnimatedStyle(() => ({ opacity: descOpacity.value }));
    const footerStyle = useAnimatedStyle(() => ({ opacity: footerOpacity.value }));

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#181A20]">
            <View className="flex-1 px-6 pt-12 pb-8">
                {/* Image Container */}
                <View className="flex-[0.55] translate-y-[10px] items-center justify-center">
                    <Animated.Image
                        source={
                            isDarkMode
                                ? require('@/assets/images/onboarding-3-dark.png')
                                : require('@/assets/images/onboarding-3.png')
                        }
                        style={[{ width: width * 1.3, height: width * 1.3 }, imageStyle]}
                        resizeMode="contain"
                    />
                </View>

                {/* Text Container */}
                <View className="flex-[0.3] items-center mt-8">
                    <Animated.Text style={[titleStyle]} className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4 px-2">
                        Safe and secure payments for charging
                    </Animated.Text>
                    <Animated.Text style={[descStyle]} className="text-base text-center text-gray-400 dark:text-gray-400 px-6 leading-6">
                        Enjoy a variety of secure payment methods for your convenience and peace of mind.
                    </Animated.Text>
                </View>

                {/* Pagination & Buttons Container */}
                <Animated.View style={[footerStyle]} className="flex-[0.15] justify-between">
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
                            title="Get Started"
                            type="primary"
                            onPress={() => router.push('/auth/welcome')}
                            className="flex-1"
                        />
                    </View>
                </Animated.View>
            </View>
        </SafeAreaView>
    );
}
