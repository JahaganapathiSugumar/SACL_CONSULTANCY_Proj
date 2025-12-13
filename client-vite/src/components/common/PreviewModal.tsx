import React from 'react';
import { Box, Paper, IconButton, Button, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import { COLORS } from '../../theme/appTheme';

interface PreviewModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit?: () => void;
    onExport?: () => void;
    title: string;
    subtitle?: string;
    submitted?: boolean;
    children: React.ReactNode;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
    open,
    onClose,
    onSubmit,
    onExport,
    title,
    subtitle,
    submitted,
    children
}) => {
    if (!open) return null;

    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                zIndex: 1300,
                bgcolor: 'rgba(15, 23, 42, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2
            }}
        >
            <Paper
                sx={{
                    width: '100%',
                    maxWidth: 850,
                    maxHeight: '90vh',
                    borderRadius: 3,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Box
                    sx={{
                        p: 2,
                        bgcolor: COLORS.primary,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: COLORS.background }}>
                    {children}
                </Box>

                <Box
                    sx={{
                        p: 2,
                        bgcolor: 'white',
                        borderTop: `1px solid ${COLORS.border}`,
                        display: 'flex',
                        gap: 2,
                        justifyContent: 'flex-end'
                    }}
                >
                    <Button variant="outlined" onClick={onClose}>
                        Close
                    </Button>
                    {submitted && onExport && (
                        <Button
                            variant="contained"
                            startIcon={<PrintIcon />}
                            onClick={onExport}
                            sx={{ bgcolor: COLORS.primary }}
                        >
                            Download PDF
                        </Button>
                    )}
                    {!submitted && onSubmit && (
                        <Button
                            variant="contained"
                            sx={{ bgcolor: COLORS.secondary }}
                            onClick={onSubmit}
                        >
                            Confirm & Submit
                        </Button>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};
