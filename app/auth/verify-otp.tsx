import { Button } from '@/components/Button';
import { AlertType, CustomAlert } from '@/components/CustomAlert';
import { useColorScheme } from '@/components/useColorScheme';
import { resendOtp, verifyOtp } from '@/services/auth.service';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function VerifyOtpScreen() {
    const params = useLocalSearchParams<{ email: string }>();
    const email = Array.isArray(params.email) ? params.email[0] : params.email;
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    const [otp, setOtp] = useState(['', '', '', '']);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const inputRefs = [
        useRef<TextInput>(null),
        useRef<TextInput>(null),
        useRef<TextInput>(null),
        useRef<TextInput>(null),
    ];

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

    useEffect(() => {
        let interval: any;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to next input if value is entered
        if (value.length === 1 && index < 3) {
            inputRefs[index + 1].current?.focus();
        }

        // Auto-verify if all 4 digits are entered
        if (newOtp.every(digit => digit !== '') && value !== '') {
            Keyboard.dismiss();
            handleVerify(newOtp.join(''));
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const handleVerify = async (code?: string) => {
        const otpCode = code || otp.join('');
        if (otpCode.length < 4) {
            showAlert('warning', 'Validation', 'Please enter the 4-digit code.');
            return;
        }

        if (!email) {
            showAlert('error', 'Configuration Error', 'Email is missing. Please try signing up again.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await verifyOtp({ email, otp: otpCode });
            Toast.show({
                type: 'success',
                text1: 'Verification Successful',
                text2: response.message || 'Account activated successfully. You can now log in.',
                position: 'top',
                visibilityTime: 4000,
            });
            router.replace('/auth/login');
        } catch (error: any) {
            showAlert('error', error?.title || 'Verification Failed', error?.message ?? 'Invalid or expired OTP.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;

        if (!email) {
            showAlert('error', 'Configuration Error', 'Email is missing. Please try signing up again.');
            return;
        }

        setIsResending(true);
        try {
            console.log(`[VerifyOTP] Resending OTP to email: ${email}`);
            const response = await resendOtp({ email });
            Toast.show({
                type: 'success',
                text1: 'OTP Sent',
                text2: response.message || 'A new verification code has been sent to your email.',
                position: 'top',
                visibilityTime: 4000,
            });
            setTimer(60);
            setCanResend(false);
            setOtp(['', '', '', '']);
            inputRefs[0].current?.focus();
        } catch (error: any) {
            console.error('[VerifyOTP] Resend failed:', error);
            showAlert('error', error?.title || 'Resend Failed', error?.message ?? 'Could not resend OTP.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#1C1F26]">
            <View className="flex-1 px-6 pt-4">
                {/* Back Button */}
                <TouchableOpacity onPress={() => router.back()} className="mb-6">
                    <Ionicons name="arrow-back" size={28} color={isDarkMode ? 'white' : 'black'} />
                </TouchableOpacity>

                <View className="mb-8">
                    <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        OTP code verification 🔐
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400 text-[16px] leading-6">
                        We have sent an OTP code to email <Text className="font-semibold text-gray-900 dark:text-white">{email}</Text>. Enter the OTP code below to continue.
                    </Text>
                </View>

                {/* OTP Input Boxes */}
                <View className="flex-row justify-between mb-10 px-2">
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={inputRefs[index]}
                            className={`w-[70px] h-[70px] rounded-2xl border-2 text-2xl text-center font-bold text-gray-900 dark:text-white ${digit ? 'border-[#01B764] bg-[#F5FDF9] dark:bg-[#1E2E28]' : 'border-gray-100 dark:border-[#2A2E37] bg-[#F8F9FA] dark:bg-[#2A2E37]'
                                }`}
                            value={digit}
                            onChangeText={(value) => handleOtpChange(value, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            autoFocus={index === 0}
                        />
                    ))}
                </View>

                <View className="items-center mb-10">
                    <Text className="text-gray-600 dark:text-gray-400 text-[16px] mb-2">
                        Didn't receive email?
                    </Text>
                    {canResend ? (
                        <TouchableOpacity onPress={handleResend} disabled={isResending}>
                            <Text className="text-[#01B764] text-[16px] font-bold">Resend Code</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text className="text-gray-500 dark:text-gray-400 text-[16px]">
                            You can resend code in <Text className="text-[#01B764] font-bold">{timer}</Text> s
                        </Text>
                    )}
                </View>

                <View className="flex-1 justify-end pb-10">
                    <Button
                        title="Verify"
                        type="primary"
                        onPress={() => handleVerify()}
                        loading={isLoading}
                        disabled={isLoading || otp.some(digit => digit === '')}
                        className="w-full"
                    />
                </View>
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
