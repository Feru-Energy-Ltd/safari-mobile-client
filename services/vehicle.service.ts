import { authenticatedFetch } from './auth.service';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

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
    return authenticatedFetch<any>(`${BASE_URL}/csms/app/vehicles`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function getConnectorTypes(): Promise<ConnectorTypeResponse> {
    return authenticatedFetch<ConnectorTypeResponse>(`${BASE_URL}/csms/app/chargers/connectors/types`);
}

export async function getVehicles(): Promise<{ status: boolean; data: Vehicle[]; code: number; message: string }> {
    return authenticatedFetch<{ status: boolean; data: Vehicle[]; code: number; message: string }>(`${BASE_URL}/csms/app/vehicles`);
}

export async function deleteVehicle(vehicleId: number): Promise<any> {
    return authenticatedFetch<any>(`${BASE_URL}/csms/app/vehicles/${vehicleId}`, {
        method: 'DELETE',
    });
}
