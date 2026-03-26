import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// ---------- Storage Keys ----------

export const AUTH_KEYS = {
    IDENTITY_TOKEN: 'auth.identityToken',
    ACCESS_TOKEN: 'auth.accessToken',
    REFRESH_TOKEN: 'auth.refreshToken',
    IDENTITY_TYPE: 'auth.identityType',
    ACCOUNTS: 'auth.accounts',
    ACCOUNT: 'auth.account',
} as const;

// ---------- Types ----------

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    displayName: string;
}

export interface Account {
    accountId: number;
    accountName: string;
    accountType: string;
    role: string;
}

export interface AuthResponse {
    identityType?: string;
    identityToken?: string;
    autoSelect?: boolean;
    accounts?: Account[];
    accessToken?: string;
    refreshToken?: string;
    tokenType?: string;
    expiresIn?: number;
    account?: Account;
    message?: string;
}

export interface UserProfile {
    id: number;
    userId: number;
    email: string;
    displayName: string;
    firstName: string;
    lastName: string;
    phone: string;
    enabled: boolean;
    createdAt: string;
}


// ---------- Token Helpers ----------

async function saveTokens(data: AuthResponse) {
    const entries: [string, string][] = [];

    if (data.identityToken) {
        entries.push([AUTH_KEYS.IDENTITY_TOKEN, data.identityToken]);
    }
    if (data.accessToken) {
        entries.push([AUTH_KEYS.ACCESS_TOKEN, data.accessToken]);
    }
    if (data.refreshToken) {
        entries.push([AUTH_KEYS.REFRESH_TOKEN, data.refreshToken]);
    }
    if (data.identityType) {
        entries.push([AUTH_KEYS.IDENTITY_TYPE, data.identityType]);
    }
    if (data.accounts) {
        entries.push([AUTH_KEYS.ACCOUNTS, JSON.stringify(data.accounts)]);
    }
    if (data.account) {
        entries.push([AUTH_KEYS.ACCOUNT, JSON.stringify(data.account)]);
    }

    if (entries.length > 0) {
        await AsyncStorage.multiSet(entries);
    }
}


export async function clearTokens() {
    await AsyncStorage.multiRemove(Object.values(AUTH_KEYS));
}

export async function getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
}

export async function getIdentityToken(): Promise<string | null> {
    return AsyncStorage.getItem(AUTH_KEYS.IDENTITY_TOKEN);
}

export async function getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
}

export async function getAccounts(): Promise<Account[]> {
    const raw = await AsyncStorage.getItem(AUTH_KEYS.ACCOUNTS);
    return raw ? JSON.parse(raw) : [];
}

export async function getCurrentAccount(): Promise<Account | null> {
    const raw = await AsyncStorage.getItem(AUTH_KEYS.ACCOUNT);
    return raw ? JSON.parse(raw) : null;
}

export async function isAuthenticated(): Promise<boolean> {
    const token = await getAccessToken();
    return !!token;
}

// ---------- Helpers ----------

function authHeaders() {
    return {
        accept: '*/*',
        'Content-Type': 'application/json',
    };
}

async function handleResponse<T>(response: Response): Promise<T> {
    let data;
    try {
        data = await response.json();
    } catch (e) {
        // Fallback if response is not JSON
    }

    if (!response.ok) {
        let message = data?.message;

        if (!message) {
            switch (response.status) {
                case 401:
                    message = 'Invalid email or password. Please try again.';
                    break;
                case 403:
                    message = 'You do not have permission to access this.';
                    break;
                case 404:
                    message = 'Authentication service not found. Please try again later.';
                    break;
                case 409:
                    message = 'An account with this email already exists.';
                    break;
                case 500:
                case 502:
                case 503:
                    message = 'Server error. Please try again later.';
                    break;
                default:
                    message = `Something went wrong. Please try again later.`;
            }
        }
        throw new Error(message);
    }
    return data as T;
}


// ---------- Auth API ----------

export async function login(payload: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${BASE_URL}/auth/api/auth/login`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await handleResponse<AuthResponse>(response);
    await saveTokens(data);
    return data;
}

export async function selectContext(payload: { identityToken: string; contextId: number }): Promise<AuthResponse> {
    const response = await fetch(`${BASE_URL}/auth/api/auth/select-context`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await handleResponse<AuthResponse>(response);
    await saveTokens(data);
    return data;
}

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${BASE_URL}/auth/api/auth/register`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await handleResponse<AuthResponse>(response);
    await saveTokens(data);
    return data;
}

export async function refreshToken(token: string): Promise<AuthResponse> {
    const response = await fetch(`${BASE_URL}/auth/api/auth/refresh`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ refreshToken: token }),
    });
    const data = await handleResponse<AuthResponse>(response);
    await saveTokens(data);
    return data;
}

export async function logout(): Promise<void> {
    const refreshTkn = await getRefreshToken();
    const accessTkn = await getAccessToken();

    if (refreshTkn) {
        try {
            await fetch(`${BASE_URL}/auth/api/auth/logout`, {
                method: 'POST',
                headers: {
                    ...authHeaders(),
                    ...(accessTkn ? { 'Authorization': `Bearer ${accessTkn}` } : {})
                },
                body: JSON.stringify({ refreshToken: refreshTkn }),
            });
        } catch (e) {
            console.error('Logout request failed', e);
        }
    }
    await clearTokens();
}

export async function getProfile(): Promise<UserProfile> {
    const accessTkn = await getAccessToken();
    const response = await fetch(`${BASE_URL}/auth/api/profile`, {
        method: 'GET',
        headers: {
            ...authHeaders(),
            ...(accessTkn ? { 'Authorization': `Bearer ${accessTkn}` } : {})
        },
    });
    return handleResponse<UserProfile>(response);
}
export async function updateProfile(payload: Partial<UserProfile>): Promise<UserProfile> {
    const accessTkn = await getAccessToken();
    const response = await fetch(`${BASE_URL}/auth/api/profile`, {
        method: 'PUT',
        headers: {
            ...authHeaders(),
            ...(accessTkn ? { 'Authorization': `Bearer ${accessTkn}` } : {})
        },
        body: JSON.stringify(payload),
    });
    return handleResponse<UserProfile>(response);
}
