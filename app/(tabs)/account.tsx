import { AlertType, CustomAlert } from '@/components/CustomAlert';
import { logout } from '@/services/auth.service';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';


interface SettingsItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
    isLast?: boolean;
    textColor?: string;
    iconColor?: string;
    rightElement?: React.ReactNode;
}

const SettingsItem = ({
    icon,
    title,
    value,
    onPress,
    showChevron = true,
    isLast = false,
    textColor,
    iconColor,
    rightElement,
}: SettingsItemProps) => {
    const { colorScheme } = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const defaultIconColor = isDarkMode ? '#FFFFFF' : '#1C1F26';
    const defaultTextColor = isDarkMode ? '#FFFFFF' : '#1C1F26';

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.6}
            style={styles.settingsItem}
        >
            <View style={styles.settingsItemIcon}>
                <Ionicons
                    name={icon}
                    size={22}
                    color={iconColor || defaultIconColor}
                />
            </View>

            <Text
                style={[
                    styles.settingsItemTitle,
                    { color: defaultTextColor },
                    textColor === 'text-red-500' && { color: '#EF4444' },
                ]}
            >
                {title}
            </Text>

            <View style={styles.settingsItemRight}>
                {value && (
                    <Text style={styles.settingsItemValue}>
                        {value}
                    </Text>
                )}
                {rightElement}
                {showChevron && !rightElement && (
                    <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#9CA3AF"
                    />
                )}
            </View>
        </TouchableOpacity>
    );
};

export default function AccountScreen() {
    const { colorScheme, setColorScheme } = useColorScheme();
    const router = useRouter();
    const isDarkMode = colorScheme === 'dark';

    const toggleDarkMode = () => {
        setColorScheme(isDarkMode ? 'light' : 'dark');
    };

    // Alert State
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        type: AlertType;
        title: string;
        message: string;
        onConfirm?: () => void;
    }>({
        visible: false,
        type: 'confirm',
        title: '',
        message: '',
    });

    const showConfirm = (title: string, message: string, onConfirm: () => void) => {
        setAlertConfig({ visible: true, type: 'confirm', title, message, onConfirm });
    };

    const dividerColor = isDarkMode ? '#2A2D35' : '#F0F0F0';

    const bgColor = isDarkMode ? '#1C1F26' : '#FFFFFF';

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: bgColor }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.headerIconContainer}>
                        <Ionicons name="flash" size={16} color="white" />
                    </View>
                    <Text style={[styles.headerTitle, { color: isDarkMode ? '#FFFFFF' : '#1C1F26' }]}>
                        Account
                    </Text>
                </View>
                {/* <TouchableOpacity
                    style={[styles.headerButton, { borderColor: isDarkMode ? '#2A2D35' : '#E5E7EB' }]}
                >
                    <Ionicons
                        name="ellipsis-horizontal-circle"
                        size={22}
                        color={isDarkMode ? '#FFFFFF' : '#1C1F26'}
                    />
                </TouchableOpacity> */}
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* Profile Row */}
                <View style={styles.profileSection}>
                    <TouchableOpacity
                        style={styles.profileRow}
                        activeOpacity={0.7}
                        onPress={() => router.push('/personal-info')}
                    >
                        <View style={[styles.avatarContainer, { backgroundColor: isDarkMode ? '#2A2D35' : '#F5F5F5' }]}>
                            <Text style={styles.avatarInitials}>AA</Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={[styles.profileName, { color: isDarkMode ? '#FFFFFF' : '#1C1F26' }]}>
                                Andrew Ainsley
                            </Text>
                            <Text style={styles.profilePhone}>+1 111 467 378 399</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                <View style={[styles.fullDivider, { backgroundColor: dividerColor }]} />

                {/* Section 1 */}
                <View style={styles.section}>
                    <SettingsItem icon="car-outline" title="My Vehicle" />
                    <View style={[styles.inlineDivider, { backgroundColor: dividerColor }]} />
                    <SettingsItem icon="card-outline" title="Payment Methods" />
                </View>

                <View style={[styles.sectionDivider, { backgroundColor: dividerColor }]} />

                {/* Section 2 */}
                <View style={styles.section}>
                    <SettingsItem
                        icon="person-outline"
                        title="Personal Info"
                        onPress={() => router.push('/personal-info')}
                    />
                    <View style={[styles.inlineDivider, { backgroundColor: dividerColor }]} />
                    <SettingsItem icon="shield-checkmark-outline" title="Security" />
                    <View style={[styles.inlineDivider, { backgroundColor: dividerColor }]} />
                    <SettingsItem icon="language-outline" title="Language" value="English (US)" />
                    <View style={[styles.inlineDivider, { backgroundColor: dividerColor }]} />
                    <SettingsItem
                        icon="eye-outline"
                        title="Dark Mode"
                        showChevron={false}
                        rightElement={
                            <Switch
                                trackColor={{ false: '#D1D5DB', true: '#01B764' }}
                                thumbColor="white"
                                ios_backgroundColor="#D1D5DB"
                                onValueChange={toggleDarkMode}
                                value={isDarkMode}
                            />
                        }
                    />
                </View>

                <View style={[styles.sectionDivider, { backgroundColor: dividerColor }]} />

                {/* Section 3 */}
                <View style={styles.section}>
                    <SettingsItem
                        icon="help-circle-outline"
                        title="Help Center"
                        onPress={() => router.push('/help-center')}
                    />
                    <View style={[styles.inlineDivider, { backgroundColor: dividerColor }]} />
                    <SettingsItem icon="lock-closed-outline" title="Privacy Policy" />
                    <View style={[styles.inlineDivider, { backgroundColor: dividerColor }]} />
                    <SettingsItem icon="information-circle-outline" title="About SafariCharger" />
                </View>

                <View style={[styles.sectionDivider, { backgroundColor: dividerColor }]} />

                {/* Logout */}
                <View style={styles.section}>
                    <SettingsItem
                        icon="log-out-outline"
                        title="Logout"
                        textColor="text-red-500"
                        iconColor="#EF4444"
                        showChevron={false}
                        onPress={() => {
                            showConfirm(
                                'Logout',
                                'Are you sure you want to logout of your account?',
                                async () => {
                                    await logout();
                                    router.replace('/login');
                                }
                            );
                        }}
                    />
                </View>
            </ScrollView>

            <CustomAlert
                visible={alertConfig.visible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                confirmText={alertConfig.type === 'confirm' ? 'Logout' : 'OK'}
                onConfirm={alertConfig.onConfirm}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
            />
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerIconContainer: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#01B764',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    headerButton: {
        width: 38,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 19,
        borderWidth: 1,
    },

    // Profile
    profileSection: {
        paddingHorizontal: 20,
        paddingVertical: 4,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
    avatarContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitials: {
        fontSize: 22,
        fontWeight: '700',
        color: '#01B764',
    },
    avatarEditButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 22,
        height: 22,
        borderRadius: 6,
        backgroundColor: '#01B764',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    profileInfo: {
        flex: 1,
        marginLeft: 14,
    },
    profileName: {
        fontSize: 19,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    profilePhone: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 3,
    },

    // Dividers
    fullDivider: {
        height: 1,
        marginHorizontal: 20,
        marginVertical: 4,
    },
    sectionDivider: {
        height: 8,
        marginVertical: 6,
    },
    inlineDivider: {
        height: 1,
        marginLeft: 50,
    },

    // Section container
    section: {
        paddingHorizontal: 20,
    },

    // Settings Items
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
    },
    settingsItemIcon: {
        width: 28,
        alignItems: 'center',
        marginRight: 14,
    },
    settingsItemTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    settingsItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    settingsItemValue: {
        fontSize: 15,
        fontWeight: '400',
        color: '#6B7280',
        marginRight: 4,
    },
});