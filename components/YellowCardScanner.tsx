import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { parseYellowCardText } from '../utils/yellowCardParser';

// Safely require native module to prevent crash in Expo Go
let recognizeText: any = null;
try {
    const MLKit = require('@infinitered/react-native-mlkit-text-recognition');
    recognizeText = MLKit.recognizeText;
} catch (e) {
    console.warn('RNMLKitTextRecognition module not found (likely running in Expo Go)');
}

const { width, height } = Dimensions.get('window');

interface YellowCardScannerProps {
    visible: boolean;
    onClose: () => void;
    onScan: (plate: string, vin: string) => void;
    isDarkMode: boolean;
}

export default function YellowCardScanner({ visible, onClose, onScan, isDarkMode }: YellowCardScannerProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const [isScanning, setIsScanning] = useState(false);
    const cameraRef = useRef<any>(null);

    useEffect(() => {
        if (visible && !permission?.granted) {
            requestPermission();
        }
    }, [visible, permission]);

    const handleCapture = async () => {
        if (!cameraRef.current || isScanning) return;

        setIsScanning(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                base64: false,
            });

            // Fallback check if native module is not linked (e.g. in Expo Go)
            if (typeof recognizeText !== 'function') {
                throw new Error('OCR native module not found. Please ensure you are using a Development/Preview build.');
            }

            // Using Infinite Red's library API: recognizeText(uri)
            const result = await recognizeText(photo.uri);

            if (!result || !result.blocks) {
                throw new Error('OCR returned no results.');
            }

            // The library returns an object with { text: string, blocks: [...] }
            const textBlocks = result.blocks.map((block: any) => block.text);

            const { plateNumber, vinNumber } = parseYellowCardText(textBlocks);

            if (plateNumber || vinNumber) {
                onScan(plateNumber || '', vinNumber || '');
                onClose();
            } else {
                alert('Could not find Plate or VIN. Please ensure the card is well-lit and within the frame.');
            }
        } catch (error) {
            console.error('Scanning error:', error);
            alert('An error occurred while scanning. Please ensure you are using a Development Build, as OCR requires native modules.');
        } finally {
            setIsScanning(false);
        }
    };

    if (!permission) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View style={[styles.container, { backgroundColor: isDarkMode ? '#1C1F26' : '#000' }]}>
                {permission.granted ? (
                    <CameraView
                        ref={cameraRef}
                        style={styles.camera}
                        facing="back"
                    >
                        {/* Overlay */}
                        <View style={styles.overlay}>
                            <View style={styles.header}>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <Ionicons name="close" size={30} color="#FFF" />
                                </TouchableOpacity>
                                <Text style={styles.title}>Scan Card</Text>
                                <View style={{ width: 30 }} />
                            </View>

                            {/* Scanner Frame */}
                            <View style={styles.frameContainer}>
                                <View style={styles.frame}>
                                    <View style={[styles.corner, styles.topLeft]} />
                                    <View style={[styles.corner, styles.topRight]} />
                                    <View style={[styles.corner, styles.bottomLeft]} />
                                    <View style={[styles.corner, styles.bottomRight]} />
                                </View>
                                <Text style={styles.instruction}>
                                    Align your Yellow Card within the frame
                                </Text>
                            </View>

                            {/* Controls */}
                            <View style={styles.controls}>
                                <TouchableOpacity
                                    style={[styles.captureButton, isScanning && styles.captureButtonDisabled]}
                                    onPress={handleCapture}
                                    disabled={isScanning}
                                >
                                    <View style={styles.captureInner} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </CameraView>
                ) : (
                    <View style={styles.noPermission}>
                        <Text style={{ color: '#FFF', textAlign: 'center' }}>
                            Camera permission is required to scan the yellow card.
                        </Text>
                        <TouchableOpacity onPress={requestPermission} style={styles.retryButton}>
                            <Text style={styles.retryText}>Grant Permission</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'space-between',
        paddingVertical: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    closeButton: {
        padding: 8,
    },
    title: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    frameContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    frame: {
        width: width * 0.85,
        height: width * 0.55,
        borderWidth: 0,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#01B764',
        borderWidth: 4,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    topRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    instruction: {
        color: '#FFF',
        marginTop: 24,
        fontSize: 15,
        fontWeight: '500',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    controls: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFF',
    },
    captureButtonDisabled: {
        opacity: 0.5,
    },
    captureInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFF',
    },
    noPermission: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#01B764',
        borderRadius: 8,
    },
    retryText: {
        color: '#FFF',
        fontWeight: '600',
    },
});
