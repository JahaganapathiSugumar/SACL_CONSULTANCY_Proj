import React from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';
import { COLORS } from '../../theme/appTheme';

interface FormSectionProps {
    title: string;
    icon?: React.ReactNode;
    color?: string;
    badge?: string;
    children: React.ReactNode;
    noPadding?: boolean;
}

const FormSection: React.FC<FormSectionProps> = ({
    title,
    icon,
    color = COLORS.primary,
    badge,
    children,
    noPadding = false
}) => {
    return (
        <Paper sx={{ p: noPadding ? 0 : { xs: 2, md: 3 }, mb: 3 }}>
            <Box
                display="flex"
                alignItems="center"
                gap={1.5}
                mb={2}
                pb={1}
                px={noPadding ? 3 : 0}
                pt={noPadding ? 3 : 0}
                borderBottom={`2px solid ${color}`}
            >
                {icon && (
                    <Box sx={{ color, display: 'flex', alignItems: 'center' }}>
                        {icon}
                    </Box>
                )}
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: COLORS.primary,
                        flexGrow: 1,
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        letterSpacing: 0.5
                    }}
                >
                    {title}
                </Typography>
                {badge && (
                    <Chip
                        label={badge}
                        size="small"
                        variant="outlined"
                        sx={{ opacity: 0.7 }}
                    />
                )}
            </Box>
            <Box px={noPadding ? 3 : 0} pb={noPadding ? 3 : 0}>
                {children}
            </Box>
        </Paper>
    );
};

export default FormSection;
