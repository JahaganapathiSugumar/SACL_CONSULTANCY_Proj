import React, { useEffect, useState, useMemo } from 'react';
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
    Container,
    ThemeProvider,
    TextField,
    InputAdornment,
    IconButton,
    Tooltip,
    Select,
    MenuItem,
    InputLabel,
    Checkbox,
    FormControl,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TableContainer,
    TablePagination,
    CircularProgress,
    Autocomplete,
} from '@mui/material';
import * as XLSX from 'xlsx';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import LoadingState from '../components/common/LoadingState';
import DocumentViewer from '../components/common/DocumentViewer';
import BackButton from '../components/common/BackButton';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';
import Swal from 'sweetalert2';
import { appTheme, COLORS } from '../theme/appTheme';
import { trialService } from '../services/trialService';
import { useAuth } from '../context/AuthContext';
import Header from '../components/dashboard/Header';
import ProfileModal from '../components/dashboard/ProfileModal';
import { getDepartmentInfo } from '../utils/dashboardUtils';
import { apiService } from '../services/commonService';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Collapse, Grid, Card, CardContent, Chip } from '@mui/material';
import departmentProgressService, { type ProgressItem } from '../services/departmentProgressService';
import { getPendingRoute } from '../utils/dashboardUtils';


interface AllTrialsPageProps {
    embedded?: boolean;
}

export default function AllTrialsPage({ embedded = false }: AllTrialsPageProps) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const [trials, setTrials] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [deptFilter, setDeptFilter] = useState('ALL');
    const [patternFilter, setPatternFilter] = useState('ALL');
    const [departments, setDepartments] = useState<any[]>([]);
    const [showProfile, setShowProfile] = useState(false);
    const [headerRefreshKey, setHeaderRefreshKey] = useState(0);
    const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [fetchingReport, setFetchingReport] = useState<number | string | null>(null);
    const departmentInfo = getDepartmentInfo(user);


    const [expandedTrialId, setExpandedTrialId] = useState<number | string | null>(null);
    const [trialProgressData, setTrialProgressData] = useState<Record<string | number, ProgressItem[]>>({});
    const [loadingProgress, setLoadingProgress] = useState<Record<string | number, boolean>>({});


    useEffect(() => {
        const fetchTrialReports = async () => {
            try {
                const data = await trialService.getAllTrialReports();
                setTrials(data);
            } catch (error) {
                console.error("Error fetching trial reports:", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchDepartments = async () => {
            try {
                const data = await apiService.getDepartments();
                setDepartments(data);
            } catch (error) {
                console.error("Error fetching departments:", error);
            }
        };

        fetchTrialReports();
        fetchDepartments();
    }, []);

    const uniquePatternCodes = useMemo(() => {
        const codes = trials.map(t => t.pattern_code).filter(Boolean);
        return Array.from(new Set(codes)).sort() as string[];
    }, [trials]);

    const filteredTrials = trials
        .filter(trial => {
            const searchLower = searchTerm.toLowerCase();
            return (
                String(trial.trial_id || '').toLowerCase().includes(searchLower) ||
                String(trial.trial_no || '').toLowerCase().includes(searchLower) ||
                String(trial.part_name || '').toLowerCase().includes(searchLower) ||
                String(trial.pattern_code || '').toLowerCase().includes(searchLower)
            );
        })
        .filter(trial => {
            if (statusFilter === 'ALL') return true;
            return trial.status === statusFilter;
        })
        .filter(trial => {
            if (deptFilter === 'ALL') return true;
            return trial.current_department_id === Number(deptFilter);
        })
        .filter(trial => {
            if (patternFilter === 'ALL') return true;
            return trial.pattern_code === patternFilter;
        })
        .sort((a, b) => new Date(b.date_of_sampling).getTime() - new Date(a.date_of_sampling).getTime());
    
    const totalCols = useMemo(() => {
        let cols = 8;
        if (user?.role === 'Admin') {
            cols += 2;
        }
        return cols;
    }, [user]);

    const handleGlobalExport = async () => {
        if (filteredTrials.length === 0) return;
        
        try {
            setLoading(true);
            const allProgress = await Promise.all(
                filteredTrials.map(async (trial) => {
                    try {
                        const progress = trialProgressData[trial.trial_id] || 
                                        await departmentProgressService.getProgressByTrialId(trial.trial_id);
                        return { trial, progress };
                    } catch (err) {
                        console.error(`Error fetching progress for trial ${trial.trial_no}:`, err);
                        return { trial, progress: [] };
                    }
                })
            );

            const exportData = allProgress.map(({ trial, progress }) => {
                const row: any = {
                    'Trial No': trial.trial_no,
                    'Part Name': trial.part_name,
                    'Pattern Code': trial.pattern_code,
                    'Grade': trial.material_grade,
                    'Sampling Date': new Date(trial.date_of_sampling).toLocaleDateString('en-GB'),
                    'Overall Status': trial.status,
                    'Current Dept': trial.department || 'N/A'
                };
                
                departments.forEach(dept => {
                    const p = progress.find(prog => prog.department_id === dept.department_id);
                    row[`${dept.department_name} (Completed)`] = p?.completed_at 
                        ? new Date(p.completed_at).toLocaleString('en-GB') 
                        : (p?.approval_status ? p.approval_status.charAt(0).toUpperCase() + p.approval_status.slice(1) : 'Pending');
                });
                
                return row;
            });

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Trials Progress');

            const wscols = [
                { wch: 15 },
                { wch: 30 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
                { wch: 20 },
                ...departments.map(() => ({ wch: 25 }))
            ];
            worksheet['!cols'] = wscols;

            XLSX.writeFile(workbook, `Trial_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

            Swal.fire({
                title: 'Success!',
                text: 'Trial report exported to Excel.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error("Error exporting trial report:", error);
            Swal.fire('Error', 'Failed to generate trial report.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        const result = await Swal.fire({
            title: 'Delete Selected Trials?',
            text: `You are about to delete ${selectedIds.length} trial(s). This action will move them to the recycle bin.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete all!'
        });

        if (result.isConfirmed) {
            try {
                setLoading(true);
                const selectedTrials = trials.filter(t => selectedIds.includes(t.trial_id));
                const uniquePatternCodes = Array.from(new Set(selectedTrials.map(t => t.pattern_code).filter(pc => !!pc)));
                const response = await trialService.bulkDeleteTrialCards(selectedIds, uniquePatternCodes);

                if (response.success) {
                    Swal.fire('Deleted!', `${selectedIds.length} trial(s) have been deleted.`, 'success');
                    const data = await trialService.getAllTrialReports();
                    setTrials(data);
                    setSelectedIds([]);
                } else {
                    Swal.fire('Failed!', response.message || 'Failed to delete trials.', 'error');
                }
            } catch (error) {
                console.error("Error during bulk delete:", error);
                Swal.fire('Error!', 'An error occurred during bulk deletion.', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleToggleSelectAll = () => {
        if (selectedIds.length === filteredTrials.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredTrials.map(t => t.trial_id));
        }
    };

    const handleToggleSelect = (trialId: number | string) => {
        setSelectedIds(prev =>
            prev.includes(trialId)
                ? prev.filter(id => id !== trialId)
                : [...prev, trialId]
        );
    };

    const handleDeleteTrialReport = async (trial: any) => {
        const result = await Swal.fire({
            title: 'Delete Trial Report?',
            text: `You are about to delete trial report for Trial No: ${trial.trial_no} (${trial.part_name}). This action will move it to the recycle bin.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                setLoading(true);
                const response = await trialService.deleteTrialReport(trial.trial_id);
                if (response.success) {
                    Swal.fire('Deleted!', 'Trial report has been moved to recycle bin.', 'success');
                    const data = await trialService.getAllTrialReports();
                    setTrials(data);
                } else {
                    Swal.fire('Failed!', response.message || 'Failed to delete trial report.', 'error');
                }
            } catch (error) {
                console.error("Error deleting trial report:", error);
                Swal.fire('Error!', 'An unexpected error occurred.', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const [viewReport, setViewReport] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

    const handleViewReport = async (trial: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        try {
            setFetchingReport(trial.trial_id);

            let reportData = trial;
            if (!trial.file_base64) {
                const response = await trialService.getTrialReportFile(trial.trial_id);
                if (response && response.file_base64) {
                    reportData = { ...trial, ...response };
                } else {
                    Swal.fire('Error', 'Report file content not found.', 'error');
                    return;
                }
            }

            const document = {
                document_id: Date.now(),
                file_name: reportData.file_name || `Report_${reportData.trial_id}.pdf`,
                document_type: reportData.document_type || 'TRIAL_REPORT',
                file_base64: reportData.file_base64,
                uploaded_by: 'System',
                uploaded_at: new Date().toISOString(),
                remarks: 'Auto-generated Report'
            };

            setViewReport({
                trialId: reportData.trial_id,
                trialNo: reportData.trial_no,
                partName: reportData.part_name,
                documents: [document]
            });
        } catch (error) {
            console.error("Error fetching report base64:", error);
            Swal.fire('Error', 'Failed to load report file.', 'error');
        } finally {
            setFetchingReport(null);
        }
    };

    const handleExpandRow = async (trialId: number | string) => {
        if (expandedTrialId === trialId) {
            setExpandedTrialId(null);
            return;
        }

        setExpandedTrialId(trialId);

        if (!trialProgressData[trialId]) {
            setLoadingProgress(prev => ({ ...prev, [trialId]: true }));
            try {
                const data = await departmentProgressService.getProgressByTrialId(trialId);
                setTrialProgressData(prev => ({ ...prev, [trialId]: data }));
            } catch (error) {
                console.error("Error fetching trial progress:", error);
            } finally {
                setLoadingProgress(prev => ({ ...prev, [trialId]: false }));
            }
        }
    };



    const handleExportTrialDetails = (trial: any, progress: any[]) => {
        try {
            // Header Info
            const trialInfo = [
                ['TRIAL DETAILS REPORT'],
                [''],
                ['Trial No', trial.trial_no],
                ['Part Name', trial.part_name],
                ['Pattern Code', trial.pattern_code],
                ['Grade', trial.material_grade],
                ['Sampling Date', new Date(trial.date_of_sampling).toLocaleDateString('en-GB')],
                ['Overall Status', trial.status],
                [''],
                ['DEPARTMENT PROGRESS HISTORY'],
                ['Department', 'Status', 'Completed At', 'Remarks']
            ];

            // Progress Rows
            const progressRows = progress.map(p => [
                p.department_name || `Dept ${p.department_id}`,
                p.approval_status ? p.approval_status.charAt(0).toUpperCase() + p.approval_status.slice(1) : 'Pending',
                p.completed_at ? new Date(p.completed_at).toLocaleString('en-GB') : 'Pending',
                p.remarks || '-'
            ]);

            const finalData = [...trialInfo, ...progressRows];

            const worksheet = XLSX.utils.aoa_to_sheet(finalData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Trial Details');

            // Formatting
            const wscols = [
                { wch: 25 },
                { wch: 15 },
                { wch: 25 },
                { wch: 40 }
            ];
            worksheet['!cols'] = wscols;

            XLSX.writeFile(workbook, `Trial_${trial.trial_no}_Details_${new Date().toISOString().split('T')[0]}.xlsx`);

            Swal.fire({
                title: 'Success!',
                text: 'Trial details exported to Excel.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error("Trial detail export error:", error);
            Swal.fire('Error', 'Failed to export trial details.', 'error');
        }
    };

    const handleRowExportClick = async (trial: any) => {
        let progress = trialProgressData[trial.trial_id];
        if (!progress || progress.length === 0) {
            Swal.fire({
                title: 'Preparing Export',
                text: 'Fetching detailed progress data...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            try {
                progress = await departmentProgressService.getProgressByTrialId(trial.trial_id);
                setTrialProgressData(prev => ({ ...prev, [trial.trial_id]: progress }));
                Swal.close();
            } catch (error) {
                console.error("Error fetching trial progress:", error);
                Swal.fire('Error', 'Failed to fetch trial progress details.', 'error');
                return;
            }
        }
        handleExportTrialDetails(trial, progress);
    };
    return (
        <ThemeProvider theme={appTheme}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                {!embedded && (
                    <Header
                        setShowProfile={setShowProfile}
                        departmentInfo={departmentInfo}
                        photoRefreshKey={headerRefreshKey}
                        showBackButton={true}
                    />
                )}
                <Box sx={{ p: embedded ? 0 : 3, pb: 1, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 2
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {!embedded && <BackButton label="Back" variant="button" />}
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                            <FormControl size="small" sx={{ minWidth: 160, bgcolor: 'white' }}>
                                <InputLabel>Department</InputLabel>
                                <Select
                                    value={deptFilter}
                                    label="Department"
                                    onChange={(e) => setDeptFilter(e.target.value)}
                                    sx={{ bgcolor: 'white' }}
                                >
                                    <MenuItem value="ALL">All Departments</MenuItem>
                                    {departments.map((dept) => (
                                        <MenuItem key={dept.department_id} value={dept.department_id}>
                                            {dept.department_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 140, bgcolor: 'white' }}>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Status"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    sx={{ bgcolor: 'white' }}
                                >
                                    <MenuItem value="ALL">All Status</MenuItem>
                                    <MenuItem value="CREATED">Created</MenuItem>
                                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                                    <MenuItem value="CLOSED">Closed</MenuItem>
                                </Select>
                            </FormControl>
                            <Autocomplete
                                size="small"
                                sx={{ minWidth: 200, bgcolor: 'white' }}
                                options={['ALL', ...uniquePatternCodes]}
                                getOptionLabel={(option) => option === 'ALL' ? 'All Pattern Codes' : option}
                                value={patternFilter}
                                onChange={(_, newValue) => setPatternFilter(newValue || 'ALL')}
                                renderInput={(params) => (
                                    <TextField {...params} label="Pattern Code" variant="outlined" />
                                )}
                            />
                            <TextField
                                placeholder="Search Trial No, Part Name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                size="small"
                                sx={{
                                    bgcolor: 'white',
                                    width: { xs: '100%', sm: 280 }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: '#94a3b8', fontSize: '1.1rem' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                variant="contained"
                                color="success"
                                size="small"
                                disabled={filteredTrials.length === 0}
                                startIcon={<FileDownloadIcon fontSize="small" />}
                                onClick={handleGlobalExport}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderRadius: 1,
                                    height: '40px',
                                    whiteSpace: 'nowrap',
                                    display: (user?.department_id != 3) ? 'flex' : 'none'
                                }}
                            >
                                Export Report
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                size="small"
                                disabled={selectedIds.length === 0}
                                startIcon={<DeleteIcon fontSize="small" />}
                                onClick={handleBulkDelete}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderRadius: 1,
                                    height: '40px',
                                    whiteSpace: 'nowrap',
                                    display: (user?.role === 'Admin' && selectedIds.length > 0) ? 'flex' : 'none'
                                }}
                            >
                                Delete Selected ({selectedIds.length})
                            </Button>
                        </Box>
                    </Box>
                </Box>
                <Box sx={{ flexGrow: 1, overflow: 'hidden', p: embedded ? 0 : 3, pt: 1, display: 'flex', flexDirection: 'column' }}>

                    <TableContainer
                        className="premium-table-container"
                        sx={{
                            flexGrow: 1,
                            maxHeight: '650px',
                            overflow: 'auto',
                            position: 'relative',
                            minHeight: loading || filteredTrials.length === 0 ? '300px' : 'auto',
                            bgcolor: 'white',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0'
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
                                <LoadingState message="Fetching trials..." />
                            </Box>
                        ) : null}
                        <Table stickyHeader size="medium">
                            <TableHead className="premium-table-head">
                                <TableRow>
                                    {user?.role === 'Admin' && (
                                        <TableCell padding="checkbox" className="premium-table-header-cell">
                                            <Checkbox
                                                indeterminate={selectedIds.length > 0 && selectedIds.length < filteredTrials.length}
                                                checked={filteredTrials.length > 0 && selectedIds.length === filteredTrials.length}
                                                onChange={handleToggleSelectAll}
                                                size="small"
                                            />
                                        </TableCell>
                                    )}
                                    {user?.role === 'Admin' && <TableCell className="premium-table-header-cell" />}

                                    <TableCell className="premium-table-header-cell">Trial No</TableCell>
                                    <TableCell className="premium-table-header-cell">Part Name</TableCell>
                                    <TableCell className="premium-table-header-cell">Pattern Code</TableCell>
                                    <TableCell className="premium-table-header-cell">Grade</TableCell>
                                    <TableCell className="premium-table-header-cell">Date</TableCell>
                                    <TableCell className="premium-table-header-cell">Dept</TableCell>
                                    <TableCell className="premium-table-header-cell">Status</TableCell>
                                    <TableCell className="premium-table-header-cell" style={{ textAlign: 'center' }}>Report</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredTrials.length > 0 ? (
                                    filteredTrials.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((trial) => (
                                        <React.Fragment key={trial.trial_id}>
                                            <TableRow
                                                hover
                                                selected={selectedIds.includes(trial.trial_id)}
                                                className="premium-table-row"
                                            >
                                                {user?.role === 'Admin' && (
                                                    <TableCell padding="checkbox" className="premium-table-cell">
                                                        <Checkbox
                                                            checked={selectedIds.includes(trial.trial_id)}
                                                            onChange={() => handleToggleSelect(trial.trial_id)}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                )}
                                                {user?.role === 'Admin' && (
                                                    <TableCell className="premium-table-cell">
                                                        <IconButton
                                                            aria-label="expand row"
                                                            size="small"
                                                            onClick={() => handleExpandRow(trial.trial_id)}
                                                        >
                                                            {expandedTrialId === trial.trial_id ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                                        </IconButton>
                                                    </TableCell>
                                                )}

                                                <TableCell className="premium-table-cell-bold">{trial.trial_no}</TableCell>
                                                <TableCell className="premium-table-cell">
                                                    <Box sx={{ maxWidth: { xs: '60px', sm: '100%' }, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {trial.part_name}
                                                    </Box>
                                                </TableCell>
                                                <TableCell className="premium-table-cell">{trial.pattern_code}</TableCell>
                                                <TableCell className="premium-table-cell">{trial.material_grade}</TableCell>
                                                <TableCell className="premium-table-cell">{new Date(trial.date_of_sampling).toLocaleDateString('en-GB')}</TableCell>
                                                <TableCell className="premium-table-cell">
                                                    <span className="status-pill status-pill-info">
                                                        {trial.department || 'N/A'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="premium-table-cell">
                                                    <span className={`status-pill ${trial.status === 'CLOSED' ? 'status-pill-success' :
                                                        trial.status === 'CREATED' ? 'status-pill-info' :
                                                            'status-pill-warning'
                                                        }`}>
                                                        {trial.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell align="center" className="premium-table-cell">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                                        {(trial.status === 'CLOSED' && trial.document_id) ? (
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                disabled={fetchingReport === trial.trial_id}
                                                                startIcon={fetchingReport === trial.trial_id ? <CircularProgress size={16} /> : <DescriptionIcon />}
                                                                onClick={() => handleViewReport(trial)}
                                                                sx={{
                                                                    borderRadius: 1,
                                                                    textTransform: 'none',
                                                                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                                                                    padding: { xs: '2px 8px', sm: '4px 12px' }
                                                                }}
                                                            >
                                                                {fetchingReport === trial.trial_id ? 'Loading...' : 'Report'}
                                                            </Button>
                                                        ) : "N/A"}
                                                        {trial.document_id && user?.role === 'Admin' && (
                                                            <Tooltip title="Delete Report">
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => handleDeleteTrialReport(trial)}
                                                                    sx={{
                                                                        ml: 0.5,
                                                                        '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' }
                                                                    }}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>

                                            <TableRow>
                                                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={totalCols} className="premium-table-cell">
                                                    <Collapse in={expandedTrialId === trial.trial_id} timeout="auto" unmountOnExit>
                                                        <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2 }}>
                                                            <Typography variant="h6" gutterBottom component="div" sx={{ fontSize: '1rem', fontWeight: 'bold', mb: 2 }}>
                                                                Detailed Progress History
                                                            </Typography>
                                                            {loadingProgress[trial.trial_id] ? (
                                                                <LoadingState size={24} message="Loading details..." />
                                                            ) : (trialProgressData[trial.trial_id] && trialProgressData[trial.trial_id].length > 0) ? (
                                                                <Box sx={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: 2,
                                                                    pb: 1
                                                                }}>
                                                                    {trialProgressData[trial.trial_id].map((progress: ProgressItem, index: number) => (
                                                                        <Box key={index} sx={{ width: '100%' }}>
                                                                            <Card variant="outlined" sx={{ borderRadius: 2 }}>
                                                                                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                                                                    <Grid container alignItems="center" spacing={2}>
                                                                                        <Grid size={{ xs: 3 }}>
                                                                                            <Typography variant="subtitle2" color="textSecondary">Department</Typography>
                                                                                            <Typography variant="body2" fontWeight="medium">{progress.department_name || `Dept ID: ${progress.department_id}`}</Typography>
                                                                                        </Grid>
                                                                                        <Grid size={{ xs: 2 }}>
                                                                                            <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                                                                                            <Chip
                                                                                                label={progress.approval_status}
                                                                                                size="small"
                                                                                                color={progress.approval_status === 'approved' ? 'success' : 'warning'}
                                                                                                variant="outlined"
                                                                                                sx={{ textTransform: 'capitalize' }}
                                                                                            />
                                                                                            {user?.role === 'Admin' && progress.department_id !== 2 && progress.department_id !== 3 && (
                                                                                                <Tooltip title="Toggle Status">
                                                                                                    <IconButton
                                                                                                        size="small"
                                                                                                        onClick={async () => {
                                                                                                            try {
                                                                                                                const result = await Swal.fire({
                                                                                                                    title: 'Toggle Status?',
                                                                                                                    text: `Change status from ${progress.approval_status}?`,
                                                                                                                    icon: 'question',
                                                                                                                    showCancelButton: true,
                                                                                                                    confirmButtonText: 'Yes, change it'
                                                                                                                });

                                                                                                                if (result.isConfirmed) {
                                                                                                                    setLoadingProgress(prev => ({ ...prev, [trial.trial_id]: true }));
                                                                                                                    const response = await departmentProgressService.toggleApprovalStatus(trial.trial_id, progress.department_id);
                                                                                                                    if (response.success) {
                                                                                                                        const data = await departmentProgressService.getProgressByTrialId(trial.trial_id);
                                                                                                                        setTrialProgressData(prev => ({ ...prev, [trial.trial_id]: data }));
                                                                                                                        Swal.fire('Updated!', 'Status has been updated.', 'success');
                                                                                                                    } else {
                                                                                                                        Swal.fire('Error!', response.message || 'Failed to update.', 'error');
                                                                                                                    }
                                                                                                                }
                                                                                                            } catch (error) {
                                                                                                                console.error("Toggle error:", error);
                                                                                                                Swal.fire('Error!', 'Failed to toggle status.', 'error');
                                                                                                            } finally {
                                                                                                                setLoadingProgress(prev => ({ ...prev, [trial.trial_id]: false }));
                                                                                                            }
                                                                                                        }}
                                                                                                    >
                                                                                                        <PublishedWithChangesIcon fontSize="small" color="primary" />
                                                                                                    </IconButton>
                                                                                                </Tooltip>
                                                                                            )}
                                                                                        </Grid>
                                                                                        <Grid size={{ xs: 3 }}>
                                                                                            <Typography variant="subtitle2" color="textSecondary">Completed At</Typography>
                                                                                            <Typography variant="body2">
                                                                                                {progress.completed_at ? new Date(progress.completed_at).toLocaleString() : '-'}
                                                                                            </Typography>
                                                                                        </Grid>
                                                                                        <Grid size={{ xs: 2 }}>
                                                                                            <Typography variant="subtitle2" color="textSecondary">Remarks</Typography>
                                                                                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                                                                                {progress.remarks || 'No remarks'}
                                                                                            </Typography>
                                                                                        </Grid>
                                                                                        <Grid size={{ xs: 2 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                                                            <Button
                                                                                                variant="contained"
                                                                                                size="small"
                                                                                                color="primary"
                                                                                                onClick={() => navigate(`${getPendingRoute(progress.department_id)}?trial_id=${trial.trial_id}`)}
                                                                                                sx={{ textTransform: 'none' }}
                                                                                            >
                                                                                                View Details
                                                                                            </Button>
                                                                                        </Grid>
                                                                                    </Grid>
                                                                                </CardContent>
                                                                            </Card>
                                                                        </Box>
                                                                    ))}
                                                                </Box>
                                                            ) : (
                                                                <Typography variant="body2" color="textSecondary" align="center">
                                                                    No progress data available.
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Collapse>
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={totalCols} align="center" className="premium-table-cell" sx={{ py: 20 }}>
                                            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                                No trials found.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        component="div"
                        count={filteredTrials.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(event) => {
                            setRowsPerPage(parseInt(event.target.value, 10));
                            setPage(0);
                        }}
                        sx={{
                            borderTop: '1px solid #e2e8f0',
                            bgcolor: '#f8fafc',
                            borderBottomLeftRadius: '12px',
                            borderBottomRightRadius: '12px'
                        }}
                    />
                </Box>

                <Box sx={{ mt: 3, textAlign: 'right' }}>
                </Box>
            </Box>

            <Dialog open={!!viewReport} onClose={() => setViewReport(null)} maxWidth="md" fullWidth>
                <DialogTitle>Trial Report - {viewReport?.partName} - Trial No: {viewReport?.trialNo}</DialogTitle>
                <DialogContent>
                    {viewReport && (
                        <DocumentViewer
                            documents={viewReport.documents}
                            label="Generated Report"
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewReport(null)}>Close</Button>
                </DialogActions>
            </Dialog>

            {!embedded && showProfile && (
                <ProfileModal
                    onClose={() => setShowProfile(false)}
                    onPhotoUpdate={() => setHeaderRefreshKey(prev => prev + 1)}
                />
            )}
        </ThemeProvider>
    );
}
