import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import NoPendingWorks from "./common/NoPendingWorks";
import { useAuth } from "../context/AuthContext";
import { getProgress } from "../services/departmentProgressService";
import { useNavigate } from "react-router-dom";
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
  IconButton,
  useMediaQuery,
  GlobalStyles,
  Divider
} from "@mui/material";

import FactoryIcon from '@mui/icons-material/Factory';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from "@mui/icons-material/Close";
import ScienceIcon from '@mui/icons-material/Science';
import EngineeringIcon from '@mui/icons-material/Engineering';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from "@mui/icons-material/Person";
import SaclHeader from "./common/SaclHeader";
import NoAccess from "./common/NoAccess";
import { ipService } from '../services/ipService';
import { inspectionService } from '../services/inspectionService';
import { uploadFiles } from '../services/fileUploadHelper';
import { COLORS, appTheme } from '../theme/appTheme';
import { useAlert } from '../hooks/useAlert';
import { AlertMessage } from './common/AlertMessage';
import { fileToMeta } from '../utils';
const SpecInput = ({ inputStyle, ...props }: any) => (
  <TextField
    {...props}
    variant="outlined"
    size="small"
    fullWidth
    inputProps={{
      ...props.inputProps,
      style: { textAlign: 'center', fontFamily: 'Roboto Mono', fontSize: '0.9rem', ...inputStyle }
    }}
    sx={{
      "& .MuiOutlinedInput-root": { backgroundColor: props.readOnly ? "#f8fafc" : "#fff" },
      ...props.sx
    }}
  />
);

function MouldingTable() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(appTheme.breakpoints.down('sm'));
  const { alert, showAlert } = useAlert();
  const [assigned, setAssigned] = useState<boolean | null>(null);
  const [mouldState, setMouldState] = useState({
    thickness: "",
    compressability: "",
    pressure: "",
    hardness: "",
    remarks: ""
  });
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const [mouldCorrectionLoading, setMouldCorrectionLoading] = useState(false);
  const [mouldCorrectionSubmitted, setMouldCorrectionSubmitted] = useState(false);
  const [mouldDate, setMouldDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [previewMode, setPreviewMode] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userIP, setUserIP] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const uname = user?.username ?? "";
        const data = await getProgress(uname);
        const found = data.some(
          (p) =>
            p.username === uname &&
            p.department_id === 6 &&
            (p.approval_status === "pending" || p.approval_status === "assigned")
        );
        if (mounted) setAssigned(found);
      } catch {
        if (mounted) setAssigned(false);
      }
    };
    if (user) check();
    return () => { mounted = false; };
  }, [user]);

  useEffect(() => {
    const fetchIP = async () => {
      const ip = await ipService.getUserIP();
      setUserIP(ip);
    };
    fetchIP();
  }, []);

  if (assigned === null) return <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress /></Box>;
  if (!assigned) return <NoPendingWorks />;

  const handleChange = (field: string, value: string) => {
    setMouldState(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setMouldState({
      thickness: "", compressability: "", pressure: "", hardness: "",
      remarks: ""
    });
    setSubmitted(false);
  };
  const handleAttachFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    const files = Array.from(fileList) as File[];
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };


  const handleSaveAndContinue = () => {
    setPreviewMode(true);
  };

  const handleExportPDF = () => { window.print(); };

  const GridValueBox = ({ label, value }: { label: string, value: string }) => (
    <Box sx={{
      p: 2,
      borderRadius: 2,
      border: `1px solid ${COLORS.border}`,
      textAlign: 'center',
      bgcolor: 'white',
      flex: 1
    }}>
      <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>{label}</Typography>
      <Typography variant="h6" sx={{ fontSize: '1rem' }}>{value || "-"}</Typography>
    </Box>
  );

  const postMouldCorrection = async (payload: {
    mould_thickness: string;
    compressability: string;
    squeeze_pressure: string;
    mould_hardness: string;
    remarks: string;
    trial_id?: string;
  }) => {
    setMouldCorrectionLoading(true);
    try {
      const body = { ...payload, trial_id: 'Sample1', date: mouldDate };
      await inspectionService.submitMouldingCorrection(body);
      setMouldCorrectionSubmitted(true);
      return { ok: true, data: {} };
    } catch (err) {
      showAlert('error', 'Failed to save moulding details. Please try again.');
      return { ok: false, message: 'Failed to save mould correction' };
    } finally {
      setMouldCorrectionLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    const payload = {
      mould_thickness: mouldState.thickness,
      compressability: mouldState.compressability,
      squeeze_pressure: mouldState.pressure,
      mould_hardness: mouldState.hardness,
      remarks: mouldState.remarks
    };

    const result = await postMouldCorrection(payload);
    if (!result.ok) {
      // alert(result.message || 'Failed to submit mould correction'); // Removed as per instruction
    } else {
      showAlert('success', 'Moulding details created successfully.');
      setSubmitted(true);

      if (attachedFiles.length > 0) {
        try {
        } catch (uploadError) {
          console.error("File upload error:", uploadError);
        }
      }
    }
  };

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
          <Paper sx={{
            p: 1.5, mb: 3,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            borderLeft: `6px solid ${COLORS.secondary}`
          }}>
            <Box display="flex" alignItems="center" gap={2}>
              <FactoryIcon sx={{ fontSize: 32, color: COLORS.primary }} />
              <Typography variant="h6">MOULDING DETAILS</Typography>
            </Box>
            <Box display="flex" gap={1} alignItems="center">
              <TextField
                type="date"
                size="small"
                value={mouldDate}
                onChange={(e) => setMouldDate(e.target.value)}
                sx={{ bgcolor: 'white', borderRadius: 1, width: 150 }}
              />
              <Chip label={userIP} size="small" variant="outlined" sx={{ bgcolor: 'white' }} />
              <Chip
                label="USER NAME"
                sx={{
                  bgcolor: COLORS.secondary,
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.75rem'
                }}
                size="small"
                icon={<PersonIcon style={{ color: 'white' }} />}
              />
            </Box>
          </Paper>

          <Paper sx={{ p: { xs: 2, md: 3 }, overflow: 'hidden' }}>

            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <EngineeringIcon sx={{ color: COLORS.blueHeaderText, fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ color: COLORS.primary }}>MOULD CORRECTION DETAILS</Typography>
            </Box>
            <Divider sx={{ mb: 2, borderColor: COLORS.blueHeaderText, opacity: 0.3 }} />

            <Box sx={{ overflowX: "auto", mb: 4 }}>
              <Table size="small" sx={{ minWidth: 1000 }}>
                <TableHead>
                  <TableRow>
                    <TableCell colSpan={4} sx={{ bgcolor: COLORS.blueHeaderBg, color: COLORS.blueHeaderText, borderBottom: 'none' }}>
                      <Typography variant="subtitle2" sx={{ color: 'inherit', letterSpacing: 1 }}>Moulding Parameters</Typography>
                    </TableCell>
                    <TableCell colSpan={1} sx={{ bgcolor: COLORS.orangeHeaderBg, color: COLORS.orangeHeaderText, borderBottom: 'none' }}>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell width="15%" sx={{ bgcolor: '#f8fafc', color: COLORS.textSecondary }}>Mould Thickness</TableCell>
                    <TableCell width="15%" sx={{ bgcolor: '#f8fafc', color: COLORS.textSecondary }}>Compressability</TableCell>
                    <TableCell width="15%" sx={{ bgcolor: '#f8fafc', color: COLORS.textSecondary }}>Squeeze Pressure</TableCell>
                    <TableCell width="15%" sx={{ bgcolor: '#f8fafc', color: COLORS.textSecondary, borderRight: `2px solid ${COLORS.border}` }}>Mould Hardness</TableCell>

                    <TableCell width="40%" sx={{ bgcolor: '#fff7ed', color: COLORS.textSecondary }}>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell><SpecInput value={mouldState.thickness} onChange={(e: any) => handleChange('thickness', e.target.value)} /></TableCell>
                    <TableCell><SpecInput value={mouldState.compressability} onChange={(e: any) => handleChange('compressability', e.target.value)} /></TableCell>
                    <TableCell><SpecInput value={mouldState.pressure} onChange={(e: any) => handleChange('pressure', e.target.value)} /></TableCell>
                    <TableCell sx={{ borderRight: `2px solid ${COLORS.border}` }}>
                      <SpecInput value={mouldState.hardness} onChange={(e: any) => handleChange('hardness', e.target.value)} />
                    </TableCell>

                    <TableCell>
                      <SpecInput
                        value={mouldState.remarks}
                        onChange={(e: any) => handleChange('remarks', e.target.value)}
                        placeholder="--"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
            <Box sx={{ mt: 3, mb: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, mb: 1, textTransform: "uppercase", color: COLORS.primary }}
              >
                Attach PDF / Image Files
              </Typography>

              <Button
                variant="outlined"
                component="label"
                sx={{
                  bgcolor: "white",
                  borderStyle: "dashed",
                  py: 1.5,
                  px: 3,
                  fontWeight: 600,
                }}
              >
                Attach PDF
                <input
                  type="file"
                  hidden
                  multiple
                  accept="application/pdf,image/*"
                  onChange={handleAttachFiles}
                />
              </Button>

              <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                {attachedFiles.map((file, index) => (
                  <Chip
                    key={index}
                    label={file.name}
                    onDelete={() => removeAttachedFile(index)}
                    sx={{
                      bgcolor: "white",
                      border: `1px solid ${COLORS.border}`,
                      fontSize: "0.8rem"
                    }}
                  />
                ))}
              </Box>
            </Box>




            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                onClick={handleReset}
                sx={{
                  color: 'black',
                  borderColor: 'black',
                  borderWidth: '1.5px',
                  '&:hover': { borderColor: 'black', borderWidth: '1.5px', bgcolor: '#f3f4f6' }
                }}
              >
                Reset Form
              </Button>
              <Button
                variant="contained"
                sx={{ bgcolor: COLORS.secondary, '&:hover': { bgcolor: '#c2410c' } }}
                startIcon={<SaveIcon />}
                onClick={handleSaveAndContinue}
              >
                Save & Continue
              </Button>
            </Box>

          </Paper>

          {previewMode && (
            <Box sx={{
              position: "fixed", inset: 0, zIndex: 1300,
              bgcolor: "rgba(15, 23, 42, 0.8)",
              display: "flex", alignItems: "center", justifyContent: "center", p: 2
            }}>
              <Paper sx={{ width: "100%", maxWidth: 850, borderRadius: 3, overflow: "hidden" }}>

                <Box sx={{ p: 2, px: 3, borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>Verify Moulding Details</Typography>
                  <IconButton size="small" onClick={() => setPreviewMode(false)} sx={{ color: '#ef4444' }}>
                    <CloseIcon />
                  </IconButton>
                </Box>

                <Box sx={{ p: 4 }}>

                  <Typography variant="caption" sx={{ color: COLORS.blueHeaderText, mb: 2, display: 'block' }}>MOULDING PARAMETERS</Typography>
                  <AlertMessage alert={alert} />
                  <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={6} sm={3}><GridValueBox label="Thickness" value={mouldState.thickness} /></Grid>
                    <Grid item xs={6} sm={3}><GridValueBox label="Compressability" value={mouldState.compressability} /></Grid>
                    <Grid item xs={6} sm={3}><GridValueBox label="Pressure" value={mouldState.pressure} /></Grid>
                    <Grid item xs={6} sm={3}><GridValueBox label="Hardness" value={mouldState.hardness} /></Grid>
                  </Grid>

                  <Typography variant="caption" sx={{ color: COLORS.textSecondary, mb: 2, display: 'block' }}>REMARKS & LOG</Typography>
                  <Box sx={{
                    p: 3,
                    bgcolor: '#f8fafc',
                    borderRadius: 2,
                    border: `1px solid ${COLORS.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 3
                  }}>
                    <Box flex={2}>
                      <Typography variant="caption" color="textSecondary" display="block">REMARKS</Typography>
                      <Typography variant="body2">{mouldState.remarks || "No remarks entered."}</Typography>
                    </Box>
                  </Box>
                  {attachedFiles.length > 0 && (
                    <Box
                      sx={{
                        mt: 3,
                        p: 2,
                        bgcolor: "white",
                        borderRadius: 2,
                        border: `1px solid ${COLORS.border}`,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                        ATTACHED FILES
                      </Typography>

                      {attachedFiles.map((file, i) => (
                        <Typography key={i} variant="body2">• {file.name}</Typography>
                      ))}
                    </Box>
                  )}

                  {submitted && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: '#ecfdf5', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5, color: '#059669' }}>
                      <CheckCircleIcon fontSize="small" />
                      <Typography variant="body2" sx={{ fontFamily: 'Inter', fontWeight: 500 }}>Moulding Specification Registered Successfully</Typography>
                    </Box>
                  )}

                </Box>

                <Box sx={{ p: 2, px: 3, borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/dashboard')}
                    sx={{
                      borderColor: "#e2e8f0",
                      color: COLORS.textSecondary,
                      '&:hover': { borderColor: COLORS.textSecondary }
                    }}
                  >
                    Back to Edit
                  </Button>
                  {submitted ? (
                    <Button
                      variant="contained"
                      sx={{ bgcolor: COLORS.primary, color: 'white' }}
                      startIcon={<PrintIcon />}
                      onClick={handleExportPDF}
                    >
                      Download PDF
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      sx={{ bgcolor: COLORS.secondary }}
                      onClick={handleFinalSubmit}
                    >
                      Confirm & Submit
                    </Button>
                  )}
                </Box>

              </Paper>
            </Box>
          )}
          <Box className="print-section" sx={{ display: 'none', fontFamily: appTheme.typography.fontFamily }}>
            <Box sx={{ mb: 3, borderBottom: "2px solid black", pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0 }}>FOUNDRY SAMPLE CARD</Typography>
                <Typography variant="body1">Moulding Correction Report</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2">Date: {new Date().toLocaleDateString()}</Typography>
                <Typography variant="body2">IP: {userIP}</Typography>
              </Box>
            </Box>

            <Typography variant="h6" sx={{ borderBottom: "1px solid #ccc", mb: 1 }}>Moulding Details</Typography>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr>
                  <th colSpan={4} style={{ border: '1px solid #999', padding: '6px', textAlign: 'center', backgroundColor: '#f0f0f0' }}>Moulding Parameters</th>
                  <th colSpan={1} style={{ border: '1px solid #999', padding: '6px', textAlign: 'center', backgroundColor: '#f0f0f0' }}>Log Data</th>
                </tr>
                <tr style={{ backgroundColor: '#f9f9f9' }}>
                  <th style={{ border: '1px solid #999', padding: '6px' }}>Thickness</th>
                  <th style={{ border: '1px solid #999', padding: '6px' }}>Compressability</th>
                  <th style={{ border: '1px solid #999', padding: '6px' }}>Pressure</th>
                  <th style={{ border: '1px solid #999', padding: '6px' }}>Hardness</th>
                  <th style={{ border: '1px solid #999', padding: '6px' }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{mouldState.thickness}</td>
                  <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{mouldState.compressability}</td>
                  <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{mouldState.pressure}</td>
                  <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{mouldState.hardness}</td>
                  <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{mouldState.remarks || "-"}</td>
                </tr>
              </tbody>
            </table>
            {/* Attached Files - Print Version */}
            {attachedFiles.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <h3 style={{
                  margin: 0,
                  paddingBottom: "5px",
                  borderBottom: "1px solid #999"
                }}>
                  Attached Files
                </h3>

                <ul style={{ marginTop: "5px" }}>
                  {attachedFiles.map((file, index) => (
                    <li key={index} style={{ fontSize: "14px" }}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}

          </Box>

        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default MouldingTable;