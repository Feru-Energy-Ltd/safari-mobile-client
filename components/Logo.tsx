import React from 'react';
import { Image, View } from 'react-native';

export default function Logo() {
    return (
        <View className="items-center justify-center">
            <Image
                source={require('@/assets/images/safaricharger.png')}
                className="w-full h-full"
                resizeMode="contain"
            />
        </View>
    );
}
