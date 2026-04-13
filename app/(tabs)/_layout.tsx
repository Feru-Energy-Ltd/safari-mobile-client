import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  // const bottomPadding = Math.max(insets.bottom, 15);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#01B764',
        tabBarInactiveTintColor: isDarkMode ? '#858E92' : '#9E9E9E',
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1C1F26' : '#FFFFFF',
          borderTopColor: isDarkMode ? '#1C1F26' : '#F3F3F3',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 65 + insets.bottom,
          paddingBottom: Platform.OS === 'ios' ? 30 : insets.bottom,
          elevation: 10,
        },
        tabBarItemStyle: {
          paddingTop: 8,
          paddingBottom: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="charging"
        options={{
          title: 'Charging',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'battery-charging' : 'battery-charging-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'My Wallet',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
