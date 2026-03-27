import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Dimensions, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import AddVehicleSvg from '../../assets/images/add-vehicle.svg';

const { width } = Dimensions.get('window');

export default function AddVehicleScreen() {
    const { colorScheme } = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#1C1F26]">
            <View className="flex-1 px-3">
                {/* Content Container */}
                <View className="flex-1 items-center justify-center px-4">
                    <Text className="text-[32px] font-semibold text-[#1C1F26] dark:text-white leading-[42px] mb-4 text-left self-start">
                        Personalize your experience by adding a vehicle 🚗
                    </Text>

                    <Text className="text-[16px] text-gray-500 dark:text-gray-400 leading-[24px] mb-10 text-left self-start">
                        Your vehicle is used to determine compatible charging stations and provide a better experience.
                    </Text>

                    {/* Illustration Container */}
                    <View
                        className="items-center justify-center"
                        style={{ width: width * 0.85, height: width * 0.7 }}
                    >
                        <AddVehicleSvg width={width * 0.9} height={width * 0.7} />
                    </View>
                </View>

                {/* Footer Action Buttons */}
                <View className="flex-row px-2 pb-12 gap-4">
                    <TouchableOpacity
                        onPress={() => router.replace('/(tabs)')}
                        className="flex-1 h-[58px] rounded-[29px] bg-green-50 dark:bg-[#2A2D35] items-center justify-center border border-green-100 dark:border-transparent"
                        activeOpacity={0.7}
                    >
                        <Text className="text-[16px] font-bold text-[#01B764]">Add Later</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            // Link to vehicle add process later
                            router.replace('/(tabs)');
                        }}
                        className="flex-1 h-[58px] rounded-[29px] bg-[#01B764] items-center justify-center shadow-lg shadow-green-500/30"
                        activeOpacity={0.8}
                    >
                        <Text className="text-[16px] font-bold text-white">Add Vehicle</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}
