import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { trialService } from '../../services/trialService';
import ProgressingTrialModal from './ProgressingTrialModal';
import GearSpinner from '../common/GearSpinner';

interface ProgressingTrialsGridProps {
    departmentId: number;
}

const ProgressingTrialsGrid: React.FC<ProgressingTrialsGridProps> = ({ departmentId }) => {
    const [progressingTrials, setProgressingTrials] = useState<any[]>([]);
    const [loadingTrials, setLoadingTrials] = useState(false);
    const [selectedTrialId, setSelectedTrialId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchProgressing = async () => {
            if (departmentId === 4 || departmentId === 6 || departmentId === 7) {
                setLoadingTrials(true);
                try {
                    const data = await trialService.getProgressingTrials();
                    setProgressingTrials(data);
                } catch (error) {
                    console.error('Failed to fetch progressing trials:', error);
                } finally {
                    setLoadingTrials(false);
                }
            }
        };

        fetchProgressing();
        // Refresh every 2 minutes
        const interval = setInterval(fetchProgressing, 120000);
        return () => clearInterval(interval);
    }, [departmentId]);

    if (departmentId !== 4 && departmentId !== 6 && departmentId !== 7) {
        return null;
    }

    return (
        <>
            <Box sx={{ mb: 3 }}>
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 700,
                        color: '#E67E22',
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}
                >
                    Progressing Trials
                </Typography>

                {loadingTrials ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <div style={{ transform: 'scale(0.7)' }}><GearSpinner /></div>
                    </Box>
                ) : progressingTrials.length > 0 ? (
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(3, 1fr)',
                            lg: 'repeat(4, 1fr)'
                        },
                        gap: 2
                    }}>
                        {progressingTrials.map((trial) => (
                            <Card
                                key={trial.trial_id}
                                sx={{
                                    bgcolor: '#FFF3E0',
                                    border: '1px solid #FFE0B2',
                                    borderRadius: 2,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 4px 12px rgba(230, 126, 34, 0.2)',
                                        borderColor: '#E67E22'
                                    }
                                }}
                            >
                                <CardContent sx={{ p: 2 }}>
                                    <Typography
                                        variant="subtitle2"
                                        sx={{
                                            fontWeight: 700,
                                            color: '#333',
                                            mb: 0.5,
                                            fontSize: '0.95rem'
                                        }}
                                    >
                                        {trial.pattern_code}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: '#666',
                                            display: 'block',
                                            mb: 1.5,
                                            fontSize: '0.75rem',
                                            lineHeight: 1.4
                                        }}
                                    >
                                        {trial.part_name}
                                    </Typography>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        fullWidth
                                        startIcon={<InfoIcon sx={{ fontSize: '14px !important' }} />}
                                        onClick={() => {
                                            setSelectedTrialId(trial.trial_id);
                                            setIsModalOpen(true);
                                        }}
                                        sx={{
                                            bgcolor: '#E67E22',
                                            fontSize: '0.75rem',
                                            py: 0.75,
                                            '&:hover': { bgcolor: '#D35400' }
                                        }}
                                    >
                                        View Details
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                ) : (
                    <Box
                        sx={{
                            bgcolor: '#f8f9fa',
                            p: 4,
                            borderRadius: 2,
                            textAlign: 'center',
                            border: '1px dashed #ddd'
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#999',
                                fontStyle: 'italic'
                            }}
                        >
                            No progressing trials at the moment
                        </Typography>
                    </Box>
                )}
            </Box>

            {selectedTrialId && (
                <ProgressingTrialModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedTrialId(null);
                    }}
                    trialId={selectedTrialId}
                />
            )}
        </>
    );
};

export default ProgressingTrialsGrid;