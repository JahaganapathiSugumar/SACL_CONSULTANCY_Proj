import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

const COLORS = {
    primary: "#1e293b",
    secondary: "#ea580c",
    border: "#e2e8f0",
};

const SaclHeader: React.FC = () => {
    return (
        <Paper
            sx={{
                p: 2,
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `4px solid ${COLORS.secondary}`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
        >
            <Box display="flex" alignItems="center" gap={3}>
                <Box
                    component="img"
                    src="/assets/SACL-LOGO-01.jpg"
                    alt="SACL Logo"
                    sx={{
                        height: { xs: 50, md: 60 },
                        width: 'auto',
                        objectFit: 'contain',
                    }}
                />
                <Box>
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 700,
                            color: COLORS.primary,
                            fontSize: { xs: '1.25rem', md: '1.5rem' },
                            letterSpacing: '0.5px',
                        }}
                    >
                        Steel Authority of India Limited
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            color: COLORS.secondary,
                            fontWeight: 600,
                            fontSize: { xs: '0.75rem', md: '0.875rem' },
                        }}
                    >
                        Foundry Inspection System
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
};

export default SaclHeader;
