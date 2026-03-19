import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const Section = ({ title, content }: { title: string; content: React.ReactNode }) => {
    const { colorScheme } = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    return (
        <View className="mb-8">
            <Text className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                {title}
            </Text>
            <View className="text-gray-600 dark:text-gray-400 leading-6">
                {content}
            </View>
        </View>
    );
};

const Paragraph = ({ children }: { children: React.ReactNode }) => (
    <Text className="text-[15px] leading-6 text-gray-600 dark:text-gray-400 mb-4">
        {children}
    </Text>
);

const BulletPoint = ({ children }: { children: React.ReactNode }) => (
    <View className="flex-row mb-3 pl-2">
        <View className="w-1.5 h-1.5 rounded-full bg-[#01B764] mt-2 mr-3" />
        <Text className="flex-1 text-[15px] leading-6 text-gray-600 dark:text-gray-400">
            {children}
        </Text>
    </View>
);

export default function TermsScreen() {
    const { colorScheme } = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#1C1F26]">
            {/* Header */}
            <View className="flex-row items-center px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color={isDarkMode ? 'white' : '#1C1F26'}
                    />
                </TouchableOpacity>
                <Text className="ml-4 text-xl font-bold text-gray-900 dark:text-white">
                    Terms & Conditions
                </Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32 }}
            >
                <View className="mb-10">
                    <Text className="text-3xl font-extrabold text-[#01B764] mb-3">
                        SafariCharger
                    </Text>
                    <Text className="text-gray-500 dark:text-gray-500 text-[14px] uppercase tracking-wider font-semibold">
                        Last Updated: March 2026
                    </Text>
                </View>

                <Section
                    title="Introduction"
                    content={
                        <Paragraph>
                            Welcome to SafariCharger, a product of Feru Energy Ltd. These terms and conditions govern your use of the SafariCharger mobile application and the Charging Stations Management System (collectively referred to as the "Services"). By using the Services, you agree to comply with and be bound by these terms and conditions.
                        </Paragraph>
                    }
                />

                <Section
                    title="Definitions"
                    content={
                        <>
                            <BulletPoint>
                                <Text className="font-bold text-gray-900 dark:text-white">"We," "us," "our":</Text> Refers to Feru Energy Ltd.
                            </BulletPoint>
                            <BulletPoint>
                                <Text className="font-bold text-gray-900 dark:text-white">"You," "your," "user":</Text> Refers to the individual or entity using the Services.
                            </BulletPoint>
                            <BulletPoint>
                                <Text className="font-bold text-gray-900 dark:text-white">"Services":</Text> Refers to the SafariCharger mobile application and Charging Stations Management System.
                            </BulletPoint>
                            <BulletPoint>
                                <Text className="font-bold text-gray-900 dark:text-white">"Charging Station":</Text> Refers to the electric vehicle charging infrastructure managed by SafariCharger.
                            </BulletPoint>
                        </>
                    }
                />

                <Section
                    title="Use of Services"
                    content={
                        <>
                            <Text className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Eligibility</Text>
                            <Paragraph>
                                You must be at least 18 years old to use our Services. By using our Services, you represent and warrant that you meet this age requirement.
                            </Paragraph>

                            <Text className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Account Registration</Text>
                            <Paragraph>
                                To access certain features of the Services, you may need to register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
                            </Paragraph>

                            <Text className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Account Security</Text>
                            <Paragraph>
                                You are responsible for safeguarding your account credentials. You agree not to disclose your password to any third party and to notify us immediately of any unauthorized use of your account.
                            </Paragraph>
                        </>
                    }
                />

                <Section
                    title="Service Usage"
                    content={
                        <>
                            <Text className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Mobile Application</Text>
                            <BulletPoint>The SafariCharger mobile app provides users with access to information about charging stations, charging status, payment options, and other related features.</BulletPoint>
                            <BulletPoint>You agree to use the mobile app in compliance with all applicable laws and regulations.</BulletPoint>

                            <View className="mt-4">
                                <Text className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Charging Stations Management System</Text>
                                <BulletPoint>The Charging Stations Management System allows charging station owners to monitor and manage their charging infrastructure.</BulletPoint>
                                <BulletPoint>You agree to use the management system in accordance with the instructions provided and to maintain the confidentiality of any login credentials.</BulletPoint>
                            </View>
                        </>
                    }
                />

                <Section
                    title="Payments and Fees"
                    content={
                        <>
                            <Text className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Charging Fees</Text>
                            <Paragraph>
                                The fees for using the charging stations will be displayed in the SafariCharger mobile app. You agree to pay all fees associated with the use of the charging stations as indicated in the app.
                            </Paragraph>

                            <Text className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Subscription Fees</Text>
                            <Paragraph>
                                Certain features of the Charging Stations Management System may require a subscription. Subscription fees will be clearly communicated to you, and you agree to pay these fees in accordance with the subscription terms.
                            </Paragraph>
                        </>
                    }
                />

                <Section
                    title="User Conduct"
                    content={
                        <>
                            <Text className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Prohibited Activities</Text>
                            <BulletPoint>Using the Services for any illegal or unauthorized purpose.</BulletPoint>
                            <BulletPoint>Tampering with or circumventing any security measures of the Services.</BulletPoint>
                            <BulletPoint>Interfering with or disrupting the integrity or performance of the Services.</BulletPoint>

                            <View className="mt-4">
                                <Text className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">User Content</Text>
                                <Paragraph>
                                    You are solely responsible for any content you post, upload, or otherwise make available through the Services. You agree not to post content that is unlawful, offensive, or infringes on the rights of others.
                                </Paragraph>
                            </View>
                        </>
                    }
                />

                <Section
                    title="Intellectual Property"
                    content={
                        <>
                            <Text className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Ownership</Text>
                            <Paragraph>
                                All intellectual property rights in the Services, including but not limited to software, design, and content, are owned by Feru Energy Ltd. You agree not to reproduce, distribute, or create derivative works based on our intellectual property without our explicit permission.
                            </Paragraph>

                            <Text className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">License</Text>
                            <Paragraph>
                                Subject to your compliance with these terms, we grant you a limited, non-exclusive, non-transferable, and revocable license to use the Services.
                            </Paragraph>
                        </>
                    }
                />

                <Section
                    title="Limitation of Liability"
                    content={
                        <Paragraph>
                            To the maximum extent permitted by law, Feru Energy Ltd shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from:
                            {"\n\n"}• Your use or inability to use the Services.
                            {"\n"}• Any unauthorized access to or use of our servers and/or any personal information stored therein.
                            {"\n"}• Any interruption or cessation of transmission to or from the Services.
                        </Paragraph>
                    }
                />

                <Section
                    title="Indemnification"
                    content={
                        <Paragraph>
                            You agree to indemnify and hold harmless Feru Energy Ltd, its affiliates, and their respective officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including, without limitation, reasonable legal and accounting fees, arising out of or in any way connected with your access to or use of the Services or your violation of these terms.
                        </Paragraph>
                    }
                />

                <Section
                    title="Termination"
                    content={
                        <Paragraph>
                            We may terminate or suspend your access to the Services at any time, without prior notice or liability, for any reason whatsoever, including, without limitation, if you breach these terms. Upon termination, your right to use the Services will immediately cease.
                        </Paragraph>
                    }
                />

                <Section
                    title="Governing Law"
                    content={
                        <Paragraph>
                            These terms shall be governed and construed in accordance with the laws of Rwanda, without regard to its conflict of law provisions.
                        </Paragraph>
                    }
                />

                <Section
                    title="Changes to Terms"
                    content={
                        <Paragraph>
                            We reserve the right, at our sole discretion, to modify or replace these terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                        </Paragraph>
                    }
                />

                <Section
                    title="Contact Us"
                    content={
                        <View className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <Paragraph>
                                If you have any questions about these terms, please contact us at:
                            </Paragraph>
                            <View className="flex-row items-center mb-3">
                                <Ionicons name="mail-outline" size={18} color="#01B764" />
                                <Text className="ml-3 text-gray-700 dark:text-gray-300 font-medium">support@feruenergy.com</Text>
                            </View>
                            <View className="flex-row items-center">
                                <Ionicons name="call-outline" size={18} color="#01B764" />
                                <Text className="ml-3 text-gray-700 dark:text-gray-300 font-medium">+250 788 314509</Text>
                            </View>
                        </View>
                    }
                />

                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    );
}
