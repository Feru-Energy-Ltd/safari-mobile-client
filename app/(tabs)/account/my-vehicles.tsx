import { useColorScheme } from '@/components/useColorScheme';
import { getVehicles, Vehicle } from '@/services/vehicle.service';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const CAR_IMAGES = [
    require('@/assets/images/Compact-Car.png'),
    require('@/assets/images/Coupe-Car.png'),
    require('@/assets/images/Maserati-Ghibli.png'),
    require('@/assets/images/Economy-Car.png'),
    require('@/assets/images/Fancy-Car.png'),
];

export default function MyVehiclesScreen() {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadVehicles = async () => {
        try {
            const res = await getVehicles();
            if (res && res.data) {
                setVehicles(res.data);
            }
        } catch (error: any) {
            Alert.alert('Error', 'Could not load your vehicles. Please try again.');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadVehicles();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadVehicles();
    };

    const bgColor = isDarkMode ? '#1C1F26' : '#FAFAFA';
    const cardColor = isDarkMode ? '#2A2D35' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : '#111827';
    const subtitleColor = isDarkMode ? '#9CA3AF' : '#6B7280';
    const borderColor = isDarkMode ? '#374151' : '#F3F4F6';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
                    <Ionicons name="arrow-back" size={26} color={textColor} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: '700', color: textColor }}>My Vehicle</Text>
                <TouchableOpacity onPress={() => router.push('/auth/create-vehicle')} style={{ padding: 4 }}>
                    <Ionicons name="add" size={28} color={textColor} />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#01B764" />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={{ padding: 20, paddingTop: 10, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#01B764" />}
                >
                    {vehicles.length === 0 ? (
                        <View style={{ alignItems: 'center', marginTop: 60 }}>
                            <Ionicons name="car-outline" size={60} color={subtitleColor} style={{ marginBottom: 16 }} />
                            <Text style={{ fontSize: 18, color: textColor, fontWeight: '600', marginBottom: 8 }}>No Vehicles Found</Text>
                            <Text style={{ fontSize: 14, color: subtitleColor, textAlign: 'center', marginHorizontal: 20 }}>
                                You haven't added any vehicles yet. Tap the + icon to register your first EV.
                            </Text>
                        </View>
                    ) : (
                        vehicles.map((vehicle) => (
                            <TouchableOpacity
                                key={vehicle.id}
                                activeOpacity={0.7}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: cardColor,
                                    borderRadius: 16,
                                    paddingVertical: 16,
                                    paddingHorizontal: 20,
                                    marginBottom: 16,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.03,
                                    shadowRadius: 8,
                                    elevation: 2,
                                    borderWidth: 1,
                                    borderColor: borderColor
                                }}
                            >
                                {/* Car Image matching Mockup */}
                                <View style={{ width: 48, height: 72, alignItems: 'center', justifyContent: 'center' }}>
                                    <Image
                                        source={CAR_IMAGES[vehicle.id % CAR_IMAGES.length]}
                                        style={{ width: 56, height: 56, resizeMode: 'contain' }}
                                    />
                                </View>

                                <View style={{ flex: 1, marginLeft: 16 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>
                                            {vehicle.plateNumber}
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 13, color: subtitleColor, marginTop: 2 }}>
                                        {vehicle.vinNumber || vehicle.description}
                                    </Text>
                                </View>

                                {vehicle.active && (
                                    <View style={{ backgroundColor: '#01B764', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 12 }}>
                                        <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>Active</Text>
                                    </View>
                                )}
                                <Ionicons name="chevron-forward" size={20} color={subtitleColor} />
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
