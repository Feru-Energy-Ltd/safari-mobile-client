import { AlertType, CustomAlert } from '@/components/CustomAlert';
import { useColorScheme } from '@/components/useColorScheme';
import { deleteVehicle, getVehicles, Vehicle } from '@/services/vehicle.service';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    PanResponder,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';

const CAR_IMAGES = [
    require('@/assets/images/Compact-Car.png'),
    require('@/assets/images/Coupe-Car.png'),
    require('@/assets/images/Maserati-Ghibli.png'),
    require('@/assets/images/Economy-Car.png'),
    require('@/assets/images/Fancy-Car.png'),
];

const SwipeableVehicleCard = ({ vehicle, onDelete, children, cardColor, borderColor }: any) => {
    const panX = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) =>
                Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dx < 0 && gestureState.dx > -120) {
                    panX.setValue(gestureState.dx);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx < -50) {
                    Animated.spring(panX, {
                        toValue: -80,
                        useNativeDriver: true,
                        bounciness: 0,
                    }).start();
                } else {
                    Animated.spring(panX, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 0,
                    }).start();
                }
            },
        })
    ).current;

    const close = () => {
        Animated.spring(panX, {
            toValue: 0,
            useNativeDriver: true,
        }).start();
    };

    return (
        <View style={{ marginBottom: 16, borderRadius: 16, backgroundColor: '#FF4C4C' }}>
            <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, justifyContent: 'center', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => onDelete(vehicle, close)} style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="trash-outline" size={28} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
            <Animated.View
                {...panResponder.panHandlers}
                style={{
                    transform: [{ translateX: panX }],
                    backgroundColor: cardColor,
                    borderRadius: 16,
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: borderColor,
                }}
            >
                {children}
            </Animated.View>
        </View>
    );
};

export default function MyVehiclesScreen() {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadVehicles = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const res = await getVehicles();
            if (res && res.data) {
                setVehicles(res.data);
            }
        } catch (error: any) {
            if (error?.message?.includes('No vehicles found')) {
                setVehicles([]);
            } else {
                Alert.alert('Error', 'Could not load your vehicles. Please try again.');
            }
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

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

    const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
    const [closeFn, setCloseFn] = useState<(() => void) | null>(null);

    const handleDeleteSwipe = (vehicle: Vehicle, closeCallback: () => void) => {
        setVehicleToDelete(vehicle);
        setCloseFn(() => closeCallback);
        setAlertConfig({
            visible: true,
            type: 'warning',
            title: 'Delete Vehicle',
            message: `Are you sure you want to delete vehicle ${vehicle.plateNumber}?`,
            onConfirm: () => confirmDelete(vehicle),
        });
    };

    const confirmDelete = async (vehicle: Vehicle) => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        setIsLoading(true);
        try {
            await deleteVehicle(vehicle.id);
            Toast.show({ type: 'success', text1: 'Success', text2: 'Vehicle deleted successfully!', position: 'top' });
            await loadVehicles(false);
        } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete vehicle.' });
            if (closeFn) closeFn();
            setIsLoading(false);
        }
    };

    const onAlertClose = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        if (closeFn) closeFn();
    };

    useEffect(() => {
        loadVehicles();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadVehicles();
    };

    const bgColor = isDarkMode ? '#1C1F26' : '#FAFAFA';
    const cardColor = isDarkMode ? '#2A2D35' : '#FFFFFF';
    const textColor = isDarkMode ? '#FFFFFF' : '#111827';
    const subtitleColor = isDarkMode ? '#9CA3AF' : '#6B7280';
    const borderColor = isDarkMode ? '#374151' : '#F3F4F6';

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
                    <Ionicons name="arrow-back" size={26} color={textColor} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: '700', color: textColor }}>My Vehicle</Text>
                <TouchableOpacity onPress={() => router.push('/auth/create-vehicle')} style={{ padding: 4 }}>
                    <Ionicons name="add" size={28} color={textColor} />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#01B764" />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={{ padding: 20, paddingTop: 10, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#01B764" />}
                >
                    {vehicles.length === 0 ? (
                        <View style={{ alignItems: 'center', marginTop: 60 }}>
                            <Ionicons name="car-outline" size={60} color={subtitleColor} style={{ marginBottom: 16 }} />
                            <Text style={{ fontSize: 18, color: textColor, fontWeight: '600', marginBottom: 8 }}>No Vehicles Found</Text>
                            <Text style={{ fontSize: 14, color: subtitleColor, textAlign: 'center', marginHorizontal: 20 }}>
                                You haven't added any vehicles yet. Tap the + icon to register your first EV.
                            </Text>
                        </View>
                    ) : (
                        vehicles.map((vehicle) => (
                            <SwipeableVehicleCard
                                key={vehicle.id}
                                vehicle={vehicle}
                                onDelete={handleDeleteSwipe}
                                cardColor={cardColor}
                                borderColor={borderColor}
                                isDarkMode={isDarkMode}
                            >
                                {/* Car Image matching Mockup */}
                                <View style={{ width: 48, height: 72, alignItems: 'center', justifyContent: 'center' }}>
                                    <Image
                                        source={CAR_IMAGES[vehicle.id % CAR_IMAGES.length]}
                                        style={{ width: 56, height: 56, resizeMode: 'contain' }}
                                    />
                                </View>

                                <View style={{ flex: 1, marginLeft: 16 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>
                                            {vehicle.plateNumber}
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 13, color: subtitleColor, marginTop: 2 }}>
                                        {vehicle.vinNumber || vehicle.description}
                                    </Text>
                                </View>

                                {vehicle.active && (
                                    <View style={{ backgroundColor: '#01B764', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 12 }}>
                                        <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>Active</Text>
                                    </View>
                                )}
                                <Ionicons name="chevron-forward" size={20} color={subtitleColor} />
                            </SwipeableVehicleCard>
                        ))
                    )}
                </ScrollView>
            )}

            <CustomAlert
                visible={alertConfig.visible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                confirmText="Delete"
                onConfirm={alertConfig.onConfirm}
                onClose={onAlertClose}
            />
        </SafeAreaView>
    );
}
