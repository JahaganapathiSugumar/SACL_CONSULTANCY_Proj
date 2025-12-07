import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
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
  Alert,
  CircularProgress,
  IconButton,
  Grid,
  Container,
  Card,
  CardContent,
  InputAdornment,
  useMediaQuery,
  GlobalStyles
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

// Icons
import CloseIcon from "@mui/icons-material/Close";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ScienceIcon from '@mui/icons-material/Science';
import RefreshIcon from '@mui/icons-material/Refresh';
import FactoryIcon from '@mui/icons-material/Factory';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from "@mui/icons-material/Person";
import SaclHeader from "./common/SaclHeader";

/* ---------------- 1. Theme Configuration ---------------- */

const COLORS = {
  primary: "#1e293b",    // Slate 800
  secondary: "#ea580c",  // Orange 600
  background: "#f8fafc", // Slate 50
  surface: "#ffffff",
  border: "#e2e8f0",     // Slate 200
  textPrimary: "#0f172a",
  textSecondary: "#64748b",
  accentBlue: "#0ea5e9",
  accentGreen: "#10b981",
  headerBg: "#f1f5f9",   // Light Gray for headers
  headerText: "#334155"
};

const theme = createTheme({
  breakpoints: {
    values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
  },
  palette: {
    primary: { main: COLORS.primary },
    secondary: { main: COLORS.secondary },
    background: { default: COLORS.background, paper: COLORS.surface },
    text: { primary: COLORS.textPrimary, secondary: COLORS.textSecondary },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 800, letterSpacing: -0.5 },
    h6: { fontWeight: 700 },
    subtitle2: { fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: 0.5 },
    body2: { fontFamily: '"Roboto Mono", monospace', fontSize: '0.875rem' },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
          border: `1px solid ${COLORS.border}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          backgroundColor: COLORS.headerBg,
          color: COLORS.primary,
          borderBottom: `2px solid ${COLORS.border}`,
          borderRight: `1px solid ${COLORS.border}`, // Added vertical separators for header
          whiteSpace: "nowrap",
          textAlign: "center",
          fontSize: "0.8rem",
          padding: "8px 4px",
        },
        body: {
          padding: "8px",
          borderBottom: `1px solid ${COLORS.border}`,
          borderRight: `1px solid ${COLORS.border}`,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 6,
            backgroundColor: "#fff",
            "& fieldset": { borderColor: "#cbd5e1" },
            "&:hover fieldset": { borderColor: COLORS.primary },
            "&.Mui-focused fieldset": { borderColor: COLORS.secondary, borderWidth: 2 },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          textTransform: "none",
          padding: "8px 24px",
        },
      },
    },
  },
});

/* ---------------- Types ---------------- */

interface PartData {
  id: number;
  pattern_code: string;
  part_name: string;
  material_grade: string;
  chemical_composition: any;
  micro_structure: string;
  tensile: string;
  impact?: string;
  hardness: string;
  xray: string;
  created_at: string;
}

/* ---------------- Helpers ---------------- */

const parseChemicalComposition = (composition: any) => {
  const blank = { c: "", si: "", mn: "", p: "", s: "", mg: "", cr: "", cu: "" };
  if (!composition) return blank;
  let obj: any = composition;
  if (typeof composition === "string") {
    try { obj = JSON.parse(composition); } catch (e) { return { ...blank, c: composition }; }
  }
  if (typeof obj !== "object" || obj === null) return blank;
  const map: Record<string, any> = {};
  Object.keys(obj).forEach((k) => {
    if (typeof k === "string") { map[k.toLowerCase().replace(/\s+/g, "")] = obj[k]; }
  });
  const siKeyCandidates = ["si", "silicon"];
  const getFirst = (keys: string[]) => {
    for (const k of keys) {
      if (map[k] !== undefined && map[k] !== null) return String(map[k]);
    }
    return "";
  };
  return {
    c: getFirst(["c"]), si: getFirst(siKeyCandidates), mn: getFirst(["mn"]), p: getFirst(["p"]),
    s: getFirst(["s"]), mg: getFirst(["mg"]), cr: getFirst(["cr"]), cu: getFirst(["cu"]),
  };
};

/* ---------------- UI Sub-components ---------------- */

const SectionHeader = ({ icon, title, color }: { icon: React.ReactNode, title: string, color: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, pb: 1, borderBottom: `2px solid ${color}`, width: '100%' }}>
    <Box sx={{ color: color, display: "flex" }}>{icon}</Box>
    <Typography variant="subtitle2" sx={{ color: COLORS.primary, flexGrow: 1 }}>
      {title}
    </Typography>
  </Box>
);

const SpecInput = (props: any) => (
  <TextField
    {...props}
    variant="outlined"
    size="small"
    fullWidth
    inputProps={{
      ...props.inputProps,
      style: { textAlign: 'center', fontFamily: 'Roboto Mono', fontSize: '0.85rem' }
    }}
    sx={{
      minWidth: "60px",
      "& .MuiOutlinedInput-root": { backgroundColor: props.readOnly ? "#f8fafc" : "#fff" }
    }}
  />
);

/* ---------------- Main Component ---------------- */

function FoundrySampleCard() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State
  const [selectedPart, setSelectedPart] = useState<PartData | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<PartData | null>(null);
  const [trialNo, setTrialNo] = useState<string>("");
  const [masterParts, setMasterParts] = useState<PartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const [remarks, setRemarks] = useState("");
  // Attach Files State
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);


  // Form State
  const [chemState, setChemState] = useState({ c: "", si: "", mn: "", p: "", s: "", mg: "", cr: "", cu: "" });
  const [processState, setProcessState] = useState({ pouringTemp: "", inoculantPerSec: "", inoculantType: "" });

  const [submittedData, setSubmittedData] = useState<any>(null);

  // Preview State
  const [previewMode, setPreviewMode] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<any | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [userIP, setUserIP] = useState<string>("");

  useEffect(() => {
    if (previewMessage) { const t = setTimeout(() => setPreviewMessage(null), 4000); return () => clearTimeout(t); }
  }, [previewMessage]);

  useEffect(() => {
    const fetchIP = async () => { try { const r = await fetch("https://api.ipify.org?format=json"); const d = await r.json(); setUserIP(d.ip); } catch { setUserIP("Offline"); } };
    fetchIP();
  }, []);

  useEffect(() => {
    const getMasterParts = async () => {
      try {
        setLoading(true);
        // Mock data to simulate fetching
        const mockData = [
          {
            id: 1,
            pattern_code: "PT-2024-X",
            part_name: "Front Axle Housing",
            material_grade: "SG 450/10",
            chemical_composition: { c: 3.6, si: 2.3, mn: 0.3, mg: 0.04, cr: 0.02, cu: 0.05, p: 0.015, s: 0.008 },
            micro_structure: "Ferritic >90%",
            tensile: "Tensile: 450 MPa\nYield: 310 MPa\nElongation: 10%",
            hardness: "160-190 HB",
            xray: "Level 1",
            created_at: ""
          },
          {
            id: 2,
            pattern_code: "PT-9988-Y",
            part_name: "Brake Caliper",
            material_grade: "SG 500/7",
            chemical_composition: { c: 3.7, si: 2.5, mn: 0.4 },
            micro_structure: "Pearlitic",
            tensile: "500 MPa",
            hardness: "190-220 HB",
            xray: "Level 2",
            created_at: ""
          }
        ];

        // Simulating API call delay
        setTimeout(() => {
          setMasterParts(mockData);
          setLoading(false);
        }, 800);
      } catch (error) { setError("Failed to load master parts."); setLoading(false); }
    };
    getMasterParts();
  }, []);

  useEffect(() => {
    if (selectedPart) {
      setSelectedPattern(selectedPart);
      setChemState(parseChemicalComposition(selectedPart.chemical_composition));
    } else { setSelectedPattern(null); }
  }, [selectedPart]);

  const generateTrialId = async () => {
    if (!selectedPart) return;
    setTrialLoading(true);
    setTimeout(() => {
      setTrialNo(`TR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`);
      setTrialLoading(false);
    }, 600);
  };

  useEffect(() => { if (selectedPart) generateTrialId(); else setTrialNo(""); }, [selectedPart]);

  const handlePartChange = (v: PartData | null) => { setSelectedPart(v); };
  const handlePatternChange = (v: PartData | null) => { setSelectedPattern(v); if (v) setSelectedPart(v); };
  // File upload handlers
  const handleAttachFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    const files = Array.from(fileList) as File[];
    setAttachedFiles((prev: File[]) => [...prev, ...files]);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleExportPDF = () => {
    if (!submitted) return;
    window.print();
  };

  const handleSaveAndContinue = () => {
    // Removed validation for Part Selection as the section is removed
    const payload = {
      trial_no: trialNo,
      pattern_code: selectedPart ? selectedPart.pattern_code : "",
      part_name: selectedPart ? selectedPart.part_name : "",
      chemical_composition: chemState,
      process_parameters: processState,
      remarks,
    };
    setPreviewPayload(payload);
    setPreviewMode(true);
  };

  const handleFinalSave = () => {
    setSubmittedData({ ...previewPayload });
    setSubmitted(true);
    setPreviewMessage("Trial Specification Registered Successfully");
  };

  return (
    <ThemeProvider theme={theme}>
      {/* GlobalStyles for Printing */}
      <GlobalStyles styles={{
        "@media print": {
          "html, body": {
            height: "initial !important",
            overflow: "initial !important",
            backgroundColor: "white !important",
          },
          "body *": {
            visibility: "hidden",
          },
          ".print-section, .print-section *": {
            visibility: "visible",
          },
          ".print-section": {
            display: "block !important",
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            color: "black",
            backgroundColor: "white",
            padding: "20px",
          },
          ".MuiModal-root": {
            display: "none !important",
          }
        }
      }} />

      <Box sx={{ minHeight: "100vh", bgcolor: COLORS.background, py: { xs: 2, md: 4 }, px: { xs: 1, sm: 3 } }}>
        <Container maxWidth="xl" disableGutters>

          <SaclHeader />
          {/* Header Bar */}
          <Paper sx={{
            p: { xs: 1.5, md: 2 },
            mb: 3,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            gap: 2,
            borderLeft: `6px solid ${COLORS.secondary}`
          }}>
            <Box display="flex" alignItems="center" gap={2}>
              <FactoryIcon sx={{ fontSize: { xs: 32, md: 40 }, color: COLORS.primary }} />
              <Box>
                <Typography variant="h5" sx={{ color: COLORS.primary, textTransform: "uppercase" }}>
                  MATERIAL CORRECTION DETAILS
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={2} alignItems="center" width={isMobile ? "100%" : "auto"} justifyContent="space-between">
              <Chip label={userIP} size="small" variant="outlined" />
              <Chip label="USER NAME " color="warning" size="small" icon={<PersonIcon />} />
            </Box>
          </Paper>

          {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 10 }}><CircularProgress /></Box>
          ) : (
            <Grid container spacing={3}>

              {/* REMOVED 1. Identification Section as per request */}

              {/* 2. Material Correction Details */}
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: { xs: 2, md: 3 } }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <SectionHeader icon={<ScienceIcon />} title="Material correction details:" color={COLORS.accentBlue} />
                    {!isMobile && <Chip label="Input Required" size="small" variant="outlined" sx={{ opacity: 0.7 }} />}
                  </Box>

                  <Box sx={{ overflowX: "auto", width: "100%", pb: 1 }}>
                    <Table size="small" sx={{ minWidth: 1000, border: `1px solid ${COLORS.border}` }}>
                      <TableHead>
                        {/* Grouped Header Row */}
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            align="center"
                            sx={{
                              bgcolor: "#f0f9ff", // Light Blue for Chemistry group
                              color: COLORS.accentBlue,
                              borderRight: `2px solid ${COLORS.border} !important`
                            }}
                          >
                            Chemical Composition:
                          </TableCell>
                          <TableCell
                            colSpan={3}
                            align="center"
                            sx={{
                              bgcolor: "#fff7ed", // Light Orange for Process group
                              color: COLORS.secondary
                            }}
                          >
                            Process parameters
                          </TableCell>
                        </TableRow>
                        {/* Column Header Row */}
                        <TableRow>
                          {["C%", "Si%", "Mn%", "P%", "S%", "Mg%", "Cu%", "Cr%"].map((h, index) => (
                            <TableCell
                              key={h}
                              align="center"
                              sx={{
                                borderRight: index === 7 ? `2px solid ${COLORS.border} !important` : undefined
                              }}
                            >
                              {h}
                            </TableCell>
                          ))}
                          <TableCell align="center">Pouring temp °C</TableCell>
                          <TableCell align="center">Inoculant per Sec</TableCell>
                          <TableCell align="center">Inoculant type</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          {/* Chemical Composition Inputs */}
                          <TableCell><SpecInput value={chemState.c} onChange={(e: any) => setChemState({ ...chemState, c: e.target.value })} /></TableCell>
                          <TableCell><SpecInput value={chemState.si} onChange={(e: any) => setChemState({ ...chemState, si: e.target.value })} /></TableCell>
                          <TableCell><SpecInput value={chemState.mn} onChange={(e: any) => setChemState({ ...chemState, mn: e.target.value })} /></TableCell>
                          <TableCell><SpecInput value={chemState.p} onChange={(e: any) => setChemState({ ...chemState, p: e.target.value })} /></TableCell>
                          <TableCell><SpecInput value={chemState.s} onChange={(e: any) => setChemState({ ...chemState, s: e.target.value })} /></TableCell>
                          <TableCell><SpecInput value={chemState.mg} onChange={(e: any) => setChemState({ ...chemState, mg: e.target.value })} /></TableCell>
                          <TableCell><SpecInput value={chemState.cu} onChange={(e: any) => setChemState({ ...chemState, cu: e.target.value })} /></TableCell>
                          <TableCell sx={{ borderRight: `2px solid ${COLORS.border} !important` }}>
                            <SpecInput value={chemState.cr} onChange={(e: any) => setChemState({ ...chemState, cr: e.target.value })} />
                          </TableCell>

                          {/* Process Parameters Inputs */}
                          <TableCell><SpecInput value={processState.pouringTemp} onChange={(e: any) => setProcessState({ ...processState, pouringTemp: e.target.value })} /></TableCell>
                          <TableCell><SpecInput value={processState.inoculantPerSec} onChange={(e: any) => setProcessState({ ...processState, inoculantPerSec: e.target.value })} /></TableCell>
                          <TableCell><SpecInput value={processState.inoculantType} onChange={(e: any) => setProcessState({ ...processState, inoculantType: e.target.value })} /></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Box>
                  {isMobile && <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', mt: 1 }}>← Swipe to view more →</Typography>}
                </Paper>
              </Grid>
              {/* Attach PDF / Image Section */}
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
                  <SectionHeader
                    icon={<UploadFileIcon />}
                    title="Attach PDF / Image Files"
                    color={COLORS.accentBlue}
                  />

                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    sx={{
                      bgcolor: "white",
                      borderStyle: "dashed",
                      py: 1.5,
                      fontWeight: 600
                    }}
                  >
                    Upload Files
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="application/pdf,image/*"
                      onChange={handleAttachFiles}
                    />
                  </Button>

                  {/* Display file chips */}
                  <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {attachedFiles.map((file, i) => (
                      <Chip
                        key={i}
                        label={file.name}
                        onDelete={() => removeAttachedFile(i)}
                        sx={{
                          bgcolor: "white",
                          border: `1px solid ${COLORS.border}`
                        }}
                      />
                    ))}
                  </Box>
                </Paper>
              </Grid>

              {/* Remarks Section */}
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
                  <SectionHeader
                    icon={<EditIcon />}
                    title="Remarks"
                    color={COLORS.primary}
                  />

                  <TextField
                    multiline
                    rows={3}
                    fullWidth
                    variant="outlined"
                    placeholder="Enter remarks..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    sx={{ bgcolor: "#fff" }}
                  />
                </Paper>
              </Grid>


              {/* REMOVED 3. Mechanical Spec Section as per request */}

              {/* 4. Action Buttons */}
              <Grid size={{ xs: 12 }} sx={{ mt: 2, mb: 4 }}>
                <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" gap={2}>
                  <Button variant="outlined" color="inherit" fullWidth={isMobile} onClick={() => window.location.reload()}>
                    Reset Form
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    fullWidth={isMobile}
                    onClick={handleSaveAndContinue}
                    startIcon={<SaveIcon />}
                  >
                    Save & Continue
                  </Button>
                </Box>
              </Grid>

            </Grid>
          )}

          {/* ---------------- Preview Overlay ---------------- */}
          {previewMode && previewPayload && (
            <Box sx={{
              position: "fixed", inset: 0, zIndex: 1300,
              bgcolor: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)",
              display: "flex", alignItems: "center", justifyContent: "center", p: 2
            }}>
              <Paper sx={{
                width: "100%", maxWidth: 900, maxHeight: "90vh", overflow: "hidden",
                display: 'flex', flexDirection: 'column', borderRadius: 3, position: 'relative'
              }}>
                <Box sx={{ p: 2, borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: "#fff" }}>
                  <Typography variant="h6" sx={{ color: COLORS.primary }}>Verify Specification</Typography>
                  <IconButton
                    onClick={() => {
                      setPreviewMode(false);
                      navigate("/pouring");
                    }}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      color: "#DC2626",
                      "&:hover": { backgroundColor: "rgba(220,38,38,0.08)" },
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>

                <Box sx={{ p: { xs: 2, md: 4 }, overflowY: "auto", bgcolor: COLORS.background }}>
                  {/* REMOVED Summary Grid (Pattern/Part/Trial) as per request */}

                  <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.accentBlue }}>Composition & Process Check</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: 1, mb: 3 }}>
                    {["C", "Si", "Mn", "P", "S", "Mg", "Cu", "Cr"].map(k => (
                      <Box key={k} sx={{ textAlign: "center", p: 1, bgcolor: "white", borderRadius: 1, border: `1px solid ${COLORS.border}` }}>
                        <Typography variant="caption" color="text.secondary">{k}</Typography>
                        <Typography variant="body2" fontWeight="bold">{previewPayload.chemical_composition[k.toLowerCase()] || "-"}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ mb: 3, p: 2, bgcolor: "white", border: `1px solid ${COLORS.border}`, borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>PROCESS PARAMETERS</Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 4 }}><Typography variant="body2">Temp: <b>{previewPayload.process_parameters.pouringTemp || "-"}°C</b></Typography></Grid>

                    </Grid>
                  </Box>
                  {/* Attached Files in Preview */}
                  {attachedFiles.length > 0 && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: "white", borderRadius: 1, border: `1px solid ${COLORS.border}` }}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                        ATTACHED FILES
                      </Typography>

                      {attachedFiles.map((file, i) => (
                        <Typography key={i} variant="body2">• {file.name}</Typography>
                      ))}
                    </Box>
                  )}

                  {/* Remarks in Preview */}
                  {remarks && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: "white", borderRadius: 1, border: `1px solid ${COLORS.border}` }}>
                      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                        REMARKS
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                        {remarks}
                      </Typography>
                    </Box>
                  )}


                  {previewMessage && <Alert severity="success" sx={{ mt: 2 }}>{previewMessage}</Alert>}
                </Box>

                <Box sx={{ p: 2, borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "flex-end", gap: 2, bgcolor: "#fff", flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Button variant="outlined" fullWidth={isMobile} onClick={() => setPreviewMode(false)} disabled={submitted}>Back to Edit</Button>
                  {submitted ? (
                    <Button variant="contained" fullWidth={isMobile} color="primary" onClick={handleExportPDF} startIcon={<PrintIcon />}>Download PDF</Button>
                  ) : (
                    <Button variant="contained" fullWidth={isMobile} color="secondary" onClick={handleFinalSave} startIcon={<UploadFileIcon />}>Confirm & Submit</Button>
                  )}
                </Box>
              </Paper>
            </Box>
          )}

          {/* ---------------- HIDDEN PRINT CONTENT ---------------- */}
          {previewPayload && (
            <Box className="print-section" sx={{ display: 'none' }}>
              <Box sx={{ mb: 3, borderBottom: "2px solid black", pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0 }}>FOUNDRY SAMPLE CARD</Typography>
                  <Typography variant="body1">Trial Report & Specification Sheet</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2">Date: {new Date().toLocaleDateString()}</Typography>
                  <Typography variant="body2">IP: {userIP}</Typography>
                </Box>
              </Box>

              {/* REMOVED Header Info (Pattern/Part/Trial) in Print Section as per request */}

              <Typography variant="h6" sx={{ borderBottom: "1px solid #ccc", mb: 1 }}>Material Correction Details</Typography>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                  <tr>
                    <th colSpan={8} style={{ border: '1px solid #999', padding: '6px', textAlign: 'center', backgroundColor: '#f0f0f0' }}>Chemical Composition</th>
                    <th colSpan={3} style={{ border: '1px solid #999', padding: '6px', textAlign: 'center', backgroundColor: '#f0f0f0' }}>Process Parameters</th>
                  </tr>
                  <tr style={{ backgroundColor: '#f9f9f9' }}>
                    {["C", "Si", "Mn", "P", "S", "Mg", "Cu", "Cr"].map(h => (
                      <th key={h} style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{h}</th>
                    ))}
                    <th style={{ border: '1px solid #999', padding: '6px' }}>Pouring Temp</th>
                    <th style={{ border: '1px solid #999', padding: '6px' }}>Inoculant/Sec</th>
                    <th style={{ border: '1px solid #999', padding: '6px' }}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {["c", "si", "mn", "p", "s", "mg", "cu", "cr"].map(k => (
                      <td key={k} style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>
                        {previewPayload.chemical_composition[k] || "-"}
                      </td>
                    ))}
                    <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewPayload.process_parameters.pouringTemp}</td>
                    <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewPayload.process_parameters.inoculantPerSec}</td>
                    <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewPayload.process_parameters.inoculantType}</td>
                  </tr>
                </tbody>
              </table>

              {/* ✅ Remarks in Print — paste here */}
              {remarks && (
                <div style={{ marginTop: "20px" }}>
                  <h3 style={{ margin: 0, paddingBottom: "5px", borderBottom: "1px solid #ccc" }}>Remarks</h3>
                  <p style={{ whiteSpace: "pre-line", marginTop: "5px" }}>{remarks}</p>
                </div>
              )}
              {/* Attached Files in Print */}
              {attachedFiles.length > 0 && (
                <div style={{ marginTop: "20px" }}>
                  <h3 style={{ margin: 0, paddingBottom: "5px", borderBottom: "1px solid #ccc" }}>
                    Attached Files
                  </h3>
                  <ul style={{ marginTop: "5px" }}>
                    {attachedFiles.map((file, i) => (
                      <li key={i} style={{ fontSize: "14px" }}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* REMOVED Mechanical Properties Section from Print */}

            </Box>
          )}

        </Container>
      </Box>
    </ThemeProvider>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { if (this.state.hasError) return <Alert severity="error">System Error. Please refresh.</Alert>; return this.props.children; }
}

export default function FoundrySampleCardApp() {
  return (
    <ErrorBoundary>
      <FoundrySampleCard />
    </ErrorBoundary>
  );
}