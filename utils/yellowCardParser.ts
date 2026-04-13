/**
 * Utility file to parse vehicle registration details from raw OCR text blocks.
 * Targets Rwanda "Yellow Card" structure.
 */

export interface ParsedVehicleInfo {
    plateNumber?: string;
    vinNumber?: string;
}

export const parseYellowCardText = (textBlocks: string[]): ParsedVehicleInfo => {
    const info: ParsedVehicleInfo = {};
    const fullText = textBlocks.join('\n').toUpperCase();

    // 1. Extract Plate Number
    // Pattern: R + 2 letters + 3-4 digits + 1 letter (e.g., RAA 445 K, RAE 1234 A)
    // We also handle cases where there might be spaces or slightly misread characters
    const plateRegex = /\b(R[A-Z]{2}\s?\d{3,4}\s?[A-Z])\b/;
    const plateMatch = fullText.match(plateRegex);
    if (plateMatch) {
        info.plateNumber = plateMatch[1].replace(/\s+/g, ' '); // Normalize spaces
    }

    // 2. Extract VIN / Chassis Number
    // VIN is typically 17 characters alphanumeric, avoiding I, O, Q.
    // We look for "CHASSIS" or "VIN" labels or just the pattern.
    const vinRegex = /\b([A-HJ-NPR-Z0-9]{17})\b/;
    const vinMatch = fullText.match(vinRegex);
    if (vinMatch) {
        info.vinNumber = vinMatch[1];
    } else {
        // If no direct 17-char match, look specifically after keywords
        const keywords = ['CHASSIS', 'VIN', 'FRAME NO'];
        for (const keyword of keywords) {
            const keywordRegex = new RegExp(`${keyword}[:\\s]+([A-Z0-9]{10,17})`, 'i');
            const keywordMatch = fullText.match(keywordRegex);
            if (keywordMatch) {
                info.vinNumber = keywordMatch[1];
                break;
            }
        }
    }

    return info;
};
