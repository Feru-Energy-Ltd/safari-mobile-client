import { useColorScheme } from '@/components/useColorScheme';
import { getProfile, UserProfile } from '@/services/auth.service';
import { Charger, getChargers } from '@/services/charger.service';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Fuel, List, Map as MapIcon, Navigation2, Search, Target } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { calculateDistance } from '@/utils/location';
import { logger } from '@/utils/logger';

// const { width, height } = Dimensions.get('window');

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
  { "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
  { "featureType": "administrative.land_parcel", "stylers": [{ "visibility": "off" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#181818" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "poi.park", "elementType": "labels.text.stroke", "stylers": [{ "color": "#1b1b1b" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a8a" }] },
  { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#373737" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#3c3c3c" }] },
  { "featureType": "road.highway.controlled_access", "elementType": "geometry", "stylers": [{ "color": "#4e4e4e" }] },
  { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "transit", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#3d3d3d" }] }
];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [isLoadingChargers, setIsLoadingChargers] = useState(true);
  const [selectedCharger, setSelectedCharger] = useState<Charger | null>(null);

  const [region, setRegion] = useState({
    latitude: -1.286389,
    longitude: 36.817223,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);


  const distanceText = useMemo(() => {
    if (!selectedCharger || !userLocation) return null;
    const dist = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      parseFloat(selectedCharger.locationLatitude),
      parseFloat(selectedCharger.locationLongitude)
    );
    return dist < 1 ? `${(dist * 1000).toFixed(0)} m` : `${dist.toFixed(1)} km`;
  }, [selectedCharger, userLocation]);


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
        logger.error('Failed to initialize home:', error);
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
    let subscription: Location.LocationSubscription | null = null;

    const initLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        // One-time fetch for initial map centering
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });

        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setUserLocation(coords);

        const initialRegion = {
          ...coords,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        };
        setRegion(initialRegion);
        mapRef.current?.animateToRegion(initialRegion, 1000);

        // Continuous high-accuracy tracking without native blue dot
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (loc) => {
            setUserLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          }
        );
      } catch (error) {
        logger.error('Error in initial location setup:', error);
      }
    };

    initLocation();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const locateUser = async () => {
    if (userLocation) {
      const newRegion = {
        ...userLocation,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
    } else {
      // Fallback to fresh fetch if userLocation isn't populated yet
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          alert('Permission to access location was denied');
          return;
        }

        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(coords);

        const newRegion = {
          ...coords,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);
      } catch (error) {
        logger.error('Error locating user:', error);
        alert('Could not get your current location. Please make sure location services are enabled.');
      }
    }
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
    setSelectedCharger(charger);
    setViewMode('map');
    setIsDropdownVisible(false);
    Keyboard.dismiss();
  };

  const UserLocationMarker = ({ location }: { location: { latitude: number; longitude: number } }) => {
    const pulseValue = useSharedValue(1);

    useEffect(() => {
      pulseValue.value = withRepeat(
        withSequence(
          withTiming(1.4, { duration: 1500 }),
          withTiming(1, { duration: 1500 })
        ),
        -1,
        true
      );
    }, []);

    const pulseStyle = useAnimatedStyle(() => ({
      transform: [{ scale: pulseValue.value }],
      opacity: interpolate(pulseValue.value, [1, 1.4], [0.5, 0], Extrapolate.CLAMP),
    }));

    return (
      <Marker
        coordinate={location}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={true}
      >
        <View className="items-center justify-center">
          <Animated.View
            style={[pulseStyle]}
            className="absolute w-20 h-20 rounded-full bg-[#01B764]"
          />
          <View className="w-14 h-14 rounded-full border-2 border-white bg-[#01B764] shadow-xl items-center justify-center overflow-hidden">
            {isLoadingProfile ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-bold text-xl">{initials}</Text>
            )}
          </View>
        </View>
      </Marker>
    );
  };

  const ChargerMarker = ({ charger }: { charger: Charger }) => {
    const isAvailable = charger.onlineStatus === 'ON';
    const isSelected = selectedCharger?.id === charger.id;
    const coordinate = {
      latitude: parseFloat(charger.locationLatitude),
      longitude: parseFloat(charger.locationLongitude)
    };

    // Guard against invalid coordinates
    if (isNaN(coordinate.latitude) || isNaN(coordinate.longitude)) return null;

    return (
      <Marker
        coordinate={coordinate}
        onPress={() => selectCharger(charger)}
      >
        <View className={`items-center justify-center`}>
          {isSelected && (
            <View className="absolute -top-1 w-12 h-12 rounded-full bg-[#01B764]/20 items-center justify-center" />
          )}
          <View className={`w-10 h-10 rounded-full ${isAvailable ? 'bg-[#01B764]' : 'bg-[#F75555]'} border-2 border-white shadow-lg items-center justify-center`}>
            <Fuel size={16} color="white" />
          </View>
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
            onPress={() => setSelectedCharger(null)}
            customMapStyle={isDarkMode ? darkMapStyle : []}
          >
            {/* Chargers */}
            {filteredChargers.map(charger => (
              <ChargerMarker key={charger.id} charger={charger} />
            ))}

            {/* Custom User Marker */}
            {userLocation && <UserLocationMarker location={userLocation} />}
          </MapView>

          {/* Floating Action Buttons */}
          <View
            className="absolute right-4 items-center"
            style={{
              bottom: insets.bottom + (selectedCharger ? 260 : 40),
            }}
          >
            <TouchableOpacity
              onPress={() => setViewMode('list')}
              className="w-14 h-14 bg-white dark:bg-[#1C1F26] rounded-2xl items-center justify-center shadow-xl border border-gray-100 dark:border-gray-800 mb-4"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 }}
            >
              <List size={24} color="#01B764" />
            </TouchableOpacity>

            <TouchableOpacity
              className="w-14 h-14 bg-white dark:bg-[#1C1F26] rounded-2xl items-center justify-center shadow-xl border border-gray-100 dark:border-gray-800 mb-4"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 }}
            >
              <Navigation2 size={24} color="#01B764" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={locateUser}
              className="w-14 h-14 bg-[#01B764] rounded-2xl items-center justify-center shadow-xl"
              style={{ shadowColor: '#01B764', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 }}
            >
              <Target size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Charger Detail Card */}
          {selectedCharger && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1C1F26] rounded-t-[40px] shadow-2xl px-6 pt-8 pb-10 border-t border-gray-100 dark:border-gray-800"
              style={{ marginBottom: insets.bottom - 20 }}
            >
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1 mr-4">
                  <Text className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {selectedCharger.chargePointVendor || 'Charger'} - {selectedCharger.address}
                  </Text>
                  <Text className="text-gray-500 dark:text-gray-400 font-medium">
                    {selectedCharger.address}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mb-6">
                <View className={`px-3 py-1.5 rounded-lg ${selectedCharger.onlineStatus === 'ON' ? 'bg-[#01B764]' : 'bg-[#F75555]'} mr-3`}>
                  <Text className="text-white font-bold text-xs uppercase">
                    {selectedCharger.onlineStatus === 'ON' ? 'Available' : 'Unavailable'}
                  </Text>
                </View>
                {distanceText && (
                  <View className="flex-row items-center bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                    <Ionicons name="location" size={14} color="#01B764" />
                    <Text className="ml-1 text-gray-600 dark:text-gray-300 font-bold text-xs">{distanceText}</Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center space-x-4 mb-8">
                <View className="flex-row items-center">
                  <Ionicons name="flash" size={18} color="#01B764" />
                  <Text className="ml-1.5 text-gray-900 dark:text-white font-bold text-sm">
                    {selectedCharger.chargePointModel}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-x-4">
                <TouchableOpacity className="flex-1 h-14 border border-[#01B764] rounded-2xl items-center justify-center">
                  <Text className="text-[#01B764] font-bold text-lg">View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push({
                    pathname: '/booking/select-vehicle',
                    params: {
                      chargeBoxId: selectedCharger.chargeBoxId,
                      connectorId: '1' // Defaulting to 1 as per user's API example
                    }
                  })}
                  className="flex-1 h-14 bg-[#01B764] rounded-2xl items-center justify-center shadow-lg"
                >
                  <Text className="text-white font-bold text-lg">Book</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
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

          <View
            className="absolute right-6"
            style={{ bottom: insets.bottom + 80 }}
          >
            <TouchableOpacity
              onPress={() => setViewMode('map')}
              className="w-14 h-14 bg-[#01B764] rounded-full items-center justify-center shadow-xl"
              style={{ shadowColor: '#01B764', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 }}
            >
              <MapIcon size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Persistent Floating Search Bar */}
      <View className="absolute top-12 left-4 right-4 z-20">
        <View
          className={`flex-row items-center px-4 ${Platform.OS === 'ios' ? 'py-4' : 'py-3'} rounded-2xl bg-white dark:bg-[#1C1F26] border border-gray-100 dark:border-gray-800 shadow-2xl`}
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
          {/* <TouchableOpacity className="ml-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">
            <Filter size={20} color="#01B764" />
          </TouchableOpacity> */}
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
