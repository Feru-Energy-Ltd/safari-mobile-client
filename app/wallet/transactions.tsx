import { useColorScheme } from '@/components/useColorScheme.web';
import { getTransactions, getWalletBalance, Transaction } from '@/services/wallet.service';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Filter, Search } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TransactionsScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [accountNumber, setAccountNumber] = useState<string | null>(null);
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const textColor = isDarkMode ? '#FFFFFF' : '#111827';

    const fetchTransactions = async (accNum: string) => {
        try {
            const response = await getTransactions(accNum, 0, 100);
            setTransactions(response.content);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        async function init() {
            try {
                const info = await getWalletBalance();
                setAccountNumber(info.accountNumber);
                fetchTransactions(info.accountNumber);
            } catch (error) {
                console.error('Error initializing transactions screen:', error);
                setLoading(false);
            }
        }
        init();
    }, []);

    const onRefresh = () => {
        if (accountNumber) {
            setRefreshing(true);
            fetchTransactions(accountNumber);
        }
    };

    const filteredTransactions = useMemo(() => {
        if (!searchQuery) return transactions;
        const lowQuery = searchQuery.toLowerCase();
        return transactions.filter(tx =>
            tx.type.toLowerCase().includes(lowQuery) ||
            tx.transactionId.toLowerCase().includes(lowQuery) ||
            tx.status.toLowerCase().includes(lowQuery)
        );
    }, [transactions, searchQuery]);

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
                <TouchableOpacity className="p-2">
                    <Search size={22} color="#01B764" />
                </TouchableOpacity>
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
                    <TouchableOpacity>
                        <Filter size={20} color="#01B764" />
                    </TouchableOpacity>
                </View>
            </View>

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
