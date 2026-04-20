import { useColorScheme } from '@/components/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Dimensions,
    FlatList,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PickerModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const BottomSheetModal = ({ visible, onClose, title, children }: PickerModalProps) => {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/40">
                <TouchableOpacity className="flex-1" onPress={onClose} activeOpacity={1} />
                <View className="bg-white dark:bg-[#2A2D35] rounded-t-[40px] px-6 pt-6 pb-10 border-t border-gray-100 dark:border-gray-800">
                    <View className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full self-center mb-6" />
                    <View className="flex-row justify-between items-center mb-8">
                        <Text className="text-xl font-bold text-gray-900 dark:text-white">{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text className="text-[#01B764] font-bold text-lg">Done</Text>
                        </TouchableOpacity>
                    </View>
                    {children}
                </View>
            </View>
        </Modal>
    );
};

export default function DurationSelectionScreen() {
    const params = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    const [selectedDuration, setSelectedDuration] = useState(30);
    const [arrivalTime, setArrivalTime] = useState('10:00 AM');

    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showDurationPicker, setShowDurationPicker] = useState(false);

    const today = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const durations = [15, 20, 25, 30, 35, 40, 45];
    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
    const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));
    const periods = ['AM', 'PM'];

    const handleContinue = () => {
        router.push({
            pathname: '/booking/review',
            params: {
                ...params,
                reservationDuration: selectedDuration.toString(),
                arrivalTime: arrivalTime
            }
        });
    };

    const renderCalendar = () => {
        const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
        const currentDay = today.getDate();

        const grid = [
            ['', '', 1, 2, 3, 4, 5],
            [6, 7, 8, 9, 10, 11, 12],
            [13, 14, 15, 16, 17, 18, 19],
            [20, 21, 22, 23, 24, 25, 26],
            [27, 28, 29, 30, 31]
        ];

        return (
            <View className="bg-white dark:bg-[#2A2D35] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-lg font-bold text-gray-900 dark:text-white">
                        {monthNames[today.getMonth()]} {today.getFullYear()}
                    </Text>
                    <View className="flex-row gap-x-4">
                        <Ionicons name="caret-back" size={16} color={isDarkMode ? '#858E92' : '#9E9E9E'} />
                        <Ionicons name="caret-forward" size={16} color="#01B764" />
                    </View>
                </View>

                <View className="flex-row justify-between mb-2">
                    {days.map(d => (
                        <Text key={d} className="w-8 text-center text-gray-500 dark:text-gray-400 font-bold text-xs">{d}</Text>
                    ))}
                </View>

                {grid.map((row, i) => (
                    <View key={i} className="flex-row justify-between mb-2">
                        {row.map((day, j) => {
                            const isToday = day === currentDay;
                            return (
                                <View key={j} className={`w-10 h-10 items-center justify-center rounded-full ${isToday ? 'bg-[#01B764]' : ''}`}>
                                    <Text className={`text-sm font-medium ${isToday ? 'text-white' : 'text-gray-900 dark:text-gray-300'}`}>
                                        {day}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-[#1C1F26]">
            <View className="px-6 pt-4 pb-2 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
                    <Ionicons name="arrow-back" size={24} color={isDarkMode ? 'white' : 'black'} />
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-gray-900 dark:text-white ml-2">Booking</Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                <Text className="text-base font-bold text-gray-900 dark:text-white mb-4">Select Date</Text>
                {renderCalendar()}

                <Text className="text-base font-bold text-gray-900 dark:text-white mt-8 mb-4">Select Arrival Time</Text>
                <TouchableOpacity
                    onPress={() => setShowTimePicker(true)}
                    className="flex-row items-center justify-between bg-white dark:bg-[#2A2D35] border-b border-[#01B764] p-4"
                >
                    <Text className="text-lg font-medium text-gray-900 dark:text-white">{arrivalTime}</Text>
                    <View className="flex-row items-center">
                        <Text className="text-[#01B764] font-bold mr-2">{arrivalTime.split(' ')[1]}</Text>
                        <ChevronDown size={20} color={isDarkMode ? '#858E92' : '#9E9E9E'} />
                    </View>
                </TouchableOpacity>

                <Text className="text-base font-bold text-gray-900 dark:text-white mt-8 mb-4">Select Charging Duration</Text>
                <TouchableOpacity
                    onPress={() => setShowDurationPicker(true)}
                    className="flex-row items-center justify-between bg-white dark:bg-[#2A2D35] border-b border-[#01B764] p-4"
                >
                    <Text className="text-lg font-medium text-gray-900 dark:text-white">{selectedDuration}</Text>
                    <View className="flex-row items-center">
                        <Text className="text-[#01B764] font-bold mr-2">Minutes</Text>
                        <ChevronDown size={20} color={isDarkMode ? '#858E92' : '#9E9E9E'} />
                    </View>
                </TouchableOpacity>

                <View className="h-20" />
            </ScrollView>

            <View className="px-6 pb-8">
                <TouchableOpacity
                    onPress={handleContinue}
                    className="bg-[#01B764] h-16 rounded-[32px] items-center justify-center shadow-xl shadow-[#01B764]/30"
                >
                    <Text className="text-white font-bold text-lg">Continue</Text>
                </TouchableOpacity>
            </View>

            {/* Time Picker Modal */}
            <BottomSheetModal
                visible={showTimePicker}
                onClose={() => setShowTimePicker(false)}
                title="Arrival Time"
            >
                <View className="flex-row h-48">
                    <FlatList
                        data={hours}
                        keyExtractor={item => item}
                        showsVerticalScrollIndicator={false}
                        snapToInterval={40}
                        decelerationRate="fast"
                        className="flex-1"
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => {
                                    const parts = arrivalTime.split(/[: ]/);
                                    setArrivalTime(`${item}:${parts[1]} ${parts[2]}`);
                                }}
                                className="h-10 items-center justify-center"
                            >
                                <Text className={`text-xl font-bold ${arrivalTime.split(':')[0] === item ? 'text-[#01B764]' : 'text-gray-400'}`}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                    <FlatList
                        data={minutes}
                        keyExtractor={item => item}
                        showsVerticalScrollIndicator={false}
                        snapToInterval={40}
                        decelerationRate="fast"
                        className="flex-1"
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => {
                                    const parts = arrivalTime.split(/[: ]/);
                                    setArrivalTime(`${parts[0]}:${item} ${parts[2]}`);
                                }}
                                className="h-10 items-center justify-center"
                            >
                                <Text className={`text-xl font-bold ${arrivalTime.split(/[: ]/)[1] === item ? 'text-[#01B764]' : 'text-gray-400'}`}>
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                    <View className="flex-1">
                        {periods.map(p => (
                            <TouchableOpacity
                                key={p}
                                onPress={() => {
                                    const parts = arrivalTime.split(/[: ]/);
                                    setArrivalTime(`${parts[0]}:${parts[1]} ${p}`);
                                }}
                                className="h-[96px] items-center justify-center"
                            >
                                <Text className={`text-xl font-bold ${arrivalTime.split(' ')[1] === p ? 'text-[#01B764]' : 'text-gray-400'}`}>
                                    {p}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </BottomSheetModal>

            {/* Duration Picker Modal */}
            <BottomSheetModal
                visible={showDurationPicker}
                onClose={() => setShowDurationPicker(false)}
                title="Charging Duration"
            >
                <FlatList
                    data={durations}
                    keyExtractor={item => item.toString()}
                    showsVerticalScrollIndicator={false}
                    className="h-48"
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => setSelectedDuration(item)}
                            className="h-12 items-center justify-center border-b border-gray-50 dark:border-gray-800"
                        >
                            <Text className={`text-xl font-bold ${selectedDuration === item ? 'text-[#01B764]' : 'text-gray-400'}`}>
                                {item} Minutes
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </BottomSheetModal>
        </SafeAreaView>
    );
}
