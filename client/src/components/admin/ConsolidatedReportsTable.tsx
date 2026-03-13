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
    InputAdornment,
    CircularProgress
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';
import LoadingState from '../common/LoadingState';
import { trialService } from '../../services/trialService';
import DocumentViewer from '../common/DocumentViewer';
import * as XLSX from 'xlsx';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import Swal from 'sweetalert2';

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
    const [exportingExcel, setExportingExcel] = useState<string | null>(null);

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

    const handleExportExcel = async (report: ConsolidatedReport) => {
        try {
            setExportingExcel(report.pattern_code);
            
            const response = await trialService.getPatternFullData(report.pattern_code);
            
            if (!Array.isArray(response)) {
                throw new Error('Failed to fetch pattern data');
            }

            const allTrialsData = response;
            if (allTrialsData.length === 0) {
                Swal.fire('Info', 'No trial data found for this pattern.', 'info');
                return;
            }

            const flattenedData = allTrialsData.map((data: any) => {
                const trial = data.trial_cards?.[0] || {};
                const pouring = data.pouring_details?.[0] || {};
                const meta = data.metallurgical_inspection?.[0] || {};
                const visual = data.visual_inspection?.[0] || {};
                const mcShop = data.machine_shop?.[0] || {};
                const materialCorrection = data.material_correction?.[0] || {};

                const safeParse = (val: any) => {
                    if (!val) return null;
                    try {
                        return typeof val === 'string' ? JSON.parse(val) : val;
                    } catch (e) {
                        return null;
                    }
                };

                const pInoc = safeParse(pouring.inoculation);
                const actualChem = safeParse(pouring.composition);
                const mechProps = safeParse(meta.mech_properties) || [];
                const microStruct = safeParse(meta.micro_structure) || [];
                const visInspections = safeParse(visual.inspections) || [];
                const ndtInspections = safeParse(visual.ndt_inspection) || [];
                const hardnessInspections = safeParse(visual.hardness) || [];
                const mcInspections = safeParse(mcShop.inspections) || [];
                
                const matCorrChem = safeParse(materialCorrection.chemical_composition);
                const matCorrParams = safeParse(materialCorrection.process_parameters);

                const firstMech = mechProps[0] || {};
                const firstMicro = microStruct[0] || {};
                
                const row: any = {
                    'Trial No': trial.trial_no,
                    'Pouring Date': pouring.pour_date ? new Date(pouring.pour_date).toLocaleDateString('en-GB') : '-',
                    'Trial Type': trial.trial_type,
                    'Initiated By': trial.initiated_by,
                    'DISA / Machine': trial.disa || '-',
                    'Sample Traceability': trial.sample_traceability || '-',
                    'Reason': trial.reason_for_sampling,
                    'Moulds (Plan/Act)': `${trial.plan_moulds || '-'} / ${trial.actual_moulds || '-'}`,

                    'Material Correction Date': materialCorrection.date ? new Date(materialCorrection.date).toLocaleDateString('en-GB') : '-',
                    'Material Correction Chem': matCorrChem ? JSON.stringify(matCorrChem) : '-',
                    'Material Correction Params': matCorrParams ? JSON.stringify(matCorrParams) : '-',
                    
                    'Heat Code': pouring.heat_code || '-',
                    'Pour Temp (C)': pouring.pouring_temp_c || '-',
                    'Pour Time (s)': pouring.pouring_time_sec || '-',
                    'Moulds Poured': pouring.no_of_mould_poured || '-',
                    'Inoc Type': pInoc?.text || '-',
                    'Melting Other Remarks': pouring.other_remarks || '-',
                    'Chem: C': actualChem?.C || '-',
                    'Chem: Si': actualChem?.Si || '-',
                    'Chem: Mn': actualChem?.Mn || '-',
                    'Chem: S': actualChem?.S || '-',
                    'Chem: Mg': actualChem?.Mg || '-',
                    'Chem: P': actualChem?.P || '-',
                    'Chem: Cu': actualChem?.Cu || '-',
                    'Chem: Cr': actualChem?.Cr || '-',

                    'Metallurgical Result(Micro)': meta.micro_structure_ok ? 'OK' : (meta.micro_structure_ok === false ? 'NOT OK' : '-'),
                    'Metallurgical Result(Mech)': meta.mech_properties_ok ? 'OK' : (meta.mech_properties_ok === false ? 'NOT OK' : '-'),
                    'Metallurgical Result(Impact)': meta.impact_strength_ok ? 'OK' : (meta.impact_strength_ok === false ? 'NOT OK' : '-'),
                    'Metallurgical Result(Hardness)': meta.hardness_ok ? 'OK' : (meta.hardness_ok === false ? 'NOT OK' : '-'),

                    'Visual Result': visual.visual_ok ? 'OK' : (visual.visual_ok === false ? 'NOT OK' : '-'),
                    'Total Inspected': visInspections.reduce((acc: number, r: any) => acc + (parseFloat(r['Inspected Quantity']) || 0), 0),
                    'Total Accepted': visInspections.reduce((acc: number, r: any) => acc + (parseFloat(r['Accepted Quantity']) || 0), 0),
                    'Total Rejected': visInspections.reduce((acc: number, r: any) => acc + (parseFloat(r['Rejected Quantity']) || 0), 0),

                    'NDT Result': visual.ndt_inspection_ok ? 'OK' : (visual.ndt_inspection_ok === false ? 'NOT OK' : '-'),
                    'NDT Inspected Qty': ndtInspections.reduce((acc: number, r: any) => acc + (parseFloat(r['Inspected Quantity']) || 0), 0),
                    'NDT Accepted Qty': ndtInspections.reduce((acc: number, r: any) => acc + (parseFloat(r['Accepted Quantity']) || 0), 0),
                    'NDT Rejected Qty': ndtInspections.reduce((acc: number, r: any) => acc + (parseFloat(r['Rejected Quantity']) || 0), 0),
                    
                    'Hardness Result': visual.hardness_ok ? 'OK' : (visual.hardness_ok === false ? 'NOT OK' : '-'),
                    'Hardness Inspected Qty': hardnessInspections.reduce((acc: number, r: any) => acc + (parseFloat(r['Inspected Quantity']) || 0), 0),
                    'Hardness Accepted Qty': hardnessInspections.reduce((acc: number, r: any) => acc + (parseFloat(r['Accepted Quantity']) || 0), 0),
                    'Hardness Rejected Qty': hardnessInspections.reduce((acc: number, r: any) => acc + (parseFloat(r['Rejected Quantity']) || 0), 0),

                    'MC Received Qty': mcInspections.reduce((acc: number, r: any) => acc + (parseFloat(r['Received Quantity']) || 0), 0),
                    'MC Inspected Qty': mcInspections.reduce((acc: number, r: any) => acc + (parseFloat(r['Inspected Quantity']) || 0), 0),
                    'MC Accepted Qty': mcInspections.reduce((acc: number, r: any) => acc + (parseFloat(r['Accepted Quantity']) || 0), 0),
                    'MC Rejected Qty': mcInspections.reduce((acc: number, r: any) => acc + (parseFloat(r['Rejected Quantity']) || 0), 0),
                };

                return row;
            });

            const worksheet = XLSX.utils.json_to_sheet(flattenedData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Consolidated Trials');

            worksheet['!cols'] = Object.keys(flattenedData[0] || {}).map(() => ({ wch: 20 }));

            XLSX.writeFile(workbook, `Consolidated_Report_${report.pattern_code}_${new Date().toISOString().split('T')[0]}.xlsx`);

            Swal.fire({
                title: 'Success!',
                text: 'Consolidated report exported to Excel.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });

        } catch (error) {
            console.error('Error exporting consolidated excel:', error);
            Swal.fire('Error', 'Failed to generate Excel report.', 'error');
        } finally {
            setExportingExcel(null);
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
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                        <Button
                                            onClick={() => handleViewReport(report)}
                                            variant="contained"
                                            size="small"
                                            disabled={fetchingReport === report.pattern_code}
                                            startIcon={<VisibilityIcon fontSize="small" />}
                                            sx={{
                                                textTransform: 'none',
                                                bgcolor: '#E67E22',
                                                '&:hover': {
                                                    bgcolor: '#D35400',
                                                }
                                            }}
                                        >
                                            {fetchingReport === report.pattern_code ? 'Loading...' : 'View PDF'}
                                        </Button>
                                        <Button
                                            onClick={() => handleExportExcel(report)}
                                            variant="contained"
                                            color="success"
                                            size="small"
                                            disabled={exportingExcel === report.pattern_code}
                                            startIcon={exportingExcel === report.pattern_code ? <CircularProgress size={16} color="inherit" /> : <FileDownloadIcon fontSize="small" />}
                                            sx={{
                                                textTransform: 'none',
                                                fontWeight: 600
                                            }}
                                        >
                                            {exportingExcel === report.pattern_code ? 'Exporting...' : 'Excel'}
                                        </Button>
                                    </Box>
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
