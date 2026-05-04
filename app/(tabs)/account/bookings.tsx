import { BOOKING_STATUS_MAP, BOOKING_TABS, BookingTab } from '@/constants/bookings';
import { getAccessToken } from '@/services/auth.service';
import { getConnectorIconUrl, getReservations, ReservationRecord } from '@/services/charger.service';
import { logger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';



export default function BookingsScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    const [activeTab, setActiveTab] = useState<BookingTab>('Upcoming');
    const [bookings, setBookings] = useState<ReservationRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    const fetchBookings = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const [data, accessToken] = await Promise.all([
                getReservations(0, 50),
                getAccessToken()
            ]);
            setBookings(data.content);
            setToken(accessToken);
        } catch (error: any) {
            logger.error('Failed to fetch bookings:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const filteredBookings = bookings.filter(b => BOOKING_STATUS_MAP[b.reservationStatus] === activeTab);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        });
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getDuration = (start: number, end: number) => {
        const diffMs = end - start;
        const mins = Math.floor(diffMs / 60000);
        if (mins < 60) return `${mins} mins`;
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        return remainingMins > 0 ? `${hours} hour ${remainingMins} mins` : `${hours} hour${hours > 1 ? 's' : ''}`;
    };

    const BookingCard = ({ item }: { item: ReservationRecord }) => {
        const isCanceled = item.reservationStatus === 'Cancelled';
        const isUpcoming = item.reservationStatus === 'Accepted';

        return (
            <View className="bg-white dark:bg-[#2A2D35] rounded-3xl p-5 mb-5 shadow-sm border border-gray-50 dark:border-gray-800">
                {/* Header: Date, Time & Status */}
                <View className="flex-row justify-between items-start mb-5">
                    <View>
                        <Text className="text-gray-900 dark:text-white font-bold text-base">{formatDate(item.startTime)}</Text>
                        <Text className="text-gray-400 dark:text-gray-500 font-medium text-sm mt-1">{formatTime(item.startTime)}</Text>
                    </View>
                    <View className={`${isCanceled ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'} px-3 py-1.5 rounded-lg`}>
                        <Text className={`${isCanceled ? 'text-red-500' : 'text-[#01B764]'} font-bold text-xs`}>
                            {BOOKING_STATUS_MAP[item.reservationStatus]}
                        </Text>
                    </View>
                </View>

                {/* Location & Navigation */}
                <View className="flex-row items-center justify-between mb-5">
                    <View className="flex-1 mr-4">
                        <Text className="text-lg font-black text-gray-900 dark:text-white" numberOfLines={1}>
                            {item.locationAddress}
                        </Text>
                    </View>
                </View>

                <View className="h-[1px] bg-gray-50 dark:bg-gray-800 mb-5" />

                {/* Details Grid */}
                <View className="flex-row mb-6">
                    <View className="flex-1 items-center border-r border-gray-50 dark:border-gray-800">
                        <Text className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mb-2">Connector</Text>
                        <View className="flex-row items-center justify-center h-10 w-full px-2">
                            {item.connectorType ? (
                                <Image
                                    source={{
                                        uri: getConnectorIconUrl(item.connectorType),
                                        headers: token ? { Authorization: `Bearer ${token}` } : {}
                                    }}
                                    style={{ width: 44, height: 44 }}
                                    resizeMode="contain"
                                />
                            ) : (
                                <Ionicons name="flash" size={24} color={isDarkMode ? '#FFFFFF' : '#1C1F26'} />
                            )}
                        </View>
                    </View>

                    <View className="flex-2 items-center border-r border-gray-50 dark:border-gray-800 px-2 min-w-[100px]">
                        <Text className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mb-2">Duration</Text>
                        <Text className="text-sm font-bold text-gray-900 dark:text-white">{getDuration(item.startTime, item.expiryDateTime)}</Text>
                    </View>

                    <View className="flex-1 items-center">
                        <Text className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mb-2">Status</Text>
                        <Text className="text-sm font-bold text-gray-900 dark:text-white" numberOfLines={1}>{item.connectorStatus}</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-3">
                    {/* <TouchableOpacity
                        className="flex-1 h-12 rounded-2xl border border-[#01B764] items-center justify-center"
                        onPress={() => router.push({ pathname: '/(tabs)/charging', params: { id: item.id } })}
                    >
                        <Text className="text-[#01B764] font-bold">View</Text>
                    </TouchableOpacity> */}
                    {!isUpcoming && item.connectorStatus !== 'Reserved' && (
                        <TouchableOpacity className="flex-1 h-12 bg-[#01B764] rounded-2xl items-center justify-center shadow-lg shadow-[#01B764]/20">
                            <Text className="text-white font-bold">Book Again</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#1C1F26]">
            {/* Custom Header */}
            <View className="flex-row items-center justify-between px-6 py-4">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#FFFFFF' : '#1C1F26'} />
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-gray-900 dark:text-white">My Booking</Text>
                </View>
                <TouchableOpacity>
                    <Ionicons name="search" size={24} color={isDarkMode ? '#FFFFFF' : '#1C1F26'} />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View className="flex-row px-6 border-b border-gray-100 dark:border-gray-800">
                {BOOKING_TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        className={`flex-1 items-center pb-4 ${activeTab === tab ? 'border-b-2 border-[#01B764]' : ''}`}
                    >
                        <Text className={`font-bold ${activeTab === tab ? 'text-[#01B764]' : 'text-gray-400'}`}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#01B764" />
                </View>
            ) : (
                <FlatList
                    data={filteredBookings}
                    renderItem={({ item }) => <BookingCard item={item} />}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ padding: 24 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchBookings(false)} tintColor="#01B764" />
                    }
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center py-20">
                            <Ionicons name="calendar-outline" size={64} color={isDarkMode ? '#2A2D35' : '#F3F4F6'} />
                            <Text className="text-gray-500 dark:text-gray-400 mt-4 font-medium">No {activeTab.toLowerCase()} bookings found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
