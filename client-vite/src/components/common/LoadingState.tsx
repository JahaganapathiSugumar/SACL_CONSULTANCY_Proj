import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

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
            <CircularProgress size={size} />
            {message && (
                <Typography variant="body2" color="text.secondary">
                    {message}
                </Typography>
            )}
        </Box>
    );
};

export default LoadingState;
