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
    Alert,
    Chip,
    TableContainer,
    useMediaQuery,
    useTheme,
    TablePagination,
    TextField,
    InputAdornment,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SearchIcon from '@mui/icons-material/Search';
import { COLORS } from '../../theme/appTheme';
import departmentProgressService, { type ProgressItem } from '../../services/departmentProgressService';
import LoadingState from '../common/LoadingState';
import { formatDate, formatDateTime } from '../../utils';

interface CompletedTrialsViewProps {
    username: string;
}

const CompletedTrialsView: React.FC<CompletedTrialsViewProps> = ({ username }) => {
    const [completedTrials, setCompletedTrials] = useState<ProgressItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        if (username) {
            fetchCompletedTrials();
        }
    }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchCompletedTrials = async () => {
        try {
            setLoading(true);
            const trials = await departmentProgressService.getCompletedTrials(username);
            setCompletedTrials(trials);
            setError(null);
        } catch (err) {
            console.error('Error fetching completed trials:', err);
            setCompletedTrials([]);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const filteredTrials = completedTrials.filter(trial => {
        const searchLower = searchTerm.toLowerCase();
        return (
            (trial.trial_no?.toLowerCase() || '').includes(searchLower) ||
            (trial.part_name?.toLowerCase() || '').includes(searchLower) ||
            (trial.pattern_code?.toLowerCase() || '').includes(searchLower) ||
            (trial.department_name?.toLowerCase() || '').includes(searchLower)
        );
    });

    const displayedTrials = filteredTrials.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Box sx={{ p: { xs: 1, sm: 2.5, md: 3 } }}>
            {/* Header Section with Search */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                alignItems: 'center', 
                mb: 3,
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2
            }}>
                <TextField
                    placeholder="Search by Trial No, Part, or Pattern..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(0);
                    }}
                    sx={{ 
                        width: { xs: '100%', sm: 320 },
                        bgcolor: 'white',
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            '& fieldset': { borderColor: '#e2e8f0' },
                        }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: '#94a3b8', fontSize: '20px' }} />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            {/* Error State */}
            {error && (
                <Alert severity="error" sx={{ mb: 3, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                    {error}
                </Alert>
            )}

            {/* Completed Trials Table */}
            <TableContainer className="premium-table-container" sx={{ 
                maxHeight: 'calc(100vh - 280px)', 
                overflow: 'auto', 
                position: 'relative', 
                minHeight: loading || filteredTrials.length === 0 ? '400px' : 'auto',
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                mt: 0
            }}>
                {loading ? (
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        bgcolor: 'rgba(255,255,255,0.7)',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 10,
                        borderRadius: '12px',
                        backdropFilter: 'blur(2px)'
                    }}>
                        <LoadingState message="Fetching completed trials..." />
                    </Box>
                ) : null}
                <Table size={isMobile ? "small" : "medium"} stickyHeader>
                    <TableHead className="premium-table-head">
                        <TableRow>
                            <TableCell className="premium-table-header-cell">Trial No</TableCell>
                            {!isMobile && <TableCell className="premium-table-header-cell">Pattern Code</TableCell>}
                            <TableCell className="premium-table-header-cell">Part Name</TableCell>
                            {!isTablet && <TableCell className="premium-table-header-cell">Machine</TableCell>}
                            {!isTablet && <TableCell className="premium-table-header-cell">Sampling Date</TableCell>}
                            {!isMobile && <TableCell className="premium-table-header-cell">Department</TableCell>}
                            {!isTablet && <TableCell className="premium-table-header-cell">Completed At</TableCell>}
                            <TableCell className="premium-table-header-cell">Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayedTrials.length > 0 ? (
                            displayedTrials.map((trial) => (
                                <TableRow
                                    key={`${trial.trial_id}-${trial.department_id}`}
                                    className="premium-table-row"
                                >
                                    <TableCell className="premium-table-cell-bold">{trial.trial_no}</TableCell>
                                    {!isMobile && <TableCell className="premium-table-cell">{trial.pattern_code || 'N/A'}</TableCell>}
                                    <TableCell className="premium-table-cell">{trial.part_name || 'N/A'}</TableCell>
                                    {!isTablet && <TableCell className="premium-table-cell">{trial.disa || 'N/A'}</TableCell>}
                                    {!isTablet && <TableCell className="premium-table-cell">{formatDate(trial.date_of_sampling || '')}</TableCell>}
                                    {!isMobile && <TableCell className="premium-table-cell">{trial.department_name || 'N/A'}</TableCell>}
                                    {!isTablet && <TableCell className="premium-table-cell">{formatDateTime(trial.completed_at || '')}</TableCell>}
                                    <TableCell className="premium-table-cell">
                                        <span className="status-pill status-pill-success">
                                            <CheckCircleIcon sx={{ fontSize: '14px' }} /> Completed
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={isMobile ? 3 : isTablet ? 5 : 8} align="center" className="premium-table-cell" sx={{ py: 20 }}>
                                    <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                        {loading ? 'Loading trials...' : searchTerm ? 'No trials match your search' : 'No completed trials found'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredTrials.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                    bgcolor: '#f8fafc',
                    border: '1px solid #eef2f6',
                    borderTop: 'none',
                    borderBottomLeftRadius: '12px',
                    borderBottomRightRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                }}
            />
            {completedTrials.length > 0 && (
                <Typography variant="caption" sx={{ display: { xs: 'block', sm: 'none' }, color: 'text.secondary', textAlign: 'center', mt: 1 }}>
                    Swipe to view more
                </Typography>
            )}
        </Box>
    );
};

export default CompletedTrialsView;
