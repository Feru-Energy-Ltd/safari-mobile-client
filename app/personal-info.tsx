import { Button } from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import {
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

    const [form, setForm] = useState({
        fullName: 'Andrew Ainsley',
        phoneNumber: '+1 111 467 378 399',
        email: 'andrew.ainsley@yourdomain.com',
        gender: 'Male',
        dob: '12/27/1995',
        address: '3517 W. Gray Street, New York',
        country: 'United States'
    });

    const [tempForm, setTempForm] = useState({ ...form });

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
        setForm({ ...tempForm });
        setIsEditing(false);
        Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Personal information updated successfully!',
            position: 'top',
        });
    };

    const renderInput = (label: string, value: string, key: keyof typeof tempForm, icon?: keyof typeof Ionicons.glyphMap) => (
        <View className="mb-6">
            <Text style={{ color: textColor, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>{label}</Text>
            <View
                className="flex-row items-center border-b pb-2"
                style={{ borderBottomColor: isEditing ? PRIMARY_GREEN : (isDarkMode ? '#35383F' : '#F3F4F6') }}
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
                />
                {icon && <Ionicons name={icon} size={20} color={isEditing ? PRIMARY_GREEN : secondaryTextColor} />}
                {label === 'Gender' && <Ionicons name="chevron-down" size={20} color={isEditing ? PRIMARY_GREEN : secondaryTextColor} />}
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
                        <Text style={{ fontSize: 40, fontWeight: 'bold', color: PRIMARY_GREEN }}>
                            {form.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </Text>
                        {isEditing && (
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
                    {renderInput('Full Name', isEditing ? tempForm.fullName : form.fullName, 'fullName')}
                    {renderInput('Phone Number', isEditing ? tempForm.phoneNumber : form.phoneNumber, 'phoneNumber')}
                    {renderInput('Email', isEditing ? tempForm.email : form.email, 'email')}
                    {renderInput('Gender', isEditing ? tempForm.gender : form.gender, 'gender')}
                    {renderInput('Date of Birth', isEditing ? tempForm.dob : form.dob, 'dob', 'calendar')}
                    {renderInput('Street Address', isEditing ? tempForm.address : form.address, 'address')}
                    {renderInput('Country', isEditing ? tempForm.country : form.country, 'country')}
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
