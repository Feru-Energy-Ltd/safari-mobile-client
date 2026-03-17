import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

export interface IButtonProps {
    title: string;
    onPress: () => void;
    type?: 'primary' | 'secondary';
    disabled?: boolean;
    className?: string;
    textStyle?: string;
    loading?: boolean;
    showSomeStyles?: boolean;
}

export const Button = (props: IButtonProps) => {
    const isPrimary = props.type === 'primary';
    const defaultBg = isPrimary ? 'bg-[#01B764]' : 'bg-[#EAF9F0]';
    const defaultTextColor = isPrimary ? 'text-white' : 'text-[#01B764]';

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            className={`h-[56px] rounded-full justify-center items-center px-8 ${defaultBg} ${props.className || ''}`}
            onPress={props.onPress}
            disabled={props.disabled || props.loading}
            style={props.showSomeStyles ? {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 4, // Android
            } : {}}
        >
            {props.loading ? (
                <ActivityIndicator color={isPrimary ? "#fff" : "#01B764"} />
            ) : (
                <Text className={`text-lg font-semibold ${defaultTextColor} ${props.textStyle || ''}`}>
                    {props.title}
                </Text>
            )}
        </TouchableOpacity>
    );
};
