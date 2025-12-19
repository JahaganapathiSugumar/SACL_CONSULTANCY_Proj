import React from 'react';
import { Box, Button, CircularProgress } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface ActionButtonsProps {
    onReset?: () => void;
    onSave?: () => void;
    onSubmit?: () => void;
    loading?: boolean;
    disabled?: boolean;
    saveLabel?: string;
    submitLabel?: string;
    resetLabel?: string;
    showReset?: boolean;
    showSave?: boolean;
    showSubmit?: boolean;
    saveIcon?: React.ReactNode;
    children?: React.ReactNode;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
    onReset,
    onSave,
    onSubmit,
    loading = false,
    disabled = false,
    saveLabel = "Save & Continue",
    submitLabel = "Submit",
    resetLabel = "Reset Form",
    showReset = true,
    showSave = true,
    showSubmit = true,
    saveIcon = <SaveIcon />,
    children
}) => {
    return (
        <Box display="flex" gap={2} justifyContent="flex-end" flexWrap="wrap">
            {children}
            {showReset && onReset && (
                <Button
                    onClick={onReset}
                    startIcon={<RefreshIcon />}
                    variant="outlined"
                    disabled={loading}
                >
                    {resetLabel}
                </Button>
            )}

            {showSave && onSave && (
                <Button
                    onClick={onSave}
                    startIcon={saveIcon}
                    variant="contained"
                    color="secondary"
                    disabled={disabled || loading}
                >
                    {loading ? (
                        <>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Processing...
                        </>
                    ) : (
                        saveLabel
                    )}
                </Button>
            )}

            {showSubmit && onSubmit && (
                <Button
                    onClick={onSubmit}
                    startIcon={loading ? undefined : <SendIcon />}
                    variant="contained"
                    color="secondary"
                    disabled={disabled || loading}
                >
                    {loading ? (
                        <>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Submitting...
                        </>
                    ) : (
                        submitLabel
                    )}
                </Button>
            )}
        </Box>
    );
};

export default ActionButtons;
