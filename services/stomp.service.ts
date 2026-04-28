/**
 * STOMP Service using @stomp/stompjs
 * 
 * Re-implemented with the "magic" ingredients discovered during raw debugging:
 * 1. Pass Authorization header in the 3rd argument of WebSocket constructor (HTTP Upgrade).
 * 2. Specify STOMP sub-protocols ['v12.stomp', 'v11.stomp', 'v10.stomp'].
 * 3. Standard @stomp/stompjs Client handles heartbeats, framing, and auto-reconnect logic.
 */

import { logger } from '@/utils/logger';
import { Client, IFrame } from '@stomp/stompjs';

const WS_URL = 'wss://api.safaricharger.com/ws/push';

// ── Types ─────────────────────────────────────────────────────────

export interface ChargingSession {
    chargerId: string;
    idTag: string;
    connectorId: number;
    cost?: number;
    energy?: number;
    stateOfCharge?: number;
    timeToFullCharge?: number;
    status?: string;
}

export interface ChargerStatus {
    chargerId: string;
    connectorId: number;
    status: string;
}

export interface NotificationRequest {
    to: string;
    success: boolean;
    message: string;
    payload: any;
}

// ── Singleton State ───────────────────────────────────────────────

let stompClient: Client | null = null;
let isConnected = false;

// ── Connection ────────────────────────────────────────────────────

export async function connectStomp(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (stompClient && isConnected) {
            logger.info('STOMP: already connected, reusing existing client');
            resolve();
            return;
        }

        // 15-second timeout for the initial handshake
        const timeoutId = setTimeout(() => {
            if (!isConnected) {
                stompClient?.deactivate();
                stompClient = null;
                logger.error('STOMP: connection timed out — server did not respond with CONNECTED in 15s');
                reject(new Error('STOMP connection timed out'));
            }
        }, 15000);

        logger.info('STOMP: initializing @stomp/stompjs client...', {
            url: WS_URL,
            tokenPreview: `Bearer ${token.substring(0, 20)}...`,
        });

        stompClient = new Client({
            // React Native's WebSocket requires the 3rd argument for custom headers (HTTP upgrade).
            // Sub-protocols are essential for many Spring Boot STOMP configurations.
            webSocketFactory: () => new (WebSocket as any)(WS_URL, ['v12.stomp', 'v11.stomp', 'v10.stomp'], {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }),
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            // CRITICAL: Mirroring our manual success by forcing binary frames.
            // This ensures \0 and other characters aren't mangled by non-UTF-8-compliant JS string handlers.
            forceBinaryWSFrames: true,
            // Log raw frames for visibility during this transition
            debug: (msg) => console.log('[STOMP DEBUG]', msg),
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            reconnectDelay: 0, // We manage reconnection manually if needed to avoid spam during auth issues

            onConnect: (frame: IFrame) => {
                clearTimeout(timeoutId);
                isConnected = true;
                logger.info('✅ STOMP: connected and ready!', {
                    version: frame.headers['version'],
                    server: frame.headers['server'] ?? 'unknown',
                    session: frame.headers['session'] ?? 'unknown',
                });
                resolve();
            },

            onStompError: (frame) => {
                clearTimeout(timeoutId);
                isConnected = false;
                logger.error('STOMP: protocol error', {
                    message: frame.headers['message'],
                    body: frame.body,
                });
                reject(new Error(frame.headers['message'] || 'STOMP error'));
            },

            onWebSocketClose: (evt) => {
                isConnected = false;
                logger.warn('STOMP: WebSocket closed', { code: evt.code, reason: evt.reason });
            },
        });

        stompClient.activate();
    });
}

export function disconnectStomp(): void {
    if (stompClient) {
        stompClient.deactivate();
        stompClient = null;
        isConnected = false;
        logger.info('STOMP: client deactivated and cleared');
    }
}

export function isstompConnected(): boolean {
    return isConnected && stompClient !== null && stompClient.connected;
}

// ── Subscriptions ─────────────────────────────────────────────────

export function subscribeToChargingSession(
    chargerId: string,
    connectorId: number,
    callback: (session: ChargingSession) => void
): { unsubscribe: () => void } {
    if (!stompClient || !isConnected) {
        logger.warn('STOMP: cannot subscribe to ChargingSession — client not ready');
        return { unsubscribe: () => { } };
    }

    const destination = `/user/queue/ChargingSession/${chargerId}/${connectorId}`;
    const sub = stompClient.subscribe(destination, (message) => {
        try {
            callback(JSON.parse(message.body));
        } catch (e) {
            logger.error('STOMP: failed to parse ChargingSession message', { body: message.body });
        }
    });

    logger.info('STOMP: subscribed', { destination });
    return { unsubscribe: () => sub.unsubscribe() };
}

export function subscribeToChargingStatus(
    chargerId: string,
    connectorId: number,
    callback: (status: ChargerStatus) => void
): { unsubscribe: () => void } {
    if (!stompClient || !isConnected) {
        logger.warn('STOMP: cannot subscribe to ChargingStatus — client not ready');
        return { unsubscribe: () => { } };
    }

    const destination = `/user/queue/ChargingStatus/${chargerId}/${connectorId}`;
    const sub = stompClient.subscribe(destination, (message) => {
        try {
            callback(JSON.parse(message.body));
        } catch (e) {
            logger.error('STOMP: failed to parse ChargingStatus message', { body: message.body });
        }
    });

    logger.info('STOMP: subscribed', { destination });
    return { unsubscribe: () => sub.unsubscribe() };
}

export function subscribeToWalletBalance(
    callback: (notification: NotificationRequest) => void
): { unsubscribe: () => void } {
    if (!stompClient || !isConnected) {
        logger.warn('STOMP: cannot subscribe to WalletBalance — client not ready');
        return { unsubscribe: () => { } };
    }

    const destination = '/user/queue/WalletBalance';
    const sub = stompClient.subscribe(destination, (message) => {
        try {
            callback(JSON.parse(message.body));
        } catch (e) {
            logger.error('STOMP: failed to parse WalletBalance message', { body: message.body });
        }
    });

    logger.info('STOMP: subscribed', { destination });
    return { unsubscribe: () => sub.unsubscribe() };
}

export function subscribeToReservation(
    callback: (notification: NotificationRequest) => void
): { unsubscribe: () => void } {
    if (!stompClient || !isConnected) {
        logger.warn('STOMP: cannot subscribe to Reservation — client not ready');
        return { unsubscribe: () => { } };
    }

    const destination = '/user/queue/Reservation';
    const sub = stompClient.subscribe(destination, (message) => {
        try {
            callback(JSON.parse(message.body));
        } catch (e) {
            logger.error('STOMP: failed to parse Reservation message', { body: message.body });
        }
    });

    logger.info('STOMP: subscribed', { destination });
    return { unsubscribe: () => sub.unsubscribe() };
}
