import { useColorScheme } from '@/components/useColorScheme';
import { getVehicles, Vehicle } from '@/services/vehicle.service';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronRight, Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CAR_IMAGES = [
    require('@/assets/images/Compact-Car.png'),
    require('@/assets/images/Coupe-Car.png'),
    require('@/assets/images/Maserati-Ghibli.png'),
    require('@/assets/images/Economy-Car.png'),
    require('@/assets/images/Fancy-Car.png'),
];

export default function SelectVehicleScreen() {
    const { chargeBoxId, connectorId } = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const res = await getVehicles();
                if (res.status && res.data) {
                    setVehicles(res.data);
                }
            } catch (error) {
                console.error('Failed to fetch vehicles:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchVehicles();
    }, []);

    const handleSelectVehicle = (vehicle: Vehicle) => {
        router.push({
            pathname: '/booking/duration',
            params: {
                chargeBoxId: chargeBoxId as string,
                connectorId: connectorId as string,
                plateNumber: vehicle.plateNumber,
                batteryCapacity: vehicle.batteryCapacity.toString()
            }
        });
    };

    const renderVehicleItem = ({ item }: { item: Vehicle }) => (
        <TouchableOpacity
            onPress={() => handleSelectVehicle(item)}
            className="flex-row items-center p-4 mb-4 rounded-3xl bg-white dark:bg-[#2A2D35] border border-gray-100 dark:border-gray-800 shadow-sm"
        >
            <View className="w-16 h-16 items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-2xl mr-4">
                <Image
                    source={CAR_IMAGES[item.id % CAR_IMAGES.length]}
                    className="w-12 h-12"
                    resizeMode="contain"
                />
            </View>
            <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900 dark:text-white">
                    {item.plateNumber}
                </Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                    {item.description || 'Electric Vehicle'} • {item.batteryCapacity} kWh
                </Text>
            </View>
            <ChevronRight size={20} color={isDarkMode ? '#858E92' : '#9E9E9E'} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-[#1C1F26]">
            <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 items-center justify-center rounded-xl bg-white dark:bg-[#2A2D35] border border-gray-100 dark:border-gray-800"
                >
                    <Ionicons name="arrow-back" size={24} color={isDarkMode ? 'white' : 'black'} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900 dark:text-white">Select Vehicle</Text>
                <TouchableOpacity
                    onPress={() => router.push('/auth/create-vehicle')}
                    className="w-10 h-10 items-center justify-center rounded-xl bg-[#01B764]"
                >
                    <Plus size={20} color="white" />
                </TouchableOpacity>
            </View>

            <View className="flex-1 px-6 pt-6">
                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#01B764" />
                    </View>
                ) : vehicles.length === 0 ? (
                    <View className="flex-1 items-center justify-center">
                        <Text className="text-gray-500 dark:text-gray-400 text-center mb-6">
                            You haven't added any vehicles yet.
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push('/auth/create-vehicle')}
                            className="bg-[#01B764] px-12 h-16 rounded-[32px] items-center justify-center shadow-xl shadow-[#01B764]/30"
                        >
                            <Text className="text-white font-bold text-lg">Add New Vehicle</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={vehicles}
                        renderItem={renderVehicleItem}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
