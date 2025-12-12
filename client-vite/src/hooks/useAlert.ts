import { useState, useEffect } from 'react';
import type { AlertState } from '../types/inspection';

/**
 * Custom hook for managing alert messages
 * Automatically dismisses alerts after a specified duration
 * 
 * @example
 * ```tsx
 * const { alert, showAlert, clearAlert } = useAlert();
 * 
 * // Show success alert
 * showAlert('success', 'Operation completed successfully');
 * 
 * // Show error with custom duration
 * showAlert('error', 'Failed to save', 6000);
 * ```
 */
export function useAlert() {
    const [alert, setAlert] = useState<AlertState | null>(null);

    useEffect(() => {
        if (alert) {
            const duration = alert.duration || 4000;
            const timer = setTimeout(() => setAlert(null), duration);
            return () => clearTimeout(timer);
        }
    }, [alert]);

    const showAlert = (
        severity: AlertState['severity'],
        message: string,
        duration?: number
    ) => {
        setAlert({ severity, message, duration });
    };

    const clearAlert = () => {
        setAlert(null);
    };

    return { alert, showAlert, clearAlert };
}
