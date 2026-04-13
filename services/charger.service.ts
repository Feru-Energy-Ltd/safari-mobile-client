import { authenticatedFetch } from './auth.service';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export interface Charger {
    id: number;
    chargeBoxId: string;
    ocppProtocol?: string;
    chargePointVendor?: string;
    chargePointModel?: string;
    chargePointSerialNumber?: string;
    chargeBoxSerialNumber?: string;
    locationLatitude: string;
    locationLongitude: string;
    address: string;
    registrationStatus: string;
    onlineStatus: 'ON' | 'OFF';
}

export interface Pageable {
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
}

export interface ChargerResponse {
    content: Charger[];
    totalElements: number;
    totalPages: number;
    last: boolean;
    numberOfElements: number;
    size: number;
    number: number;
}

export async function getChargers(page: number = 0, size: number = 10): Promise<ChargerResponse> {
    return authenticatedFetch<ChargerResponse>(`${BASE_URL}/csms/app/chargers?page=${page}&size=${size}`, {
        method: 'GET'
    });
}
