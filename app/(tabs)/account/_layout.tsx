import { Stack } from 'expo-router';

export default function AccountLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="personal-info" />
            <Stack.Screen name="help-center" />
        </Stack>
    );
}
