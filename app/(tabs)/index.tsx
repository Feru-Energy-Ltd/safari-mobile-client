import { useColorScheme } from '@/components/useColorScheme';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { Filter, Search } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [region, setRegion] = useState({
    latitude: -1.286389,
    longitude: 36.817223,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    })();
  }, []);

  const darkMapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#1C1F26" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#858E92" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#1C1F26" }] },
    { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#D1D5DB" }] },
    { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#D1D5DB" }] },
    { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#263c3f" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
    { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
    { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] }
  ];

  return (
    <View className="flex-1 bg-white dark:bg-[#1C1F26]">
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        customMapStyle={isDarkMode ? darkMapStyle : []}
      />

      {/* Floating Search Bar */}
      <View className="absolute top-12 left-4 right-4 z-10">
        <BlurView
          intensity={Platform.OS === 'ios' ? 70 : 100}
          tint={isDarkMode ? 'dark' : 'light'}
          className="flex-row items-center px-4 py-3 rounded-2xl overflow-hidden border border-white/20 shadow-xl"
          style={{ backgroundColor: isDarkMode ? 'rgba(28, 31, 38, 0.8)' : 'rgba(255, 255, 255, 0.9)' }}
        >
          <Search size={20} color={isDarkMode ? '#858E92' : '#9E9E9E'} />
          <TextInput
            placeholder="Search location..."
            placeholderTextColor={isDarkMode ? '#858E92' : '#9E9E9E'}
            className="flex-1 ml-3 text-gray-900 dark:text-white font-medium"
          />
          <TouchableOpacity className="ml-2 p-1">
            <Filter size={20} color="#01B764" />
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  );
}
