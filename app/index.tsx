import { isAuthenticated } from '@/services/auth.service';
import { router } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
    useEffect(() => {
        async function checkInitialRoute() {
            try {
                const authed = await isAuthenticated();
                if (authed) {
                    router.replace('/(tabs)');
                } else {
                    router.replace('/onboarding');
                }
            } catch (error) {
                router.replace('/onboarding');
            }
        }
        checkInitialRoute();
    }, []);

    return null;
}
