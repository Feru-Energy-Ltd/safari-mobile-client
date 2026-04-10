/**
 * Utility functions for form validation.
 */

/**
 * Validates an email address.
 * @param email - The email string to validate.
 * @returns boolean - True if the email is valid.
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Returns an error message for an email validation check.
 * @param email - The email string to check.
 * @returns string | null - Error message if invalid, null otherwise.
 */
export const getEmailErrorMessage = (email: string): string | null => {
    if (!email) {
        return 'Email is required';
    } else if (!isValidEmail(email)) {
        return 'Please enter a valid email address';
    }
    return null;
};

/**
 * Validates a phone number.
 * @param phone - The phone string to validate.
 * @returns boolean - True if the phone number is valid.
 */
export const isValidPhone = (phone: string): boolean => {
    return phone.length >= 9;
};

/**
 * Returns an error message for a phone number validation check.
 * @param phone - The phone string to check.
 * @returns string | null - Error message if invalid, null otherwise.
 */
export const getPhoneErrorMessage = (phone: string): string | null => {
    if (!phone) {
        return 'Phone number is required';
    } else if (!isValidPhone(phone)) {
        return 'Phone number must be at least 9 characters';
    }
    return null;
};
