/**
 * Booking tab constants.
 * Centralising these here means the tab labels and the backend→tab mapping
 * can be adjusted in one file without touching component logic.
 */

export type BookingTab = 'Upcoming' | 'Completed' | 'Canceled';

/**
 * Maps backend `reservationStatus` values to the UI tab they belong to.
 * Update this map whenever the backend introduces a new status.
 */
export const BOOKING_STATUS_MAP: Record<string, BookingTab> = {
    Accepted: 'Upcoming',
    Expired: 'Completed',
    Cancelled: 'Canceled',
};

/** Ordered list of tabs to render – keeps the tab bar in sync with the type. */
export const BOOKING_TABS: BookingTab[] = ['Upcoming', 'Completed', 'Canceled'];
