import { useColorScheme } from '@/components/useColorScheme.web';
import { getWalletBalance, topUpWallet, WalletInfo } from '@/services/wallet.service';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const STATIC_AMOUNTS = [100, 500, 1000, 2000, 5000, 10000, 20000, 50000];

export default function TopUpScreen() {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);

    useEffect(() => {
        async function fetchWallet() {
            try {
                const info = await getWalletBalance();
                setWalletInfo(info);
            } catch (error) {
                console.error('Error fetching wallet info:', error);
            }
        }
        fetchWallet();
    }, []);

    const handleAmountPress = (val: number) => {
        setAmount(val.toString());
    };

    const handleNumberPress = (num: string) => {
        setAmount(prev => prev + num);
    };

    const handleDelete = () => {
        setAmount(prev => prev.slice(0, -1));
    };

    const handleContinue = async () => {
        if (!amount || parseInt(amount) <= 0) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Amount',
                text2: 'Please enter a valid amount to top up.',
            });
            return;
        }

        if (!walletInfo?.accountNumber) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Wallet information not available.',
            });
            return;
        }

        setLoading(true);
        try {
            const response = await topUpWallet({
                amount: parseInt(amount),
                phoneNumber: walletInfo.accountNumber
            });

            if (response.status) {
                Toast.show({
                    type: 'success',
                    text1: 'Request Accepted',
                    text2: 'Your top-up request is being processed.',
                });
                router.back();
            } else {
                throw new Error(response.message || 'Top-up failed');
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Top-up Failed',
                text2: error.message || 'Something went wrong.',
            });
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: string) => {
        if (!val) return 'RWF 0';
        return new Intl.NumberFormat('en-RW', {
            style: 'currency',
            currency: 'RWF',
            minimumFractionDigits: 0,
        }).format(parseInt(val));
    };

    const KeypadButton = ({ label, onPress, icon }: { label?: string; onPress: () => void; icon?: React.ReactNode }) => (
        <TouchableOpacity
            onPress={onPress}
            className="w-[30%] aspect-square items-center justify-center m-1 rounded-2xl"
        >
            {icon ? icon : <Text className="text-2xl font-bold text-gray-900 dark:text-white">{label}</Text>}
        </TouchableOpacity>
    );
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const textColor = isDarkMode ? '#FFFFFF' : '#111827';


    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#1C1F26]">
            {/* Header */}
            <View className="px-6 py-4 flex-row items-center border-b border-gray-100 dark:border-gray-800">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color={textColor} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900 dark:text-white">Top Up Wallet</Text>
            </View>

            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
                <Text className="text-center text-gray-500 mt-8 mb-4">Enter the amount of top up</Text>

                {/* Amount Input Display */}
                <View className="border-2 border-[#01B764] rounded-3xl p-8 items-center mb-8">
                    <Text className="text-4xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(amount)}
                    </Text>
                </View>

                {/* Static Amounts Grid */}
                <View className="flex-row flex-wrap justify-between mb-8">
                    {STATIC_AMOUNTS.map((val) => (
                        <TouchableOpacity
                            key={val}
                            onPress={() => handleAmountPress(val)}
                            className={`w-[31%] py-3 mb-3 rounded-full border items-center ${amount === val.toString()
                                ? 'bg-[#01B764] border-[#01B764]'
                                : 'border-[#01B764]'
                                }`}
                        >
                            <Text className={`font-bold ${amount === val.toString() ? 'text-white' : 'text-[#01B764]'
                                }`}>
                                RWF {val}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                    onPress={handleContinue}
                    disabled={loading || !amount}
                    className={`bg-[#01B764] py-4 rounded-full items-center shadow-lg mb-8 ${(loading || !amount) ? 'opacity-50' : ''
                        }`}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Continue</Text>
                    )}
                </TouchableOpacity>

                {/* Custom Keypad */}
                <View className="flex-row flex-wrap justify-center mb-10">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <KeypadButton key={num} label={num.toString()} onPress={() => handleNumberPress(num.toString())} />
                    ))}
                    <KeypadButton label="*" onPress={() => { }} />
                    <KeypadButton label="0" onPress={() => handleNumberPress('0')} />
                    <KeypadButton
                        onPress={handleDelete}
                        icon={<Ionicons name="backspace-outline" size={32} color="#F75555" />}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
