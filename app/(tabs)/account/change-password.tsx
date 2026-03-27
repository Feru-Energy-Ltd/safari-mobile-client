import { Button } from '@/components/Button';
import { AlertType, CustomAlert } from '@/components/CustomAlert';
import { useColorScheme } from '@/components/useColorScheme';
import { changePassword } from '@/services/auth.service';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ChangePasswordScreen() {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);

    // Alert State
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        type: AlertType;
        title: string;
        message: string;
        onConfirm?: () => void;
    }>({
        visible: false,
        type: 'error',
        title: '',
        message: '',
    });

    const showAlert = (type: AlertType, title: string, message: string, onConfirm?: () => void) => {
        setAlertConfig({ visible: true, type, title, message, onConfirm });
    };

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            showAlert('warning', 'Validation', 'Please fill in all password fields.');
            return;
        }

        if (newPassword !== confirmPassword) {
            showAlert('warning', 'Validation', 'New passwords do not match.');
            return;
        }

        if (newPassword.length < 8) {
            showAlert('warning', 'Validation', 'New password must be at least 8 characters long.');
            return;
        }

        setIsLoading(true);
        try {
            await changePassword({ oldPassword, newPassword });
            showAlert('success', 'Success', 'Your password has been changed successfully.', () => {
                router.back();
            });
        } catch (error: any) {
            showAlert('error', 'Update Failed', error?.message ?? 'Could not update password. Please check your current password.');
        } finally {
            setIsLoading(false);
        }
    };

    const labelClasses = "text-[16px] font-semibold text-gray-900 dark:text-white mb-2";
    const inputClasses = "flex-1 py-3 text-[16px] text-gray-900 dark:text-white";
    const underlineClasses = "h-[1.5px] bg-[#01B764] mb-8";

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#1C1F26]">
            <View className="flex-1 px-6 pt-4">
                {/* Header */}
                <View className="flex-row items-center mb-8">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <Ionicons name="arrow-back" size={28} color={isDarkMode ? 'white' : 'black'} />
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-gray-900 dark:text-white">Change Password</Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text className="text-gray-500 dark:text-gray-400 text-[15px] mb-10">
                        Enter your current password and a new one to update your security.
                    </Text>

                    {/* Old Password */}
                    <View className="mb-4">
                        <Text className={labelClasses}>Current Password</Text>
                        <View className="flex-row items-center">
                            <TextInput
                                className={inputClasses}
                                placeholder="Enter current password"
                                placeholderTextColor={isDarkMode ? '#555A64' : '#9E9E9E'}
                                value={oldPassword}
                                onChangeText={setOldPassword}
                                secureTextEntry={!showOldPassword}
                            />
                            <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)}>
                                <Ionicons
                                    name={showOldPassword ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    color={isDarkMode ? '#858E92' : '#9E9E9E'}
                                />
                            </TouchableOpacity>
                        </View>
                        <View className={underlineClasses} />
                    </View>

                    {/* New Password */}
                    <View className="mb-4">
                        <Text className={labelClasses}>New Password</Text>
                        <View className="flex-row items-center">
                            <TextInput
                                className={inputClasses}
                                placeholder="Enter new password"
                                placeholderTextColor={isDarkMode ? '#555A64' : '#9E9E9E'}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showNewPassword}
                            />
                            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                <Ionicons
                                    name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    color={isDarkMode ? '#858E92' : '#9E9E9E'}
                                />
                            </TouchableOpacity>
                        </View>
                        <View className={underlineClasses} />
                    </View>

                    {/* Confirm New Password */}
                    <View className="mb-4">
                        <Text className={labelClasses}>Confirm New Password</Text>
                        <View className="flex-row items-center">
                            <TextInput
                                className={inputClasses}
                                placeholder="Confirm new password"
                                placeholderTextColor={isDarkMode ? '#555A64' : '#9E9E9E'}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                <Ionicons
                                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    color={isDarkMode ? '#858E92' : '#9E9E9E'}
                                />
                            </TouchableOpacity>
                        </View>
                        <View className={underlineClasses} />
                    </View>

                    <View className="mt-8 gap-4">
                        <Button
                            title="Update Password"
                            type="primary"
                            onPress={handleChangePassword}
                            loading={isLoading}
                            disabled={isLoading}
                            className="w-full"
                        />
                    </View>
                </ScrollView>
            </View>

            <CustomAlert
                visible={alertConfig.visible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onConfirm={alertConfig.onConfirm}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
            />
        </SafeAreaView>
    );
}
