import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import {
    LayoutAnimation,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PRIMARY_GREEN = '#01B764';

export default function HelpCenterScreen() {
    const { colorScheme } = useColorScheme();
    const router = useRouter();
    const isDarkMode = colorScheme === 'dark';

    const [activeTab, setActiveTab] = useState<'FAQ' | 'Contact'>('FAQ');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('General');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const bgColor = isDarkMode ? '#1C1F26' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : '#1C1F26';
    const secondaryTextColor = isDarkMode ? '#9CA3AF' : '#6B7280';
    const cardBg = isDarkMode ? '#2A2D35' : '#FFFFFF';

    const categories = ['General', 'Account', 'Service', 'Booking'];

    const faqs = [
        { id: 1, question: 'What is Safari Charger?', answer: 'Safari Charger is an innovative electric vehicle charging solution designed for Safari and off-road enthusiasts, providing reliable power in remote locations.' },
        { id: 2, question: 'Is the Safari Charger App free?', answer: 'Yes, the Safari Charger app is completely free to download and use for finding and managing your charging sessions.' },
        { id: 3, question: 'How can I make a station booking?', answer: 'Simply select a charger on the map, choose your preferred time slot, and confirm your booking through the app.' },
        { id: 4, question: 'How can I log out from Safari Charger?', answer: 'Go to the Account tab and scroll to the bottom to find the Logout button.' },
        { id: 5, question: 'How to close Safari Charger account?', answer: 'You can request account closure through the Security section in your account settings.' }
    ];

    const contactMethods = [
        { icon: 'headset-outline', title: 'Customer Service', link: 'Support' },
        { icon: 'logo-whatsapp', title: 'WhatsApp', link: 'Social' },
        { icon: 'logo-instagram', title: 'Instagram', link: 'Social' },
        { icon: 'logo-facebook', title: 'Facebook', link: 'Social' },
        { icon: 'logo-twitter', title: 'Twitter', link: 'Social' },
        { icon: 'globe-outline', title: 'Website', link: 'Web' }
    ];

    const toggleExpand = (id: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
            {/* Header */}
            <View className="flex-row items-center px-5 py-4 gap-4">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={textColor} />
                </TouchableOpacity>
                <Text style={{ fontSize: 22, fontWeight: '700', color: textColor }}>Help Center</Text>
            </View>

            {/* Tabs */}
            <View className="flex-row border-b border-gray-100 dark:border-gray-800">
                <TouchableOpacity
                    className={`flex-1 items-center py-4 border-b-2 ${activeTab === 'FAQ' ? 'border-[#01B764]' : 'border-transparent'}`}
                    onPress={() => setActiveTab('FAQ')}
                >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: activeTab === 'FAQ' ? PRIMARY_GREEN : secondaryTextColor }}>FAQ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`flex-1 items-center py-4 border-b-2 ${activeTab === 'Contact' ? 'border-[#01B764]' : 'border-transparent'}`}
                    onPress={() => setActiveTab('Contact')}
                >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: activeTab === 'Contact' ? PRIMARY_GREEN : secondaryTextColor }}>Contact us</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-5">
                {activeTab === 'FAQ' ? (
                    <>
                        {/* Search Bar */}
                        <View
                            className="flex-row items-center px-4 py-3 rounded-2xl mt-6 mb-4"
                            style={{ backgroundColor: isDarkMode ? '#2A2D35' : '#F5F5F7' }}
                        >
                            <Ionicons name="search" size={20} color="#9CA3AF" />
                            <TextInput
                                className="flex-1 ml-3"
                                placeholder="Search"
                                placeholderTextColor="#9CA3AF"
                                style={{ color: textColor, fontSize: 16 }}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            <Ionicons name="options-outline" size={20} color={PRIMARY_GREEN} />
                        </View>

                        {/* Categories */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                            {categories.map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setSelectedCategory(cat)}
                                    className={`px-6 py-2 rounded-full mr-3 border ${selectedCategory === cat ? 'bg-[#01B764] border-[#01B764]' : 'bg-transparent border-[#01B764]'}`}
                                >
                                    <Text style={{ color: selectedCategory === cat ? 'white' : PRIMARY_GREEN, fontWeight: '600' }}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* FAQ List */}
                        {faqs.map(faq => (
                            <View
                                key={faq.id}
                                className="mb-4 rounded-2xl p-4 shadow-sm"
                                style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: isDarkMode ? '#35383F' : '#F3F4F6' }}
                            >
                                <TouchableOpacity
                                    className="flex-row items-center justify-between"
                                    onPress={() => toggleExpand(faq.id)}
                                >
                                    <Text className="flex-1 pr-4" style={{ fontSize: 16, fontWeight: '700', color: textColor }}>{faq.question}</Text>
                                    <Ionicons name={expandedId === faq.id ? "chevron-up" : "chevron-down"} size={20} color={PRIMARY_GREEN} />
                                </TouchableOpacity>
                                {expandedId === faq.id && (
                                    <View className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <Text style={{ fontSize: 14, lineHeight: 22, color: secondaryTextColor }}>{faq.answer}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </>
                ) : (
                    <View className="mt-6">
                        {contactMethods.map((method, index) => (
                            <TouchableOpacity
                                key={index}
                                className="flex-row items-center p-4 rounded-2xl mb-4 shadow-sm"
                                style={{ backgroundColor: cardBg, borderWidth: 1, borderColor: isDarkMode ? '#35383F' : '#F3F4F6' }}
                            >
                                <Ionicons name={method.icon as any} size={24} color={PRIMARY_GREEN} />
                                <Text className="flex-1 ml-4" style={{ fontSize: 16, fontWeight: '600', color: textColor }}>{method.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
                <View className="h-10" />
            </ScrollView>
        </SafeAreaView>
    );
}
