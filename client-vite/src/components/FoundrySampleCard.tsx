import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
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
  InputAdornment,
  IconButton,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

import PouringDetailsTable from './pouring';
import type { PouringDetails } from './pouring';

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Colors
const SAKTHI_COLORS = {
  primary: "#2950bbff",
  secondary: "#DC2626",
  accent: "#F59E0B",
  background: "#F8FAFC",
  lightBlue: "#3B82F6",
  darkGray: "#374151",
  lightGray: "#E5E7EB",
  white: "#FFFFFF",
  success: "#10B981",
};

const MACHINES = ["DISA-1", "DISA-2", "DISA-3", "DISA-4", "DISA-5"];
const SAMPLING_REASONS = ["First trial", "Metallurgy trial", "Porosity verification", "others"];

const theme = createTheme({
  palette: {
    primary: { main: SAKTHI_COLORS.primary },
    secondary: { main: SAKTHI_COLORS.secondary },
    background: { default: SAKTHI_COLORS.background },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          backgroundColor: SAKTHI_COLORS.lightBlue,
          color: SAKTHI_COLORS.white,
          borderRight: `1px solid ${SAKTHI_COLORS.lightGray}`,
          padding: '12px 8px',
        },
        body: {
          backgroundColor: SAKTHI_COLORS.white,
          borderRight: `1px solid ${SAKTHI_COLORS.lightGray}`,
          padding: '8px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
          fontWeight: 600,
        }
      }
    }
  },
});

interface PartData {
  id: number;
  pattern_code: string;
  part_name: string;
  material_grade: string;
  chemical_composition: any;
  micro_structure: string;
  tensile: string;
  impact: string;
  hardness: string;
  xray: string;
  created_at: string;
}

interface MouldCorrection {
  id: number;
  compressibility: string;
  squeezePressure: string;
  fillerSize: string;
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6">Something went wrong</Typography>
            <Typography variant="body2">{this.state.error?.message}</Typography>
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

/*
  REPLACED PARSING LOGIC:
  Backend now returns chemical_composition as JSON (object). Accept either object or JSON string.
  Normalize keys case-insensitively and return a simple object with keys: c, si, mn, p, s, mg, cr, cu
*/
const parseChemicalComposition = (composition: any) => {
  const blank = { c: '', si: '', mn: '', p: '', s: '', mg: '', cr: '', cu: '' };
  if (!composition) return blank;

  let obj: any = composition;

  if (typeof composition === 'string') {
    try {
      obj = JSON.parse(composition);
    } catch (e) {
      console.warn('chemical_composition is string and JSON.parse failed, using raw string as C', e);
      return { ...blank, c: composition };
    }
  }

  if (typeof obj !== 'object' || obj === null) return blank;

  const map: Record<string, any> = {};
  Object.keys(obj).forEach((k) => {
    if (typeof k === 'string') {
      map[k.toLowerCase().replace(/\s+/g, '')] = obj[k];
    }
  });

  const siKeyCandidates = ['si', 'silicon'];
  const getFirst = (keys: string[]) => {
    for (const k of keys) {
      if (map[k] !== undefined && map[k] !== null) return String(map[k]);
    }
    return '';
  };

  return {
    c: getFirst(['c']),
    si: getFirst(siKeyCandidates),
    mn: getFirst(['mn']),
    p: getFirst(['p']),
    s: getFirst(['s']),
    mg: getFirst(['mg']),
    cr: getFirst(['cr']),
    cu: getFirst(['cu']),
  };
};

const parseTensileData = (tensile: string) => {
  const lines = tensile ? tensile.split('\n') : [];
  let tensileStrength = '';
  let yieldStrength = '';
  let elongation = '';
  let impactCold = '';
  let impactRoom = '';

  lines.forEach(line => {
    const cleanLine = line.trim();

    if (cleanLine.match(/\d+\s*(MPa|N\/mm²|Mpa|Kgf\/mm²)/) ||
      cleanLine.includes('Tensile Strength') ||
      cleanLine.match(/[≥>]\s*\d+/)) {

      if (cleanLine.includes('≥')) {
        const numberMatch = cleanLine.match(/≥\s*(\d+)/);
        if (numberMatch && !tensileStrength) tensileStrength = `≥${numberMatch[1]}`;
      } else if (cleanLine.includes('>')) {
        const numberMatch = cleanLine.match(/>\s*(\d+)/);
        if (numberMatch && !tensileStrength) tensileStrength = `>${numberMatch[1]}`;
      } else if (cleanLine.includes('Min')) {
        const numberMatch = cleanLine.match(/(\d+)/);
        if (numberMatch && !tensileStrength) tensileStrength = `≥${numberMatch[1]}`;
      } else {
        const numberMatch = cleanLine.match(/(\d+)/);
        if (numberMatch && !tensileStrength) tensileStrength = numberMatch[1];
      }
    }

    if (cleanLine.includes('Yield Strength') || cleanLine.includes('Yield')) {
      if (cleanLine.includes('≥')) {
        const numberMatch = cleanLine.match(/≥\s*(\d+)/);
        if (numberMatch && !yieldStrength) yieldStrength = `≥${numberMatch[1]}`;
      } else if (cleanLine.includes('>')) {
        const numberMatch = cleanLine.match(/>\s*(\d+)/);
        if (numberMatch && !yieldStrength) yieldStrength = `>${numberMatch[1]}`;
      } else if (cleanLine.includes('Min')) {
        const numberMatch = cleanLine.match(/(\d+)/);
        if (numberMatch && !yieldStrength) yieldStrength = `≥${numberMatch[1]}`;
      } else {
        const numberMatch = cleanLine.match(/(\d+)/);
        if (numberMatch && !yieldStrength) yieldStrength = numberMatch[1];
      }
    }

    if (cleanLine.includes('Elongation') || cleanLine.includes('%') || cleanLine.match(/[≥>]\s*\d+\s*%/)) {
      if (cleanLine.includes('≥')) {
        const numberMatch = cleanLine.match(/≥\s*(\d+)/);
        if (numberMatch && !elongation) elongation = `≥${numberMatch[1]}`;
      } else if (cleanLine.includes('>')) {
        const numberMatch = cleanLine.match(/>\s*(\d+)/);
        if (numberMatch && !elongation) elongation = `>${numberMatch[1]}`;
      } else if (cleanLine.includes('Min')) {
        const numberMatch = cleanLine.match(/(\d+)/);
        if (numberMatch && !elongation) elongation = `≥${numberMatch[1]}`;
      } else {
        const numberMatch = cleanLine.match(/(\d+)/);
        if (numberMatch && !elongation) elongation = numberMatch[1];
      }
    }
  });

  return { tensileStrength, yieldStrength, elongation, impactCold, impactRoom };
};

const parseMicrostructureData = (microstructure: string) => {
  const lines = microstructure ? microstructure.split('\n') : [];
  let nodularity = '';
  let pearlite = '';
  let carbide = '';

  lines.forEach(line => {
    const cleanLine = line.trim().toLowerCase();

    if (cleanLine.includes('nodularity')) {
      if (cleanLine.includes('≥')) {
        const match = cleanLine.match(/≥\s*(\d+)/);
        if (match) nodularity = `≥${match[1]}`;
      } else if (cleanLine.includes('≤')) {
        const match = cleanLine.match(/≤\s*(\d+)/);
        if (match) nodularity = `≤${match[1]}`;
      } else if (cleanLine.match(/\d+/)) {
        const match = cleanLine.match(/(\d+)/);
        if (match) nodularity = match[1];
      }
    }

    if (cleanLine.includes('pearlite')) {
      if (cleanLine.includes('≥')) {
        const match = cleanLine.match(/≥\s*(\d+)/);
        if (match) pearlite = `≥${match[1]}`;
      } else if (cleanLine.includes('≤')) {
        const match = cleanLine.match(/≤\s*(\d+)/);
        if (match) pearlite = `≤${match[1]}`;
      } else if (cleanLine.includes('<')) {
        const match = cleanLine.match(/<\s*(\d+)/);
        if (match) pearlite = `<${match[1]}`;
      } else if (cleanLine.includes('>')) {
        const match = cleanLine.match(/>\s*(\d+)/);
        if (match) pearlite = `>${match[1]}`;
      } else if (cleanLine.includes('max')) {
        const match = cleanLine.match(/(\d+)/);
        if (match) pearlite = `≤${match[1]}`;
      } else if (cleanLine.includes('min')) {
        const match = cleanLine.match(/(\d+)/);
        if (match) pearlite = `≥${match[1]}`;
      } else if (cleanLine.match(/\d+\s*-\s*\d+/)) {
        const match = cleanLine.match(/(\d+\s*-\s*\d+)/);
        if (match) pearlite = match[1];
      } else if (cleanLine.match(/\d+/)) {
        const match = cleanLine.match(/(\d+)/);
        if (match) pearlite = match[1];
      }
    }

    if (cleanLine.includes('carbide') || cleanLine.includes('cementite')) {
      if (cleanLine.includes('≤')) {
        const match = cleanLine.match(/≤\s*(\d+)/);
        if (match) carbide = `≤${match[1]}`;
      } else if (cleanLine.includes('<')) {
        const match = cleanLine.match(/<\s*(\d+)/);
        if (match) carbide = `<${match[1]}`;
      } else if (cleanLine.includes('≥')) {
        const match = cleanLine.match(/≥\s*(\d+)/);
        if (match) carbide = `≥${match[1]}`;
      } else if (cleanLine.includes('>')) {
        const match = cleanLine.match(/>\s*(\d+)/);
        if (match) carbide = `>${match[1]}`;
      } else if (cleanLine.includes('max')) {
        const match = cleanLine.match(/(\d+)/);
        if (match) carbide = `≤${match[1]}`;
      } else if (cleanLine.includes('min')) {
        const match = cleanLine.match(/(\d+)/);
        if (match) carbide = `≥${match[1]}`;
      } else if (cleanLine.match(/\d+/)) {
        const match = cleanLine.match(/(\d+)/);
        if (match) carbide = match[1];
      }
    }
  });

  return {
    nodularity: nodularity || '--',
    pearlite: pearlite || '--',
    carbide: carbide || '--'
  };
};

const parseHardnessData = (hardness: string) => {
  const lines = hardness ? hardness.split('\n') : [];
  let surface = '';
  let core = '';

  lines.forEach(line => {
    const cleanLine = line.trim().toLowerCase();

    if (cleanLine.includes('surface')) {
      const match = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/);
      if (match) surface = match[1];
    } else if (cleanLine.includes('core')) {
      const match = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/);
      if (match) core = match[1];
    } else if (!surface) {
      const match = cleanLine.match(/(\d+\s*-\s*\d+|\d+)/);
      if (match) surface = match[1];
    }
  });

  return { surface: surface || '--', core: core || '--' };
};

function SampleCardSubmitted({
  submittedData,
  onProceedToPouring,
  onExportPDF,
}: {
  submittedData: any;
  onProceedToPouring: () => void;
  onExportPDF: () => void;
}) {
  return (
    <Box sx={{ p: 3, minHeight: '60vh' }}>
      <Paper variant="outlined" sx={{ p: 4, width: '100%', maxWidth: 1000, mx: 'auto', mb: 3, bgcolor: SAKTHI_COLORS.success + '10', border: `2px solid ${SAKTHI_COLORS.success}` }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: SAKTHI_COLORS.success }}>
            ✅ Sample Card Submitted Successfully!
          </Typography>
          <Typography variant="body1" sx={{ color: SAKTHI_COLORS.darkGray }}>
            Your sample card has been submitted and is now available for sand analysis
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: SAKTHI_COLORS.white }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Pattern Code</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>{submittedData.selectedPart.pattern_code}</Typography>

          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Part Name</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>{submittedData.selectedPart.part_name}</Typography>

          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Machine</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>{submittedData.machine}</Typography>

          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Trial No</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>{submittedData.trialNo}</Typography>

          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Sampling Date</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>{submittedData.samplingDate}</Typography>

          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Pattern Data Sheet Files</Typography>
          <Box sx={{ mb: 2 }}>
            {submittedData.patternFiles && submittedData.patternFiles.length > 0 ? (
              submittedData.patternFiles.map((f: File, i: number) => <Typography key={i} variant="caption" display="block">{f.name}</Typography>)
            ) : <Typography variant="caption">None</Typography>}
          </Box>

          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>STD Box Files</Typography>
          <Box>
            {submittedData.stdFiles && submittedData.stdFiles.length > 0 ? (
              submittedData.stdFiles.map((f: File, i: number) => <Typography key={i} variant="caption" display="block">{f.name}</Typography>)
            ) : <Typography variant="caption">None</Typography>}
          </Box>

          {/* API Response Display */}
          {submittedData.apiResponse && (
            <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: SAKTHI_COLORS.background }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>API Response</Typography>
              <Typography variant="body2" sx={{ 
                color: submittedData.apiResponse.success ? SAKTHI_COLORS.success : SAKTHI_COLORS.secondary,
                fontFamily: 'monospace',
                fontSize: '0.8rem'
              }}>
                {JSON.stringify(submittedData.apiResponse, null, 2)}
              </Typography>
            </Paper>
          )}
        </Paper>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={onExportPDF}
            sx={{
              minWidth: 200,
              height: 48,
              fontSize: '1rem',
              fontWeight: 700,
              background: `linear-gradient(135deg, ${SAKTHI_COLORS.primary} 0%, ${SAKTHI_COLORS.lightBlue} 100%)`,
              '&:hover': {
                background: `linear-gradient(135deg, ${SAKTHI_COLORS.lightBlue} 0%, ${SAKTHI_COLORS.primary} 100%)`
              }
            }}
          >
            📥 Export as PDF
          </Button>
          <Button 
            variant="contained" 
            color="success"
            onClick={onProceedToPouring}
            sx={{
              minWidth: 200,
              height: 48,
              fontSize: '1rem',
              fontWeight: 700,
            }}
          >
            ➜ Proceed to Pouring Details
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

function FoundrySampleCard() {
  const printRef = useRef<HTMLDivElement | null>(null);

  const [selectedPart, setSelectedPart] = useState<PartData | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<PartData | null>(null);
  const [machine, setMachine] = useState("");
  const [reason, setReason] = useState("");
  const [trialNo, setTrialNo] = useState<string>("");
  //   approval is handled in the pouring flow; remove unused state here
  const [masterParts, setMasterParts] = useState<PartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);
  const [samplingDate, setSamplingDate] = useState("");
  const [mouldCount, setMouldCount] = useState("");
  const [sampleTraceability, setSampleTraceability] = useState("");
  const [toolingType, setToolingType] = useState("");
  const [toolingFiles, setToolingFiles] = useState<File[]>([]);

  // New state for routing
  const [currentView, setCurrentView] = useState<'form' | 'submitted' | 'pouring'>('form');
  const [submittedData, setSubmittedData] = useState<any>(null);

  // Pouring details state
  const [pouringDetails, setPouringDetails] = useState<PouringDetails>({
    date: '',
    heatCode: '',
    cComposition: '',
    siComposition: '',
    mnComposition: '',
    pComposition: '',
    sComposition: '',
    mgComposition: '',
    crComposition: '',
    cuComposition: '',
    pouringTempDegC: '',
    pouringTimeSec: '',
    ficHeatNo: '',
    ppCode: '',
    followedBy: '',
    userName: ''
  });

  // Handler used by PouringDetailsTable to update pouring details
  const handlePouringDetailsChange = (details: PouringDetails) => {
    setPouringDetails(details);
  };

  // New states for pattern data sheet and std box uploads
  const [patternFiles, setPatternFiles] = useState<File[]>([]);
  const [stdFiles, setStdFiles] = useState<File[]>([]);

  // Mould correction details rows
  const [mouldCorrections, setMouldCorrections] = useState<MouldCorrection[]>([
    { id: 1, compressibility: '', squeezePressure: '', fillerSize: '' }
  ]);

  // handlers for tooling files
  const handleToolingFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setToolingFiles(files);
  };

  const removeToolingFile = (index: number) => {
    setToolingFiles(prev => prev.filter((_, i) => i !== index));
  };

  // pattern files handlers
  const handlePatternFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setPatternFiles(prev => [...prev, ...files]);
  };

  const removePatternFile = (index: number) => {
    setPatternFiles(prev => prev.filter((_, i) => i !== index));
  };

  // std files handlers
  const handleStdFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setStdFiles(prev => [...prev, ...files]);
  };

  const removeStdFile = (index: number) => {
    setStdFiles(prev => prev.filter((_, i) => i !== index));
  };

  // mould correction handlers
  const handleMouldCorrectionChange = (id: number, field: keyof Omit<MouldCorrection, 'id'>, value: string) => {
    setMouldCorrections(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addMouldCorrectionRow = () => {
    setMouldCorrections(prev => [
      ...prev,
      { id: Date.now(), compressibility: '', squeezePressure: '', fillerSize: '' }
    ]);
  };

  const removeMouldCorrectionRow = (id: number) => {
    if (mouldCorrections.length > 1) {
      setMouldCorrections(prev => prev.filter(row => row.id !== id));
    }
  };

  useEffect(() => {
    const getMasterParts = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/api/master-list');
        if (!response.ok) {
          throw new Error("Failed to fetch master list");
        }
        const data = await response.json();
        setMasterParts(data);
        setError(null);
      } catch (error) {
        console.error("Error loading master parts:", error);
        setError("Failed to load master parts. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }
    getMasterParts();
  }, []);

  useEffect(() => {
    if (selectedPart) {
      setSelectedPattern(selectedPart);
    } else {
      setSelectedPattern(null);
    }
  }, [selectedPart]);

  // Generate trial number when selectedPart changes (auto-generate via backend)
  const generateTrialId = async (partName?: string) => {
    const name = partName || selectedPart?.part_name;
    if (!name) {
      setTrialNo('');
      setTrialError(null);
      return;
    }

    setTrialLoading(true);
    setTrialError(null);
    try {
      // call backend API (your backend examples use /api/trial/id?part_name="PART_NAME")
      const res = await fetch(`http://localhost:3000/api/trial/id?part_name=${encodeURIComponent(name)}`);
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Failed to generate trial id (${res.status}) ${body}`);
      }
      const json = await res.json();
      if (json && json.trialId) {
        setTrialNo(json.trialId);
      } else {
        setTrialNo('');
        setTrialError('Unexpected response from server');
      }
    } catch (err) {
      console.error('Error generating trial id:', err);
      setTrialError('Failed to generate trial number');
    } finally {
      setTrialLoading(false);
    }
  };

  // auto-generate when user selects a part
  useEffect(() => {
    if (!selectedPart) {
      setTrialNo('');
      setTrialError(null);
      return;
    }
    generateTrialId(selectedPart.part_name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPart]);

  // Use the new JSON-parsing chemical data
  const chemicalData = selectedPart ? parseChemicalComposition(selectedPart.chemical_composition) : { c: '', si: '', mn: '', p: '', s: '', mg: '', cr: '', cu: '' };
  const tensileData = selectedPart ? parseTensileData(selectedPart.tensile) : { tensileStrength: '', yieldStrength: '', elongation: '', impactCold: '', impactRoom: '' };
  const microData = selectedPart ? parseMicrostructureData(selectedPart.micro_structure) : { nodularity: '', pearlite: '', carbide: '' };
  const hardnessData = selectedPart ? parseHardnessData(selectedPart.hardness) : { surface: '', core: '' };

  const handlePartChange = (newValue: PartData | null) => {
    setSelectedPart(newValue);
  };

  const handlePatternChange = (newValue: PartData | null) => {
    setSelectedPattern(newValue);
    if (newValue) {
      setSelectedPart(newValue);
    }
  };

  const handleSubmit = async () => {
  try {
    setLoading(true);
    setError(null);

    // Prepare file data - ensure no undefined values
    const prepareFileData = (files: File[]) => {
      if (!files || files.length === 0) {
        return null; // Explicit null for empty files
      }
      return files.map(file => ({
        name: file.name || '',
        size: file.size || 0,
        type: file.type || '',
        lastModified: file.lastModified || Date.now()
      }));
    };

    // Prepare mould correction data - ensure no undefined values
    const mouldCorrectionData = mouldCorrections.map(row => ({
      compressibility: row.compressibility || '',
      squeeze_pressure: row.squeezePressure || '',
      filler_size: row.fillerSize || ''
    }));

    // Prepare the data for API - ensure NO undefined values, only valid values or explicit null
    const trialData = {
      trial_no: trialNo || null,
      pattern_code: selectedPart?.pattern_code || null,
      part_name: selectedPart?.part_name || null,
      material_grade: selectedPart?.material_grade || null,
      machine_used: machine || null,
      sampling_date: samplingDate || null,
      no_of_moulds: mouldCount ? parseInt(mouldCount) : null,
      reason_for_sampling: reason || null,
      sample_traceability: sampleTraceability || null,
      tooling_type: toolingType || null,
      tooling_modification_files: prepareFileData(toolingFiles),
      pattern_data_sheet_files: prepareFileData(patternFiles),
      std_doc_files: prepareFileData(stdFiles),
      mould_correction_details: mouldCorrectionData.length > 0 ? mouldCorrectionData : null,
      current_department: 'methods',
      status: 'draft'
    };

    // Remove any potential undefined values from the final object
    const cleanTrialData = Object.fromEntries(
      Object.entries(trialData).map(([key, value]) => [
        key, 
        value === undefined ? null : value
      ])
    );

    console.log('🔧 DEBUG - Sending trial data to API:', JSON.stringify(cleanTrialData, null, 2));

    const response = await fetch('http://localhost:3000/api/trial-november', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanTrialData),
    });

    console.log('📡 DEBUG - Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      
      // Try to parse as JSON for better error message
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || `Failed to submit trial data: ${response.status}`);
      } catch {
        throw new Error(`Failed to submit trial data: ${response.status} - ${errorText}`);
      }
    }

    const responseData = await response.json();
    console.log('✅ DEBUG - Success API Response:', responseData);

    // Store the submitted data and show confirmation screen
    const dataToSubmit = {
      selectedPart,
      selectedPattern,
      machine,
      reason,
      trialNo,
      samplingDate,
      mouldCount,
      sampleTraceability,
      toolingType,
      toolingFiles,
      tensileData: selectedPart ? parseTensileData(selectedPart.tensile) : {},
      microData: selectedPart ? parseMicrostructureData(selectedPart.micro_structure) : {},
      patternFiles,
      stdFiles,
      mouldCorrections,
      apiResponse: responseData
    };

    setSubmittedData(dataToSubmit);
    setCurrentView('submitted');

  } catch (error) {
    console.error('❌ Error submitting trial:', error);
    setError(error instanceof Error ? error.message : 'Failed to submit trial data. Please check console for details.');
  } finally {
    setLoading(false);
  }
};

  // ---------- PDF Export ----------
  const handleExportPDF = async () => {
    const el = printRef.current;
    if (!el) {
      alert("Nothing to export");
      return;
    }

    try {
      const originalScrollY = window.scrollY;
      el.scrollIntoView({ behavior: "auto", block: "center" });

      const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false });
      window.scrollTo(0, originalScrollY);

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      const scale = (pageWidth - margin * 2) / canvas.width;
      const imgHeight = canvas.height * scale;
      const imgWidth = canvas.width * scale;

      if (imgHeight <= pageHeight - margin * 2) {
        pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);
      } else {
        const totalPages = Math.ceil(imgHeight / (pageHeight - margin * 2));
        const sliceHeightPx = Math.floor((pageHeight - margin * 2) / scale);

        for (let page = 0; page < totalPages; page++) {
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvas.width;
          const remainingPx = canvas.height - page * sliceHeightPx;
          pageCanvas.height = remainingPx < sliceHeightPx ? remainingPx : sliceHeightPx;

          const ctx = pageCanvas.getContext("2d");
          if (!ctx) throw new Error("Could not get canvas context");

          ctx.drawImage(
            canvas,
            0,
            page * sliceHeightPx,
            canvas.width,
            pageCanvas.height,
            0,
            0,
            pageCanvas.width,
            pageCanvas.height
          );

          const pageData = pageCanvas.toDataURL("image/png");
          const pageImgHeight = pageCanvas.height * scale;

          if (page > 0) pdf.addPage();
          pdf.addImage(pageData, "PNG", margin, margin, imgWidth, pageImgHeight);
        }
      }

      const safeName = (trialNo || "sample_card").replace(/\s+/g, "_");
      pdf.save(`${safeName}.pdf`);
    } catch (err) {
      console.error("Export PDF failed:", err);
      alert("Failed to export PDF. See console for details.");
    }
  };

  // Render pouring details page when submitted
  if (currentView === 'pouring' && submittedData) {
    return (
      <PouringDetailsTable
        pouringDetails={pouringDetails}
        onPouringDetailsChange={handlePouringDetailsChange}
        submittedData={submittedData}
      />
    );
  }

  // Render submitted confirmation
  if (currentView === 'submitted' && submittedData) {
    return (
      <SampleCardSubmitted
        submittedData={submittedData}
        onProceedToPouring={() => setCurrentView('pouring')}
        onExportPDF={handleExportPDF}
      />
    );
  }

  // Render main form
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: "background.default", minHeight: '100vh', pt: '80px' }}>
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <CircularProgress size={60} />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {!loading && !error && (
            <Paper ref={printRef} variant="outlined" sx={{ overflow: "hidden", border: `2px solid ${SAKTHI_COLORS.primary}`, bgcolor: SAKTHI_COLORS.white }}>
              {/* Header Section */}
              <Box sx={{ p: 3, borderBottom: `3px solid ${SAKTHI_COLORS.primary}`, background: `linear-gradient(135deg, ${SAKTHI_COLORS.primary} 0%, ${SAKTHI_COLORS.lightBlue} 100%)`, color: SAKTHI_COLORS.white }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3, alignItems: 'start' }}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, opacity: 0.9 }}>Pattern Code</Typography>
                    <Autocomplete
                      options={masterParts}
                      value={selectedPattern}
                      onChange={(_, newValue) => handlePatternChange(newValue)}
                      getOptionLabel={(option) => option.pattern_code}
                      renderOption={(props, option) => (
                        <li {...props} key={option.id} style={{ whiteSpace: 'normal', lineHeight: '1.5', padding: '8px 16px' }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.pattern_code}</Typography>
                            <Typography variant="caption" color="text.secondary">{option.part_name}</Typography>
                          </Box>
                        </li>
                      )}
                      renderInput={(params) => {
                        const { InputProps, ...other } = params;
                        return (
                          <TextField
                            {...other}
                            placeholder="Select pattern code"
                            size="small"
                            required
                            InputProps={{ ...(InputProps as any), sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 2 } }}
                          />
                        );
                      }}
                      slotProps={{ paper: { sx: { width: 'auto', minWidth: '400px', maxWidth: '90vw' } } }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, opacity: 0.9 }}>Part Name</Typography>
                    <Autocomplete
                      options={masterParts}
                      value={selectedPart}
                      onChange={(_, newValue) => handlePartChange(newValue)}
                      getOptionLabel={(option) => option.part_name}
                      renderOption={(props, option) => (
                        <li {...props} key={option.id} style={{ whiteSpace: 'normal', lineHeight: '1.5', padding: '8px 16px' }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.part_name}</Typography>
                            <Typography variant="caption" color="text.secondary">{option.pattern_code}</Typography>
                          </Box>
                        </li>
                      )}
                      renderInput={(params) => {
                        const { InputProps, ...other } = params;
                        return (
                          <TextField
                            {...other}
                            placeholder="Select from Master list"
                            size="small"
                            required
                            InputProps={{ ...(InputProps as any), sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 2 } }}
                          />
                        );
                      }}
                      slotProps={{ paper: { sx: { width: 'auto', minWidth: '400px', maxWidth: '90vw' } } }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, opacity: 0.9 }}>TRIAL No</Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        fullWidth
                        value={trialNo}
                        placeholder="Auto-generated"
                        size="small"
                        InputProps={{
                          readOnly: true,
                          sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 2 },
                          endAdornment: (
                            <InputAdornment position="end">
                              {trialLoading ? <CircularProgress size={18} /> : null}
                            </InputAdornment>
                          )
                        }}
                      />
                      <IconButton
                        color="primary"
                        onClick={() => generateTrialId(selectedPart?.part_name)}
                        disabled={!selectedPart || trialLoading}
                        size="large"
                        title="Regenerate trial number"
                        sx={{ bgcolor: SAKTHI_COLORS.white, borderRadius: 2, '&:hover': { bgcolor: '#f0f4ff' } }}
                      >
                        <span style={{ fontSize: 18 }}>⟳</span>
                      </IconButton>
                    </Box>
                    {trialError && <Typography color="error" variant="caption">{trialError}</Typography>}
                  </Box>
                </Box>
              </Box>

              {/* Info Chip */}
              <Box sx={{ px: 3, pt: 3, pb: 2 }}>
                <Chip
                  icon={<span style={{ fontSize: '1.2rem' }}>💡</span>}
                  label="Auto retrieval of spec once part name is selected (Metallurgical Spec)"
                  sx={{
                    bgcolor: selectedPart ? SAKTHI_COLORS.success + '20' : SAKTHI_COLORS.accent + '20',
                    color: SAKTHI_COLORS.darkGray,
                    border: `1px dashed ${selectedPart ? SAKTHI_COLORS.success : SAKTHI_COLORS.accent}`,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    py: 2.5
                  }}
                />
              </Box>

              <Box sx={{ p: 3 }}>
                {/* METALLURGICAL SPECIFICATION Section */}
                <Paper variant="outlined" sx={{ border: `2px solid ${SAKTHI_COLORS.primary}`, overflow: "hidden", mb: 3 }}>
                  {/* Header */}
                  <Box sx={{ bgcolor: SAKTHI_COLORS.accent, p: 1.5, textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 800, color: SAKTHI_COLORS.white, fontSize: '1rem' }}>
                      METALLURGICAL SPECIFICATION
                    </Typography>
                  </Box>

                  {/* Chemical Composition and Microstructure Row */}
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          align="center"
                          sx={{
                            bgcolor: SAKTHI_COLORS.primary,
                            fontWeight: 700,
                            borderRight: `2px solid ${SAKTHI_COLORS.primary}`,
                            fontSize: '0.95rem',
                            py: 1.5,
                            color: SAKTHI_COLORS.white
                          }}
                        >
                          Chemical Composition
                        </TableCell>
                        <TableCell
                          colSpan={3}
                          align="center"
                          sx={{
                            bgcolor: SAKTHI_COLORS.primary,
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            py: 1.5,
                            color: SAKTHI_COLORS.white
                          }}
                        >
                          Microstructure
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="center" sx={{ minWidth: '80px', fontSize: '0.85rem', bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>C%</TableCell>
                        <TableCell align="center" sx={{ minWidth: '80px', fontSize: '0.85rem', bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Si%</TableCell>
                        <TableCell align="center" sx={{ minWidth: '80px', fontSize: '0.85rem', bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Mn%</TableCell>
                        <TableCell align="center" sx={{ minWidth: '80px', fontSize: '0.85rem', bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>P%</TableCell>
                        <TableCell align="center" sx={{ minWidth: '80px', fontSize: '0.85rem', bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>S%</TableCell>
                        <TableCell align="center" sx={{ minWidth: '80px', fontSize: '0.85rem', bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Mg%</TableCell>
                        <TableCell align="center" sx={{ minWidth: '80px', fontSize: '0.85rem', bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Cr%</TableCell>
                        <TableCell align="center" sx={{ minWidth: '80px', fontSize: '0.85rem', borderRight: `2px solid ${SAKTHI_COLORS.primary}`, bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Cu%</TableCell>
                        <TableCell align="center" sx={{ minWidth: '100px', fontSize: '0.85rem', bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Nodularity%</TableCell>
                        <TableCell align="center" sx={{ minWidth: '100px', fontSize: '0.85rem', bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Pearlite%</TableCell>
                        <TableCell align="center" sx={{ minWidth: '100px', fontSize: '0.85rem', bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Carbide%</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell><TextField fullWidth value={chemicalData.c} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: chemicalData.c ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: chemicalData.c ? 600 : 400 } }} /></TableCell>
                        <TableCell><TextField fullWidth value={chemicalData.si} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: chemicalData.si ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: chemicalData.si ? 600 : 400 } }} /></TableCell>
                        <TableCell><TextField fullWidth value={chemicalData.mn} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: chemicalData.mn ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: chemicalData.mn ? 600 : 400 } }} /></TableCell>
                        <TableCell><TextField fullWidth value={chemicalData.p} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: chemicalData.p ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: chemicalData.p ? 600 : 400 } }} /></TableCell>
                        <TableCell><TextField fullWidth value={chemicalData.s} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: chemicalData.s ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: chemicalData.s ? 600 : 400 } }} /></TableCell>
                        <TableCell><TextField fullWidth value={chemicalData.mg} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: chemicalData.mg ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: chemicalData.mg ? 600 : 400 } }} /></TableCell>
                        <TableCell><TextField fullWidth value={chemicalData.cr} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: chemicalData.cr ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: chemicalData.cr ? 600 : 400 } }} /></TableCell>
                        <TableCell sx={{ borderRight: `2px solid ${SAKTHI_COLORS.primary}` }}><TextField fullWidth value={chemicalData.cu} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: chemicalData.cu ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: chemicalData.cu ? 600 : 400 } }} /></TableCell>
                        <TableCell><TextField fullWidth value={microData.nodularity} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: microData.nodularity !== '--' ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: microData.nodularity !== '--' ? 600 : 400 } }} /></TableCell>
                        <TableCell><TextField fullWidth value={microData.pearlite} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: microData.pearlite !== '--' ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: microData.pearlite !== '--' ? 600 : 400 } }} /></TableCell>
                        <TableCell><TextField fullWidth value={microData.carbide} placeholder="--" size="small" InputProps={{ readOnly: true, sx: { bgcolor: microData.carbide !== '--' ? SAKTHI_COLORS.background : SAKTHI_COLORS.white, borderRadius: 1, fontWeight: microData.carbide !== '--' ? 600 : 400 } }} /></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  {/* Mechanical Properties and NDT Inspection Row */}
                  <Table size="small" sx={{ mt: 2 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          align="center"
                          sx={{
                            bgcolor: SAKTHI_COLORS.primary,
                            fontWeight: 700,
                            borderRight: `2px solid ${SAKTHI_COLORS.primary}`,
                            fontSize: '0.95rem',
                            py: 1.5,
                            color: SAKTHI_COLORS.white
                          }}
                        >
                          Mechanical Properties
                        </TableCell>
                        <TableCell
                          colSpan={4}
                          align="center"
                          sx={{
                            bgcolor: SAKTHI_COLORS.primary,
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            py: 1.5,
                            color: SAKTHI_COLORS.white
                          }}
                        >
                          NDT Inspection
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="center" sx={{ minWidth: '120px', fontSize: '0.85rem', bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Tensile Strength (Min)</TableCell>
                        <TableCell align="center" sx={{ minWidth: '120px', fontSize: '0.85rem', bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Yield Strength (Min)</TableCell>
                        <TableCell align="center" sx={{ minWidth: '100px', fontSize: '0.85rem', bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Elongation%</TableCell>
                        <TableCell align="center" sx={{ minWidth: '100px', fontSize: '0.85rem', bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Impact strength@ Cold Temp °c</TableCell>
                        <TableCell align="center" sx={{ minWidth: '100px', fontSize: '0.85rem', bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Impact strength@ Room Temp °c</TableCell>
                        <TableCell align="center" colSpan={2} sx={{ fontSize: '0.85rem', borderRight: `2px solid ${SAKTHI_COLORS.primary}`, bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 0.5, color: SAKTHI_COLORS.white }}>Hardness (BHN)</Typography>
                            <Box sx={{ display: 'flex', borderTop: `1px solid ${SAKTHI_COLORS.lightGray}` }}>
                              <Box sx={{ flex: 1, py: 0.5, borderRight: `1px solid ${SAKTHI_COLORS.lightGray}`, color: SAKTHI_COLORS.white }}>Surface</Box>
                              <Box sx={{ flex: 1, py: 0.5, color: SAKTHI_COLORS.white }}>Core</Box>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ minWidth: '120px', fontSize: '0.85rem', bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>X-Ray Inspection</TableCell>
                        <TableCell align="center" sx={{ minWidth: '100px', fontSize: '0.85rem', bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>MPI</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        {/* Tensile Strength */}
                        <TableCell>
                          <TextField
                            fullWidth
                            value={tensileData.tensileStrength}
                            placeholder="--"
                            size="small"
                            InputProps={{
                              readOnly: true,
                              sx: {
                                bgcolor: tensileData.tensileStrength ? SAKTHI_COLORS.background : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: tensileData.tensileStrength ? 600 : 400
                              }
                            }}
                          />
                        </TableCell>

                        {/* Yield Strength */}
                        <TableCell>
                          <TextField
                            fullWidth
                            value={tensileData.yieldStrength}
                            placeholder="--"
                            size="small"
                            InputProps={{
                              readOnly: true,
                              sx: {
                                bgcolor: tensileData.yieldStrength ? SAKTHI_COLORS.background : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: tensileData.yieldStrength ? 600 : 400
                              }
                            }}
                          />
                        </TableCell>

                        {/* Elongation */}
                        <TableCell>
                          <TextField
                            fullWidth
                            value={tensileData.elongation}
                            placeholder="--"
                            size="small"
                            InputProps={{
                              readOnly: true,
                              sx: {
                                bgcolor: tensileData.elongation ? SAKTHI_COLORS.background : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: tensileData.elongation ? 600 : 400
                              }
                            }}
                          />
                        </TableCell>

                        {/* Impact Strength @ Cold Temp */}
                        <TableCell>
                          <TextField
                            fullWidth
                            value={selectedPart?.impact ? `${selectedPart.impact} (Cold)` : "--"}
                            placeholder="--"
                            size="small"
                            InputProps={{
                              readOnly: true,
                              sx: {
                                bgcolor: selectedPart?.impact ? SAKTHI_COLORS.background : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: selectedPart?.impact ? 600 : 400
                              }
                            }}
                          />
                        </TableCell>

                        {/* Impact Strength @ Room Temp */}
                        <TableCell>
                          <TextField
                            fullWidth
                            value={selectedPart?.impact ? `${selectedPart.impact} (Room)` : "--"}
                            placeholder="--"
                            size="small"
                            InputProps={{
                              readOnly: true,
                              sx: {
                                bgcolor: selectedPart?.impact ? SAKTHI_COLORS.background : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: selectedPart?.impact ? 600 : 400
                              }
                            }}
                          />
                        </TableCell>

                        {/* Hardness Surface */}
                        <TableCell>
                          <TextField
                            fullWidth
                            value={hardnessData.surface}
                            placeholder="--"
                            size="small"
                            InputProps={{
                              readOnly: true,
                              sx: {
                                bgcolor: hardnessData.surface !== "--" ? SAKTHI_COLORS.background : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: hardnessData.surface !== "--" ? 600 : 400
                              }
                            }}
                          />
                        </TableCell>

                        {/* Hardness Core */}
                        <TableCell>
                          <TextField
                            fullWidth
                            value={hardnessData.core}
                            placeholder="--"
                            size="small"
                            InputProps={{
                              readOnly: true,
                              sx: {
                                bgcolor: hardnessData.core !== "--" ? SAKTHI_COLORS.background : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: hardnessData.core !== "--" ? 600 : 400
                              }
                            }}
                          />
                        </TableCell>

                        {/* X-Ray */}
                        <TableCell>
                          <TextField
                            fullWidth
                            value={selectedPart?.xray || "--"}
                            placeholder="--"
                            size="small"
                            InputProps={{
                              readOnly: true,
                              sx: {
                                bgcolor: selectedPart?.xray ? SAKTHI_COLORS.background : SAKTHI_COLORS.white,
                                borderRadius: 1,
                                fontWeight: selectedPart?.xray ? 600 : 400
                              }
                            }}
                          />
                        </TableCell>

                        {/* MPI */}
                        <TableCell>
                          <TextField
                            fullWidth
                            placeholder="--"
                            size="small"
                            InputProps={{
                              sx: {
                                bgcolor: SAKTHI_COLORS.white,
                                borderRadius: 1
                              }
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Paper>

                {/* Date, Moulds, Machine, Reason, Sample Traceability Table + Pattern Data Sheet + STD Box */}
                <Paper variant="outlined" sx={{ border: `2px solid ${SAKTHI_COLORS.primary}`, overflow: "auto", mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '140px', bgcolor: SAKTHI_COLORS.primary, color: SAKTHI_COLORS.white }}>Date of Sampling</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '120px', bgcolor: SAKTHI_COLORS.primary, color: SAKTHI_COLORS.white }}>No. of Moulds</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '180px', bgcolor: SAKTHI_COLORS.primary, color: SAKTHI_COLORS.white }}>DISA / FOUNDRY-A</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '180px', bgcolor: SAKTHI_COLORS.primary, color: SAKTHI_COLORS.white }}>Reason For Sampling</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '150px', bgcolor: SAKTHI_COLORS.primary, color: SAKTHI_COLORS.white }}>Sample Traceability</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '160px', bgcolor: SAKTHI_COLORS.primary, color: SAKTHI_COLORS.white }}>Pattern Data Sheet</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '160px', bgcolor: SAKTHI_COLORS.primary, color: SAKTHI_COLORS.white }}> Std Doc</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <TextField
                            fullWidth
                            type="date"
                            value={samplingDate}
                            onChange={(e) => setSamplingDate(e.target.value)}
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            required
                            InputProps={{ sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 1 } }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            type="number"
                            value={mouldCount}
                            onChange={(e) => setMouldCount(e.target.value)}
                            placeholder="10"
                            size="small"
                            inputProps={{ min: 0 }}
                            required
                            InputProps={{ sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 1 } }}
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small" required>
                            <Select
                              value={machine}
                              onChange={(e) => setMachine(e.target.value)}
                              displayEmpty
                              sx={{ bgcolor: SAKTHI_COLORS.white, borderRadius: 1 }}
                            >
                              <MenuItem value="" disabled>Select Machine</MenuItem>
                              {MACHINES.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small" required>
                            <Select
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              displayEmpty
                              sx={{ bgcolor: SAKTHI_COLORS.white, borderRadius: 1 }}
                            >
                              <MenuItem value="" disabled>Select Reason</MenuItem>
                              {SAMPLING_REASONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={sampleTraceability}
                            onChange={(e) => setSampleTraceability(e.target.value)}
                            placeholder="Enter option"
                            size="small"
                            required
                            InputProps={{ sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 1 } }}
                          />
                        </TableCell>

                        {/* Pattern Data Sheet Upload */}
                        <TableCell>
                          <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            sx={{
                              borderWidth: 2,
                              borderStyle: 'dashed',
                              borderColor: SAKTHI_COLORS.primary,
                              color: SAKTHI_COLORS.primary,
                              py: 1.5,
                              bgcolor: SAKTHI_COLORS.white,
                              '&:hover': {
                                borderColor: SAKTHI_COLORS.lightBlue,
                                backgroundColor: SAKTHI_COLORS.background,
                                borderWidth: 2
                              }
                            }}
                          >
                            📎 Upload Pattern PDF / Image
                            <input
                              type="file"
                              hidden
                              accept=".jpg,.jpeg,.png,.pdf"
                              multiple
                              onChange={handlePatternFilesChange}
                            />
                          </Button>

                          {patternFiles.length > 0 && (
                            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexDirection: 'column' }}>
                              {patternFiles.map((f, i) => (
                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#fff', px: 1, py: 0.5, borderRadius: 1, border: `1px solid ${SAKTHI_COLORS.lightGray}`, justifyContent: 'space-between' }}>
                                  <Typography variant="caption" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</Typography>
                                  <Button size="small" onClick={() => removePatternFile(i)} sx={{ color: SAKTHI_COLORS.secondary }}>Remove</Button>
                                </Box>
                              ))}
                            </Box>
                          )}
                        </TableCell>

                        {/* STD Box Upload */}
                        <TableCell>
                          <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            sx={{
                              borderWidth: 2,
                              borderStyle: 'dashed',
                              borderColor: SAKTHI_COLORS.primary,
                              color: SAKTHI_COLORS.primary,
                              py: 1.5,
                              bgcolor: SAKTHI_COLORS.white,
                              '&:hover': {
                                borderColor: SAKTHI_COLORS.lightBlue,
                                backgroundColor: SAKTHI_COLORS.background,
                                borderWidth: 2
                              }
                            }}
                          >
                            📎 Attach STD PDF
                            <input
                              type="file"
                              hidden
                              accept=".pdf"
                              multiple
                              onChange={handleStdFilesChange}
                            />
                          </Button>

                          {stdFiles.length > 0 && (
                            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexDirection: 'column' }}>
                              {stdFiles.map((f, i) => (
                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#fff', px: 1, py: 0.5, borderRadius: 1, border: `1px solid ${SAKTHI_COLORS.lightGray}`, justifyContent: 'space-between' }}>
                                  <Typography variant="caption" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</Typography>
                                  <Button size="small" onClick={() => removeStdFile(i)} sx={{ color: SAKTHI_COLORS.secondary }}>Remove</Button>
                                </Box>
                              ))}
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Paper>

                {/* Tooling Modification Done */}
                <Paper variant="outlined" sx={{ border: `2px solid ${SAKTHI_COLORS.primary}`, overflow: "hidden", mb: 3, p: 3, bgcolor: '#D3D3D3' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SAKTHI_COLORS.darkGray, fontSize: '1rem', mb: 2 }}>
                    Tooling Modification Done
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: SAKTHI_COLORS.darkGray }}>Type</Typography>
                      <TextField
                        fullWidth
                        value={toolingType}
                        onChange={(e) => setToolingType(e.target.value)}
                        placeholder="Enter modification type"
                        size="small"
                        multiline
                        rows={2}
                        required
                        InputProps={{ sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 1 } }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: SAKTHI_COLORS.darkGray }}>Attach Photo or PDF</Typography>
                      <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        sx={{
                          borderWidth: 2,
                          borderStyle: 'dashed',
                          borderColor: SAKTHI_COLORS.primary,
                          color: SAKTHI_COLORS.primary,
                          py: 1.5,
                          bgcolor: SAKTHI_COLORS.white,
                          '&:hover': {
                            borderColor: SAKTHI_COLORS.lightBlue,
                            backgroundColor: SAKTHI_COLORS.background,
                            borderWidth: 2
                          }
                        }}
                      >
                        📎 Upload Files
                        <input
                          type="file"
                          hidden
                          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                          multiple
                          onChange={handleToolingFilesChange}
                        />
                      </Button>
                      {toolingFiles.length > 0 && (
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {toolingFiles.map((f, i) => (
                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#fff', px: 1, py: 0.5, borderRadius: 1, border: `1px solid ${SAKTHI_COLORS.lightGray}` }}>
                              <Typography variant="caption" sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</Typography>
                              <Button size="small" onClick={() => removeToolingFile(i)} sx={{ color: SAKTHI_COLORS.secondary }}>Remove</Button>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Paper>

                {/* Mould correction details */}
                <Paper variant="outlined" sx={{ border: `2px solid ${SAKTHI_COLORS.primary}`, overflow: "hidden", mb: 3, p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SAKTHI_COLORS.darkGray, fontSize: '1rem' }}>
                      Mould Correction Details
                    </Typography>
                    <Button 
                      variant="outlined" 
                      onClick={addMouldCorrectionRow}
                      sx={{ borderColor: SAKTHI_COLORS.primary, color: SAKTHI_COLORS.primary }}
                    >
                      + Add Row
                    </Button>
                  </Box>

                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell align="center" sx={{ fontWeight: 700, bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Compressibility</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Squeeze Pressure</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Filler Size</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, bgcolor: SAKTHI_COLORS.lightBlue, color: SAKTHI_COLORS.white }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mouldCorrections.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <TextField 
                              fullWidth 
                              value={row.compressibility} 
                              size="small" 
                              placeholder="Enter value"
                              required
                              onChange={(e) => handleMouldCorrectionChange(row.id, 'compressibility', e.target.value)}
                              InputProps={{ 
                                sx: { 
                                  bgcolor: SAKTHI_COLORS.white, 
                                  borderRadius: 1,
                                  '& .MuiInputBase-input': {
                                    textAlign: 'center'
                                  }
                                } 
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField 
                              fullWidth 
                              value={row.squeezePressure} 
                              size="small" 
                              placeholder="Enter pressure"
                              required
                              onChange={(e) => handleMouldCorrectionChange(row.id, 'squeezePressure', e.target.value)}
                              InputProps={{ 
                                sx: { 
                                  bgcolor: SAKTHI_COLORS.white, 
                                  borderRadius: 1,
                                  '& .MuiInputBase-input': {
                                    textAlign: 'center'
                                  }
                                } 
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField 
                              fullWidth 
                              value={row.fillerSize} 
                              size="small" 
                              placeholder="Enter size"
                              required
                              onChange={(e) => handleMouldCorrectionChange(row.id, 'fillerSize', e.target.value)}
                              InputProps={{ 
                                sx: { 
                                  bgcolor: SAKTHI_COLORS.white, 
                                  borderRadius: 1,
                                  '& .MuiInputBase-input': {
                                    textAlign: 'center'
                                  }
                                } 
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {mouldCorrections.length > 1 && (
                              <Button 
                                size="small" 
                                onClick={() => removeMouldCorrectionRow(row.id)}
                                sx={{ color: SAKTHI_COLORS.secondary }}
                              >
                                Remove
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>

                {/* Submit + Export Buttons */}
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSubmit}
                    disabled={loading}
                    sx={{
                      minWidth: 250,
                      height: 56,
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      background: `linear-gradient(135deg, ${SAKTHI_COLORS.primary} 0%, ${SAKTHI_COLORS.lightBlue} 100%)`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${SAKTHI_COLORS.lightBlue} 0%, ${SAKTHI_COLORS.primary} 100%)`
                      },
                      '&:disabled': {
                        bgcolor: SAKTHI_COLORS.lightGray,
                        color: SAKTHI_COLORS.darkGray
                      }
                    }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Submit Sample Card'}
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleExportPDF}
                    disabled={loading}
                    sx={{
                      minWidth: 200,
                      height: 56,
                      fontWeight: 700,
                      borderColor: SAKTHI_COLORS.primary,
                      color: SAKTHI_COLORS.primary,
                      bgcolor: SAKTHI_COLORS.white,
                      '&:hover': {
                        bgcolor: SAKTHI_COLORS.background,
                      }
                    }}
                  >
                    Export as PDF
                  </Button>
                </Box>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

// Wrap with Error Boundary
export default function FoundrySampleCardWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <FoundrySampleCard />
    </ErrorBoundary>
  );
}