import { Button } from '@/components/Button';
import { getProfile } from '@/services/auth.service';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';

const PRIMARY_GREEN = '#01B764';

export default function PersonalInfoScreen() {
    const { colorScheme } = useColorScheme();
    const router = useRouter();
    const isDarkMode = colorScheme === 'dark';

    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        displayName: '',
        email: '',
        phoneNumber: '',
    });

    const [tempForm, setTempForm] = useState({ ...form });

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
                console.error('Failed to fetch profile:', error);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Could not fetch profile information.',
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const bgColor = isDarkMode ? '#1C1F26' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : '#1C1F26';
    const secondaryTextColor = isDarkMode ? '#9CA3AF' : '#6B7280';

    const handleEdit = () => {
        setIsEditing(true);
        setTempForm({ ...form });
    };

    const handleCancel = () => {
        setIsEditing(false);
        setTempForm({ ...form });
    };

    const handleSave = () => {
        // Note: For now, we're just updating the local state.
        // A real implementation would call an updateProfile API here.
        setForm({ ...tempForm });
        setIsEditing(false);
        Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Personal information updated successfully!',
            position: 'top',
        });
    };

    const renderInput = (label: string, value: string, key: keyof typeof form, icon?: keyof typeof Ionicons.glyphMap) => (
        <View className="mb-6">
            <Text style={{ color: textColor, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>{label}</Text>
            <View
                className="flex-row items-center border-b pb-2"
                style={{ borderBottomColor: PRIMARY_GREEN }}
            >
                <TextInput
                    style={{
                        flex: 1,
                        color: textColor,
                        fontSize: 16,
                        fontWeight: '500',
                        paddingVertical: Platform.OS === 'ios' ? 4 : 0
                    }}
                    value={isEditing ? tempForm[key] : form[key]}
                    onChangeText={(text) => setTempForm(prev => ({ ...prev, [key]: text }))}
                    editable={isEditing}
                    placeholderTextColor={secondaryTextColor}
                    keyboardType={key === 'email' ? 'email-address' : key === 'phoneNumber' ? 'phone-pad' : 'default'}
                    autoCapitalize={key === 'email' ? 'none' : 'words'}
                />
                {icon && <Ionicons name={icon} size={20} color={isEditing ? PRIMARY_GREEN : secondaryTextColor} />}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4">
                <View className="flex-row items-center gap-4">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={textColor} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 22, fontWeight: '700', color: textColor }}>Personal Info</Text>
                </View>
                {!isEditing && (
                    <TouchableOpacity onPress={handleEdit}>
                        <Ionicons name="pencil-outline" size={24} color={textColor} />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Avatar Section */}
                <View className="items-center py-8">
                    <View
                        style={{
                            width: 120,
                            height: 120,
                            borderRadius: 60,
                            backgroundColor: isDarkMode ? '#2A2D35' : '#F5F5F5',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                        }}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="large" color={PRIMARY_GREEN} />
                        ) : (
                            <Text style={{ fontSize: 40, fontWeight: 'bold', color: PRIMARY_GREEN }}>
                                {form.displayName ? form.displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '??'}
                            </Text>
                        )}
                        {isEditing && !isLoading && (
                            <TouchableOpacity
                                style={{
                                    position: 'absolute',
                                    bottom: 5,
                                    right: 5,
                                    backgroundColor: PRIMARY_GREEN,
                                    borderRadius: 8,
                                    padding: 4,
                                    borderWidth: 2,
                                    borderColor: bgColor
                                }}
                            >
                                <Ionicons name="pencil" size={14} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Form Section */}
                <View className="px-5">
                    {isLoading ? (
                        <View className="py-10 items-center">
                            <ActivityIndicator size="small" color={PRIMARY_GREEN} />
                            <Text className="mt-4 text-gray-500">Loading your profile...</Text>
                        </View>
                    ) : (
                        <>
                            {renderInput('First Name', isEditing ? tempForm.firstName : form.firstName, 'firstName')}
                            {renderInput('Last Name', isEditing ? tempForm.lastName : form.lastName, 'lastName')}
                            {renderInput('Display Name', isEditing ? tempForm.displayName : form.displayName, 'displayName')}
                            {renderInput('Phone Number', isEditing ? tempForm.phoneNumber : form.phoneNumber, 'phoneNumber')}
                            {renderInput('Email', isEditing ? tempForm.email : form.email, 'email')}
                        </>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Actions */}
            {isEditing && (
                <View
                    className="absolute bottom-0 left-0 right-0 p-5 flex-row gap-4 border-t"
                    style={{ backgroundColor: bgColor, borderTopColor: isDarkMode ? '#2A2D35' : '#F3F4F6' }}
                >
                    <Button
                        title="Cancel"
                        type="secondary"
                        onPress={handleCancel}
                        className="flex-1"
                    />
                    <Button
                        title="Save Changes"
                        type="primary"
                        onPress={handleSave}
                        className="flex-1"
                    />
                </View>
            )}
        </SafeAreaView>
    );
}
