import { Button } from '@/components/Button';
import YellowCardScanner from '@/components/YellowCardScanner';
import { useColorScheme } from '@/components/useColorScheme';
import { ConnectorType, createVehicle, getConnectorTypes } from '@/services/vehicle.service';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import AcGbtIcon from '../../assets/images/connectors/AC_GBT.svg';
import AcType1Icon from '../../assets/images/connectors/AC_TYPE1_SEA_J1772.svg';
import AcType2Icon from '../../assets/images/connectors/AC_TYPE2_MENNEKES.svg';
import DcChaojiIcon from '../../assets/images/connectors/DC_CHAOJI_CHAdeMO3.svg';
import DcChadeMoIcon from '../../assets/images/connectors/DC_CHAdeMO.svg';
import DcGbtIcon from '../../assets/images/connectors/DC_GBT.svg';
import DcType1Icon from '../../assets/images/connectors/DC_TYPE1_CCS1.svg';
import DcType2Icon from '../../assets/images/connectors/DC_TYPE2_CCS2.svg';
import TeslaIcon from '../../assets/images/connectors/TESLA.svg';

const CONNECTOR_IMAGES: Record<string, any> = {
    'AC_GBT': AcGbtIcon,
    'AC_TYPE1_SEA_J1772': AcType1Icon,
    'AC_TYPE2_MENNEKES': AcType2Icon,
    'DC_CHAOJI_CHAdeMO3': DcChaojiIcon,
    'DC_CHAdeMO': DcChadeMoIcon,
    'DC_GBT': DcGbtIcon,
    'DC_TYPE1_CCS1': DcType1Icon,
    'DC_TYPE2_CCS2': DcType2Icon,
    'TESLA': TeslaIcon,
};

export default function CreateVehicleScreen() {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    const [plateNumber, setPlateNumber] = useState('');
    const [vinNumber, setVinNumber] = useState('');
    const [batteryCapacity, setBatteryCapacity] = useState('');
    const [description, setDescription] = useState('');

    const [connectorTypes, setConnectorTypes] = useState<ConnectorType[]>([]);
    const [selectedConnector, setSelectedConnector] = useState<ConnectorType | null>(null);

    const [isLoadConnectors, setIsLoadConnectors] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConnectorModal, setShowConnectorModal] = useState(false);
    const [showScanner, setShowScanner] = useState(false);

    useEffect(() => {
        const fetchConnectors = async () => {
            setIsLoadConnectors(true);
            try {
                const res = await getConnectorTypes();
                if (res && res.data) {
                    setConnectorTypes(res.data);
                }
            } catch (error) {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Could not fetch connector types.',
                });
            } finally {
                setIsLoadConnectors(false);
            }
        };

        fetchConnectors();
    }, []);

    const handleSubmit = async () => {
        if (!plateNumber || !vinNumber || !batteryCapacity || !selectedConnector) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Please fill out all required fields.',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await createVehicle({
                plateNumber,
                vinNumber,
                batteryCapacity: parseFloat(batteryCapacity),
                connectorType: selectedConnector.connectorType,
                description,
            });

            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Vehicle added successfully!',
                position: 'top',
            });

            // Navigate towards Dashboard
            router.replace('/(tabs)');
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Failed to Add Vehicle',
                text2: error?.message || 'Something went wrong.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputBgColor = isDarkMode ? '#2A2D35' : '#FFFFFF';
    const borderColor = isDarkMode ? '#374151' : '#E5E7EB';
    const focusedBorderColor = '#01B764';
    const textColor = isDarkMode ? '#FFFFFF' : '#111827';
    const placeholderColor = isDarkMode ? '#858E92' : '#9CA3AF';
    const labelColor = isDarkMode ? '#9CA3AF' : '#6B7280';

    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    const renderInput = (
        label: string,
        value: string,
        setValue: (val: string) => void,
        icon: keyof typeof Ionicons.glyphMap,
        placeholder: string,
        required = true,
        keyboardType: 'default' | 'numeric' = 'default',
        suffix?: string
    ) => {
        const isFocused = focusedInput === label;

        return (
            <View className="mb-5">
                <Text style={{ color: labelColor, fontSize: 13, fontWeight: '600', marginBottom: 6, marginLeft: 4 }}>
                    {label} {required && <Text style={{ color: '#EF4444' }}>*</Text>}
                </Text>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: inputBgColor,
                        borderWidth: 1.5,
                        borderColor: isFocused ? focusedBorderColor : borderColor,
                        borderRadius: 16,
                        paddingHorizontal: 16,
                        height: 56,
                    }}
                >
                    <Ionicons name={icon} size={20} color={isFocused ? focusedBorderColor : placeholderColor} style={{ marginRight: 12 }} />
                    <TextInput
                        style={{
                            flex: 1,
                            color: textColor,
                            fontSize: 16,
                            fontWeight: '500',
                            height: '100%',
                        }}
                        placeholder={placeholder}
                        placeholderTextColor={placeholderColor}
                        value={value}
                        onChangeText={setValue}
                        onFocus={() => setFocusedInput(label)}
                        onBlur={() => setFocusedInput(null)}
                        keyboardType={keyboardType}
                    />
                    {suffix && (
                        <Text style={{ color: labelColor, fontSize: 14, fontWeight: '600', marginLeft: 8 }}>
                            {suffix}
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 select-none" style={{ backgroundColor: isDarkMode ? '#1C1F26' : '#F9FAF9' }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header Back Button */}
                <View className="px-6 pt-4 pb-0 items-start">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={28} color={isDarkMode ? 'white' : 'black'} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 110 }}>
                    {/* Header Logic */}
                    <View className="items-center mb-8 mt-2">
                        <Image
                            source={require('../../assets/images/safaricharger.png')}
                            style={{ width: 250, height: 120, resizeMode: 'contain', marginBottom: 12 }}
                        />
                        <Text style={{ fontSize: 26, fontWeight: '700', color: isDarkMode ? '#FFFFFF' : '#111827', textAlign: 'center', marginBottom: 8 }}>
                            Add New Vehicle
                        </Text>
                        <Text style={{ fontSize: 15, color: isDarkMode ? '#9CA3AF' : '#6B7280', textAlign: 'center', lineHeight: 22, paddingHorizontal: 16 }}>
                            Register your EV to track charging sessions and optimize performance.
                        </Text>
                    </View>

                    {/* Scan Action */}
                    <TouchableOpacity
                        onPress={() => setShowScanner(true)}
                        activeOpacity={0.8}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isDarkMode ? '#233F31' : '#E8F8F0',
                            paddingVertical: 14,
                            borderRadius: 16,
                            marginBottom: 24,
                            borderWidth: 1,
                            borderColor: '#01B764',
                        }}
                    >
                        <Ionicons name="camera" size={20} color="#01B764" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#01B764', fontWeight: '700', fontSize: 15 }}>Scan Yellow Card</Text>
                    </TouchableOpacity>

                    {renderInput('Plate Number', plateNumber, setPlateNumber, 'car-outline', 'e.g. RAA 445K')}
                    {renderInput('VIN Number', vinNumber, setVinNumber, 'barcode-outline', 'Vehicle ID Number', true, 'default')}
                    {renderInput('Battery Capacity', batteryCapacity, setBatteryCapacity, 'battery-full-outline', 'e.g. 75', true, 'numeric', 'kWh')}

                    {/* Connector Type Dropdown */}
                    <View className="mb-5">
                        <Text style={{ color: labelColor, fontSize: 13, fontWeight: '600', marginBottom: 6, marginLeft: 4 }}>
                            Connector Type <Text style={{ color: '#EF4444' }}>*</Text>
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowConnectorModal(true)}
                            activeOpacity={0.8}
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
                            <Ionicons name="flash-outline" size={20} color={placeholderColor} style={{ marginRight: 12 }} />
                            {selectedConnector ? (
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                                    {(() => {
                                        const ConnectorIcon = CONNECTOR_IMAGES[selectedConnector.connectorType];
                                        return ConnectorIcon ? <ConnectorIcon width={24} height={24} style={{ marginRight: 8 }} /> : null;
                                    })()}
                                    <Text style={{ flex: 1, color: textColor, fontSize: 16, fontWeight: '500' }}>
                                        {selectedConnector.connectorName}
                                    </Text>
                                </View>
                            ) : (
                                <Text style={{ flex: 1, color: placeholderColor, fontSize: 16, fontWeight: '500' }}>
                                    Select Connector Type
                                </Text>
                            )}
                            <Ionicons name="chevron-down" size={20} color={placeholderColor} />
                        </TouchableOpacity>
                    </View>

                    {renderInput('Description', description, setDescription, 'document-text-outline', 'Optional details', false)}

                </ScrollView>

                {/* Bottom Fixed Action Button */}
                <View style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: 24, paddingTop: 16,
                    backgroundColor: isDarkMode ? 'rgba(28,31,38,0.95)' : 'rgba(249,250,249,0.95)',
                    borderTopWidth: 1, borderTopColor: isDarkMode ? '#2A2D35' : '#E5E7EB'
                }}>
                    <Button
                        title="Add Vehicle"
                        type="primary"
                        onPress={handleSubmit}
                        loading={isSubmitting}
                        disabled={isSubmitting || isLoadConnectors}
                        className="w-full"
                    />
                </View>

                {/* Connector Type Modal */}
                <Modal visible={showConnectorModal} animationType="slide" transparent={true}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                        <View style={{
                            backgroundColor: isDarkMode ? '#1C1F26' : '#FFFFFF',
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            maxHeight: '75%',
                            paddingTop: 8,
                        }}>
                            <View style={{ width: 40, height: 5, backgroundColor: isDarkMode ? '#374151' : '#E5E7EB', borderRadius: 3, alignSelf: 'center', marginVertical: 8 }} />

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12 }}>
                                <Text style={{ fontSize: 20, fontWeight: '700', color: textColor }}>Select Connector</Text>
                                <TouchableOpacity onPress={() => setShowConnectorModal(false)}>
                                    <Ionicons name="close" size={24} color={labelColor} />
                                </TouchableOpacity>
                            </View>

                            {isLoadConnectors ? (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <ActivityIndicator size="large" color="#01B764" />
                                    <Text style={{ color: labelColor, marginTop: 12 }}>Loading connectors...</Text>
                                </View>
                            ) : (
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
                                    {connectorTypes.map((connector) => (
                                        <TouchableOpacity
                                            key={connector.id}
                                            onPress={() => {
                                                setSelectedConnector(connector);
                                                setShowConnectorModal(false);
                                            }}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                padding: 16,
                                                marginBottom: 12,
                                                backgroundColor: selectedConnector?.id === connector.id ? (isDarkMode ? '#233F31' : '#E8F8F0') : inputBgColor,
                                                borderRadius: 16,
                                                borderWidth: 1,
                                                borderColor: selectedConnector?.id === connector.id ? '#01B764' : borderColor,
                                            }}
                                        >
                                            {(() => {
                                                const ConnectorItemIcon = CONNECTOR_IMAGES[connector.connectorType];
                                                return ConnectorItemIcon ? (
                                                    <ConnectorItemIcon width={44} height={44} style={{ marginRight: 16 }} />
                                                ) : (
                                                    <Ionicons name="flash-outline" size={36} color={labelColor} style={{ marginRight: 16 }} />
                                                );
                                            })()}

                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 16, fontWeight: '600', color: textColor, marginBottom: 4 }}>
                                                    {connector.connectorName}
                                                </Text>
                                                <Text style={{ fontSize: 13, color: labelColor }}>
                                                    {connector.level} • {connector.origin}
                                                </Text>
                                            </View>
                                            {selectedConnector?.id === connector.id && (
                                                <Ionicons name="checkmark-circle" size={24} color="#01B764" />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    </View>
                </Modal>

                <YellowCardScanner
                    visible={showScanner}
                    onClose={() => setShowScanner(false)}
                    isDarkMode={isDarkMode}
                    onScan={(plate, vin) => {
                        if (plate) setPlateNumber(plate);
                        if (vin) setVinNumber(vin);
                        Toast.show({
                            type: 'success',
                            text1: 'Scanned Successfully',
                            text2: 'Please verify the details below.',
                        });
                    }}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
