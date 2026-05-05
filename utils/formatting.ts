/**
 * Shared formatting utilities.
 * Keep pure functions here – no React imports, no side-effects.
 */

// ─── Time ─────────────────────────────────────────────────────────────────────

/**
 * Converts a total number of seconds into an HH:MM:SS string.
 * e.g. 3661 → "01:01:01"
 */
export function formatHMS(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s]
        .map((v) => v.toString().padStart(2, '0'))
        .join(':');
}

/**
 * Parses a datetime string that the backend sends in EAT (UTC+3) without a
 * timezone suffix (e.g. "2024-05-01 14:30:00") and returns a proper Date.
 */
export function eatToDate(dateStr: string): Date {
    return new Date(dateStr.replace(' ', 'T') + '+03:00');
}

// ─── Transactions ─────────────────────────────────────────────────────────────

/**
 * Converts a Java LocalDateTime array `[year, month, day, hour, minute, second]`
 * into a JavaScript Date.
 * Falls back to `new Date()` when the array is missing or malformed.
 */
export function formatTxDate(arr?: number[]): Date {
    if (!arr || arr.length < 6) return new Date();
    const [year, month, day, hour, minute, second] = arr;
    return new Date(year, month - 1, day, hour, minute, second);
}

// ─── Currency ─────────────────────────────────────────────────────────────────

/**
 * Formats a numeric (or numeric-string) amount as Rwandan Francs.
 * e.g. 5000 → "RWF 5,000"
 */
export function formatCurrency(amount: number | string): string {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-RW', {
        style: 'currency',
        currency: 'RWF',
        minimumFractionDigits: 0,
    }).format(value);
}
