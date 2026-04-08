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

/**
 * Robust check used on app startup.
 * If accessToken is missing but refreshToken exists, attempt to refresh.
 */
export async function checkAuthStatus(): Promise<boolean> {
    const accessTkn = await getAccessToken();
    if (accessTkn) return true;

    const refreshTkn = await getRefreshToken();
    if (refreshTkn) {
        try {
            await refreshToken(refreshTkn);
            return true;
        } catch (e) {
            await clearTokens();
            return false;
        }
    }
    return false;
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
        // Add status code to error if needed for specific logic (like 401 handling)
        const error: any = new Error(data?.message || `Error: ${response.status}`);
        error.status = response.status;

        if (!data?.message) {
            switch (response.status) {
                case 401:
                    error.message = 'Invalid email or password. Please try again.';
                    break;
                case 403:
                    error.message = 'You do not have permission to access this.';
                    break;
                case 404:
                    error.message = 'Authentication service not found. Please try again later.';
                    break;
                case 409:
                    error.message = 'An account with this email already exists.';
                    break;
                case 500:
                case 502:
                case 503:
                    error.message = 'Server error. Please try again later.';
                    break;
                default:
                    error.message = `Something went wrong. Please try again later.`;
            }
        }
        throw error;
    }
    return data as T;
}

/**
 * Standard fetch wrapper that includes auth headers and handles token refresh automatically.
 */
export async function authenticatedFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
    let accessTkn = await getAccessToken();

    const fetchOptions = {
        ...options,
        headers: {
            ...authHeaders(),
            ...(accessTkn ? { 'Authorization': `Bearer ${accessTkn}` } : {}),
            ...options.headers,
        },
    };

    let response = await fetch(url, fetchOptions);

    // If 401, try to refresh and retry
    if (response.status === 401) {
        const refreshTkn = await getRefreshToken();
        if (refreshTkn) {
            try {
                // Perform refresh
                const refreshData = await refreshToken(refreshTkn);
                const newAccessTkn = refreshData.accessToken;

                // Retry with new token
                const retryOptions = {
                    ...fetchOptions,
                    headers: {
                        ...fetchOptions.headers,
                        'Authorization': `Bearer ${newAccessTkn}`,
                    }
                };
                response = await fetch(url, retryOptions);
            } catch (err) {
                // If refresh fails, log out the user
                await clearTokens();
                throw new Error('Your session has expired. Please log in again.');
            }
        } else {
            // No refresh token available
            await clearTokens();
            throw new Error('Your session has expired. Please log in again.');
        }
    }

    return handleResponse<T>(response);
}


// ---------- Auth API ----------

export async function login(payload: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await handleResponse<AuthResponse>(response);
    await saveTokens(data);
    return data;
}

export async function selectContext(payload: { identityToken: string; contextId: number }): Promise<AuthResponse> {
    const response = await fetch(`${BASE_URL}/auth/select-context`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await handleResponse<AuthResponse>(response);
    await saveTokens(data);
    return data;
}

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await handleResponse<AuthResponse>(response);
    await saveTokens(data);
    return data;
}

export async function refreshToken(token: string): Promise<AuthResponse> {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
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
    if (refreshTkn) {
        try {
            await authenticatedFetch(`${BASE_URL}/auth/logout`, {
                method: 'POST',
                body: JSON.stringify({ refreshToken: refreshTkn }),
            });
        } catch (e) {
            console.error('Logout request failed', e);
        }
    }
    await clearTokens();
}

export async function getProfile(): Promise<UserProfile> {
    return authenticatedFetch<UserProfile>(`${BASE_URL}/auth/profile`);
}

export async function updateProfile(payload: Partial<UserProfile>): Promise<UserProfile> {
    return authenticatedFetch<UserProfile>(`${BASE_URL}/auth/profile`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export async function changePassword(payload: { oldPassword: string; newPassword: string }): Promise<any> {
    return authenticatedFetch<any>(`${BASE_URL}/auth/profile/change-password`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}
