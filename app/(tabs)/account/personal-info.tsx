import { Button } from '@/components/Button';
import { changePassword, getProfile, updateProfile } from '@/services/auth.service';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const PRIMARY_GREEN = '#01B764';

type Tab = 'profile' | 'security';

export default function ProfileSecurityScreen() {
    const { colorScheme } = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const { tab } = useLocalSearchParams<{ tab?: string }>();

    const [activeTab, setActiveTab] = useState<Tab>((tab as Tab) || 'profile');

    // Profile State
    const [isEditing, setIsEditing] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        displayName: '',
        email: '',
        phoneNumber: '',
    });
    const [tempForm, setTempForm] = useState({ ...form });

    // Security State
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    useEffect(() => {
        if (tab && (tab === 'profile' || tab === 'security')) {
            setActiveTab(tab as Tab);
        }
    }, [tab]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getProfile();
                const profileData = {
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    displayName: data.displayName || '',
                    email: data.email || '',
                    phoneNumber: data.phone || '',
                };
                setForm(profileData);
                setTempForm(profileData);
            } catch (error) {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Could not fetch profile information.',
                });
            } finally {
                setIsLoadingProfile(false);
            }
        };
        fetchProfile();
    }, []);

    const bgColor = isDarkMode ? '#1C1F26' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : '#1C1F26';
    const secondaryTextColor = isDarkMode ? '#9CA3AF' : '#6B7280';
    const borderColor = isDarkMode ? '#2A2D35' : '#E5E7EB';
    const inputBgColor = isDarkMode ? '#232730' : '#F9FAF9';

    // --- Profile Handlers ---
    const handleEdit = () => {
        setIsEditing(true);
        setTempForm({ ...form });
    };

    const handleCancel = () => {
        setIsEditing(false);
        setTempForm({ ...form });
    };

    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        try {
            const payload = {
                firstName: tempForm.firstName,
                lastName: tempForm.lastName,
                phone: tempForm.phoneNumber,
                displayName: tempForm.displayName,
            };

            const updatedProfile = await updateProfile(payload);

            const profileData = {
                firstName: updatedProfile.firstName || '',
                lastName: updatedProfile.lastName || '',
                displayName: updatedProfile.displayName || '',
                email: updatedProfile.email || '',
                phoneNumber: updatedProfile.phone || '',
            };

            setForm(profileData);
            setIsEditing(false);

            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Personal information updated successfully!',
                position: 'top',
            });
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Update Failed',
                text2: error?.message || 'Something went wrong. Please try again.',
            });
        } finally {
            setIsSavingProfile(false);
        }
    };

    // --- Security Handlers ---
    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Toast.show({ type: 'error', text1: 'Validation', text2: 'Please fill in all password fields.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            Toast.show({ type: 'error', text1: 'Validation', text2: 'New passwords do not match.' });
            return;
        }
        if (newPassword.length < 8) {
            Toast.show({ type: 'error', text1: 'Validation', text2: 'New password must be at least 8 characters long.' });
            return;
        }

        setIsUpdatingPassword(true);
        try {
            await changePassword({ oldPassword, newPassword });
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Your password has been changed successfully.',
                position: 'top',
            });
            // Clear fields on success
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Update Failed',
                text2: error?.message ?? 'Could not update password. Please check your current password.',
            });
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const renderProfileInput = (label: string, value: string, key: keyof typeof form, icon: keyof typeof Ionicons.glyphMap) => {
        const isEmailField = key === 'email';
        const isFieldEditable = isEditing && !isEmailField;

        return (
            <View className="mb-5">
                <Text style={{ color: secondaryTextColor, fontSize: 13, fontWeight: '600', marginBottom: 6, marginLeft: 4 }}>
                    {label}
                </Text>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isFieldEditable ? inputBgColor : (isDarkMode ? '#1A1D24' : '#F3F4F6'),
                        borderWidth: 1.5,
                        borderColor: isFieldEditable ? PRIMARY_GREEN : borderColor,
                        borderRadius: 16,
                        paddingHorizontal: 16,
                        height: 56,
                    }}
                >
                    <Ionicons
                        name={icon}
                        size={20}
                        color={isFieldEditable ? PRIMARY_GREEN : secondaryTextColor}
                        style={{ marginRight: 12 }}
                    />
                    <TextInput
                        style={{
                            flex: 1,
                            color: isFieldEditable ? textColor : secondaryTextColor,
                            fontSize: 16,
                            fontWeight: '500',
                            height: '100%',
                        }}
                        value={isEditing ? tempForm[key] : form[key]}
                        onChangeText={(text) => setTempForm(prev => ({ ...prev, [key]: text }))}
                        editable={isFieldEditable}
                        placeholderTextColor={secondaryTextColor}
                        keyboardType={key === 'email' ? 'email-address' : key === 'phoneNumber' ? 'phone-pad' : 'default'}
                        autoCapitalize={key === 'email' ? 'none' : 'words'}
                    />
                    {isEmailField && (
                        <Ionicons name="lock-closed" size={16} color={secondaryTextColor} />
                    )}
                </View>
            </View>
        );
    };

    const renderPasswordInput = (
        label: string,
        value: string,
        setValue: (val: string) => void,
        show: boolean,
        setShow: (val: boolean) => void,
        placeholder: string
    ) => {
        return (
            <View className="mb-5">
                <Text style={{ color: secondaryTextColor, fontSize: 13, fontWeight: '600', marginBottom: 6, marginLeft: 4 }}>
                    {label}
                </Text>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: inputBgColor,
                        borderWidth: 1.5,
                        borderColor: borderColor,
                        borderRadius: 16,
                        paddingHorizontal: 16,
                        height: 56,
                    }}
                >
                    <Ionicons name="lock-closed-outline" size={20} color={secondaryTextColor} style={{ marginRight: 12 }} />
                    <TextInput
                        style={{
                            flex: 1,
                            color: textColor,
                            fontSize: 16,
                            fontWeight: '500',
                            height: '100%',
                        }}
                        placeholder={placeholder}
                        placeholderTextColor={secondaryTextColor}
                        value={value}
                        onChangeText={setValue}
                        secureTextEntry={!show}
                    />
                    <TouchableOpacity onPress={() => setShow(!show)} style={{ padding: 4 }}>
                        <Ionicons
                            name={show ? "eye-off-outline" : "eye-outline"}
                            size={20}
                            color={secondaryTextColor}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

                {/* Header */}
                <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
                    <View className="flex-row items-center gap-4">
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={26} color={textColor} />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 22, fontWeight: '700', color: textColor }}>Profile & Security</Text>
                    </View>
                    {!isEditing && activeTab === 'profile' && (
                        <TouchableOpacity onPress={handleEdit} style={{ padding: 4 }}>
                            <Ionicons name="pencil-outline" size={24} color={textColor} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Tab Switcher */}
                <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginTop: 12, borderBottomWidth: 1, borderBottomColor: borderColor }}>
                    <TouchableOpacity
                        style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'profile' ? PRIMARY_GREEN : 'transparent' }}
                        onPress={() => setActiveTab('profile')}
                    >
                        <Text style={{ fontSize: 16, fontWeight: '600', color: activeTab === 'profile' ? PRIMARY_GREEN : secondaryTextColor }}>
                            Profile
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'security' ? PRIMARY_GREEN : 'transparent' }}
                        onPress={() => setActiveTab('security')}
                    >
                        <Text style={{ fontSize: 16, fontWeight: '600', color: activeTab === 'security' ? PRIMARY_GREEN : secondaryTextColor }}>
                            Security
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <View className="pt-6">
                            <View className="items-center pb-8">
                                <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: isDarkMode ? '#2A2D35' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                                    {isLoadingProfile ? (
                                        <ActivityIndicator size="large" color={PRIMARY_GREEN} />
                                    ) : (
                                        <Text style={{ fontSize: 36, fontWeight: 'bold', color: PRIMARY_GREEN }}>
                                            {form.displayName ? form.displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '??'}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            <View className="px-5">
                                {isLoadingProfile ? (
                                    <View className="py-10 items-center">
                                        <ActivityIndicator size="small" color={PRIMARY_GREEN} />
                                    </View>
                                ) : (
                                    <>
                                        {renderProfileInput('First Name', isEditing ? tempForm.firstName : form.firstName, 'firstName', 'person')}
                                        {renderProfileInput('Last Name', isEditing ? tempForm.lastName : form.lastName, 'lastName', 'people')}
                                        {renderProfileInput('Display Name', isEditing ? tempForm.displayName : form.displayName, 'displayName', 'id-card')}
                                        {renderProfileInput('Phone Number', isEditing ? tempForm.phoneNumber : form.phoneNumber, 'phoneNumber', 'call')}
                                        {renderProfileInput('Email Address', isEditing ? tempForm.email : form.email, 'email', 'mail')}
                                    </>
                                )}
                            </View>
                        </View>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === 'security' && (
                        <View className="pt-6 px-5">
                            <Text style={{ fontSize: 15, color: secondaryTextColor, marginBottom: 24, lineHeight: 22 }}>
                                Update your password below to ensure your SafariCharger account remains secure.
                            </Text>

                            {renderPasswordInput('Current Password', oldPassword, setOldPassword, showOldPassword, setShowOldPassword, 'Enter current password')}
                            {renderPasswordInput('New Password', newPassword, setNewPassword, showNewPassword, setShowNewPassword, 'Enter new password')}
                            {renderPasswordInput('Confirm New Password', confirmPassword, setConfirmPassword, showConfirmPassword, setShowConfirmPassword, 'Confirm new password')}

                            <View className="mt-6">
                                <Button
                                    title="Update Password"
                                    type="primary"
                                    onPress={handleChangePassword}
                                    loading={isUpdatingPassword}
                                    disabled={isUpdatingPassword}
                                    className="w-full"
                                />
                            </View>
                        </View>
                    )}

                </ScrollView>

                {/* Bottom Actions for Profile Edit */}
                {activeTab === 'profile' && isEditing && (
                    <View
                        className="absolute bottom-0 left-0 right-0 p-5 flex-row gap-4 border-t"
                        style={{ backgroundColor: bgColor, borderTopColor: borderColor }}
                    >
                        <Button
                            title="Cancel"
                            type="secondary"
                            onPress={handleCancel}
                            disabled={isSavingProfile}
                            className="flex-1"
                        />
                        <Button
                            title="Save Changes"
                            type="primary"
                            onPress={handleSaveProfile}
                            loading={isSavingProfile}
                            disabled={isSavingProfile}
                            className="flex-1"
                        />
                    </View>
                )}

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
