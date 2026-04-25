import ShieldFlashIcon from '@/components/Icons';
import { getProfile, UserProfile } from '@/services/auth.service';
import { getRecentTransactions, getWalletBalance, Transaction, WalletInfo } from '@/services/wallet.service';
import { logger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Download } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WalletScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [walletError, setWalletError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const [balance, profile] = await Promise.all([
                getWalletBalance(),
                getProfile()
            ]);
            setWalletInfo(balance);
            setUserProfile(profile);

            const recentTx = await getRecentTransactions(balance.accountNumber);
            // Handle both flat array and paginated response
            if (Array.isArray(recentTx)) {
                setTransactions(recentTx.slice(0, 5));
            } else if (recentTx && (recentTx as any).content) {
                setTransactions((recentTx as any).content);
            } else {
                setTransactions([]);
            }
        } catch (error: any) {
            logger.error('Error fetching wallet data:', error);
            setWalletError(error.message || 'Could not fetch wallet data.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    if (loading && !refreshing) {
        return (
            <View className="flex-1 items-center justify-center bg-white dark:bg-[#1C1F26]">
                <ActivityIndicator size="large" color="#01B764" />
            </View>
        );
    }

    const formatCurrency = (amount: number | string) => {
        const value = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('en-RW', {
            style: 'currency',
            currency: 'RWF',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const formatTxDate = (arr?: number[]) => {
        if (!arr || arr.length < 6) return new Date();
        const [year, month, day, hour, minute, second] = arr;
        return new Date(year, month - 1, day, hour, minute, second);
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#1C1F26]">
            {/* Header */}
            <View className="px-6 py-4 flex-row justify-between items-center">
                <View className="flex-row gap-4 items-center">
                    <ShieldFlashIcon size={30} color="#01B764" />

                    <Text className="text-2xl font-bold text-gray-900 dark:text-white">My Wallet</Text>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#01B764']} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Wallet Card */}
                <View className="px-6 mt-4">
                    <View
                        className="bg-[#01B764] rounded-[32px] p-6 shadow-xl relative overflow-hidden"
                        style={{ height: 200 }}
                    >
                        {/* Abstract Background patterns could be added here if we had SVGs */}
                        <View className="flex-row justify-between items-start">
                            <View>
                                <Text className="text-white text-lg font-semibold mb-1">
                                    {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : ''}
                                </Text>
                                <Text className="text-white/80 text-base font-mono">
                                    {walletInfo?.accountNumber}
                                </Text>
                            </View>
                            <Ionicons name="card-outline" size={32} color="white" />
                        </View>

                        <View className="mt-auto">
                            <Text className="text-white/90 text-sm mb-1">Your balance</Text>
                            <View className="flex-row justify-between items-end">
                                <Text className="text-white text-4xl font-bold">
                                    {walletInfo ? formatCurrency(walletInfo.accountBalance) : 'RWF 0'}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => router.push('/wallet/topup')}
                                    className="bg-white px-5 py-2.5 rounded-full flex-row items-center"
                                >
                                    <Download size={18} color="#01B764" className="mr-2 transform rotate-180" />
                                    <Text className="text-[#01B764] font-bold">Top Up</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Recent Transactions Section */}
                <View className="px-6 mt-8 mb-8">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-xl font-bold text-gray-900 dark:text-white">Recent Transactions</Text>
                        {!walletError && transactions.length > 0 && (
                            <TouchableOpacity
                                onPress={() => router.push('/wallet/transactions')}
                                className="flex-row items-center"
                            >
                                <Text className="text-[#01B764] font-semibold mr-1">View All</Text>
                                <Ionicons name="arrow-forward" size={18} color="#01B764" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {transactions.length > 0 ? (
                        transactions.map((tx, index) => (
                            <TouchableOpacity
                                key={tx.id || index}
                                className="bg-white dark:bg-[#252932] mb-4 p-4 rounded-3xl flex-row items-center border border-gray-100 dark:border-gray-800 shadow-sm"
                            >
                                <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${tx.type === 'CREDIT' || tx.type === 'REFUND' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                                    }`}>
                                    <Ionicons
                                        name={tx.type === 'CREDIT' || tx.type === 'REFUND' ? 'arrow-down' : 'arrow-up'}
                                        size={20}
                                        color={tx.type === 'CREDIT' || tx.type === 'REFUND' ? '#01B764' : '#F75555'}
                                    />
                                </View>

                                <View className="flex-1">
                                    <View className="flex-row items-center mb-1">
                                        <View className={`px-2 py-0.5 rounded-md mr-2 ${tx.type === 'CREDIT' || tx.type === 'REFUND' ? 'border border-green-500' : 'border border-red-500'
                                            }`}>
                                            <Text className={`text-[10px] font-bold ${tx.type === 'CREDIT' || tx.type === 'REFUND' ? 'text-green-500' : 'text-red-500'
                                                }`}>
                                                {tx.type === 'CREDIT' ? 'Topup' : tx.type === 'REFUND' ? 'Refund' : 'Paid'}
                                            </Text>
                                        </View>
                                        <Text className="font-bold text-gray-900 dark:text-white flex-1" numberOfLines={1}>
                                            {tx.type === 'CREDIT' ? 'Top Up Wallet' : tx.type === 'REFUND' ? 'Refund' : 'Charging Service'}
                                        </Text>
                                    </View>
                                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatTxDate(tx.createdAt).toLocaleDateString()} • {formatTxDate(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>

                                <View className="items-end">
                                    <Text className={`font-bold ${tx.type === 'CREDIT' || tx.type === 'REFUND' ? 'text-[#01B764]' : 'text-[#F75555]'
                                        }`}>
                                        {tx.type === 'CREDIT' || tx.type === 'REFUND' ? '+' : '-'} {formatCurrency(tx.transactedAmount)}
                                    </Text>
                                    <Text className={`text-[10px] ${tx.status === 'SUCCESSFUL' || tx.status === 'COMPLETED' ? 'text-green-500' : 'text-orange-500'
                                        }`}>
                                        {tx.status}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View className="py-10 items-center">
                            <Text className="text-gray-500 dark:text-gray-400">No recent transactions</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

        </SafeAreaView >
    );
}
