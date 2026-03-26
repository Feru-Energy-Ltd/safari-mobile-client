import { Button } from '@/components/Button';
import { AlertType, CustomAlert } from '@/components/CustomAlert';
import { useColorScheme } from '@/components/useColorScheme';
import { login } from '@/services/auth.service';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function LoginScreen() {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Alert State
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        type: AlertType;
        title: string;
        message: string;
    }>({
        visible: false,
        type: 'error',
        title: '',
        message: '',
    });

    const showAlert = (type: AlertType, title: string, message: string) => {
        setAlertConfig({ visible: true, type, title, message });
    };

    const handleLogin = async () => {
        if (!email || !password) {
            showAlert('warning', 'Validation', 'Please enter your email and password.');
            return;
        }
        setIsLoading(true);
        try {
            const data = await login({ email, password });
            console.log('Login success:', data);

            Toast.show({
                type: 'success',
                text1: 'Login Successful',
                text2: 'Welcome back to SafariCharger!',
                position: 'top',
                visibilityTime: 3000,
                autoHide: true,
                topOffset: 60,
            });

            router.push('/(tabs)');
        } catch (error: any) {
            // console.error('Login error:', error);
            showAlert('error', 'Login Failed', error?.message ?? 'Could not reach the server.');
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
                {/* Back Button */}
                <TouchableOpacity onPress={() => router.back()} className="mb-8">
                    <Ionicons name="arrow-back" size={28} color={isDarkMode ? 'white' : 'black'} />
                </TouchableOpacity>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <View className="mb-10">
                        <Text className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
                            Login to your Account
                        </Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-[15px]">
                            Welcome back! Please enter your details.
                        </Text>
                    </View>

                    {/* Email */}
                    <View className="mb-4">
                        <Text className={labelClasses}>Email</Text>
                        <TextInput
                            className={inputClasses}
                            placeholder="Enter your email address"
                            placeholderTextColor={isDarkMode ? '#555A64' : '#9E9E9E'}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <View className={underlineClasses} />
                    </View>

                    {/* Password */}
                    <View className="mb-4">
                        <Text className={labelClasses}>Password</Text>
                        <View className="flex-row items-center">
                            <TextInput
                                className={inputClasses}
                                placeholder="Enter your password"
                                placeholderTextColor={isDarkMode ? '#555A64' : '#9E9E9E'}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    color={isDarkMode ? '#858E92' : '#9E9E9E'}
                                />
                            </TouchableOpacity>
                        </View>
                        <View className={underlineClasses} />
                    </View>

                    {/* Remember Me & Forgot Password */}
                    <View className="flex-row justify-between items-center mb-10 mt-2 px-1">
                        <View className="flex-row items-center">
                            <View className="w-5 h-5 rounded bg-[#01B764] items-center justify-center">
                                <Ionicons name="checkmark" size={14} color="white" />
                            </View>
                            <Text className="ml-2 text-sm text-gray-900 dark:text-white font-semibold">Remember me</Text>
                        </View>
                        <TouchableOpacity>
                            <Text className="text-[#01B764] text-sm font-semibold">Forgot Password?</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Login Button */}
                    <Button
                        title="Log in"
                        type="primary"
                        onPress={handleLogin}
                        loading={isLoading}
                        disabled={isLoading}
                        className="w-full mb-8"
                    />

                    <View className="flex-row justify-center">
                        <Text className="text-gray-500 dark:text-gray-400">Don't have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/signup')}>
                            <Text className="text-[#01B764] font-bold">Sign up</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>

            <CustomAlert
                visible={alertConfig.visible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
            />
        </SafeAreaView>
    );
}

