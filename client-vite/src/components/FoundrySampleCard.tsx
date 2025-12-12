import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  Select,
  MenuItem,
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
  , Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

// Icons
import CloseIcon from "@mui/icons-material/Close";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ScienceIcon from '@mui/icons-material/Science';
import ConstructionIcon from '@mui/icons-material/Construction';
import RefreshIcon from '@mui/icons-material/Refresh';
import FactoryIcon from '@mui/icons-material/Factory';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import PersonIcon from "@mui/icons-material/Person";
import DeleteIcon from '@mui/icons-material/Delete';
import SaclHeader from "./common/SaclHeader";
import { trialService } from "../services/trialService";
import { ipService } from "../services/ipService";
import { COLORS, appTheme } from '../theme/appTheme';
import { useAlert } from '../hooks/useAlert';
import { AlertMessage } from './common/AlertMessage';



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

const parseTensileData = (tensile: string) => {
  const lines = tensile ? tensile.split("\n") : [];
  let tensileStrength = "", yieldStrength = "", elongation = "", impactCold = "", impactRoom = "";
  lines.forEach((line) => {
    const cleanLine = line.trim();
    if (cleanLine.match(/\d+\s*(MPa|N\/mm²)/) || cleanLine.includes("Tensile") || cleanLine.match(/[≥>]\s*\d+/)) {
      const match = cleanLine.match(/([≥>]?)\s*(\d+)/); if (match && !tensileStrength) tensileStrength = `${match[1]}${match[2]}`;
    }
    if (cleanLine.includes("Yield")) {
      const match = cleanLine.match(/([≥>]?)\s*(\d+)/); if (match && !yieldStrength) yieldStrength = `${match[1]}${match[2]}`;
    }
    if (cleanLine.includes("Elongation") || cleanLine.includes("%")) {
      const match = cleanLine.match(/([≥>]?)\s*(\d+)/); if (match && !elongation) elongation = `${match[1]}${match[2]}`;
    }
  });
  return { tensileStrength, yieldStrength, elongation, impactCold, impactRoom };
};

const parseMicrostructureData = (microstructure: string) => {
  const lines = microstructure ? microstructure.split("\n") : [];
  let nodularity = "", pearlite = "", carbide = "";
  lines.forEach((line) => {
    const cleanLine = line.trim().toLowerCase();
    if (cleanLine.includes("nodularity")) { const match = cleanLine.match(/([≥≤]?)\s*(\d+)/); if (match) nodularity = `${match[1]}${match[2]}`; }
    if (cleanLine.includes("pearlite")) { const match = cleanLine.match(/([≥≤<>]?)\s*(\d+)/); if (match) pearlite = `${match[1]}${match[2]}`; }
    if (cleanLine.includes("carbide")) { const match = cleanLine.match(/([≥≤<>]?)\s*(\d+)/); if (match) carbide = `${match[1]}${match[2]}`; }
  });
  return { nodularity: nodularity || "--", pearlite: pearlite || "--", carbide: carbide || "--" };
};

const parseHardnessData = (hardness: string) => {
  const lines = hardness ? hardness.split("\n") : [];
  let surface = "", core = "";
  lines.forEach((line) => {
    const cleanLine = line.trim().toLowerCase();
    if (cleanLine.includes("surface")) { const match = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/); if (match) surface = match[1]; }
    else if (cleanLine.includes("core")) { const match = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/); if (match) core = match[1]; }
    else if (!surface) { const match = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/); if (match) surface = match[1]; }
  });
  return { surface: surface || "--", core: core || "--" };
};



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
      minWidth: "70px",
      "& .MuiOutlinedInput-root": { backgroundColor: props.readOnly ? "#f8fafc" : "#fff" }
    }}
  />
);



function FoundrySampleCard() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery(appTheme.breakpoints.down('sm'));

  // State
  const [selectedPart, setSelectedPart] = useState<PartData | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<PartData | null>(null);
  const [trialNo, setTrialNo] = useState<string>("");
  const [masterParts, setMasterParts] = useState<PartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);

  // --- moved table state (from FoundrySampleCard2) ---
  const MACHINES = ["DISA", "FOUNDRY-A", "FOUNDRY-B", "MACHINESHOP"];
  const SAMPLING_REASONS = ["Routine", "Customer Complaint", "Process Change", "Audit", "Other"];
  const [samplingDate, setSamplingDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [mouldCount, setMouldCount] = useState("");
  const [machine, setMachine] = useState("");
  const [reason, setReason] = useState("");
  const [sampleTraceability, setSampleTraceability] = useState("");
  const [patternFiles, setPatternFiles] = useState<File[]>([]);
  const handlePatternFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setPatternFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };
  const removePatternFile = (index: number) => setPatternFiles(prev => prev.filter((_, i) => i !== index));

  // Tooling / Remarks state (moved from FoundrySampleCard2)
  const [toolingType, setToolingType] = useState("");
  const [toolingFiles, setToolingFiles] = useState<File[]>([]);
  const handleToolingFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setToolingFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };
  const removeToolingFile = (index: number) => setToolingFiles(prev => prev.filter((_, i) => i !== index));

  const [remarks, setRemarks] = useState("");

  const [mouldCorrections, setMouldCorrections] = useState<any[]>([
    { id: 1, compressibility: "", squeezePressure: "", fillerSize: "" },
  ]);
  const handleMouldCorrectionChange = (id: number, field: string, value: string) => {
    setMouldCorrections(prev => prev.map(r => (r.id === id ? { ...r, [field]: value } : r)));
  };
  const addMouldCorrectionRow = () => setMouldCorrections(prev => [...prev, { id: Date.now(), compressibility: "", squeezePressure: "", fillerSize: "" }]);
  const removeMouldCorrectionRow = (id: number) => setMouldCorrections(prev => prev.filter(r => r.id !== id));

  const [showMetaDialog, setShowMetaDialog] = useState(false);
  const [tempToolingFiles, setTempToolingFiles] = useState<File[]>([]);
  const [tempMouldCorrections, setTempMouldCorrections] = useState<any[]>([]);
  const [tempRemarks, setTempRemarks] = useState<string>("");

  const openMetaDialog = () => {
    setTempToolingFiles(toolingFiles.slice());
    setTempMouldCorrections(mouldCorrections.map((r) => ({ ...r })));
    setTempRemarks(remarks || "");
    setShowMetaDialog(true);
  };

  const handleMetaSave = () => {
    setToolingFiles(tempToolingFiles.slice());
    setMouldCorrections(tempMouldCorrections.map((r) => ({ ...r })));
    setRemarks(tempRemarks);
    setShowMetaDialog(false);
    setPreviewMessage("Saved");
  };

  const handleTempToolingFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setTempToolingFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeTempToolingFile = (index: number) => setTempToolingFiles(prev => prev.filter((_, i) => i !== index));
  const addTempMouldCorrectionRow = () => setTempMouldCorrections(prev => [...prev, { id: Date.now(), compressibility: "", squeezePressure: "", fillerSize: "" }]);
  const removeTempMouldCorrectionRow = (id: number) => setTempMouldCorrections(prev => prev.filter(r => r.id !== id));
  const handleTempMouldCorrectionChange = (id: number, field: string, value: string) => {
    setTempMouldCorrections(prev => prev.map(r => (r.id === id ? { ...r, [field]: value } : r)));
  };

  // Form State
  const [chemState, setChemState] = useState({ c: "", si: "", mn: "", p: "", s: "", mg: "", cr: "", cu: "" });
  const [tensileState, setTensileState] = useState({ tensileStrength: "", yieldStrength: "", elongation: "", impactCold: "", impactRoom: "" });
  const [microState, setMicroState] = useState({ nodularity: "", pearlite: "", carbide: "" });
  const [hardnessState, setHardnessState] = useState({ surface: "", core: "" });

  const [submittedData, setSubmittedData] = useState<any>(null);
  const [editingOnlyMetallurgical, setEditingOnlyMetallurgical] = useState<boolean>(false);

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
    const fetchIP = async () => {
      const ip = await ipService.getUserIP();
      setUserIP(ip);
    };
    fetchIP();
  }, []);

  useEffect(() => {
    const getMasterParts = async () => {
      try {
        setLoading(true);
        const mockData = [{ id: 1, pattern_code: "PT-2024-X", part_name: "Front Axle Housing", material_grade: "SG 450/10", chemical_composition: { c: 3.6, si: 2.3, mn: 0.3 }, micro_structure: "Ferritic >90%", tensile: "450 MPa", hardness: "160-190 HB", xray: "Level 1", created_at: "" }];
        try {
          const parts = await trialService.getMasterList();
          setMasterParts(parts);
          setError(null);
        } catch (e) {
          setMasterParts(mockData);
          setError("Failed to load master parts.");
        }
      } finally { setLoading(false); }
    };
    getMasterParts();
  }, []);

  useEffect(() => {
    if (selectedPart) {
      setSelectedPattern(selectedPart);
      setChemState(parseChemicalComposition(selectedPart.chemical_composition));
      setTensileState(parseTensileData(selectedPart.tensile));
      setMicroState(parseMicrostructureData(selectedPart.micro_structure));
      setHardnessState(parseHardnessData(selectedPart.hardness));
    } else { setSelectedPattern(null); }
  }, [selectedPart]);

  // --- UPDATED TRIAL ID LOGIC ---
  const generateTrialId = async () => {
    if (!selectedPart) return;
    setTrialLoading(true);
    try {
      const json = await trialService.getTrialByPartName(selectedPart.part_name);
      const trialId = (json && (json.trialId || json.data)) as string | undefined;
      if (trialId) {
        const formattedTrialId = trialId.includes('-') ? trialId.split('-').pop() : trialId;
        setTrialNo(formattedTrialId || "");
      } else {
        throw new Error("Invalid response");
      }
    } catch (error) {
      console.warn("Using fallback trial ID", error);
      setTrialNo(`TR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`);
    } finally {
      setTrialLoading(false);
    }
  };

  useEffect(() => { if (selectedPart) generateTrialId(); else setTrialNo(""); }, [selectedPart]);

  const handlePartChange = (v: PartData | null) => { setSelectedPart(v); };
  const handlePatternChange = (v: PartData | null) => { setSelectedPattern(v); if (v) setSelectedPart(v); };

  // --- MODIFIED PRINT FUNCTIONALITY ---
  const handleExportPDF = () => {
    if (!submitted) return;
    window.print(); // Triggers the browser's print dialog (Save as PDF)
  };

  const handleSaveAndContinue = () => {
    if (!selectedPart) { setError("Please select a Part Name first."); return; }
    const payload = {
      trial_no: trialNo,
      pattern_code: selectedPart.pattern_code,
      part_name: selectedPart.part_name,
      chemical_composition: chemState,
      tensile: tensileState,
      micro_structure: microState,
      hardness: hardnessState,
      // moved fields
      samplingDate,
      mouldCount,
      machine,
      reason,
      sampleTraceability,
      patternFiles,
      toolingType,
      toolingFiles,
      remarks,
      mouldCorrections,
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
    <ThemeProvider theme={appTheme}>
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
                <Typography variant="h5" sx={{ color: COLORS.primary }}>
                  FOUNDRY METHODS
                </Typography>
                <Typography variant="subtitle2" sx={{ color: COLORS.textSecondary }}>
                  Automotive Component Specification
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={2} alignItems="center" width={isMobile ? "100%" : "auto"} justifyContent="space-between">
              <Chip label={userIP} size="small" variant="outlined" />
              <Chip label="USER NAME" color="warning" size="small" icon={<PersonIcon />} />
            </Box>
          </Paper>

          {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 10 }}><CircularProgress /></Box>
          ) : (
            <Grid container spacing={3}>

              {/* 1. Identification Section */}
              <Grid size={12}>
                <Card elevation={0} sx={{ border: `1px solid ${COLORS.border}` }}>
                  <CardContent>
                    <SectionHeader icon={<PrecisionManufacturingIcon />} title="Part Identification" color={COLORS.primary} />
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary }}>PATTERN CODE</Typography>
                        <Autocomplete
                          options={masterParts}
                          value={selectedPattern}
                          onChange={(_, v) => handlePatternChange(v)}
                          getOptionLabel={(o) => o.pattern_code}
                          renderInput={(params) => <TextField {...params} placeholder="Select Pattern" />}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary }}>COMPONENT NAME</Typography>
                        <Autocomplete
                          options={masterParts}
                          value={selectedPart}
                          onChange={(_, v) => handlePartChange(v)}
                          getOptionLabel={(o) => o.part_name}
                          renderInput={(params) => <TextField {...params} placeholder="Select Part" />}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary }}>TRIAL REFERENCE</Typography>
                        <TextField
                          fullWidth
                          value={trialNo}
                          placeholder="Generating..."
                          InputProps={{
                            readOnly: true,
                            sx: { bgcolor: "#f1f5f9", fontWeight: 700, color: COLORS.primary },
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => generateTrialId()} disabled={!selectedPart || trialLoading} size="small">
                                  {trialLoading ? <CircularProgress size={20} /> : <RefreshIcon fontSize="small" />}
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* 2. Chemical Spec Section */}
              <Grid size={12}>
                <Paper sx={{ p: { xs: 2, md: 3 } }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <SectionHeader icon={<ScienceIcon />} title="Metallurgical Composition" color={COLORS.accentBlue} />
                    {!isMobile && <Chip label="Auto-Populated" size="small" variant="outlined" sx={{ opacity: 0.7 }} />}
                  </Box>

                  <Box sx={{ overflowX: "auto", width: "100%", pb: 1 }}>
                    <Table size="small" sx={{ minWidth: 800 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ bgcolor: "#f0f9ff", color: COLORS.accentBlue }}>Chemical Elements (%)</TableCell>
                          <TableCell sx={{ width: 20, border: 'none', bgcolor: 'transparent' }}></TableCell>
                          <TableCell colSpan={3} align="center" sx={{ bgcolor: "#fff7ed", color: COLORS.secondary }}>Microstructure</TableCell>
                        </TableRow>
                        <TableRow>
                          {["C", "Si", "Mn", "P", "S", "Mg", "Cr", "Cu"].map(h => (
                            <TableCell key={h} align="center">{h}</TableCell>
                          ))}
                          <TableCell sx={{ border: 'none' }}></TableCell>
                          {["Nodularity", "Pearlite", "Carbide"].map(h => (
                            <TableCell key={h} align="center">{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          {Object.keys(chemState).map((key) => (
                            <TableCell key={key}>
                              <SpecInput
                                value={(chemState as any)[key]}
                                onChange={(e: any) => setChemState({ ...chemState, [key]: e.target.value })}
                                readOnly={!editingOnlyMetallurgical}
                              />
                            </TableCell>
                          ))}
                          <TableCell sx={{ border: 'none' }}></TableCell>
                          {Object.keys(microState).map((key) => (
                            <TableCell key={key}>
                              <SpecInput
                                value={(microState as any)[key]}
                                onChange={(e: any) => setMicroState({ ...microState, [key]: e.target.value })}
                                readOnly={!editingOnlyMetallurgical}
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Box>
                </Paper>
              </Grid>

              {/* 3. Mechanical Spec Section */}
              <Grid size={12}>
                <Paper sx={{ p: { xs: 2, md: 3 } }}>
                  <SectionHeader icon={<ConstructionIcon />} title="Mechanical Properties & NDT" color={COLORS.secondary} />

                  <Box sx={{ overflowX: "auto", width: "100%", pb: 1 }}>
                    <Table size="small" sx={{ minWidth: 900 }}>
                      <TableHead>
                        <TableRow>
                          {["Tensile (MPa)", "Yield (MPa)", "Elongation (%)", "Impact Cold", "Impact Room", "Hardness (Surf)", "Hardness (Core)", "X-Ray Grade", "MPI"].map(h => (
                            <TableCell key={h} align="center">{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell><SpecInput value={tensileState.tensileStrength} onChange={(e: any) => setTensileState({ ...tensileState, tensileStrength: e.target.value })} /></TableCell>
                          <TableCell><SpecInput value={tensileState.yieldStrength} onChange={(e: any) => setTensileState({ ...tensileState, yieldStrength: e.target.value })} /></TableCell>
                          <TableCell><SpecInput value={tensileState.elongation} onChange={(e: any) => setTensileState({ ...tensileState, elongation: e.target.value })} /></TableCell>
                          <TableCell><SpecInput value={tensileState.impactCold} onChange={(e: any) => setTensileState({ ...tensileState, impactCold: e.target.value })} /></TableCell>
                          <TableCell><SpecInput value={tensileState.impactRoom} onChange={(e: any) => setTensileState({ ...tensileState, impactRoom: e.target.value })} /></TableCell>
                          <TableCell><SpecInput value={hardnessState.surface} onChange={(e: any) => setHardnessState({ ...hardnessState, surface: e.target.value })} /></TableCell>
                          <TableCell><SpecInput value={hardnessState.core} onChange={(e: any) => setHardnessState({ ...hardnessState, core: e.target.value })} /></TableCell>
                          <TableCell><SpecInput value={selectedPart?.xray || "--"} readOnly /></TableCell>
                          <TableCell><SpecInput placeholder="--" /></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Box>
                </Paper>
              </Grid>

              {/* Action buttons were moved to bottom of the page */}

            </Grid>
          )}


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
                      setPreviewMode(false);
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
                  {/* 1. Part Identification */}
                  <Typography variant="subtitle2" sx={{ mb: 2, color: COLORS.primary }}>Part Identification</Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Paper elevation={0} sx={{ p: 2, border: `1px solid ${COLORS.border}` }}>
                        <Typography variant="caption" color="text.secondary">PATTERN CODE</Typography>
                        <Typography variant="subtitle1">{previewPayload.pattern_code}</Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Paper elevation={0} sx={{ p: 2, border: `1px solid ${COLORS.border}` }}>
                        <Typography variant="caption" color="text.secondary">PART NAME</Typography>
                        <Typography variant="subtitle1">{previewPayload.part_name}</Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Paper elevation={0} sx={{ p: 2, border: `1px solid ${COLORS.accentGreen}`, bgcolor: "#ecfdf5" }}>
                        <Typography variant="caption" color="success.main">TRIAL ID</Typography>
                        <Typography variant="subtitle1" color="success.main">{previewPayload.trial_no}</Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.accentBlue }}>Chemical Composition</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: 1, mb: 3 }}>
                    {["C", "Si", "Mn", "P", "S", "Mg", "Cr", "Cu"].map(k => (
                      <Box key={k} sx={{ textAlign: "center", p: 1, bgcolor: "white", borderRadius: 1, border: `1px solid ${COLORS.border}` }}>
                        <Typography variant="caption" color="text.secondary">{k}</Typography>
                        <Typography variant="body2" fontWeight="bold">{previewPayload.chemical_composition[k.toLowerCase()] || "-"}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.secondary }}>Microstructure</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
                    <Box sx={{ p: 1.5, bgcolor: "white", borderRadius: 1, border: `1px solid ${COLORS.border}` }}>
                      <Typography variant="caption" color="text.secondary">Nodularity</Typography>
                      <Typography variant="body2" fontWeight="bold">{previewPayload.micro_structure.nodularity || "-"}</Typography>
                    </Box>
                    <Box sx={{ p: 1.5, bgcolor: "white", borderRadius: 1, border: `1px solid ${COLORS.border}` }}>
                      <Typography variant="caption" color="text.secondary">Pearlite</Typography>
                      <Typography variant="body2" fontWeight="bold">{previewPayload.micro_structure.pearlite || "-"}</Typography>
                    </Box>
                    <Box sx={{ p: 1.5, bgcolor: "white", borderRadius: 1, border: `1px solid ${COLORS.border}` }}>
                      <Typography variant="caption" color="text.secondary">Carbide</Typography>
                      <Typography variant="body2" fontWeight="bold">{previewPayload.micro_structure.carbide || "-"}</Typography>
                    </Box>
                  </Box>

                  <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.primary }}>Mechanical Properties & NDT</Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: "white", mb: 3 }}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <Typography variant="caption" color="text.secondary">Tensile</Typography>
                        <Typography variant="body2" fontWeight="bold">{previewPayload.tensile.tensileStrength || "-"}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <Typography variant="caption" color="text.secondary">Yield</Typography>
                        <Typography variant="body2" fontWeight="bold">{previewPayload.tensile.yieldStrength || "-"}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <Typography variant="caption" color="text.secondary">Elongation</Typography>
                        <Typography variant="body2" fontWeight="bold">{previewPayload.tensile.elongation || "-"}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <Typography variant="caption" color="text.secondary">Impact (Cold)</Typography>
                        <Typography variant="body2" fontWeight="bold">{previewPayload.tensile.impactCold || "-"}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <Typography variant="caption" color="text.secondary">Impact (Room)</Typography>
                        <Typography variant="body2" fontWeight="bold">{previewPayload.tensile.impactRoom || "-"}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <Typography variant="caption" color="text.secondary">Hardness (Surf/Core)</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {previewPayload.hardness.surface || "-"} / {previewPayload.hardness.core || "-"}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* 2. Sampling Details */}
                  <Typography variant="subtitle2" sx={{ mb: 2, color: COLORS.primary }}>Sampling Details</Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Paper elevation={0} sx={{ p: 2, border: `1px solid ${COLORS.border}` }}>
                        <Typography variant="caption" color="text.secondary">Sampling Date</Typography>
                        <Typography variant="subtitle1">{previewPayload.samplingDate || "-"}</Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Paper elevation={0} sx={{ p: 2, border: `1px solid ${COLORS.border}` }}>
                        <Typography variant="caption" color="text.secondary">No. of Moulds</Typography>
                        <Typography variant="subtitle1">{previewPayload.mouldCount || "-"}</Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Paper elevation={0} sx={{ p: 2, border: `1px solid ${COLORS.border}` }}>
                        <Typography variant="caption" color="text.secondary">Machine</Typography>
                        <Typography variant="subtitle1">{previewPayload.machine || "-"}</Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Paper elevation={0} sx={{ p: 2, border: `1px solid ${COLORS.border}` }}>
                        <Typography variant="caption" color="text.secondary">Reason</Typography>
                        <Typography variant="subtitle1">{previewPayload.reason || "-"}</Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Paper elevation={0} sx={{ p: 2, border: `1px solid ${COLORS.border}` }}>
                        <Typography variant="caption" color="text.secondary">Traceability</Typography>
                        <Typography variant="subtitle1">{previewPayload.sampleTraceability || "-"}</Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Paper elevation={0} sx={{ p: 2, border: `1px solid ${COLORS.border}` }}>
                        <Typography variant="caption" color="text.secondary">Pattern Files</Typography>
                        <Typography variant="subtitle1">{(previewPayload.patternFiles?.length) ? `${previewPayload.patternFiles.length} file(s)` : "0"}</Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* 3. Tooling Modification */}
                  <Typography variant="subtitle2" sx={{ mb: 2, color: COLORS.primary }}>Tooling Modification</Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper elevation={0} sx={{ p: 2, border: `1px solid ${COLORS.border}` }}>
                        <Typography variant="caption" color="text.secondary"></Typography>
                        <Typography variant="subtitle1">{previewPayload.toolingType || "-"}</Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Paper elevation={0} sx={{ p: 2, border: `1px solid ${COLORS.border}` }}>
                        <Typography variant="caption" color="text.secondary">Tooling Files</Typography>
                        <Typography variant="subtitle1">{(previewPayload.toolingFiles?.length) ? `${previewPayload.toolingFiles.length} file(s)` : "0"}</Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* 4. Remarks */}
                  <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.primary }}>Remarks</Typography>
                  <Paper elevation={0} sx={{ p: 2, border: `1px solid ${COLORS.border}`, mb: 3 }}>
                    <Typography variant="body2">{previewPayload.remarks || "-"}</Typography>
                  </Paper>

                  {/* 5. Mould Corrections */}
                  <Typography variant="subtitle2" sx={{ mb: 2, color: COLORS.primary }}>Mould Corrections</Typography>
                  <Table size="small" sx={{ bgcolor: "white", border: `1px solid ${COLORS.border}`, borderRadius: 1, mb: 3 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell align="center">Compressibility</TableCell>
                        <TableCell align="center">Squeeze Pressure</TableCell>
                        <TableCell align="center">Filler Size</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(previewPayload.mouldCorrections || []).map((r: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell sx={{ textAlign: 'center' }}>{r.compressibility || "-"}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>{r.squeezePressure || "-"}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>{r.fillerSize || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {previewMessage && <Alert severity="success" sx={{ mt: 2 }}>{previewMessage}</Alert>}
                </Box>

                <Box sx={{ p: 2, borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "flex-end", gap: 2, bgcolor: "#fff", flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Button variant="outlined" fullWidth={isMobile} onClick={() => navigate('/dashboard')} disabled={submitted}>Back to Edit</Button>
                  {submitted ? (
                    <Button variant="contained" fullWidth={isMobile} color="primary" onClick={handleExportPDF} startIcon={<PrintIcon />}>Download PDF</Button>
                  ) : (
                    <Button variant="contained" fullWidth={isMobile} color="secondary" onClick={handleFinalSave} startIcon={<UploadFileIcon />}>Confirm & Submit</Button>
                  )}
                </Box>
              </Paper>
            </Box>
          )}




          <Paper sx={{ overflowX: "auto", mb: 3, p: 2 }}>
            <Table size="small" sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  {[
                    "Date of Sampling",
                    "No. of Moulds",
                    "DISA / FOUNDRY-A",
                    "Reason For Sampling",
                    "Sample Traceability",
                    "Pattern Data Sheet",
                  ].map((head) => (
                    <TableCell key={head} align="center">
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <TextField
                      type="date"
                      fullWidth
                      value={samplingDate}
                      onChange={(e) => setSamplingDate(e.target.value)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      fullWidth
                      value={mouldCount}
                      onChange={(e) => setMouldCount(e.target.value)}
                      size="small"
                      placeholder="10"
                    />
                  </TableCell>
                  <TableCell>
                    <FormControl fullWidth size="small">
                      <Select
                        value={machine}
                        onChange={(e) => setMachine(e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="" disabled>
                          Select
                        </MenuItem>
                        {MACHINES.map((m) => (
                          <MenuItem key={m} value={m}>
                            {m}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <FormControl fullWidth size="small">
                      <Select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="" disabled>
                          Select
                        </MenuItem>
                        {SAMPLING_REASONS.map((r) => (
                          <MenuItem key={r} value={r}>
                            {r}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      value={sampleTraceability}
                      onChange={(e) => setSampleTraceability(e.target.value)}
                      size="small"
                      placeholder="Enter option"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      sx={{ borderStyle: "dashed" }}
                    >
                      Upload
                      <input
                        type="file"
                        hidden
                        multiple
                        onChange={handlePatternFilesChange}
                      />
                    </Button>
                    {patternFiles.length > 0 && (
                      <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {patternFiles.map((f, i) => (
                          <Chip
                            key={i}
                            label={f.name}
                            onDelete={() => removePatternFile(i)}
                            size="small"
                            sx={{ maxWidth: '100%' }}
                          />
                        ))}
                      </Box>
                    )}
                  </TableCell>

                </TableRow>
              </TableBody>
            </Table>
          </Paper>

          <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Tooling / Mould Corrections / Remarks</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip label={`${toolingFiles.length} file(s)`} size="small" />
                <Chip label={`${mouldCorrections.length} correction(s)`} size="small" />
                <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                  {remarks ? `${remarks.slice(0, 80)}${remarks.length > 80 ? "..." : ""}` : "No remarks"}
                </Typography>
              </Box>
            </Box>
            <Button variant="outlined" onClick={openMetaDialog} startIcon={<EditIcon />}>Edit Material / Attach / Remarks</Button>
          </Paper>



          {/* Meta Data Dialog */}
          <Dialog open={showMetaDialog} onClose={() => setShowMetaDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle sx={{ bgcolor: COLORS.primary, color: "#fff" }}>
              <Typography variant="h6">Edit Tooling / Remarks</Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 3, bgcolor: COLORS.background }}>
              {/* Tooling Files */}
              <Typography variant="subtitle2" sx={{ mb: 2, color: COLORS.primary }}>Tooling Files</Typography>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ borderStyle: "dashed", mb: 2 }}
              >
                Upload Tooling Files
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={handleTempToolingFilesChange}
                />
              </Button>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {tempToolingFiles.map((f, i) => (
                  <Chip
                    key={i}
                    label={f.name}
                    onDelete={() => removeTempToolingFile(i)}
                    size="small"
                    sx={{ bgcolor: "white", border: `1px solid ${COLORS.border}` }}
                  />
                ))}
              </Box>

              {/* Mould Corrections */}
              <Typography variant="subtitle2" sx={{ mb: 2, color: COLORS.primary, mt: 3 }}>Mould Corrections</Typography>
              {tempMouldCorrections.map((row, index) => (
                <Box key={row.id} sx={{ display: "flex", gap: 2, mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Compressibility"
                    value={row.compressibility}
                    onChange={(e) => handleTempMouldCorrectionChange(row.id, 'compressibility', e.target.value)}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Squeeze Pressure"
                    value={row.squeezePressure}
                    onChange={(e) => handleTempMouldCorrectionChange(row.id, 'squeezePressure', e.target.value)}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Filler Size"
                    value={row.fillerSize}
                    onChange={(e) => handleTempMouldCorrectionChange(row.id, 'fillerSize', e.target.value)}
                  />
                  {tempMouldCorrections.length > 1 && (
                    <IconButton size="small" onClick={() => removeTempMouldCorrectionRow(row.id)} sx={{ color: '#DC2626' }}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button
                variant="outlined"
                onClick={addTempMouldCorrectionRow}
                size="small"
                sx={{ mb: 2 }}
              >
                Add Mould Correction
              </Button>

              {/* Remarks */}
              <Typography variant="subtitle2" sx={{ mb: 1, color: COLORS.primary }}>Remarks</Typography>
              <TextField
                multiline
                rows={3}
                fullWidth
                variant="outlined"
                placeholder="Enter remarks..."
                value={tempRemarks}
                onChange={(e) => setTempRemarks(e.target.value)}
                sx={{ bgcolor: "#fff" }}
              />
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: COLORS.background }}>
              <Button variant="outlined" onClick={() => setShowMetaDialog(false)} color="inherit">
                Cancel
              </Button>
              <Button variant="contained" onClick={handleMetaSave} color="secondary">
                Save Changes
              </Button>
            </DialogActions>
          </Dialog>


          <Box display="flex" justifyContent="flex-end" gap={2} sx={{ mt: 2, mb: 4 }}>
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

              <Box sx={{ mb: 4, display: 'flex', gap: 4 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'grey.700' }}>PATTERN:</Typography>
                  <Typography variant="h6">{previewPayload.pattern_code}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'grey.700' }}>PART NAME:</Typography>
                  <Typography variant="h6">{previewPayload.part_name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'grey.700' }}>TRIAL NO:</Typography>
                  <Typography variant="h6">{previewPayload.trial_no}</Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ borderBottom: "1px solid #ccc", mb: 1 }}>Sampling Details</Typography>
                <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
                  <div>
                    <strong>Date:</strong> {previewPayload.samplingDate || '-'}
                  </div>
                  <div>
                    <strong>No. of Moulds:</strong> {previewPayload.mouldCount || '-'}
                  </div>
                  <div>
                    <strong>Machine:</strong> {previewPayload.machine || '-'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
                  <div>
                    <strong>Reason:</strong> {previewPayload.reason || '-'}
                  </div>
                  <div>
                    <strong>Traceability:</strong> {previewPayload.sampleTraceability || '-'}
                  </div>
                </div>
              </Box>

              <h3 style={{ borderBottom: "1px solid #ccc", marginBottom: "10px" }}>Pattern Data Sheet</h3>
              <p>
                <strong>Files:</strong> {previewPayload.patternFiles?.map((f: any) => f.name).join(", ") || "None"}
              </p>

              <h3 style={{ borderBottom: "1px solid #ccc", marginBottom: "10px", marginTop: "20px" }}>Tooling Modification</h3>
              <p>
                <strong>Type:</strong> {previewPayload.toolingType || "-"}
              </p>
              <p>
                <strong>Files attached:</strong> {previewPayload.toolingFiles?.map((f: any) => f.name).join(", ") || "None"}
              </p>

              <h3 style={{ borderBottom: "1px solid #ccc", marginBottom: "10px", marginTop: "20px" }}>Mould Corrections</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: 16 }}>
                <thead>
                  <tr style={{ backgroundColor: "#f0f0f0" }}>
                    <th style={{ border: "1px solid black", padding: "5px" }}>#</th>
                    <th style={{ border: "1px solid black", padding: "5px" }}>Compressibility</th>
                    <th style={{ border: "1px solid black", padding: "5px" }}>Squeeze Pressure</th>
                    <th style={{ border: "1px solid black", padding: "5px" }}>Filler Size</th>
                  </tr>
                </thead>
                <tbody>
                  {(previewPayload.mouldCorrections || []).map((row: any, i: number) => (
                    <tr key={i}>
                      <td style={{ border: "1px solid black", padding: "5px", textAlign: "center" }}>{i + 1}</td>
                      <td style={{ border: "1px solid black", padding: "5px", textAlign: "center" }}>{row.compressibility}</td>
                      <td style={{ border: "1px solid black", padding: "5px", textAlign: "center" }}>{row.squeezePressure}</td>
                      <td style={{ border: "1px solid black", padding: "5px", textAlign: "center" }}>{row.fillerSize}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Typography variant="h6" sx={{ borderBottom: "1px solid #ccc", mb: 1 }}>Chemical Composition</Typography>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    {["C", "Si", "Mn", "P", "S", "Mg", "Cr", "Cu"].map(h => (
                      <th key={h} style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {["c", "si", "mn", "p", "s", "mg", "cr", "cu"].map(k => (
                      <td key={k} style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>
                        {previewPayload.chemical_composition[k] || "-"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>

              <Typography variant="h6" sx={{ borderBottom: "1px solid #ccc", mb: 1 }}>Microstructure</Typography>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <th style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>Nodularity</th>
                    <th style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>Pearlite</th>
                    <th style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>Carbide</th>
                  </tr>
                </thead>
              </table>

              <Typography variant="h6" sx={{ borderBottom: "1px solid #ccc", mb: 1, mt: 3 }}>Mechanical Properties</Typography>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <th style={{ border: '1px solid #999', padding: '6px' }}>Tensile</th>
                    <th style={{ border: '1px solid #999', padding: '6px' }}>Yield</th>
                    <th style={{ border: '1px solid #999', padding: '6px' }}>Elongation</th>
                    <th style={{ border: '1px solid #999', padding: '6px' }}>Impact (Cold)</th>
                    <th style={{ border: '1px solid #999', padding: '6px' }}>Impact (Room)</th>
                    <th style={{ border: '1px solid #999', padding: '6px' }}>Hardness (Surf)</th>
                    <th style={{ border: '1px solid #999', padding: '6px' }}>Hardness (Core)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewPayload.tensile.tensileStrength}</td>
                    <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewPayload.tensile.yieldStrength}</td>
                    <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewPayload.tensile.elongation}</td>
                    <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewPayload.tensile.impactCold}</td>
                    <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewPayload.tensile.impactRoom}</td>
                    <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewPayload.hardness.surface}</td>
                    <td style={{ border: '1px solid #999', padding: '6px', textAlign: 'center' }}>{previewPayload.hardness.core}</td>
                  </tr>
                </tbody>
              </table>
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