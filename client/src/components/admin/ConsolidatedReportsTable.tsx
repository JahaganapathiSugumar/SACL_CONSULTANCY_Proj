import React, { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    TableContainer,
    IconButton,
    Tooltip,
    TextField,
    InputAdornment
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';
import LoadingState from '../common/LoadingState';
import { trialService } from '../../services/trialService';
import DocumentViewer from '../common/DocumentViewer';

interface ConsolidatedReport {
    document_id: number;
    pattern_code: string;
    part_name: string;
    file_base64: string;
    file_name: string;
}

const ConsolidatedReportsTable: React.FC = () => {
    const [reports, setReports] = useState<ConsolidatedReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewReport, setViewReport] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [fetchingReport, setFetchingReport] = useState<string | null>(null);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                setLoading(true);
                const data = await trialService.getConsolidatedReports();
                setReports(data);
            } catch (error) {
                console.error('Error fetching consolidated reports:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    const filteredReports = reports.filter(report => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            String(report.pattern_code || '').toLowerCase().includes(searchLower) ||
            String(report.part_name || '').toLowerCase().includes(searchLower)
        );
    });

    const handleViewReport = async (report: ConsolidatedReport) => {
        try {
            setFetchingReport(report.pattern_code);
            
            let reportData = report;
            if (!report.file_base64) {
                const response = await trialService.getConsolidatedReportFile(report.pattern_code);
                if (response && response.file_base64) {
                    reportData = { ...report, ...response };
                } else {
                    alert('Report file content not found.');
                    return;
                }
            }

            const document = {
                document_id: reportData.document_id,
                file_name: reportData.file_name,
                document_type: 'CONSOLIDATED_REPORT',
                file_base64: reportData.file_base64,
                uploaded_by: 'System',
                uploaded_at: new Date().toISOString(),
                remarks: 'Consolidated Trial History'
            };
            setViewReport({
                patternCode: reportData.pattern_code,
                partName: reportData.part_name,
                documents: [document]
            });
        } catch (error) {
            console.error('Error fetching consolidated report base64:', error);
            alert('Failed to load report file.');
        } finally {
            setFetchingReport(null);
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <TextField
                    size="small"
                    placeholder="Search consolidated reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: 300, bgcolor: 'white' }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: '#95a5a6' }} />
                            </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setSearchTerm('')}>
                                    <CancelIcon sx={{ fontSize: '1rem' }} />
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />
            </Box>
            <TableContainer
            className="premium-table-container"
            sx={{
                maxHeight: 'calc(100vh - 400px)',
                overflow: 'auto',
                position: 'relative',
                minHeight: loading || reports.length === 0 ? '300px' : 'auto'
            }}
        >
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
                    <LoadingState message="Fetching reports..." />
                </Box>
            ) : null}
            <Table stickyHeader sx={{ minWidth: 650 }}>
                <TableHead className="premium-table-head">
                    <TableRow>
                        <TableCell className="premium-table-header-cell">Pattern Code</TableCell>
                        <TableCell className="premium-table-header-cell">Part Name</TableCell>
                        <TableCell className="premium-table-header-cell" align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {!loading && filteredReports.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} align="center" className="premium-table-cell" sx={{ py: 20 }}>
                                <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                    No reports found matching your search.
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredReports.map((report) => (
                            <TableRow key={report.document_id} className="premium-table-row">
                                <TableCell className="premium-table-cell-bold">{report.pattern_code}</TableCell>
                                <TableCell className="premium-table-cell">{report.part_name}</TableCell>
                                <TableCell className="premium-table-cell" align="right">
                                    <Button
                                        onClick={() => handleViewReport(report)}
                                        variant="contained"
                                        size="small"
                                        disabled={fetchingReport === report.pattern_code}
                                        sx={{
                                            textTransform: 'none',
                                            bgcolor: '#E67E22',
                                            '&:hover': {
                                                bgcolor: '#D35400',
                                            }
                                        }}
                                    >
                                        {fetchingReport === report.pattern_code ? 'Loading...' : 'View report'}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>

            <Dialog open={!!viewReport} onClose={() => setViewReport(null)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Consolidated Report - {viewReport?.partName} ({viewReport?.patternCode})</Typography>
                    <IconButton onClick={() => setViewReport(null)} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {viewReport && (
                        <DocumentViewer
                            documents={viewReport.documents}
                            label="Consolidated History"
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewReport(null)} color="inherit">Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ConsolidatedReportsTable;
