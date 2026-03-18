import React from 'react';
import { View } from 'react-native';

interface PaginationIndicatorProps {
    totalDots: number;
    currentIndex: number;
}

export function PaginationIndicator({ totalDots, currentIndex }: PaginationIndicatorProps) {
    return (
        <View className="flex flex-row items-center justify-center">
            {Array.from({ length: totalDots }).map((_, index) => {
                const isActive = index === currentIndex;
                return (
                    <View
                        key={index}
                        className={`h-2 ml-2 rounded-full ${isActive ? 'w-6 bg-[#01B764]' : 'w-2 bg-[#E0E0E0]'
                            }`}
                    />
                );
            })}
        </View>
    );
}
