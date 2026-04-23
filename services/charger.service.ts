import { logger } from '@/utils/logger';
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
    startTime: string; // Used in active reservation (string format)
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

export interface ReservationRecord {
    id: number;
    transactionId: number;
    idTag: string;
    startTime: number; // Used in reservation history (timestamp)
    expiryDateTime: number;
    reservationStatus: 'Accepted' | 'Expired' | 'Cancelled';
    locationAddress: string;
    connectorStatus: string;
    connectorId: number;
    chargeBoxId: string;
    connectorType?: string; // May be needed for icon
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

export interface ReservationsResponse {
    content: ReservationRecord[];
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
    try {
        const url = `${BASE_URL}/csms/app/reservations/active?walletAccount=${walletAccount}`;
        const res = await authenticatedFetch<{ status?: boolean; data?: Reservation; code?: number } | Reservation>(url);

        if (!res) {
            logger.info('No response from active reservation API', { walletAccount });
            return null;
        }

        // Handle wrapped response
        if ('data' in res) {
            logger.info('Received wrapped reservation data', { walletAccount });
            return res.data || null;
        }

        // Handle empty object
        if (Object.keys(res).length === 0) {
            logger.info('Received empty reservation object', { walletAccount });
            return null;
        }

        // Handle unwrapped response (direct Reservation object)
        if ('id' in res && 'chargeBoxId' in res) {
            logger.info('Received direct reservation object', { reservation: res, walletAccount });
            return res as Reservation;
        }

        logger.warn('Received unexpected response format from active reservation API', { res, walletAccount });
        return null;
    } catch (error: any) {
        logger.error('Failed to fetch active reservation', { error: error.message, walletAccount });
        return null;
    }
}

export async function cancelReservation(chargeBoxId: string, connectorId: number): Promise<{ status: boolean; message: string }> {
    return authenticatedFetch<{ status: boolean; message: string }>(`${BASE_URL}/csms/app/reservations`, {
        method: 'DELETE',
        body: JSON.stringify({ chargeBoxId, connectorId })
    });
}

export async function getReservations(page: number = 0, size: number = 20): Promise<ReservationsResponse> {
    return authenticatedFetch<ReservationsResponse>(`${BASE_URL}/csms/app/reservations?page=${page}&size=${size}`, {
        method: 'GET'
    });
}

export function getConnectorIconUrl(connectorType: string): string {
    return `${BASE_URL}/csms/app/chargers/connectors/icon/${connectorType}`;
}
