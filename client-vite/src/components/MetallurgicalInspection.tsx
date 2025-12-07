import React, { useEffect, useState, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
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
  ThemeProvider,
  createTheme,
  Button,
  Alert,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  IconButton,
  Container,
  Grid,
  Chip,
  Divider,
  GlobalStyles
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Icons
import UploadFileIcon from "@mui/icons-material/UploadFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import FactoryIcon from '@mui/icons-material/Factory';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import PrintIcon from '@mui/icons-material/Print';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ScienceIcon from '@mui/icons-material/Science';
import PersonIcon from "@mui/icons-material/Person";
import SaclHeader from "./common/SaclHeader";
/* ---------------- 1. Theme Configuration (Matched to FoundryApp) ---------------- */

const COLORS = {
  primary: "#1e293b",    // Slate 800
  secondary: "#ea580c",  // Orange 600
  background: "#f1f5f9", // Light Slate Background
  surface: "#ffffff",
  border: "#e2e8f0",     // Slate 200
  textPrimary: "#0f172a",
  textSecondary: "#64748b",

  // Header Colors
  blueHeaderBg: "#eff6ff", // Light Blue
  blueHeaderText: "#3b82f6", // Blue
  orangeHeaderBg: "#fff7ed", // Light Orange
  orangeHeaderText: "#c2410c", // Dark Orange

  // Specific for Inspection Status
  successBg: "#ecfdf5",
  successText: "#059669",
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
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: { fontWeight: 700, color: COLORS.primary },
    subtitle1: { fontWeight: 600, color: COLORS.primary },
    subtitle2: { fontWeight: 600, fontSize: "0.75rem", letterSpacing: 0.5, textTransform: 'uppercase' },
    body2: { fontFamily: '"Roboto Mono", monospace', fontSize: '0.875rem' },
    caption: { fontWeight: 600, color: COLORS.textSecondary, textTransform: 'uppercase' }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)",
          border: `1px solid ${COLORS.border}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${COLORS.border}`,
          borderRight: `1px solid ${COLORS.border}`,
          padding: "8px 12px",
        },
        head: {
          fontWeight: 700,
          fontSize: "0.8rem",
          textAlign: "center",
          color: COLORS.blueHeaderText,
          backgroundColor: COLORS.blueHeaderBg,
        },
        body: {
          color: COLORS.textPrimary,
        }
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            backgroundColor: "#fff",
            "& fieldset": { borderColor: "#cbd5e1" },
            "&:hover fieldset": { borderColor: COLORS.primary },
            "&.Mui-focused fieldset": { borderColor: COLORS.secondary, borderWidth: 1 },
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
          boxShadow: "none",
          "&:hover": { boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }
        },
      },
    },
  },
});

/* ---------------- Types & Helpers ---------------- */

interface Row {
  id: string;
  label: string;
  attachment: File | null;
  ok: boolean | null;
  remarks: string;
  value?: string;
}

interface MicroCol {
  id: string;
  label: string;
}

const initialRows = (labels: string[]): Row[] =>
  labels.map((label, i) => ({
    id: `${label}-${i}`,
    label,
    attachment: null,
    ok: null,
    remarks: "",
  }));

const MICRO_PARAMS = ["Cavity number", "Nodularity", "Matrix", "Carbide", "Inclusion"];

const fileToMeta = (f: File | null) => {
  if (!f) return null;
  return { name: f.name, size: f.size, type: f.type };
};

/* ---------------- UI Sub-components ---------------- */

const HeaderSection = ({ title, userIP }: { title: string, userIP: string }) => (
  <Paper sx={{
    p: 1.5, mb: 3,
    display: "flex", justifyContent: "space-between", alignItems: "center",
    borderLeft: `6px solid ${COLORS.secondary}`
  }}>
    <Box display="flex" alignItems="center" gap={2}>
      <FactoryIcon sx={{ fontSize: 32, color: COLORS.primary }} />
      <Typography variant="h6">{title}</Typography>
    </Box>
    <Box display="flex" gap={1} alignItems="center">
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
);

function SectionTable({
  title,
  rows,
  onChange,
}: {
  title: string;
  rows: Row[];
  onChange: (id: string, patch: Partial<Row>) => void;
}) {
  const [cols, setCols] = useState<MicroCol[]>([{ id: 'c1', label: '' }]);
  const [cavityNumbers, setCavityNumbers] = useState<string[]>(['']);
  const [values, setValues] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    rows.forEach((r) => { init[r.id] = ['']; });
    return init;
  });

  const [groupMeta, setGroupMeta] = useState<{ attachment: File | null; ok: boolean | null; remarks: string }>(() => ({ attachment: null, ok: null, remarks: '' }));

  useEffect(() => {
    setValues((prev) => {
      const copy: Record<string, string[]> = {};
      rows.forEach((r) => { copy[r.id] = prev[r.id] ?? ['']; });
      return copy;
    });
  }, [rows]);

  const addColumn = () => {
    setCols((prev) => [...prev, { id: `c${prev.length + 1}`, label: '' }]);
    setCavityNumbers((prev) => [...prev, '']);
    setValues((prev) => {
      const copy: Record<string, string[]> = {};
      Object.keys(prev).forEach((k) => { copy[k] = [...prev[k], '']; });
      return copy;
    });
  };

  const removeColumn = (index: number) => {
    setCols((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
    setCavityNumbers((prev) => {
      const arr = [...prev];
      if (arr.length > index) arr.splice(index, 1);
      return arr.length > 0 ? arr : [''];
    });
    setValues((prev) => {
      const copy: Record<string, string[]> = {};
      Object.keys(prev).forEach((k) => {
        const arr = [...prev[k]];
        if (arr.length > index) arr.splice(index, 1);
        copy[k] = arr;
      });
      return copy;
    });
  };

  const updateCell = (rowId: string, colIndex: number, val: string) => {
    setValues((prev) => ({ ...prev, [rowId]: prev[rowId].map((v, i) => (i === colIndex ? val : v)) }));
    const combined = (values[rowId] || []).map((v, i) => (i === colIndex ? val : v)).filter(Boolean).join(' | ');
    onChange(rowId, { value: combined });
  };

  const updateGroupMeta = (patch: Partial<{ attachment: File | null; ok: boolean | null; remarks: string }>) => {
    setGroupMeta((prev) => ({ ...prev, ...patch }));
  };

  return (
    <Box mb={4}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <ScienceIcon sx={{ color: COLORS.blueHeaderText, fontSize: 20 }} />
        <Typography variant="subtitle2" sx={{ color: COLORS.primary }}>{title}</Typography>
      </Box>
      <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

      <Box sx={{ overflowX: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 180 }}>Parameter</TableCell>
              {cols.map((c, ci) => (
                <TableCell key={c.id} sx={{ minWidth: 140 }}>
                  <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                    <TextField
                      size="small"
                      value={c.label}
                      onChange={(e) => setCols((prev) => prev.map((col, i) => (i === ci ? { ...col, label: e.target.value } : col)))}
                      variant="standard"
                      InputProps={{ disableUnderline: true, style: { fontSize: '0.8rem', fontWeight: 700, color: COLORS.blueHeaderText, textAlign: 'center' } }}
                      sx={{ input: { textAlign: 'center' } }}
                    />
                    <IconButton size="small" onClick={() => removeColumn(ci)} sx={{ color: COLORS.blueHeaderText, opacity: 0.6 }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              ))}
              <TableCell sx={{ width: 140, bgcolor: COLORS.orangeHeaderBg, color: COLORS.orangeHeaderText }}>OK / NOT OK</TableCell>
              <TableCell sx={{ width: 240, bgcolor: COLORS.orangeHeaderBg, color: COLORS.orangeHeaderText }}>Remarks & Files</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {/* Cavity Number Row */}
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: COLORS.textSecondary, bgcolor: '#f8fafc' }}>Cavity number</TableCell>
              {cols.map((c, ci) => (
                <TableCell key={c.id} sx={{ bgcolor: '#f8fafc' }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={cavityNumbers[ci] ?? ""}
                    onChange={(e) => setCavityNumbers((prev) => prev.map((v, i) => (i === ci ? e.target.value : v)))}
                    variant="outlined"
                    sx={{ "& .MuiInputBase-input": { textAlign: 'center', fontFamily: 'Roboto Mono', fontSize: '0.85rem' } }}
                  />
                </TableCell>
              ))}
              <TableCell rowSpan={1} sx={{ bgcolor: '#f8fafc' }} />
              <TableCell rowSpan={1} sx={{ bgcolor: '#f8fafc' }} />
            </TableRow>

            {rows.map((r: Row, idx: number) => (
              <TableRow key={r.id}>
                <TableCell sx={{ fontWeight: 600, color: COLORS.textSecondary, bgcolor: '#f8fafc' }}>{r.label}</TableCell>

                {cols.map((c, ci) => (
                  <TableCell key={c.id}>
                    <TextField
                      size="small"
                      fullWidth
                      value={values[r.id]?.[ci] ?? ""}
                      onChange={(e) => updateCell(r.id, ci, e.target.value)}
                      variant="outlined"
                      sx={{ "& .MuiInputBase-input": { textAlign: 'center', fontFamily: 'Roboto Mono', fontSize: '0.85rem' } }}
                    />
                  </TableCell>
                ))}

                {idx === 0 ? (
                  <>
                    <TableCell rowSpan={rows.length} sx={{ bgcolor: COLORS.successBg, verticalAlign: "middle", textAlign: 'center' }}>
                      <RadioGroup row sx={{ justifyContent: 'center' }} value={groupMeta.ok === null ? "" : String(groupMeta.ok)} onChange={(e) => updateGroupMeta({ ok: e.target.value === "true" })}>
                        <FormControlLabel value="true" control={<Radio size="small" color="success" />} label={<Typography variant="caption">OK</Typography>} />
                        <FormControlLabel value="false" control={<Radio size="small" color="error" />} label={<Typography variant="caption">NOT OK</Typography>} />
                      </RadioGroup>
                    </TableCell>

                    <TableCell rowSpan={rows.length} colSpan={4} sx={{ bgcolor: '#fff7ed', verticalAlign: "top" }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 1 }}>
                        <TextField
                          size="small"
                          fullWidth
                          multiline
                          rows={3}
                          value={groupMeta.remarks}
                          onChange={(e) => updateGroupMeta({ remarks: e.target.value })}
                          placeholder="Enter remarks..."
                          variant="outlined"
                          sx={{ bgcolor: 'white' }}
                        />

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}>
                          <input accept="image/*,application/pdf" style={{ display: 'none' }} id={`${title}-group-file`} type="file" onChange={(e) => { const file = e.target.files?.[0] ?? null; updateGroupMeta({ attachment: file }); }} />
                          <label htmlFor={`${title}-group-file`}>
                            <Button component="span" size="small" variant="outlined" startIcon={<UploadFileIcon />} sx={{ borderColor: COLORS.border, color: COLORS.textSecondary }}>
                              Attach PDF
                            </Button>
                          </label>

                          {groupMeta.attachment && (
                            <Chip
                              icon={<InsertDriveFileIcon />}
                              label={groupMeta.attachment.name}
                              onDelete={() => updateGroupMeta({ attachment: null })}
                              size="small"
                              variant="outlined"
                              sx={{ maxWidth: 120 }}
                            />
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                  </>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Button
        size="small"
        onClick={addColumn}
        startIcon={<AddCircleIcon />}
        sx={{ mt: 1, color: COLORS.secondary }}
      >
        Add Column
      </Button>
    </Box>
  );
}

function MicrostructureTable({
  params,
  cols,
  values,
  meta,
  setCols,
  setValues,
  setMeta,
}: {
  params: string[];
  cols: MicroCol[];
  values: Record<string, string[]>;
  meta: Record<string, { attachment: File | null; ok: boolean | null; remarks: string }>;
  setCols: (c: MicroCol[] | ((prev: MicroCol[]) => MicroCol[])) => void;
  setValues: (v: Record<string, string[]> | ((prev: Record<string, string[]>) => Record<string, string[]>)) => void;
  setMeta: (m: Record<string, { attachment: File | null; ok: boolean | null; remarks: string }> | ((prev: any) => any)) => void;
}) {
  const [cavityNumbers, setCavityNumbers] = useState<string[]>(['']);

  const addColumn = () => {
    setCols((prev: MicroCol[]) => {
      const nextIndex = prev.length + 1;
      return [...prev, { id: `c${nextIndex}`, label: `Value ${nextIndex}` }];
    });
    setCavityNumbers((prev) => [...prev, '']);
    setValues((prev) => {
      const copy: Record<string, string[]> = {};
      Object.keys(prev).forEach((k) => { copy[k] = [...prev[k], ""]; });
      return copy;
    });
  };

  const removeColumn = (index: number) => {
    setCols((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
    setCavityNumbers((prev) => {
      const arr = [...prev];
      if (arr.length > index) arr.splice(index, 1);
      return arr.length > 0 ? arr : [''];
    });
    setValues((prev) => {
      const copy: Record<string, string[]> = {};
      Object.keys(prev).forEach((k) => {
        const arr = [...prev[k]];
        if (arr.length > index) arr.splice(index, 1);
        copy[k] = arr;
      });
      return copy;
    });
  };

  const updateCell = (param: string, colIndex: number, val: string) => {
    setValues((prev) => ({ ...prev, [param]: prev[param].map((v, i) => (i === colIndex ? val : v)) }));
  };

  const updateMeta = (param: string, patch: Partial<{ attachment: File | null; ok: boolean | null; remarks: string }>) => {
    setMeta((prev: any) => ({ ...prev, [param]: { ...prev[param], ...patch } }));
  };

  return (
    <Box mb={4}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <ScienceIcon sx={{ color: COLORS.blueHeaderText, fontSize: 20 }} />
        <Typography variant="subtitle2" sx={{ color: COLORS.primary }}>MICROSTRUCTURE EXAMINATION RESULT</Typography>
      </Box>
      <Divider sx={{ mb: 2, borderColor: COLORS.border }} />

      <Box sx={{ overflowX: "auto", border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 180 }}>Parameter</TableCell>
              {cols.map((c, ci) => (
                <TableCell key={c.id} sx={{ minWidth: 140 }}>
                  <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                    <TextField
                      size="small"
                      value={c.label}
                      onChange={(e) => setCols((prev) => prev.map((col, i) => (i === ci ? { ...col, label: e.target.value } : col)))}
                      variant="standard"
                      InputProps={{ disableUnderline: true, style: { fontSize: '0.8rem', fontWeight: 700, color: COLORS.blueHeaderText, textAlign: 'center' } }}
                      sx={{ input: { textAlign: 'center' } }}
                    />
                    <IconButton size="small" onClick={() => removeColumn(ci)} sx={{ color: COLORS.blueHeaderText, opacity: 0.6 }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              ))}
              <TableCell sx={{ width: 140, bgcolor: COLORS.orangeHeaderBg, color: COLORS.orangeHeaderText }}>OK / NOT OK</TableCell>
              <TableCell sx={{ width: 240, bgcolor: COLORS.orangeHeaderBg, color: COLORS.orangeHeaderText }}>Remarks & Files</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {/* Cavity Number Row */}


            {params.map((param, pIndex) => (
              <TableRow key={param}>
                <TableCell sx={{ fontWeight: 600, color: COLORS.textSecondary, bgcolor: '#f8fafc' }}>
                  {param}
                </TableCell>
                {cols.map((c, ci) => (
                  <TableCell key={c.id}>
                    <TextField
                      size="small"
                      fullWidth
                      value={values[param]?.[ci] ?? ""}
                      onChange={(e) => updateCell(param, ci, e.target.value)}
                      variant="outlined"
                      sx={{ "& .MuiInputBase-input": { textAlign: 'center', fontFamily: 'Roboto Mono', fontSize: '0.85rem' } }}
                    />
                  </TableCell>
                ))}

                {pIndex === 0 ? (
                  <>
                    <TableCell rowSpan={params.length} sx={{ bgcolor: COLORS.successBg, verticalAlign: "middle", textAlign: 'center' }}>
                      <RadioGroup
                        row
                        sx={{ justifyContent: 'center' }}
                        value={meta["group"]?.ok === null ? "" : String(meta["group"]?.ok)}
                        onChange={(e) => updateMeta("group", { ok: e.target.value === "true" })}
                      >
                        <FormControlLabel value="true" control={<Radio size="small" color="success" />} label={<Typography variant="caption">OK</Typography>} />
                        <FormControlLabel value="false" control={<Radio size="small" color="error" />} label={<Typography variant="caption">NOT OK</Typography>} />
                      </RadioGroup>
                    </TableCell>

                    <TableCell rowSpan={params.length} colSpan={6} sx={{ bgcolor: '#fff7ed', verticalAlign: "top" }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 1 }}>
                        <TextField
                          size="small"
                          fullWidth
                          multiline
                          rows={3}
                          value={meta["group"]?.remarks ?? ""}
                          onChange={(e) => updateMeta("group", { remarks: e.target.value })}
                          placeholder="Enter remarks..."
                          variant="outlined"
                          sx={{ bgcolor: 'white' }}
                        />

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}>
                          <input accept="image/*,application/pdf" style={{ display: 'none' }} id={`micro-group-file`} type="file" onChange={(e) => { const file = e.target.files?.[0] ?? null; updateMeta('group', { attachment: file }); }} />
                          <label htmlFor={`micro-group-file`}>
                            <Button component="span" size="small" variant="outlined" startIcon={<UploadFileIcon />} sx={{ borderColor: COLORS.border, color: COLORS.textSecondary }}>
                              Attach PDF
                            </Button>
                          </label>

                          {meta['group']?.attachment && (
                            <Chip
                              icon={<InsertDriveFileIcon />}
                              label={meta['group']?.attachment?.name}
                              onDelete={() => updateMeta('group', { attachment: null })}
                              size="small"
                              variant="outlined"
                              sx={{ maxWidth: 120 }}
                            />
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                  </>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Button size="small" onClick={addColumn} startIcon={<AddCircleIcon />} sx={{ mt: 1, color: COLORS.secondary }}>Add Column</Button>
    </Box>
  );
}

/* ---------------- Main Component ---------------- */

export default function MetallurgicalInspection() {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement | null>(null);

  const [, setUserName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [userIP, setUserIP] = useState<string>("Loading...");
  const [alert, setAlert] = useState<{ severity: "success" | "error" | "info" | "warning"; message: string } | null>(null);

  // Preview states
  const [previewMode, setPreviewMode] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<any | null>(null);
  const [previewSubmitted, setPreviewSubmitted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchIP = async () => { try { const r = await fetch("https://api.ipify.org?format=json"); const d = await r.json(); setUserIP(d.ip); } catch { setUserIP("Offline"); } };
    fetchIP();
  }, []);

  // Microstructure state
  const [microCols, setMicroCols] = useState<MicroCol[]>([{ id: 'c1', label: 'Value 1' }]);
  const [microValues, setMicroValues] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    MICRO_PARAMS.forEach((p) => { init[p] = ['']; });
    return init;
  });
  const [microMeta, setMicroMeta] = useState<Record<string, { attachment: File | null; ok: boolean | null; remarks: string }>>(() => {
    const init: Record<string, { attachment: File | null; ok: boolean | null; remarks: string }> = {};
    MICRO_PARAMS.forEach((p) => { init[p] = { attachment: null, ok: null, remarks: '' }; });
    init['group'] = { attachment: null, ok: null, remarks: '' };
    return init;
  });

  // Other sections state
  const [mechRows, setMechRows] = useState<Row[]>(initialRows(["Tensile strength", "Yield strength", "Elongation"]));
  const [impactRows, setImpactRows] = useState<Row[]>(initialRows(["Cold Temp °C", "Room Temp °C"]));
  const [hardRows, setHardRows] = useState<Row[]>(initialRows(["Surface", "Core"]));
  const [ndtRows, setNdtRows] = useState<Row[]>(initialRows(["Inspected Qty", "Accepted Qty", "Rejected Qty", "Reason for Rejection"]));

  useEffect(() => { if (alert) { const t = setTimeout(() => setAlert(null), 5000); return () => clearTimeout(t); } }, [alert]);

  const updateRow = (setRows: Dispatch<SetStateAction<Row[]>>) => (id: string, patch: Partial<Row>) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
  };

  const buildPayload = () => {
    const mapRows = (rows: Row[]) => rows.map((r) => ({
      label: r.label,
      value: r.value ?? null,
      ok: r.ok === null ? null : Boolean(r.ok),
      remarks: r.remarks ?? null,
      attachment: fileToMeta(r.attachment),
    }));

    const microRowsPayload = MICRO_PARAMS.map((p) => ({
      label: p,
      values: (microValues[p] || []).map((v) => (v === '' ? null : v)),
      ok: microMeta['group']?.ok ?? null,
      remarks: microMeta['group']?.remarks ?? null,
      attachment: fileToMeta(microMeta['group']?.attachment ?? null),
    }));

    return {
      inspection_date: date || null,
      microRows: microRowsPayload,
      mechRows: mapRows(mechRows),
      impactRows: mapRows(impactRows),
      hardRows: mapRows(hardRows),
      ndtRows: mapRows(ndtRows),
      status: "draft",
    };
  };

  const handleSave = async () => {
    const payload = buildPayload();
    setPreviewPayload(payload);
    setPreviewMode(true);
    setPreviewSubmitted(false);
    setMessage(null);
  };

  const sendToServer = async (payload: any) => {
    // Simulated backend call
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000));
  };

  const handleFinalSave = async () => {
    if (!previewPayload) return;
    try {
      setSending(true);
      await sendToServer(previewPayload);
      setPreviewSubmitted(true);
      setMessage('Inspection data submitted successfully.');
      setAlert({ severity: "success", message: "Inspection saved successfully!" });
    } catch (err: any) {
      setMessage('Failed to submit inspection data');
    } finally {
      setSending(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  /* Preview Components */
  const PreviewSectionTable = ({ title, rows }: { title: string, rows: any[] }) => (
    <Box mt={2} mb={3}>
      <Typography variant="subtitle2" sx={{ bgcolor: '#f1f5f9', p: 1, borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        {title}
      </Typography>
      <Table size="small" sx={{ border: '1px solid #e2e8f0' }}>
        <TableHead>
          <TableRow sx={{ bgcolor: '#f8fafc' }}>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Parameter</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Value</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', width: 80 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Remarks</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              <TableCell sx={{ fontSize: '0.8rem' }}>{r.label}</TableCell>
              <TableCell sx={{ fontSize: '0.8rem', fontFamily: 'Roboto Mono' }}>{r.value || '-'}</TableCell>
              <TableCell sx={{ fontSize: '0.8rem' }}>
                {r.ok === true ? <Chip label="OK" color="success" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} /> :
                  r.ok === false ? <Chip label="NOT OK" color="error" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} /> : '-'}
              </TableCell>
              <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{r.remarks || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );

  const PreviewMicroTable = ({ data }: { data: any[] }) => {
    const maxCols = Math.max(...data.map(d => d.values?.length || 0), 1);

    return (
      <Box mt={2} mb={3}>
        <Typography variant="subtitle2" sx={{ bgcolor: '#eff6ff', color: '#3b82f6', p: 1, borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          MICROSTRUCTURE EXAMINATION
        </Typography>
        <Table size="small" sx={{ border: '1px solid #e2e8f0' }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Parameter</TableCell>
              {Array.from({ length: maxCols }).map((_, i) => (
                <TableCell key={i} sx={{ fontWeight: 600, fontSize: '0.75rem', textAlign: 'center' }}>Value {i + 1}</TableCell>
              ))}
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', width: 80 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Remarks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((r, i) => (
              <TableRow key={i}>
                <TableCell sx={{ fontSize: '0.8rem' }}>{r.label}</TableCell>
                {Array.from({ length: maxCols }).map((_, idx) => (
                  <TableCell key={idx} sx={{ fontSize: '0.8rem', fontFamily: 'Roboto Mono', textAlign: 'center' }}>
                    {r.values?.[idx] || '-'}
                  </TableCell>
                ))}
                <TableCell sx={{ fontSize: '0.8rem' }}>
                  {r.ok === true ? <span style={{ color: 'green', fontWeight: 'bold' }}>OK</span> :
                    r.ok === false ? <span style={{ color: 'red', fontWeight: 'bold' }}>NOT OKK</span> : '-'}
                </TableCell>
                <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{r.remarks || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    );
  };

  // Helper for print (no material styles, plain HTML table)
  const PrintSectionTable = ({ title, rows }: { title: string, rows: any[] }) => (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontWeight: 'bold', borderBottom: '1px solid #ccc', marginBottom: '5px' }}>{title}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', fontSize: '12px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={{ border: '1px solid black', padding: '5px', textAlign: 'left' }}>Parameter</th>
            <th style={{ border: '1px solid black', padding: '5px', textAlign: 'left' }}>Value</th>
            <th style={{ border: '1px solid black', padding: '5px', textAlign: 'center', width: '50px' }}>Status</th>
            <th style={{ border: '1px solid black', padding: '5px', textAlign: 'left' }}>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ border: '1px solid black', padding: '5px' }}>{r.label}</td>
              <td style={{ border: '1px solid black', padding: '5px' }}>{r.value || '-'}</td>
              <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>
                {r.ok === true ? 'OK' : r.ok === false ? 'NOT OK' : '-'}
              </td>
              <td style={{ border: '1px solid black', padding: '5px' }}>{r.remarks || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const PrintMicroTable = ({ data }: { data: any[] }) => {
    const maxCols = Math.max(...data.map(d => d.values?.length || 0), 1);
    return (
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontWeight: 'bold', borderBottom: '1px solid #ccc', marginBottom: '5px' }}>MICROSTRUCTURE EXAMINATION</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ border: '1px solid black', padding: '5px', textAlign: 'left' }}>Parameter</th>
              {Array.from({ length: maxCols }).map((_, i) => (
                <th key={i} style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>Value {i + 1}</th>
              ))}
              <th style={{ border: '1px solid black', padding: '5px', textAlign: 'center', width: '50px' }}>Status</th>
              <th style={{ border: '1px solid black', padding: '5px', textAlign: 'left' }}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={i}>
                <td style={{ border: '1px solid black', padding: '5px' }}>{r.label}</td>
                {Array.from({ length: maxCols }).map((_, idx) => (
                  <td key={idx} style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>{r.values?.[idx] || '-'}</td>
                ))}
                <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>
                  {r.ok === true ? 'OK' : r.ok === false ? 'NOT OK' : '-'}
                </td>
                <td style={{ border: '1px solid black', padding: '5px' }}>{r.remarks || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <ThemeProvider theme={theme}>
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
          <HeaderSection title="METALLURGICAL INSPECTION" userIP={userIP} />

          <Paper sx={{ p: { xs: 2, md: 4 }, overflow: 'hidden' }}>

            {/* Input Controls */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="flex-end"
              mb={1}        // reduced bottom space
              flexWrap="wrap"
              gap={2}
            >
              <Box />

              <Box display="flex" gap={2}>
                <TextField
                  size="small"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  sx={{ width: 160 }}
                />
              </Box>
            </Box>

            {alert && <Alert severity={alert.severity} sx={{ mb: 2 }}>{alert.message}</Alert>}

            {/* Tables */}
            <MicrostructureTable
              params={MICRO_PARAMS}
              cols={microCols}
              values={microValues}
              meta={microMeta}
              setCols={setMicroCols}
              setValues={setMicroValues}
              setMeta={setMicroMeta}
            />

            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <SectionTable title="MECHANICAL PROPERTIES" rows={mechRows} onChange={updateRow(setMechRows)} />
                <SectionTable title="IMPACT STRENGTH" rows={impactRows} onChange={updateRow(setImpactRows)} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <SectionTable title="HARDNESS" rows={hardRows} onChange={updateRow(setHardRows)} />
                <SectionTable title="NDT INSPECTION ANALYSIS" rows={ndtRows} onChange={updateRow(setNdtRows)} />
              </Grid>
            </Grid>

            {/* Actions */}
            <Box display="flex" justifyContent="flex-end" gap={2} mt={4} pt={2} borderTop={`1px solid ${COLORS.border}`}>
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
                sx={{ borderColor: COLORS.border, color: COLORS.textSecondary }}
              >
                Reset Form
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={loading}
                startIcon={<SaveIcon />}
                sx={{ bgcolor: COLORS.secondary, '&:hover': { bgcolor: COLORS.orangeHeaderText } }}
              >
                Save & Continue
              </Button>
            </Box>

          </Paper>

          {/* Preview Overlay */}
          {previewMode && previewPayload && (
            <Box
              sx={{
                position: 'fixed', inset: 0, zIndex: 1300,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(4px)',
                p: 2
              }}
            >
              <Paper
                sx={{
                  width: '100%', maxWidth: 1000, maxHeight: '90vh', overflow: 'hidden',
                  display: 'flex', flexDirection: 'column', borderRadius: 3
                }}
              >
                <Box sx={{ p: 2, px: 3, borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: 'white' }}>
                  <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>Verify Inspection Data</Typography>
                  <IconButton size="small" onClick={() => navigate('/visual-inspection')} sx={{ color: '#ef4444' }}>
                    <CloseIcon />
                  </IconButton>
                </Box>

                <Box sx={{ p: 4, overflowY: 'auto', bgcolor: COLORS.background }} ref={printRef}>
                  <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" sx={{ textTransform: 'uppercase' }}>Metallurgical Inspection Report</Typography>
                      <Typography variant="body2" color="textSecondary">Date: {previewPayload.inspection_date}</Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />

                    {/* Render ALL sections */}
                    <PreviewMicroTable data={previewPayload.microRows} />
                    <PreviewSectionTable title="MECHANICAL PROPERTIES" rows={previewPayload.mechRows} />
                    {/* <PreviewSectionTable title="IMPACT STRENGTH" rows={previewPayload.impactRows} /> */}
                    <PreviewSectionTable title="HARDNESS" rows={previewPayload.hardRows} />
                    <PreviewSectionTable title="NDT INSPECTION ANALYSIS" rows={previewPayload.ndtRows} />
                  </Box>

                  {message && (
                    <Alert severity={previewSubmitted ? "success" : "info"} sx={{ mt: 2 }}>{message}</Alert>
                  )}
                </Box>

                <Box sx={{ p: 2, px: 3, borderTop: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "flex-end", gap: 2, bgcolor: 'white' }}>
                  <Button variant="outlined" onClick={() => setPreviewMode(false)} disabled={sending || previewSubmitted}>
                    Back to Edit
                  </Button>
                  {previewSubmitted ? (
                    <Button variant="contained" onClick={handleExportPDF} startIcon={<PrintIcon />} sx={{ bgcolor: COLORS.primary }}>
                      Print / Save as PDF
                    </Button>
                  ) : (
                    <Button variant="contained" onClick={handleFinalSave} disabled={sending} sx={{ bgcolor: COLORS.secondary }}>
                      {sending ? 'Saving...' : 'Confirm & Submit'}
                    </Button>
                  )}
                </Box>
              </Paper>
            </Box>
          )}

          {/* Hidden Print Section */}
          <Box className="print-section" sx={{ display: 'none' }}>
            <Box sx={{ mb: 3, borderBottom: "2px solid black", pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0 }}>METALLURGICAL INSPECTION REPORT</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2">Date: {date}</Typography>
              </Box>
            </Box>

            {/* Render Print-specific tables */}
            {previewPayload && (
              <>
                <PrintMicroTable data={previewPayload.microRows} />
                <PrintSectionTable title="MECHANICAL PROPERTIES" rows={previewPayload.mechRows} />
                {/* <PrintSectionTable title="IMPACT STRENGTH" rows={previewPayload.impactRows} /> */}
                <PrintSectionTable title="HARDNESS" rows={previewPayload.hardRows} />
                <PrintSectionTable title="NDT INSPECTION ANALYSIS" rows={previewPayload.ndtRows} />
              </>
            )}
          </Box>

        </Container>
      </Box>
    </ThemeProvider>
  );
}