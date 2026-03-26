import React from 'react';
import { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';
import { useColorScheme } from './useColorScheme';

const PRIMARY_GREEN = '#01B764';

export const toastConfig: ToastConfig = {
    success: (props) => {
        const isDarkMode = useColorScheme() === 'dark';
        return (
            <BaseToast
                {...props}
                style={{
                    borderLeftColor: PRIMARY_GREEN,
                    backgroundColor: isDarkMode ? '#1C1F26' : '#FFFFFF',
                    height: 70,
                    borderRadius: 16,
                    borderLeftWidth: 10,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 5,
                }}
                contentContainerStyle={{ paddingHorizontal: 15 }}
                text1Style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: isDarkMode ? '#FFFFFF' : '#000000'
                }}
                text2Style={{
                    fontSize: 14,
                    color: isDarkMode ? '#E0E0E0' : '#616161'
                }}
            />
        );
    },
    error: (props) => {
        const isDarkMode = useColorScheme() === 'dark';
        return (
            <ErrorToast
                {...props}
                style={{
                    borderLeftColor: '#F75555',
                    backgroundColor: isDarkMode ? '#1C1F26' : '#FFFFFF',
                    height: 70,
                    borderRadius: 16,
                    borderLeftWidth: 10,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 5,
                }}
                contentContainerStyle={{ paddingHorizontal: 15 }}
                text1Style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: isDarkMode ? '#FFFFFF' : '#000000'
                }}
                text2Style={{
                    fontSize: 14,
                    color: isDarkMode ? '#E0E0E0' : '#616161'
                }}
            />
        );
    },
    info: (props) => {
        const isDarkMode = useColorScheme() === 'dark';
        return (
            <BaseToast
                {...props}
                style={{
                    borderLeftColor: '#246BFD',
                    backgroundColor: isDarkMode ? '#1C1F26' : '#FFFFFF',
                    height: 70,
                    borderRadius: 16,
                    borderLeftWidth: 10,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 5,
                }}
                contentContainerStyle={{ paddingHorizontal: 15 }}
                text1Style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: isDarkMode ? '#FFFFFF' : '#000000'
                }}
                text2Style={{
                    fontSize: 14,
                    color: isDarkMode ? '#E0E0E0' : '#616161'
                }}
            />
        );
    }
};
