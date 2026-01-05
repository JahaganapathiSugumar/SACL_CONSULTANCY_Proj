import React from 'react';
import { Box, Typography } from '@mui/material';
import GearSpinner from './GearSpinner';

interface LoadingStateProps {
    message?: string;
    size?: number;
}

const LoadingState: React.FC<LoadingStateProps> = ({
    message = "Loading...",
    size = 40
}) => {
    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            gap={2}
            p={10}
        >
            <div style={{ transform: `scale(${size / 24})` }}>
                <GearSpinner />
            </div>
            {message && (
                <Typography variant="body2" color="text.secondary">
                    {message}
                </Typography>
            )}
        </Box>
    );
};

export default LoadingState;
