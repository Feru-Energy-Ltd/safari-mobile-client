import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button } from './Button';
import { useColorScheme } from './useColorScheme';

export type AlertType = 'success' | 'error' | 'warning' | 'confirm';

interface CustomAlertProps {
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    onClose: () => void;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
}

export const CustomAlert = ({
    visible,
    type,
    title,
    message,
    onClose,
    onConfirm,
    confirmText = 'OK',
    cancelText = 'Cancel',
}: CustomAlertProps) => {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    // Manage mounting state for backdrop animation
    const [shouldRender, setShouldRender] = React.useState(visible);

    // Animations
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const modalY = useRef(new Animated.Value(300)).current;

    useEffect(() => {
        if (visible) {
            setShouldRender(true);
            Animated.parallel([
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(modalY, {
                    toValue: 0,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(backdropOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(modalY, {
                    toValue: 300,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setShouldRender(false);
            });
        }
    }, [visible]);

    if (!shouldRender) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return { name: 'checkmark-circle-outline' as const, color: '#01B764' };
            case 'error':
                return { name: 'close-circle-outline' as const, color: '#EF4444' };
            case 'warning':
                return { name: 'alert-circle-outline' as const, color: '#F59E0B' };
            case 'confirm':
                return { name: 'help-circle-outline' as const, color: '#01B764' };
            default:
                return { name: 'information-circle-outline' as const, color: '#01B764' };
        }
    };

    const icon = getIcon();

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={styles.overlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
                    <Animated.View
                        style={[
                            styles.backdrop,
                            { opacity: backdropOpacity }
                        ]}
                    />
                </Pressable>

                <Animated.View
                    style={[
                        styles.container,
                        {
                            backgroundColor: isDarkMode ? '#1C1F26' : '#FFFFFF',
                            transform: [{ translateY: modalY }],
                        },
                    ]}
                >
                    <View style={[styles.dragHandle, { backgroundColor: isDarkMode ? '#35383F' : '#E5E7EB' }]} />

                    <View style={styles.content}>
                        <View style={[styles.iconWrapper, { backgroundColor: `${icon.color}15` }]}>
                            <Ionicons name={icon.name} size={40} color={icon.color} />
                        </View>

                        <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : '#1C1F26' }]}>
                            {title}
                        </Text>

                        <Text style={[styles.message, { color: isDarkMode ? '#9CA3AF' : '#6B7280' }]}>
                            {message}
                        </Text>

                        <View style={styles.buttonContainer}>
                            {type === 'confirm' && (
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={onClose}
                                    style={[
                                        styles.secondaryButton,
                                        { backgroundColor: isDarkMode ? '#35383F' : '#EAF9F0' }
                                    ]}
                                >
                                    <Text style={[styles.secondaryButtonText, { color: isDarkMode ? 'white' : '#01B764' }]}>
                                        {cancelText}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <Button
                                title={confirmText}
                                type="primary"
                                onPress={() => {
                                    if (onConfirm) {
                                        onConfirm();
                                    } else {
                                        onClose();
                                    }
                                }}
                                className={type === 'confirm' ? "flex-1" : "w-full"}
                            />
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    container: {
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        paddingBottom: 40,
        paddingTop: 12,
        paddingHorizontal: 24,
        maxHeight: '80%',
    },
    dragHandle: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
        alignSelf: 'center',
        marginBottom: 24,
    },
    content: {
        alignItems: 'center',
    },
    iconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    secondaryButton: {
        flex: 1,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
