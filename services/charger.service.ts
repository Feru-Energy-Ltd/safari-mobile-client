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

export interface Reservation {
    id: number;
    transactionId: number;
    idTag: string;
    startTime: string;
    expiryDateTime: string;
    status: string;
    chargeBoxId: string;
    connectorId: number;
    reservationAmount: number;
    chargingAmount: number;
    walletAccount: string;
    walletBalance: number;
    batteryLevel: number;
    batteryCapacity: number;
    connectorType: string;
    username: string;
}

export interface CreateReservationPayload {
    chargeBoxId: string;
    connectorId: number;
    plateNumber: string;
    currentBatteryLevel: number;
    reservationDuration: number;
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

export async function createReservation(payload: CreateReservationPayload): Promise<{ status: boolean; data: Reservation; code: number; message: string }> {
    return authenticatedFetch<{ status: boolean; data: Reservation; code: number; message: string }>(`${BASE_URL}/csms/app/reservations`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export async function getActiveReservation(walletAccount: string): Promise<Reservation | null> {
    const res = await authenticatedFetch<{ status?: boolean; data?: Reservation; code?: number } | Reservation>(`${BASE_URL}/csms/app/reservations/active?walletAccount=${walletAccount}`);
    // Handle both wrapped and unwrapped response as seen in user provided JSON
    if ('data' in res) {
        return (res as any).data || null;
    }
    return res as Reservation;
}

export async function cancelReservation(chargeBoxId: string, connectorId: number): Promise<{ status: boolean; message: string }> {
    return authenticatedFetch<{ status: boolean; message: string }>(`${BASE_URL}/csms/app/reservations`, {
        method: 'DELETE',
        body: JSON.stringify({ chargeBoxId, connectorId })
    });
}
