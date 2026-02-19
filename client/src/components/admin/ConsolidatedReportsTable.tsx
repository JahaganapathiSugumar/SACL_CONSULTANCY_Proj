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
    Tooltip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
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
    const [viewReport, setViewReport] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

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

    const handleViewReport = (report: ConsolidatedReport) => {
        const document = {
            document_id: report.document_id,
            file_name: report.file_name,
            document_type: 'CONSOLIDATED_REPORT',
            file_base64: report.file_base64,
            uploaded_by: 'System',
            uploaded_at: new Date().toISOString(),
            remarks: 'Consolidated Trial History'
        };
        setViewReport({
            patternCode: report.pattern_code,
            partName: report.part_name,
            documents: [document]
        });
    };

    return (
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
                    {!loading && reports.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} align="center" className="premium-table-cell" sx={{ py: 20 }}>
                                <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                    No consolidated reports found.
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ) : (
                        reports.map((report) => (
                            <TableRow key={report.document_id} className="premium-table-row">
                                <TableCell className="premium-table-cell-bold">{report.pattern_code}</TableCell>
                                <TableCell className="premium-table-cell">{report.part_name}</TableCell>
                                <TableCell className="premium-table-cell" align="right">
                                    <Tooltip title="View History">
                                        <IconButton
                                            onClick={() => handleViewReport(report)}
                                            color="primary"
                                            size="small"
                                            sx={{
                                                bgcolor: 'rgba(230, 126, 34, 0.1)',
                                                color: '#E67E22',
                                                '&:hover': {
                                                    bgcolor: 'rgba(230, 126, 34, 0.2)',
                                                }
                                            }}
                                        >
                                            <VisibilityIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

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
        </TableContainer>
    );
};

export default ConsolidatedReportsTable;
