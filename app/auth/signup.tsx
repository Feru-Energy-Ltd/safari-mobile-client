import { Button } from '@/components/Button';
import { AlertType, CustomAlert } from '@/components/CustomAlert';
import { useColorScheme } from '@/components/useColorScheme';
import { register } from '@/services/auth.service';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CountryPicker, { Country, CountryCode, DARK_THEME, DEFAULT_THEME } from 'react-native-country-picker-modal';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';


export default function SignupScreen() {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isAgreed, setIsAgreed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [phoneError, setPhoneError] = useState('');

    const validatePhone = (text: string) => {
        const phoneRegex = /^\d{7,15}$/;
        const cleanPhone = text.replace(/[\s-]/g, '');
        if (!cleanPhone) {
            setPhoneError('Phone number is required');
            return false;
        } else if (!phoneRegex.test(cleanPhone)) {
            setPhoneError('Please enter a valid phone number');
            return false;
        }
        setPhoneError('');
        return true;
    };

    const validateEmail = (text: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!text) {
            setEmailError('Email is required');
            return false;
        } else if (!emailRegex.test(text)) {
            setEmailError('Please enter a valid email address');
            return false;
        }
        setEmailError('');
        return true;
    };

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

    const [countryCode, setCountryCode] = useState<CountryCode>('RW');

    const [callingCode, setCallingCode] = useState('250');
    const [showCountryPicker, setShowCountryPicker] = useState(false);

    const onSelectCountry = (country: Country) => {
        setCountryCode(country.cca2);
        setCallingCode(country.callingCode[0]);
    };

    const handleRegister = async () => {
        if (!firstName || !lastName || !email || !phone || !password) {
            showAlert('warning', 'Validation', 'Please fill in all required fields.');
            return;
        }
        if (emailError || !validateEmail(email)) {
            showAlert('warning', 'Validation', 'Please fix the errors before submitting.');
            return;
        }
        if (phoneError || !validatePhone(phone)) {
            showAlert('warning', 'Validation', 'Please fix the errors before submitting.');
            return;
        }
        if (!isAgreed) {
            showAlert('warning', 'Terms', 'Please agree to the Terms & Privacy Policy to continue.');
            return;
        }

        setIsLoading(true);
        try {
            const data = await register({
                email,
                password,
                firstName,
                lastName,
                phone: `+${callingCode}${phone}`,
            });

            // Show success toast with message from backend
            Toast.show({
                type: 'success',
                text1: 'Registration Successful',
                text2: data.message || 'Please check your email for a verification code.',
                position: 'top',
                visibilityTime: 5000,
                autoHide: true,
                topOffset: 60,
            });

            router.push('/auth/login');
        } catch (error: any) {
            showAlert('error', error?.title || 'Registration Failed', error?.message ?? 'Could not reach the server.');
        } finally {
            setIsLoading(false);
        }
    };


    const labelClasses = 'text-[16px] font-semibold text-gray-900 dark:text-white mb-2';
    const inputClasses = 'flex-1 mb-1 py-2 text-[16px] text-gray-900 dark:text-white';
    const underlineClasses = 'h-[1.5px] bg-[#01B764] mb-6';

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#1C1F26]">
            <View className="flex-1 px-6 pt-4">
                {/* Back Button */}
                <TouchableOpacity onPress={() => router.back()} className="mb-6">
                    <Ionicons name="arrow-back" size={28} color={isDarkMode ? 'white' : 'black'} />
                </TouchableOpacity>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    <View className="mb-8">
                        <Text className="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
                            Create your Account
                        </Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-[15px]">
                            Join SafariCharger today!
                        </Text>
                    </View>

                    {/* First Name */}
                    <View className="mb-2 flex flex-col">
                        <Text className={labelClasses}>First Name</Text>
                        <TextInput
                            className={inputClasses}
                            placeholder="Enter your first name"
                            placeholderTextColor={isDarkMode ? '#555A64' : '#9E9E9E'}
                            value={firstName}
                            onChangeText={setFirstName}
                            autoComplete="name"
                            textContentType="givenName"
                        />
                        <View className={underlineClasses} />
                    </View>

                    {/* Last Name */}
                    <View className="mb-2 flex flex-col">
                        <Text className={labelClasses}>Last Name</Text>
                        <TextInput
                            className={inputClasses}
                            placeholder="Enter your last name"
                            placeholderTextColor={isDarkMode ? '#555A64' : '#9E9E9E'}
                            value={lastName}
                            onChangeText={setLastName}
                            autoComplete="name"
                            textContentType="familyName"
                        />
                        <View className={underlineClasses} />
                    </View>

                    {/* Email */}
                    <View className="mb-2 flex flex-col">
                        <Text className={labelClasses}>Email</Text>
                        <TextInput
                            className={inputClasses}
                            placeholder="Enter your email"
                            placeholderTextColor={isDarkMode ? '#555A64' : '#9E9E9E'}
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (emailError) validateEmail(text);
                            }}
                            onBlur={() => validateEmail(email)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <View className={`h-[1.5px] ${emailError ? 'bg-red-500' : 'bg-[#01B764]'}`} />
                        <View className="h-6 pt-1">
                            {emailError ? (
                                <Text className="text-red-500 text-[12px] ml-1">{emailError}</Text>
                            ) : null}
                        </View>
                    </View>

                    {/* Phone Number */}
                    <View className="mb-2 flex flex-col">
                        <Text className={labelClasses}>Phone Number</Text>
                        <View className="flex-row items-center">
                            <TouchableOpacity
                                onPress={() => setShowCountryPicker(true)}
                                className="flex-row items-center pr-3"
                            >
                                <CountryPicker
                                    countryCode={countryCode}
                                    withFilter
                                    withFlag
                                    withCallingCode={false}
                                    withEmoji
                                    onSelect={onSelectCountry}
                                    visible={showCountryPicker}
                                    onClose={() => setShowCountryPicker(false)}
                                    theme={isDarkMode ? DARK_THEME : DEFAULT_THEME}
                                />
                                <Ionicons name="chevron-down" size={16} color={isDarkMode ? '#858E92' : '#9E9E9E'} className="ml-1" />
                            </TouchableOpacity>
                            <Text className="text-[16px] text-gray-900 dark:text-white font-medium mr-2" style={{ includeFontPadding: false, textAlignVertical: 'center' }}>
                                +{callingCode}
                            </Text>
                            <TextInput
                                className="flex-1 py-4 text-[16px] text-gray-900 dark:text-white"
                                placeholder="788007723"
                                placeholderTextColor={isDarkMode ? '#555A64' : '#9E9E9E'}
                                value={phone}
                                onChangeText={(text) => {
                                    setPhone(text);
                                    if (phoneError) validatePhone(text);
                                }}
                                onBlur={() => validatePhone(phone)}
                                keyboardType="phone-pad"
                                style={{ paddingVertical: 0 }}
                            />
                        </View>
                        <View className={`h-[1.5px] ${phoneError ? 'bg-red-500' : 'bg-[#01B764]'}`} />
                        <View className="h-6 pt-1">
                            {phoneError ? (
                                <Text className="text-red-500 text-[12px] ml-1">{phoneError}</Text>
                            ) : null}
                        </View>
                    </View>

                    {/* Password */}
                    <View className="mb-6 flex flex-col">
                        <Text className={labelClasses}>Password</Text>
                        <View className="flex-row items-center">
                            <TextInput
                                className={inputClasses}
                                placeholder="Password"
                                placeholderTextColor={isDarkMode ? '#555A64' : '#9E9E9E'}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color={isDarkMode ? '#858E92' : '#9E9E9E'}
                                />
                            </TouchableOpacity>
                        </View>
                        <View className={underlineClasses} />
                    </View>

                    {/* Agreement Checkbox */}
                    <View className="flex-row items-start mb-8 mt-2 px-1">
                        <TouchableOpacity
                            onPress={() => setIsAgreed(!isAgreed)}
                            className={`w-5 h-5 rounded border ${isAgreed ? 'bg-[#01B764] border-[#01B764]' : 'border-gray-300 dark:border-gray-600'} items-center justify-center mt-1`}
                        >
                            {isAgreed && <Ionicons name="checkmark" size={14} color="white" />}
                        </TouchableOpacity>
                        <Text className="ml-3 flex-1 text-[14px] text-gray-500 dark:text-gray-400 leading-5">
                            I agree to SafariCharger{' '}
                            <Text
                                className="text-[#01B764] font-semibold"
                                onPress={() => router.push('/terms')}
                            >
                                Terms & Privacy Policy
                            </Text>.
                        </Text>
                    </View>

                    {/* Sign Up Button */}
                    <Button
                        title="Sign up"
                        type="primary"
                        onPress={handleRegister}
                        loading={isLoading}
                        disabled={isLoading}
                        className="w-full mb-6"
                    />

                    <View className="flex-row justify-center mt-2">
                        <Text className="text-gray-500 dark:text-gray-400">Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/auth/login')}>
                            <Text className="text-[#01B764] font-semibold">Log in</Text>
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

