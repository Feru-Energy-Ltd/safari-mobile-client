import { useColorScheme } from '@/components/useColorScheme.web';
import { getTransactions, getWalletBalance, Transaction } from '@/services/wallet.service';
import { logger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Filter, Search } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TransactionsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [userAccountNumber, setUserAccountNumber] = useState<string | null>(null);
    const [filterVisible, setFilterVisible] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESSFUL' | 'PENDING' | 'FAILED'>('ALL');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');

    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const textColor = isDarkMode ? '#FFFFFF' : '#111827';

    const fetchTransactions = async (accNum: string) => {
        try {
            const response = await getTransactions(accNum, 0, 100);
            setTransactions(response.content);
        } catch (error) {
            logger.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        async function init() {
            try {
                const info = await getWalletBalance();
                setUserAccountNumber(info.accountNumber);
                fetchTransactions(info.accountNumber);
            } catch (error) {
                logger.error('Error initializing transactions screen:', error);
                setLoading(false);
            }
        }
        init();
    }, []);

    const onRefresh = () => {
        if (userAccountNumber) {
            setRefreshing(true);
            fetchTransactions(userAccountNumber);
        }
    };

    const filteredTransactions = useMemo(() => {
        let result = transactions;

        // Apply Status Filter
        if (statusFilter !== 'ALL') {
            result = result.filter(tx => tx.status === statusFilter);
        }

        // Apply Type Filter
        if (typeFilter !== 'ALL') {
            result = result.filter(tx => tx.type === typeFilter);
        }

        // Apply Search Query
        if (searchQuery) {
            const lowQuery = searchQuery.toLowerCase();
            result = result.filter(tx =>
                tx.type.toLowerCase().includes(lowQuery) ||
                tx.transactionId.toLowerCase().includes(lowQuery) ||
                tx.status.toLowerCase().includes(lowQuery) ||
                tx.amount.toLowerCase().includes(lowQuery)
            );
        }

        return result;
    }, [transactions, searchQuery, statusFilter, typeFilter]);

    const formatCurrency = (amount: number | string) => {
        const value = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('en-RW', {
            style: 'currency',
            currency: 'RWF',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const renderTransactionItem = ({ item }: { item: Transaction }) => (
        <TouchableOpacity
            className="bg-white dark:bg-[#252932] mb-4 p-4 rounded-3xl flex-row items-center border border-gray-100 dark:border-gray-800 shadow-sm mx-6"
        >
            <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${item.type === 'CREDIT' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                }`}>
                <Ionicons
                    name={item.type === 'CREDIT' ? 'arrow-down' : 'arrow-up'}
                    size={20}
                    color={item.type === 'CREDIT' ? '#01B764' : '#F75555'}
                />
            </View>

            <View className="flex-1">
                <View className="flex-row items-center mb-1">
                    <View className={`px-2 py-0.5 rounded-md mr-2 ${item.type === 'CREDIT' ? 'border border-green-500' : 'border border-red-500'
                        }`}>
                        <Text className={`text-[10px] font-bold ${item.type === 'CREDIT' ? 'text-green-500' : 'text-red-500'
                            }`}>
                            {item.type === 'CREDIT' ? 'Topup' : 'Paid'}
                        </Text>
                    </View>
                    <Text className="font-bold text-gray-900 dark:text-white flex-1" numberOfLines={1}>
                        {item.type === 'CREDIT' ? 'Top Up Wallet' : 'Charging Service'}
                    </Text>
                </View>
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(item.transactionDate).toLocaleDateString()} • {new Date(item.transactionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>

            <View className="items-end">
                <Text className={`font-bold ${item.type === 'CREDIT' ? 'text-[#01B764]' : 'text-[#F75555]'
                    }`}>
                    {item.type === 'CREDIT' ? '+' : '-'} {formatCurrency(item.amount)}
                </Text>
                <Text className={`text-[10px] ${item.status === 'SUCCESSFUL' ? 'text-green-500' : 'text-orange-500'
                    }`}>
                    {item.status}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#1C1F26]">
            {/* Header */}
            <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <Ionicons name="arrow-back" size={24} color={textColor} />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900 dark:text-white">Recent Transactions</Text>
                </View>
            </View>

            {/* Search Bar */}
            <View className="px-6 py-4">
                <View className="bg-gray-50 dark:bg-[#252932] rounded-2xl flex-row items-center px-4 py-3">
                    <Search size={20} color="#9E9E9E" />
                    <TextInput
                        placeholder="Search transactions..."
                        placeholderTextColor="#9E9E9E"
                        className="flex-1 ml-3 text-gray-900 dark:text-white"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <TouchableOpacity
                        onPress={() => setFilterVisible(true)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        className="p-1"
                    >
                        <Filter size={20} color={statusFilter !== 'ALL' || typeFilter !== 'ALL' ? "#01B764" : "#9E9E9E"} />
                    </TouchableOpacity>
                </View>

                {/* Filter Badges */}
                {(statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
                    <View className="flex-row flex-wrap gap-2 mt-3">
                        {typeFilter !== 'ALL' && (
                            <View className="bg-[#01B764]/10 px-3 py-1 rounded-full flex-row items-center">
                                <Text className="text-[#01B764] text-xs font-medium mr-1">{typeFilter}</Text>
                                <TouchableOpacity onPress={() => setTypeFilter('ALL')}>
                                    <Ionicons name="close-circle" size={14} color="#01B764" />
                                </TouchableOpacity>
                            </View>
                        )}
                        {statusFilter !== 'ALL' && (
                            <View className="bg-[#01B764]/10 px-3 py-1 rounded-full flex-row items-center">
                                <Text className="text-[#01B764] text-xs font-medium mr-1">{statusFilter}</Text>
                                <TouchableOpacity onPress={() => setStatusFilter('ALL')}>
                                    <Ionicons name="close-circle" size={14} color="#01B764" />
                                </TouchableOpacity>
                            </View>
                        )}
                        <TouchableOpacity onPress={() => { setStatusFilter('ALL'); setTypeFilter('ALL'); }}>
                            <Text className="text-gray-500 text-xs mt-1 ml-1">Clear all</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Filter Overlay (Absolute View instead of Modal for better reliability) */}
            {filterVisible && (
                <View
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}
                >
                    <Pressable
                        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
                        onPress={() => setFilterVisible(false)}
                    >
                        <TouchableWithoutFeedback>
                            <View className="bg-white dark:bg-[#1C1F26] rounded-t-[40px] p-6 pb-12 shadow-2xl">
                                <View className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full self-center mb-6" />

                                <View className="flex-row justify-between items-center mb-6">
                                    <Text className="text-2xl font-bold text-gray-900 dark:text-white">Filter</Text>
                                    <TouchableOpacity onPress={() => { setStatusFilter('ALL'); setTypeFilter('ALL'); }}>
                                        <Text className="text-[#01B764] font-bold">Reset</Text>
                                    </TouchableOpacity>
                                </View>

                                <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Transaction Type</Text>
                                <View className="flex-row flex-wrap gap-3 mb-8">
                                    {['ALL', 'CREDIT', 'DEBIT'].map((type) => (
                                        <TouchableOpacity
                                            key={type}
                                            onPress={() => setTypeFilter(type as any)}
                                            className={`px-6 py-2.5 rounded-full border ${typeFilter === type
                                                ? 'bg-[#01B764] border-[#01B764]'
                                                : 'bg-transparent border-gray-200 dark:border-gray-700'
                                                }`}
                                        >
                                            <Text className={`font-bold ${typeFilter === type ? 'text-white' : 'text-gray-500'}`}>
                                                {type === 'ALL' ? 'All' : type === 'CREDIT' ? 'Topup' : 'Paid'}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Status</Text>
                                <View className="flex-row flex-wrap gap-3 mb-10">
                                    {['ALL', 'SUCCESSFUL', 'PENDING', 'FAILED'].map((status) => (
                                        <TouchableOpacity
                                            key={status}
                                            onPress={() => setStatusFilter(status as any)}
                                            className={`px-6 py-2.5 rounded-full border ${statusFilter === status
                                                ? 'bg-[#01B764] border-[#01B764]'
                                                : 'bg-transparent border-gray-200 dark:border-gray-700'
                                                }`}
                                        >
                                            <Text className={`font-bold ${statusFilter === status ? 'text-white' : 'text-gray-500'}`}>
                                                {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TouchableOpacity
                                    onPress={() => setFilterVisible(false)}
                                    className="bg-[#01B764] w-full py-4 rounded-full items-center shadow-lg"
                                >
                                    <Text className="text-white text-lg font-bold">Apply Filter</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </Pressable>
                </View>
            )}

            {loading && !refreshing ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#01B764" />
                </View>
            ) : (
                <FlatList
                    data={filteredTransactions}
                    keyExtractor={(item) => item.transactionId}
                    renderItem={renderTransactionItem}
                    contentContainerStyle={{ paddingTop: 10, paddingBottom: 40 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#01B764']} />
                    }
                    ListEmptyComponent={
                        <View className="py-20 items-center">
                            <Text className="text-gray-500 dark:text-gray-400">No transactions found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
