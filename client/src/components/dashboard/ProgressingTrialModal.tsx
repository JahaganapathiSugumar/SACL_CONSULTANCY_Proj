import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BasicInfo from './BasicInfo';

interface ProgressingTrialModalProps {
    isOpen: boolean;
    onClose: () => void;
    trial: any;
}

const ProgressingTrialModal: React.FC<ProgressingTrialModalProps> = ({ isOpen, onClose, trial }) => {
    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    minHeight: '80vh'
                }
            }}
        >
            <DialogTitle sx={{
                m: 0,
                p: 2,
                bgcolor: '#424242',
                color: '#FFFFFF',
                fontWeight: 700,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                Trial Details: {trial.part_name} - Trial No: {trial.trial_no}
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{ color: '#FFFFFF' }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <Box sx={{ bgcolor: '#f8fafc' }}>
                    <BasicInfo trialId={trial.trial_id} />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{
                        bgcolor: '#E67E22',
                        '&:hover': { bgcolor: '#D35400' },
                        px: 4
                    }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProgressingTrialModal;
