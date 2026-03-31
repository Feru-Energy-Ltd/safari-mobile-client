import { getAccessToken } from './auth.service';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

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
        let message = data?.message || 'Something went wrong. Please try again later.';
        throw new Error(message);
    }
    return data as T;
}

export interface ConnectorType {
    id: number;
    connectorName: string;
    origin: string;
    level: string;
    mode: string;
    phase: string;
    icon: string;
    connectorType: string;
}

export interface Vehicle {
    id: number;
    ownerId: number;
    plateNumber: string;
    vinNumber: string;
    description: string;
    active: boolean;
    connectorType: string;
    batteryCapacity: number;
}

export interface ConnectorTypeResponse {
    status: boolean;
    data: ConnectorType[];
    code: number;
    message: string;
}

export interface CreateVehiclePayload {
    vinNumber: string;
    plateNumber: string;
    description?: string;
    connectorType: string;
    batteryCapacity: number;
}

export async function createVehicle(payload: CreateVehiclePayload): Promise<any> {
    const accessTkn = await getAccessToken();
    const response = await fetch(`${BASE_URL}/csms/app/vehicles`, {
        method: 'POST',
        headers: {
            ...authHeaders(),
            ...(accessTkn ? { 'Authorization': `Bearer ${accessTkn}` } : {})
        },
        body: JSON.stringify(payload),
    });
    return handleResponse<any>(response);
}

export async function getConnectorTypes(): Promise<ConnectorTypeResponse> {
    const accessTkn = await getAccessToken();
    const response = await fetch(`${BASE_URL}/csms/app/chargers/connectors/types`, {
        method: 'GET',
        headers: {
            ...authHeaders(),
            ...(accessTkn ? { 'Authorization': `Bearer ${accessTkn}` } : {})
        },
    });
    return handleResponse<ConnectorTypeResponse>(response);
}

export async function getVehicles(): Promise<{ status: boolean; data: Vehicle[]; code: number; message: string }> {
    const accessTkn = await getAccessToken();
    const response = await fetch(`${BASE_URL}/csms/app/vehicles`, {
        method: 'GET',
        headers: {
            ...authHeaders(),
            ...(accessTkn ? { 'Authorization': `Bearer ${accessTkn}` } : {})
        },
    });
    return handleResponse<{ status: boolean; data: Vehicle[]; code: number; message: string }>(response);
}
