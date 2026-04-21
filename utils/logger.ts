import * as Sentry from '@sentry/react-native';

/**
 * Logger utility that unifies local console logging with remote Sentry tracking.
 */
class Logger {
    private isDev = __DEV__;

    /**
     * Set user information in Sentry for better debugging.
     */
    setUser(id: string, email?: string, other?: Record<string, any>) {
        Sentry.setUser({
            id,
            email,
            ...other,
        });
        if (this.isDev) {
            console.log(`[Logger] User set: ${id} (${email || 'no email'})`);
        }
    }

    /**
     * Clear user information from Sentry.
     */
    clearUser() {
        Sentry.setUser(null);
        if (this.isDev) {
            console.log('[Logger] User cleared');
        }
    }

    /**
     * Log a debug message (Console only, filtered in production).
     */
    debug(message: string, ...args: any[]) {
        if (this.isDev) {
            console.log(`[DEBUG] ${message}`, ...args);
        }
    }

    /**
     * Log an info message (Console + Sentry Breadcrumb).
     */
    info(message: string, ...args: any[]) {
        if (this.isDev) {
            console.info(`[INFO] ${message}`, ...args);
        }
        Sentry.addBreadcrumb({
            category: 'log',
            message,
            level: 'info',
            data: args.length > 0 ? { args } : undefined,
        });
    }

    /**
     * Log a warning (Console + Sentry Breadcrumb/Capture).
     */
    warn(message: string, ...args: any[]) {
        if (this.isDev) {
            console.warn(`[WARN] ${message}`, ...args);
        }
        Sentry.addBreadcrumb({
            category: 'log',
            message,
            level: 'warning',
            data: args.length > 0 ? { args } : undefined,
        });
    }

    /**
     * Log an error (Console + Sentry Exception).
     */
    error(message: string, error?: any, ...args: any[]) {
        if (this.isDev) {
            console.error(`[ERROR] ${message}`, error, ...args);
        }

        // Capture exception in Sentry
        if (error) {
            Sentry.captureException(error, {
                extra: {
                    message,
                    args,
                },
            });
        } else {
            Sentry.captureMessage(message, {
                level: 'error',
                extra: { args },
            });
        }
    }
}

export const logger = new Logger();
