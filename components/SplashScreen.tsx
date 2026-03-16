import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import Logo from './Logo';

type SplashScreenProps = {
    onAnimationComplete?: () => void;
};

export const SplashScreen = ({ onAnimationComplete }: SplashScreenProps) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    const [loaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
        ...FontAwesome.font,
    });

    const startAnimations = useCallback(() => {
        if (loaded) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 2,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start(({ finished }) => {
                if (finished && onAnimationComplete) {
                    setTimeout(onAnimationComplete, 500);
                }
            });
        }
    }, [fadeAnim, scaleAnim, loaded, onAnimationComplete]);

    useEffect(() => {
        startAnimations();
    }, [startAnimations]);

    if (!loaded) {
        return null;
    }

    return (
        <View className="bg-white flex-1 items-center justify-center">
            <Animated.View
                style={{
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                }}
                className="aspect-square w-3/5">
                <Logo />
            </Animated.View>
        </View>
    );
};
