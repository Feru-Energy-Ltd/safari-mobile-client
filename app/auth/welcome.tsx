import WelcomeIllustration from '@/assets/images/welcome.svg';
import { Button } from '@/components/Button';
import { useColorScheme } from '@/components/useColorScheme';
import { router } from 'expo-router';
import React from 'react';
import { Dimensions, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// To use the SVG, you would typically use:
// import WelcomeIllustration from '@/assets/images/welcome.svg';

export default function WelcomeScreen() {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#1C1F26]">
            <View className="flex-1 px-8 pt-12 pb-10">
                {/* Illustration Section */}
                <View className="flex-[0.5] items-center justify-center">
                    <View className="w-full ml-10 aspect-square items-center justify-center overflow-hidden">
                        <WelcomeIllustration width={width * 0.8} height={width * 0.8} />
                    </View>
                </View>

                {/* Typography Section */}
                <View className="flex-[0.25] items-center justify-center">
                    <Text className="text-3xl font-semibold text-center text-gray-900 dark:text-white mb-4">
                        Welcome to SafariCharger
                    </Text>
                    <Text className="text-[18px] text-gray-500 dark:text-gray-400 text-center px-6 leading-6">
                        Create your account!
                    </Text>
                </View>

                {/* Actions Section */}
                <View className="flex-[0.25] justify-end">
                    <View className="space-y-4">
                        <Button
                            title="Sign up"
                            type="primary"
                            onPress={() => router.push('/auth/signup')}
                            className="w-full mb-4"
                        />
                        <Button
                            title="Log in"
                            type="secondary"
                            onPress={() => router.push('/auth/login')}
                            className="w-full"
                        />
                    </View>

                    {/* Legal Footer */}
                    <View className="mt-10 items-center">
                        <Text className="text-center text-gray-400 dark:text-gray-500 text-[13px] leading-5">
                            By continuing you accept our{'\n'}
                            <Text
                                className="text-[#01B764] font-semibold"
                                onPress={() => router.push('/terms')}
                            >
                                Terms & Privacy Policy
                            </Text>.
                        </Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}
