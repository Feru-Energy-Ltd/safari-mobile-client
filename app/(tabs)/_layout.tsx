import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const bottomPadding = Math.max(insets.bottom, 15);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#01B764',
        tabBarInactiveTintColor: isDarkMode ? '#858E92' : '#9E9E9E',
        tabBarStyle: Platform.OS === 'ios' ? {
          position: 'absolute',
          bottom: bottomPadding,
          left: 16,
          right: 16,
          height: 64,
          borderRadius: 32,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          shadowColor: isDarkMode ? '#000' : '#858E92',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 15,
          paddingBottom: 0, // explicitly override safe area padding
        } : {
          backgroundColor: isDarkMode ? '#1C1F26' : '#FFFFFF',
          borderTopColor: isDarkMode ? '#1C1F26' : '#F3F3F3',
          borderTopWidth: 1,
          height: 65 + bottomPadding,
          paddingBottom: bottomPadding,
          elevation: 10,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <View style={{ flex: 1, borderRadius: 32, overflow: 'hidden' }}>
              <View style={[StyleSheet.absoluteFill, { backgroundColor: isDarkMode ? 'rgba(28, 31, 38, 0.75)' : 'rgba(255, 255, 255, 0.85)' }]} />
              <BlurView tint={isDarkMode ? 'dark' : 'light'} intensity={60} style={StyleSheet.absoluteFill} />
            </View>
          ) : null
        ),
        tabBarItemStyle: Platform.OS === 'ios' ? {
          paddingTop: 6,
        } : {
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
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bookmark' : 'bookmark-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="booking"
        options={{
          title: 'Booking',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
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
