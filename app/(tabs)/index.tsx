import { useColorScheme } from '@/components/useColorScheme';
import { getProfile, UserProfile } from '@/services/auth.service';
import { Charger, getChargers } from '@/services/charger.service';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Filter, Fuel, List, Map as MapIcon, Navigation2, Search, Target } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, {
  Extrapolate,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const mapRef = useRef<MapView>(null);

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [isLoadingChargers, setIsLoadingChargers] = useState(true);

  const [region, setRegion] = useState({
    latitude: -1.286389,
    longitude: 36.817223,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Pulse animation for User Avatar
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
    opacity: interpolate(pulseValue.value, [1, 1.5], [0.6, 0], Extrapolate.CLAMP),
  }));

  // Fetch Profile & Chargers
  useEffect(() => {
    const init = async () => {
      try {
        const [profileData, chargerData] = await Promise.all([
          getProfile(),
          getChargers(0, 50) // Fetch a decent amount of chargers for search/map
        ]);
        setProfile(profileData);
        setChargers(chargerData.content);

        // If chargers found, zoom to the first one or maintain user location logic
        if (chargerData.content.length > 0 && !region.latitude) {
          // zoom logic if needed
        }
      } catch (error) {
        console.error('Failed to initialize home:', error);
      } finally {
        setIsLoadingProfile(false);
        setIsLoadingChargers(false);
      }
    };
    init();
  }, []);

  const initials = useMemo(() => {
    if (!profile?.displayName) return 'SC';
    return profile.displayName
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [profile]);

  // Filtering Logic
  const filteredChargers = useMemo(() => {
    if (!searchQuery.trim()) return chargers;
    const query = searchQuery.toLowerCase();
    return chargers.filter(
      c => c.address.toLowerCase().includes(query) ||
        c.chargePointVendor?.toLowerCase().includes(query) ||
        c.chargeBoxId?.toLowerCase().includes(query)
    );
  }, [searchQuery, chargers]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let location = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
    })();
  }, []);

  const locateUser = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    let location = await Location.getCurrentPositionAsync({});
    const newRegion = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    };
    mapRef.current?.animateToRegion(newRegion, 1000);
  };

  const selectCharger = (charger: Charger) => {
    const lat = parseFloat(charger.locationLatitude);
    const lon = parseFloat(charger.locationLongitude);
    if (isNaN(lat) || isNaN(lon)) return;

    const newRegion = {
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    mapRef.current?.animateToRegion(newRegion, 1000);
    setIsDropdownVisible(false);
    Keyboard.dismiss();
  };

  const ChargerMarker = ({ charger }: { charger: Charger }) => {
    const isAvailable = charger.onlineStatus === 'ON';
    const coordinate = {
      latitude: parseFloat(charger.locationLatitude),
      longitude: parseFloat(charger.locationLongitude)
    };

    // Guard against invalid coordinates
    if (isNaN(coordinate.latitude) || isNaN(coordinate.longitude)) return null;

    return (
      <Marker coordinate={coordinate}>
        <View className={`w-10 h-10 rounded-full ${isAvailable ? 'bg-[#01B764]' : 'bg-[#F75555]'} border-2 border-white shadow-lg items-center justify-center`}>
          <Fuel size={16} color="white" />
        </View>
      </Marker>
    );
  };

  const renderChargerItem = ({ item }: { item: Charger }) => (
    <TouchableOpacity
      onPress={() => selectCharger(item)}
      className="flex-row items-center px-4 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1C1F26]"
    >
      <View className={`w-12 h-12 rounded-full ${item.onlineStatus === 'ON' ? 'bg-[#01B764]/10' : 'bg-[#F75555]/10'} items-center justify-center`}>
        <View className={`w-8 h-8 rounded-full ${item.onlineStatus === 'ON' ? 'bg-[#01B764]' : 'bg-[#F75555]'} items-center justify-center`}>
          <Fuel size={14} color="white" />
        </View>
      </View>
      <View className="flex-1 ml-4">
        <Text className="text-base font-bold text-gray-900 dark:text-white" numberOfLines={1}>
          {item.chargePointVendor || 'Charger'} - {item.chargeBoxId}
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5" numberOfLines={1}>
          {item.address}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#858E92' : '#9E9E9E'} />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white dark:bg-[#1C1F26]">
      {viewMode === 'map' ? (
        <>
          <MapView
            ref={mapRef}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
            style={StyleSheet.absoluteFillObject}
            initialRegion={region}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            {/* Chargers */}
            {filteredChargers.map(charger => (
              <ChargerMarker key={charger.id} charger={charger} />
            ))}

            {/* Custom User Marker */}
            <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }}>
              <View className="items-center justify-center">
                <Animated.View
                  style={[pulseStyle]}
                  className="absolute w-16 h-16 rounded-full bg-[#01B764]"
                />
                <View className="w-11 h-11 rounded-full border-2 border-white bg-[#01B764] shadow-xl items-center justify-center overflow-hidden">
                  {isLoadingProfile ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-bold text-lg">{initials}</Text>
                  )}
                </View>
              </View>
            </Marker>
          </MapView>

          <View className="absolute bottom-28 right-0 items-center">
            <View className="flex-row space-x-4 bg-white/10 p-2 rounded-full">
              <TouchableOpacity
                onPress={() => setViewMode('list')}
                className="w-14 h-14 bg-[#01B764] rounded-full items-center justify-center shadow-lg"
              >
                <List size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity className="w-14 h-14 bg-[#01B764] rounded-full items-center justify-center shadow-lg">
                <Navigation2 size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={locateUser}
                className="w-14 h-14 bg-[#01B764] rounded-full items-center justify-center shadow-lg"
              >
                <Target size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <View className="flex-1 pt-32">
          {isLoadingChargers ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#01B764" />
            </View>
          ) : (
            <FlatList
              data={filteredChargers}
              keyExtractor={item => item.id.toString()}
              renderItem={renderChargerItem}
              ListHeaderComponent={() => (
                <View className="px-6 pb-2">
                  <Text className="text-gray-400 dark:text-gray-500 font-medium">
                    Found {filteredChargers.length} stations nearby
                  </Text>
                </View>
              )}
            />
          )}

          <View className="absolute bottom-32 right-6">
            <TouchableOpacity
              onPress={() => setViewMode('map')}
              className="w-14 h-14 bg-[#01B764] rounded-full items-center justify-center shadow-lg"
            >
              <MapIcon size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Persistent Floating Search Bar */}
      <View className="absolute top-12 left-4 right-4 z-20">
        <View
          className="flex-row items-center px-4 py-3 rounded-2xl bg-white dark:bg-[#1C1F26] border border-gray-100 dark:border-gray-800 shadow-2xl"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 }}
        >
          <Search size={20} color={isDarkMode ? '#858E92' : '#9E9E9E'} />
          <TextInput
            placeholder="Search station"
            placeholderTextColor={isDarkMode ? '#858E92' : '#9E9E9E'}
            className="flex-1 ml-3 text-gray-900 dark:text-white font-medium"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsDropdownVisible(true)}
          />
          <TouchableOpacity className="ml-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">
            <Filter size={20} color="#01B764" />
          </TouchableOpacity>
        </View>

        {/* Search Results Dropdown */}
        {isDropdownVisible && searchQuery.length > 0 && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="mt-2 bg-white dark:bg-[#1C1F26] rounded-2xl shadow-2xl overflow-hidden max-h-[300px] border border-gray-100 dark:border-gray-800"
          >
            <FlatList
              data={filteredChargers}
              keyExtractor={item => 'drop-' + item.id}
              renderItem={renderChargerItem}
              ListEmptyComponent={() => (
                <View className="p-4 items-center">
                  <Text className="text-gray-400">No stations found</Text>
                </View>
              )}
            />
          </Animated.View>
        )}
      </View>

      {/* Background Dimmer when searching */}
      {isDropdownVisible && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setIsDropdownVisible(false);
            Keyboard.dismiss();
          }}
          className="absolute inset-0 bg-black/10 z-10"
        />
      )}
    </View>
  );
}
