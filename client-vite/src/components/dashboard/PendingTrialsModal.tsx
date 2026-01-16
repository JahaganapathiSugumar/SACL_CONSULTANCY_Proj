import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Button,
    Alert,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { COLORS } from '../../theme/appTheme';
import departmentProgressService from '../../services/departmentProgressService';
import LoadingState from '../common/LoadingState';
import { formatDate } from '../../utils';

interface PendingTrials {
    trial_id: string;
    part_name?: string;
    pattern_code?: string;
    disa?: string;
    date_of_sampling?: string;
    approval_status?: string | null;
    department_name?: string;
    department_id: number;
}

interface PendingTrialsModalProps {
    open: boolean;
    onClose: () => void;
    username: string;
    onCardSelect?: (card: PendingTrials) => void;
}

const PendingTrialsModal: React.FC<PendingTrialsModalProps> = ({ open, onClose, username, onCardSelect }) => {
    const [pendingTrials, setPendingTrials] = useState<PendingTrials[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        if (open && username) {
            fetchPendingTrials();
        }
    }, [open, username]);

    const fetchPendingTrials = async () => {
        try {
            setLoading(true);
            const pendingTrials = await departmentProgressService.getProgress(username);
            setPendingTrials(pendingTrials);
            setError(null);
        } catch (err) {
            console.error('Error fetching pending cards:', err);
            setPendingTrials([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (card: PendingTrials) => {
        if (onCardSelect) {
            onCardSelect(card);
        }
        onClose();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return '#ffc107';
            case 'completed':
                return '#10b981';
            default:
                return '#6c757d';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Pending';
            case 'completed':
                return 'Completed';
            default:
                return 'Unknown';
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            fullScreen={isMobile}
            PaperProps={{
                sx: {
                    minHeight: isMobile ? '100vh' : '70vh',
                    maxHeight: isMobile ? '100vh' : '90vh'
                }
            }}
        >
            <DialogTitle sx={{ bgcolor: COLORS.blueHeaderBg, color: COLORS.blueHeaderText, display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 }, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                📋 Pending Sample Cards
                <IconButton onClick={onClose} size="small" sx={{ color: 'inherit' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
                <Box>
                    {/* Loading State */}
                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                            <LoadingState size={60} />
                        </Box>
                    )}

                    {/* Error State */}
                    {error && (
                        <Alert severity="warning" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Pending Cards Table */}
                    {!loading && (
                        <Paper variant="outlined" sx={{ border: `2px solid ${COLORS.primary}`, overflow: 'auto' }}>
                            <Table size={isMobile ? "small" : "medium"}>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: COLORS.blueHeaderBg }}>
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' }, whiteSpace: 'nowrap' }}>Trial ID</TableCell>
                                        {!isMobile && <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Pattern Code</TableCell>}
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>Part Name</TableCell>
                                        {!isTablet && <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Machine</TableCell>}
                                        {!isTablet && <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Sampling Date</TableCell>}
                                        <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>Status</TableCell>
                                        {!isMobile && <TableCell sx={{ fontWeight: 700, color: COLORS.blueHeaderText }}>Department</TableCell>}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pendingTrials.length > 0 ? (
                                        pendingTrials.map((card) => (
                                            <TableRow
                                                key={card.trial_id}
                                                onClick={() => handleCardClick(card)}
                                                sx={{
                                                    '&:hover': {
                                                        backgroundColor: COLORS.background,
                                                        cursor: 'pointer'
                                                    }
                                                }}
                                            >
                                                <TableCell sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>{card.trial_id}</TableCell>
                                                {!isMobile && <TableCell>{card.pattern_code}</TableCell>}
                                                <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>{card.part_name}</TableCell>
                                                {!isTablet && <TableCell>{card.disa}</TableCell>}
                                                {!isTablet && <TableCell>{card.date_of_sampling ? formatDate(card.date_of_sampling) : ''}</TableCell>}
                                                <TableCell>
                                                    <Chip
                                                        label={getStatusLabel(card.approval_status || 'pending')}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: getStatusColor(card.approval_status || 'pending'),
                                                            color: card.approval_status == 'pending' || card.approval_status == 'completed' ? '#FFFFFF' : COLORS.textPrimary,
                                                            fontWeight: 600,
                                                            fontSize: { xs: '0.65rem', sm: '0.75rem' }
                                                        }}
                                                    />
                                                </TableCell>
                                                {!isMobile && <TableCell>
                                                    {card.department_name}
                                                </TableCell>}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={isMobile ? 3 : isTablet ? 5 : 7} sx={{ textAlign: 'center', py: 4 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    No pending sample cards at the moment
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Paper>
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default PendingTrialsModal;
