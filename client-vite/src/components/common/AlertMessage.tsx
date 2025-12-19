import React from 'react';
import Alert from '@mui/material/Alert';
import type { AlertState } from '../../types/inspection';

interface AlertMessageProps {
    alert: AlertState | null;
    sx?: object;
}

/**
 * Reusable Alert component for displaying messages
 * 
 * @example
 * ```tsx
 * const { alert } = useAlert();
 * 
 * return <AlertMessage alert={alert} />;
 * ```
 */
export function AlertMessage({ alert, sx }: AlertMessageProps) {
    if (!alert) return null;

    return (
        <Alert severity={alert.severity} sx={{ mb: 3, ...sx }}>
            {alert.message}
        </Alert>
    );
}

export default AlertMessage;
