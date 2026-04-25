import { useColorScheme } from '@/components/useColorScheme';
import { getPaymentProviders, PaymentProvider, topUpWallet } from '@/services/wallet.service';
import { logger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function ProviderSelectScreen() {
    const { amount } = useLocalSearchParams<{ amount: string }>();
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const textColor = isDarkMode ? '#FFFFFF' : '#111827';

    const [providers, setProviders] = useState<PaymentProvider[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        async function fetchProviders() {
            try {
                const data = await getPaymentProviders();
                setProviders(data);
                // Removed auto-selection
            } catch (error) {
                logger.error('Error fetching providers:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Could not fetch payment providers.',
                });
            } finally {
                setLoading(false);
            }
        }
        fetchProviders();
    }, []);

    const handleConfirm = async () => {
        if (!selectedProvider) {
            Toast.show({
                type: 'error',
                text1: 'Required',
                text2: 'Please select a payment provider.',
            });
            return;
        }

        if (!phoneNumber || phoneNumber.length < 10) {
            Toast.show({
                type: 'error',
                text1: 'Required',
                text2: 'Please enter a valid phone number.',
            });
            return;
        }

        setSubmitting(true);
        try {
            const response = await topUpWallet({
                amount: parseInt(amount),
                phoneNumber: phoneNumber,
                providerCode: selectedProvider.code
            });

            if (response.status) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: response.message || 'Top-up initiated successfully.',
                });
                router.replace('/(tabs)/wallet');
            } else {
                throw new Error(response.message || 'Top-up failed');
            }
        } catch (error: any) {
            logger.error('Top-up error:', error);
            Toast.show({
                type: 'error',
                text1: 'Failed',
                text2: error.message || 'Something went wrong.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const mtnLogo = require('@/assets/images/mtn-logo.png');

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#1C1F26]">
            {/* Header */}
            <View className="px-6 py-4 flex-row items-center border-b border-gray-100 dark:border-gray-800">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color={textColor} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900 dark:text-white">Select Provider</Text>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#01B764" />
                </View>
            ) : (
                <View className="flex-1">
                    <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                        <Text className="text-gray-500 mb-6">Choose your preferred payment provider for the RWF {amount} top-up.</Text>

                        {providers.map((p) => (
                            <TouchableOpacity
                                key={p.code}
                                onPress={() => setSelectedProvider(p)}
                                className={`flex-row items-center p-4 rounded-3xl border-2 mb-4 ${selectedProvider?.code === p.code ? 'border-[#01B764] bg-[#F5FDF9] dark:bg-[#1E2E28]' : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#252932]'
                                    }`}
                            >
                                <View className="w-12 h-12 rounded-full overflow-hidden mr-4 items-center justify-center bg-white">
                                    {p.code === 'MTN_MOMO' ? (
                                        <Image source={mtnLogo} style={{ width: 40, height: 40 }} resizeMode="contain" />
                                    ) : (
                                        <Ionicons name="card" size={24} color="#01B764" />
                                    )}
                                </View>
                                <Text className="flex-1 font-bold text-gray-900 dark:text-white">{p.name}</Text>
                                <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${selectedProvider?.code === p.code ? 'border-[#01B764]' : 'border-gray-300 dark:border-gray-600'
                                    }`}>
                                    {selectedProvider?.code === p.code && <View className="w-3 h-3 rounded-full bg-[#01B764]" />}
                                </View>
                            </TouchableOpacity>
                        ))}

                        {selectedProvider && (
                            <View className="mt-4 mb-20">
                                <Text className="text-gray-900 dark:text-white font-bold mb-2 ml-1">Phone Number</Text>
                                <TextInput
                                    className="bg-gray-50 dark:bg-[#252932] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white font-semibold"
                                    placeholder="e.g. 250790077242"
                                    placeholderTextColor="#9CA3AF"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        )}
                    </ScrollView>

                    {/* Bottom Buttons */}
                    <View className="px-6 py-4 flex-row gap-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1C1F26]">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="flex-1 py-4 rounded-full border border-gray-200 dark:border-gray-700 items-center"
                        >
                            <Text className="text-gray-500 font-bold text-lg">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleConfirm}
                            disabled={submitting || !selectedProvider}
                            className={`flex-[2] bg-[#01B764] py-4 rounded-full items-center shadow-lg ${submitting || !selectedProvider ? 'opacity-50' : ''}`}
                        >
                            {submitting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Confirm</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}
