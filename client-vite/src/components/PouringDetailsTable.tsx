import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import NoPendingWorks from "./common/NoPendingWorks";
import { useAuth } from "../context/AuthContext";
import { getProgress } from "../services/departmentProgressService";
import { useNavigate } from 'react-router-dom';
import {
    Paper,
    Typography,
    TextField,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Chip,
    ThemeProvider,
    createTheme,
    Button,
    Grid,
    Container,
    InputAdornment,
    useMediaQuery,
    GlobalStyles,
    Divider,
    IconButton
} from "@mui/material";

// Icons
import FactoryIcon from '@mui/icons-material/Factory';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download'; // Added Download Icon
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from "@mui/icons-material/Person";
import SaclHeader from "./common/SaclHeader";
import NoAccess from "./common/NoAccess";
import { ipService } from '../services/ipService';
import { inspectionService } from '../services/inspectionService';
import { COLORS, appTheme } from '../theme/appTheme';
import { useAlert } from '../hooks/useAlert';
import { AlertMessage } from './common/AlertMessage';
import { fileToMeta, validateFileSizes } from '../utils';
import DepartmentHeader from "./common/DepartmentHeader";
import { LoadingState, EmptyState, SpecInput, ActionButtons, FileUploadSection, PreviewModal } from './common';



const LabelText = ({ children }: { children: React.ReactNode }) => (
    <Typography variant="caption" sx={{ fontWeight: 700, color: COLORS.textSecondary, mb: 0.5, display: 'block' }}>
        {children}
    </Typography>
);



export interface PouringDetails {
    date: string;
    heatCode: string;
    cComposition: string;
    siComposition: string;
    mnComposition: string;
    pComposition: string;
    sComposition: string;
    mgComposition: string;
    crComposition: string;
    cuComposition: string;
    pouringTempDegC: string;
    pouringTimeSec: string;
    ficHeatNo: string;
    ppCode: string;
    followedBy: string;
    userName: string;
}

export interface SubmittedData {
    selectedPart: any | null;
    selectedPattern: any | null;
    machine: string;
    reason: string;
    trialNo: string;
    samplingDate: string;
    mouldCount: string;
    sampleTraceability: string;
}

interface PouringDetailsTableProps {
    pouringDetails?: PouringDetails;
    onPouringDetailsChange?: (details: PouringDetails) => void;
    submittedData?: SubmittedData;
}



function PouringDetailsTable({ pouringDetails, onPouringDetailsChange, submittedData }: PouringDetailsTableProps) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isMobile = useMediaQuery(appTheme.breakpoints.down('sm'));
    const [assigned, setAssigned] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(false);
    const [trialId, setTrialId] = useState<string>("");

    // Pouring Details State
    const [pouringDate, setPouringDate] = useState<string>(pouringDetails?.date || new Date().toISOString().split('T')[0]);
    const [heatCode, setHeatCode] = useState<string>(pouringDetails?.heatCode || "");
    const [chemState, setChemState] = useState({
        c: pouringDetails?.cComposition || "",
        si: pouringDetails?.siComposition || "",
        mn: pouringDetails?.mnComposition || "",
        p: pouringDetails?.pComposition || "",
        s: pouringDetails?.sComposition || "",
        mg: pouringDetails?.mgComposition || "",
        cr: pouringDetails?.crComposition || "",
        cu: pouringDetails?.cuComposition || ""
    });
    const [pouringTemp, setPouringTemp] = useState<string>(pouringDetails?.pouringTempDegC || "");
    const [pouringTime, setPouringTime] = useState<string>(pouringDetails?.pouringTimeSec || "");
    const [inoculationStream, setInoculationStream] = useState<string>("");
    const [inoculationInmould, setInoculationInmould] = useState<string>("");

    // Remarks State
    const [ficHeatNo, setFicHeatNo] = useState<string>(pouringDetails?.ficHeatNo || "");
    const [ppCode, setPpCode] = useState<string>(pouringDetails?.ppCode || "");
    const [followedBy, setFollowedBy] = useState<string>(pouringDetails?.followedBy || "");
    const [remarksText, setRemarksText] = useState<string>("");
    // Attach PDF / Images
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

    const [previewMode, setPreviewMode] = useState(false);
    const [previewPayload, setPreviewPayload] = useState<any | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const { alert, showAlert } = useAlert();
    const [userIP, setUserIP] = useState<string>("");

    useEffect(() => {
        let mounted = true;
        const check = async () => {
            try {
                const uname = user?.username ?? "";
                const res = await getProgress(uname);
                if (mounted) setAssigned(res.length > 0);
            } catch {
                if (mounted) setAssigned(false);
            }
        };
        if (user) check();
        return () => { mounted = false; };
    }, [user]);

    // Check if user has access to this page
    // if (user?.department_id !== 9) {
    //     return <NoAccess />;
    // }

    useEffect(() => {
        if (onPouringDetailsChange) {
            onPouringDetailsChange({
                date: pouringDate,
                heatCode,
                cComposition: chemState.c,
                siComposition: chemState.si,
                mnComposition: chemState.mn,
                pComposition: chemState.p,
                sComposition: chemState.s,
                mgComposition: chemState.mg,
                crComposition: chemState.cr,
                cuComposition: chemState.cu,
                pouringTempDegC: pouringTemp,
                pouringTimeSec: pouringTime,
                ficHeatNo,
                ppCode,
                followedBy,
                userName: user?.username || "system"
            });
        }
    }, [pouringDate, heatCode, chemState, pouringTemp, pouringTime, ficHeatNo, ppCode, followedBy, user?.username, onPouringDetailsChange]);

    useEffect(() => {
        const fetchIP = async () => {
            const ip = await ipService.getUserIP();
            setUserIP(ip);
        };
        fetchIP();
    }, []);
    // Early exits after all hooks registered
    if (assigned === null) return <LoadingState />;
    if (!assigned) return <EmptyState title="No pending works or access denied" severity="warning" />;
    // Handle PDF/Image Upload
    const handleAttachFiles = (newFiles: File[]) => {
        setAttachedFiles(prev => [...prev, ...newFiles]);
    };

    const removeAttachedFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };


    const handleSaveAndContinue = () => {
        const payload = {
            pouringDate,
            heatCode,
            chemical_composition: chemState,
            pouringTemp,
            pouringTime,
            inoculation: { stream: inoculationStream, inmould: inoculationInmould },
            remarks: { ficHeatNo, ppCode, followedBy, userName: user?.username }
        };
        setPreviewPayload(payload);
        setPreviewMode(true);
    };

    const handleFinalSave = async () => {
        try {
            setLoading(true);

            // Construct the API payload according to backend schema
            const apiPayload = {
                trial_id: 'sample',
                pour_date: pouringDate,
                heat_code: heatCode,
                composition: {
                    C: chemState.c,
                    Si: chemState.si,
                    Mn: chemState.mn,
                    P: chemState.p,
                    S: chemState.s,
                    Mg: chemState.mg,
                    Cu: chemState.cu,
                    Cr: chemState.cr
                },
                pouring_temp_c: parseFloat(pouringTemp) || 0,
                pouring_time_sec: parseInt(pouringTime) || 0,
                inoculation: {
                    Stream: inoculationStream,
                    Inmould: inoculationInmould
                },
                other_remarks: {
                    "F/C & Heat No.": ficHeatNo,
                    "PP Code": ppCode,
                    "Followed by": followedBy,
                    "Username": user?.username
                },
                remarks: remarksText
            };

            console.log("Submitting pouring details:", apiPayload);

            const result = await inspectionService.submitPouringDetails(apiPayload);

            if (!result.success) {
                showAlert('error', result.message || 'Failed to submit pouring details. Please try again.');
            } else {
                setSubmitted(true);
                showAlert('success', 'Pouring details created successfully.');

                if (attachedFiles.length > 0) {
                    try {
                        // Upload attached files after successful form submission
                        // const uploadResults = await uploadFiles(
                        //   attachedFiles,
                        //   trialId,
                        //   "POURING",
                        //   user?.username || "system",
                        //   additionalRemarks || ""
                        // );

                        // const failures = uploadResults.filter(r => !r.success);
                        // if (failures.length > 0) {
                        //   console.error("Some files failed to upload:", failures);
                        // }
                    } catch (uploadError) {
                        console.error("File upload error:", uploadError);
                        // Non-blocking: form submission already succeeded
                    }
                }
            }
        } catch (error) {
            console.error("Error saving pouring details:", error);
            showAlert('error', 'Failed to save pouring details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = () => { window.print(); };

    // Font style for data values to match inputs
    const dataFontStyle = { fontFamily: '"Roboto Mono", monospace', fontWeight: 500 };

    return (
        <ThemeProvider theme={appTheme}>
            <GlobalStyles styles={{
                "@media print": {
                    "html, body": { height: "initial !important", overflow: "initial !important", backgroundColor: "white !important" },
                    "body *": { visibility: "hidden" },
                    ".print-section, .print-section *": { visibility: "visible" },
                    ".print-section": { display: "block !important", position: "absolute", left: 0, top: 0, width: "100%", color: "black", backgroundColor: "white", padding: "20px" },
                    ".MuiModal-root": { display: "none !important" }
                }
            }} />

            <Box sx={{ minHeight: "100vh", bgcolor: COLORS.background, py: { xs: 2, md: 4 }, px: { xs: 1, sm: 3 } }}>
                <Container maxWidth="xl" disableGutters>

                    <SaclHeader />
                    {/* Header Bar */}
                    <DepartmentHeader title="POURING DETAILS" userIP={userIP} user={user} />

                    <AlertMessage alert={alert} />


                    {loading ? (
                        <Box sx={{ display: "flex", justifyContent: "center", p: 10 }}><CircularProgress /></Box>
                    ) : (
                        <Grid container spacing={3}>


                            <Grid size={{ xs: 12 }}>
                                <Paper sx={{ p: { xs: 1, md: 2 }, overflow: "hidden" }}>
                                    {/* Updated Heading Color (No longer Red) */}


                                    <Box sx={{ overflowX: "auto" }}>
                                        <Table size="small" sx={{ minWidth: 1000, border: `2px solid ${COLORS.primary}` }}>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell width="12%">Date &<br />Heat code</TableCell>
                                                    <TableCell width="35%">Composition</TableCell>
                                                    <TableCell width="18%">
                                                        Pouring<br />Temperature<br />Deg.C
                                                    </TableCell>
                                                    <TableCell width="10%">
                                                        Pouring<br />Time<br />(Sec.)
                                                    </TableCell>
                                                    <TableCell width="25%"><br /></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                <TableRow>
                                                    {/* COL 1: Date & Heat Code */}
                                                    <TableCell>
                                                        <Box display="flex" flexDirection="column" gap={2}>
                                                            <Box>
                                                                <LabelText>Date</LabelText>
                                                                <SpecInput
                                                                    type="date"
                                                                    value={pouringDate}
                                                                    onChange={(e: any) => setPouringDate(e.target.value)}
                                                                    inputStyle={{ textAlign: 'left' }}
                                                                />
                                                            </Box>
                                                            <Box>
                                                                <LabelText>Heat Code</LabelText>
                                                                <SpecInput
                                                                    placeholder="Code"
                                                                    value={heatCode}
                                                                    onChange={(e: any) => setHeatCode(e.target.value)}
                                                                />
                                                            </Box>
                                                        </Box>
                                                    </TableCell>

                                                    {/* COL 2: Composition Grid */}
                                                    <TableCell>
                                                        <Grid container spacing={1}>
                                                            {["C", "Si", "Mn", "P"].map((el) => (
                                                                <Grid size={{ xs: 6, sm: 3 }} key={el}>
                                                                    <Box display="flex" alignItems="center" gap={1}>
                                                                        <Typography variant="body2" fontWeight="bold">{el}-</Typography>
                                                                        <SpecInput
                                                                            value={(chemState as any)[el.toLowerCase()]}
                                                                            onChange={(e: any) => setChemState({ ...chemState, [el.toLowerCase()]: e.target.value })}
                                                                        />
                                                                    </Box>
                                                                </Grid>
                                                            ))}
                                                            {/* Spacer Row */}
                                                            <Grid size={{ xs: 12 }} sx={{ my: 0.5 }}><Divider /></Grid>

                                                            {["S", "Mg", "Cu", "Cr"].map((el) => (
                                                                <Grid size={{ xs: 6, sm: 3 }} key={el}>
                                                                    <Box display="flex" alignItems="center" gap={1}>
                                                                        <Typography variant="body2" fontWeight="bold">{el}-</Typography>
                                                                        <SpecInput
                                                                            value={(chemState as any)[el.toLowerCase()]}
                                                                            onChange={(e: any) => setChemState({ ...chemState, [el.toLowerCase()]: e.target.value })}
                                                                        />
                                                                    </Box>
                                                                </Grid>
                                                            ))}
                                                        </Grid>
                                                    </TableCell>

                                                    {/* COL 3: Temp & Inoculation */}
                                                    <TableCell>
                                                        <Box display="flex" flexDirection="column" height="100%" justifyContent="space-between" gap={2}>
                                                            <Box>
                                                                <SpecInput
                                                                    placeholder="Deg C"
                                                                    value={pouringTemp}
                                                                    onChange={(e: any) => setPouringTemp(e.target.value)}
                                                                    InputProps={{
                                                                        endAdornment: <InputAdornment position="end">°C</InputAdornment>,
                                                                    }}
                                                                />
                                                            </Box>
                                                            <Divider sx={{ borderStyle: 'dashed' }} />
                                                            <Box>
                                                                <Typography variant="caption" fontWeight="bold" sx={{ textDecoration: "underline" }}>Inoculation :</Typography>
                                                                <Grid container spacing={1} sx={{ mt: 0.5 }}>
                                                                    <Grid size={{ xs: 12 }}>
                                                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                                                            <Typography variant="caption">Stream</Typography>
                                                                            <SpecInput
                                                                                sx={{ width: 60 }}
                                                                                placeholder="gms"
                                                                                value={inoculationStream}
                                                                                onChange={(e: any) => setInoculationStream(e.target.value)}
                                                                            />
                                                                        </Box>
                                                                    </Grid>
                                                                    <Grid size={{ xs: 12 }}>
                                                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                                                            <Typography variant="caption">Inmould</Typography>
                                                                            <SpecInput
                                                                                sx={{ width: 60 }}
                                                                                placeholder="gms"
                                                                                value={inoculationInmould}
                                                                                onChange={(e: any) => setInoculationInmould(e.target.value)}
                                                                            />
                                                                        </Box>
                                                                    </Grid>
                                                                </Grid>
                                                            </Box>
                                                        </Box>
                                                    </TableCell>

                                                    {/* COL 4: Time */}
                                                    <TableCell sx={{ verticalAlign: 'middle' }}>
                                                        <SpecInput
                                                            placeholder="Sec"
                                                            value={pouringTime}
                                                            onChange={(e: any) => setPouringTime(e.target.value)}
                                                        />
                                                    </TableCell>

                                                    {/* COL 5: Remarks */}
                                                    <TableCell>
                                                        <Grid container spacing={2}>
                                                            <Grid size={{ xs: 12 }}>
                                                                <Box display="flex" alignItems="center" gap={1}>
                                                                    <Typography variant="caption" noWrap minWidth={90}>F/C & Heat No:</Typography>
                                                                    <SpecInput value={ficHeatNo} onChange={(e: any) => setFicHeatNo(e.target.value)} />
                                                                </Box>
                                                            </Grid>
                                                            <Grid size={{ xs: 12 }}>
                                                                <Box display="flex" alignItems="center" gap={1}>
                                                                    <Typography variant="caption" noWrap minWidth={90}>PP Code :</Typography>
                                                                    <SpecInput value={ppCode} onChange={(e: any) => setPpCode(e.target.value)} />
                                                                </Box>
                                                            </Grid>
                                                            <Grid size={{ xs: 12 }}>
                                                                <Box display="flex" alignItems="center" gap={1}>
                                                                    <Typography variant="caption" noWrap minWidth={90}>Followed by :</Typography>
                                                                    <SpecInput value={followedBy} onChange={(e: any) => setFollowedBy(e.target.value)} />
                                                                </Box>
                                                            </Grid>
                                                            <Grid size={{ xs: 12 }}>
                                                                <Box display="flex" alignItems="center" gap={1}>
                                                                    <Typography variant="caption" noWrap minWidth={90}>Username :</Typography>
                                                                    <Typography variant="body2" fontWeight="bold" color="primary">{user?.username}</Typography>
                                                                </Box>
                                                            </Grid>
                                                        </Grid>
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </Box>
                                </Paper>
                            </Grid>
                            {/* Attach PDF / Image Section */}
                            <Grid size={{ xs: 12 }}>
                                <Paper sx={{ p: 3, mb: 3 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, textTransform: "uppercase", color: COLORS.primary }}>
                                        Attach PDF / Image Files
                                    </Typography>
                                    <FileUploadSection
                                        files={attachedFiles}
                                        onFilesChange={handleAttachFiles}
                                        onFileRemove={removeAttachedFile}
                                        showAlert={showAlert}
                                        label="Attach PDF"
                                    />
                                </Paper>
                            </Grid>

                            {/* Free Remarks Section */}
                            <Grid size={{ xs: 12 }}>
                                <Paper sx={{ p: 3, mb: 3 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, textTransform: "uppercase" }}>
                                        Remarks
                                    </Typography>

                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        placeholder="Enter additional remarks..."
                                        value={remarksText}
                                        onChange={(e) => setRemarksText(e.target.value)}
                                        sx={{ bgcolor: "white" }}
                                    />
                                </Paper>
                            </Grid>


                            {/* Action Buttons */}
                            <Grid size={{ xs: 12 }} sx={{ mt: 2, mb: 4 }}>
                                <ActionButtons
                                    onReset={() => window.location.reload()}
                                    onSave={handleSaveAndContinue}
                                    showSubmit={false}
                                />
                            </Grid>
                        </Grid>
                    )}

                    {previewPayload && (
                        <>
                            {/* PREVIEW OVERLAY */}
                            <PreviewModal
                                open={previewMode && previewPayload}
                                onClose={() => setPreviewMode(false)}
                                onSubmit={handleFinalSave}
                                onExport={handleExportPDF}
                                title="Verify Pouring Details"
                                subtitle="Review your pouring data"
                                submitted={submitted}
                            >
                                <Box sx={{ p: 4 }}>
                                    {/* Updated Header Color (No longer Red) */}
                                    <Typography variant="h6" sx={{ textDecoration: 'underline', color: 'black', fontWeight: 'bold', mb: 2, textAlign: 'center' }}>POURING DETAILS:</Typography>

                                    {/* Table with Main Font for Headers, Mono for Data */}
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', border: '2px solid black', fontFamily: appTheme.typography.fontFamily }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#E0F2FE', color: '#0C4A6E' }}>
                                                <th style={{ border: '1px solid black', padding: '10px' }}>Date & Heat code</th>
                                                <th style={{ border: '1px solid black', padding: '10px' }}>Composition</th>
                                                <th style={{ border: '1px solid black', padding: '10px' }}>Pouring<br />Temperature<br />Deg.C</th>
                                                <th style={{ border: '1px solid black', padding: '10px' }}>Pouring<br />Time<br />(Sec.)</th>
                                                <th style={{ border: '1px solid black', padding: '10px' }}>Other<br />Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr style={{ verticalAlign: 'top' }}>
                                                <td style={{ border: '1px solid black', padding: '12px' }}>
                                                    <div><strong>Date:</strong> <span style={dataFontStyle}>{previewPayload?.pouringDate}</span></div>
                                                    <div style={{ marginTop: '15px' }}><strong>Heat Code:</strong><br /><span style={dataFontStyle}>{previewPayload?.heatCode}</span></div>
                                                </td>
                                                <td style={{ border: '1px solid black', padding: '12px' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                                                        {Object.entries(previewPayload?.chemical_composition || {}).map(([k, v]) => (
                                                            <div key={k}><strong>{k.toUpperCase()}-</strong> <span style={dataFontStyle}>{v as string}</span></div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td style={{ border: '1px solid black', padding: '12px' }}>
                                                    <div style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px' }}>
                                                        <span style={dataFontStyle}>{previewPayload?.pouringTemp}°C</span>
                                                    </div>
                                                    <div style={{ borderTop: '1px dashed black', paddingTop: '10px' }}>
                                                        <u style={{ fontWeight: 'bold' }}>Inoculation:</u><br />
                                                        Stream: <span style={dataFontStyle}>{previewPayload?.inoculation.stream}</span> gms<br />
                                                        Inmould: <span style={dataFontStyle}>{previewPayload?.inoculation.inmould}</span> gms
                                                    </div>
                                                </td>
                                                <td style={{ border: '1px solid black', padding: '12px', textAlign: 'center', verticalAlign: 'middle', fontSize: '18px' }}>
                                                    <span style={dataFontStyle}>{previewPayload?.pouringTime}</span>
                                                </td>
                                                <td style={{ border: '1px solid black', padding: '12px' }}>
                                                    <div>F/C & Heat No: <span style={dataFontStyle}>{previewPayload?.remarks.ficHeatNo}</span></div>
                                                    <div style={{ marginTop: '8px' }}>PP Code: <span style={dataFontStyle}>{previewPayload?.remarks.ppCode}</span></div>
                                                    <div style={{ marginTop: '8px' }}>Followed by: <span style={dataFontStyle}>{previewPayload?.remarks.followedBy}</span></div>
                                                    <div style={{ marginTop: '15px' }}><strong>Username:</strong> <span style={{ ...dataFontStyle, color: COLORS.primary }}>{previewPayload?.remarks.userName}</span></div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    {/* Attached Files in Preview */}
                                    {attachedFiles.length > 0 && (
                                        <Box sx={{ mt: 3, p: 2, border: "1px solid #ccc", borderRadius: 1, bgcolor: "white" }}>
                                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                                ATTACHED FILES:
                                            </Typography>
                                            {attachedFiles.map((file, i) => (
                                                <Typography key={i} variant="body2">• {file.name}</Typography>
                                            ))}
                                        </Box>
                                    )}

                                    {/* Remarks in Preview */}
                                    {remarksText && (
                                        <Box sx={{ mt: 3, p: 2, border: "1px solid #ccc", borderRadius: 1, bgcolor: "white" }}>
                                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>REMARKS:</Typography>
                                            <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                                                {remarksText}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </PreviewModal>

                            {/* PRINT SECTION (Exact replica of preview with fonts applied) */}
                            <Box className="print-section" sx={{ display: 'none', fontFamily: appTheme.typography.fontFamily }}>
                                {/* Updated Header Color (No longer Red) */}
                                <Typography variant="h5" sx={{ textDecoration: 'underline', color: 'black', fontWeight: 'bold', mb: 2, textAlign: 'center' }}>POURING DETAILS:</Typography>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '2px solid black' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#E0F2FE', color: '#0C4A6E' }}>
                                            <th style={{ border: '1px solid black', padding: '8px' }}>Date & Heat code</th>
                                            <th style={{ border: '1px solid black', padding: '8px' }}>Composition</th>
                                            <th style={{ border: '1px solid black', padding: '8px' }}>Pouring<br />Temperature<br />Deg.C</th>
                                            <th style={{ border: '1px solid black', padding: '8px' }}>Pouring<br />Time<br />(Sec.)</th>
                                            <th style={{ border: '1px solid black', padding: '8px' }}>Other<br />Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style={{ verticalAlign: 'top' }}>
                                            <td style={{ border: '1px solid black', padding: '8px' }}>
                                                <div><strong>Date:</strong> <span style={dataFontStyle}>{previewPayload.pouringDate}</span></div>
                                                <div style={{ marginTop: '10px' }}><strong>Heat Code:</strong><br /><span style={dataFontStyle}>{previewPayload.heatCode}</span></div>
                                            </td>
                                            <td style={{ border: '1px solid black', padding: '8px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '5px' }}>
                                                    {Object.entries(previewPayload.chemical_composition).map(([k, v]) => (
                                                        <div key={k}><strong>{k.toUpperCase()}-</strong> <span style={dataFontStyle}>{v as string}</span></div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ border: '1px solid black', padding: '8px' }}>
                                                <div style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center', marginBottom: '15px' }}>
                                                    <span style={dataFontStyle}>{previewPayload.pouringTemp}°C</span>
                                                </div>
                                                <div style={{ borderTop: '1px dashed black', paddingTop: '5px' }}>
                                                    <u style={{ fontWeight: 'bold' }}>Inoculation:</u><br />
                                                    Stream: <span style={dataFontStyle}>{previewPayload.inoculation.stream}</span> gms<br />
                                                    Inmould: <span style={dataFontStyle}>{previewPayload.inoculation.inmould}</span> gms
                                                </div>
                                            </td>
                                            <td style={{ border: '1px solid black', padding: '8px', textAlign: 'center', verticalAlign: 'middle', fontSize: '16px' }}>
                                                <span style={dataFontStyle}>{previewPayload.pouringTime}</span>
                                            </td>
                                            <td style={{ border: '1px solid black', padding: '8px' }}>
                                                <div>F/C & Heat No: <span style={dataFontStyle}>{previewPayload.remarks.ficHeatNo}</span></div>
                                                <div style={{ marginTop: '5px' }}>PP Code: <span style={dataFontStyle}>{previewPayload.remarks.ppCode}</span></div>
                                                <div style={{ marginTop: '5px' }}>Followed by: <span style={dataFontStyle}>{previewPayload.remarks.followedBy}</span></div>
                                                <div style={{ marginTop: '10px' }}><strong>Username:</strong> <span style={{ ...dataFontStyle, color: COLORS.primary }}>{previewPayload.remarks.userName}</span></div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                {/* Attached Files in Print */}
                                {attachedFiles.length > 0 && (
                                    <div style={{ marginTop: "20px" }}>
                                        <h3 style={{ margin: 0, paddingBottom: "5px", borderBottom: "1px solid #ccc" }}>Attached Files</h3>
                                        <ul style={{ marginTop: "5px" }}>
                                            {attachedFiles.map((file, i) => (
                                                <li key={i} style={{ fontSize: "14px" }}>{file.name}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Remarks in Print */}
                                {remarksText && (
                                    <div style={{ marginTop: "20px" }}>
                                        <h3 style={{ margin: 0, paddingBottom: "5px", borderBottom: "1px solid #ccc" }}>Remarks</h3>
                                        <p style={{ marginTop: "5px", whiteSpace: "pre-line" }}>{remarksText}</p>
                                    </div>
                                )}

                            </Box>
                        </>
                    )}

                </Container>
            </Box>
        </ThemeProvider >
    );
}

export default PouringDetailsTable;