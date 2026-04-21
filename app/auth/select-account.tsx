import { Button } from '@/components/Button';
import { useColorScheme } from '@/components/useColorScheme';
import { Account, selectContext } from '@/services/auth.service';
import { getVehicles } from '@/services/vehicle.service';
import { logger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function SelectAccountScreen() {
    const { identityToken, accounts } = useLocalSearchParams<{ identityToken: string; accounts: string }>();
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    let parsedAccounts: Account[] = [];
    try {
        parsedAccounts = accounts ? JSON.parse(accounts) : [
            { accountId: 1, accountName: "John's Account", accountType: "PERSONAL", role: "OWNER" },
            { accountId: 2, accountName: "Safari Energy Ltd", accountType: "BUSINESS", role: "ADMIN" }
        ];
    } catch {
        parsedAccounts = [
            { accountId: 1, accountName: "John's Account", accountType: "PERSONAL", role: "OWNER" },
            { accountId: 2, accountName: "Safari Energy Ltd", accountType: "BUSINESS", role: "ADMIN" }
        ];
    }

    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleContinue = async () => {
        if (!selectedAccountId) return;
        setIsLoading(true);
        try {
            await selectContext({
                identityToken,
                contextId: selectedAccountId,
            });

            // Phase 3: Vehicle Check
            let hasVehicles = false;
            try {
                const vehicleRes = await getVehicles();
                if (vehicleRes && vehicleRes.data && vehicleRes.data.length > 0) {
                    hasVehicles = true;
                }
            } catch (vError: any) {
                if (vError?.message?.toLowerCase().includes('no vehicles found')) {
                    hasVehicles = false;
                } else {
                    logger.error('Vehicle check failed:', vError);
                    hasVehicles = true;
                }
            }

            Toast.show({
                type: 'success',
                text1: 'Login Successful',
                text2: 'Welcome to SafariCharger!',
                position: 'top',
                visibilityTime: 3000,
                autoHide: true,
                topOffset: 60,
            });

            if (hasVehicles) {
                router.replace('/(tabs)');
            } else {
                router.replace('/auth/add-vehicle');
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Selection Failed',
                text2: error?.message || 'Could not select the account.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const renderCard = (account: Account) => {
        const isSelected = selectedAccountId === account.accountId;
        const isPersonal = account.accountType === 'PERSONAL';

        return (
            <TouchableOpacity
                key={account.accountId}
                onPress={() => setSelectedAccountId(account.accountId)}
                style={{
                    width: '48%',
                    backgroundColor: isDarkMode ? '#2A2D35' : '#FFFFFF',
                    borderRadius: 24,
                    padding: 20,
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: isSelected ? '#01B764' : (isDarkMode ? '#374151' : '#F3F4F6'),
                    shadowColor: isSelected ? '#01B764' : '#000',
                    shadowOffset: { width: 0, height: isSelected ? 4 : 2 },
                    shadowOpacity: isSelected ? 0.15 : 0.05,
                    shadowRadius: isSelected ? 12 : 6,
                    elevation: isSelected ? 4 : 2,
                    marginBottom: 16,
                }}
            >
                <View
                    style={{
                        width: 72,
                        height: 72,
                        borderRadius: 36,
                        backgroundColor: isPersonal ? (isDarkMode ? '#233F31' : '#E8F8F0') : (isDarkMode ? '#2B3444' : '#E8F0FE'),
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                    }}
                >
                    <Ionicons
                        name={isPersonal ? 'person' : 'briefcase'}
                        size={32}
                        color={isPersonal ? '#01B764' : '#3B82F6'}
                    />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: isDarkMode ? '#FFFFFF' : '#111827', textAlign: 'center', marginBottom: 8 }}>
                    {isPersonal ? 'Personal Account' : account.accountName}
                </Text>
                <Text style={{ fontSize: 13, color: isDarkMode ? '#9CA3AF' : '#6B7280', textAlign: 'center', lineHeight: 18 }}>
                    {isPersonal ? 'I want to use it for personal matters.' : 'Company account associated with me.'}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: isDarkMode ? '#1C1F26' : '#FFFFFF' }}>
            {/* Header with Back Button similar to Mockup */}
            <View className="px-6 pt-4 pb-2 items-start">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={28} color={isDarkMode ? 'white' : 'black'} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingTop: 10, paddingBottom: 110 }}>
                {/* Header Logic */}
                <View className="items-center mb-10 mt-6">
                    <Image
                        source={require('../../assets/images/safaricharger.png')}
                        style={{ width: 300, height: 150, resizeMode: 'contain', marginBottom: 32 }}
                    />
                    <Text style={{ fontSize: 26, fontWeight: '600', color: isDarkMode ? '#FFFFFF' : '#111827', textAlign: 'center', marginBottom: 12 }}>
                        Choose Your Account Type
                    </Text>
                    <Text style={{ fontSize: 15, color: isDarkMode ? '#9CA3AF' : '#6B7280', textAlign: 'center', lineHeight: 22, paddingHorizontal: 12 }}>
                        Choose whether you are using SafariCharger for your personal use or managing a company account.
                    </Text>
                </View>

                {/* Separator / Divider - like in the mockup */}
                <View style={{ height: 1, backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', marginBottom: 32, marginHorizontal: 16 }} />

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    {parsedAccounts.map(renderCard)}
                </View>
            </ScrollView>

            {/* Bottom Button fixed to the bottom */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingTop: 16, backgroundColor: isDarkMode ? 'rgba(28,31,38,0.95)' : 'rgba(255,255,255,0.95)', borderTopWidth: 1, borderTopColor: isDarkMode ? '#2A2D35' : '#F3F4F6' }}>
                <Button
                    title="Continue"
                    type="primary"
                    onPress={handleContinue}
                    loading={isLoading}
                    disabled={isLoading || !selectedAccountId}
                    className="w-full"
                />
            </View>
        </SafeAreaView>
    );
}
