import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/components/useColorScheme';

export default function ChargingScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-[#1C1F26]">
      <Text className="text-[20px] font-bold text-gray-900 dark:text-white">Charging</Text>
    </View>
  );
}
