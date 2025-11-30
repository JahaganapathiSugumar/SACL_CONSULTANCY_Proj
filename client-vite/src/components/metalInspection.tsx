import { useEffect, useState } from "react";
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
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteIcon from "@mui/icons-material/Delete";

// ----------------------
// IMPORT POPPINS FONTS
// ----------------------
import "@fontsource/poppins/400.css"; // Regular
import "@fontsource/poppins/500.css"; // Medium
import "@fontsource/poppins/700.css"; // Bold

// ----------------------
// MUI THEME WITH POPPINS
// ----------------------
const theme = createTheme({
  typography: {
    fontFamily: "Poppins, sans-serif",

    h6: {
      fontFamily: "Poppins, sans-serif",
      fontWeight: 700, // BOLD for heading
    },

    subtitle1: {
      fontFamily: "Poppins, sans-serif",
      fontWeight: 500, // MEDIUM for section titles + labels
    },

    body1: {
      fontFamily: "Poppins, sans-serif",
      fontWeight: 400, // REGULAR for content
    },

    body2: {
      fontFamily: "Poppins, sans-serif",
      fontWeight: 400, // REGULAR for small text
    },
  },

  palette: {
    primary: { main: "#ff9800" }, // orange
    secondary: { main: "#9e9e9e" }, // grey
    background: { default: "#f3f4f6" }, // light grey page bg
  },

  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          padding: 12,
        },
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiInputBase-input": {
            fontFamily: "Poppins, sans-serif !important",
            fontWeight: 400, // REGULAR for input values
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          fontFamily: "Poppins, sans-serif",
          fontWeight: 500, // MEDIUM for table headings + labels
        },
      },
    },
  },
});

// -------------------------------------
// INTERFACE + INITIAL ROWS FUNCTION
// -------------------------------------
interface Row {
  id: string;
  label: string;
  attachment: File | null;
  ok: boolean | null;
  remarks: string;
  value?: string;
}

const initialRows = (labels: string[]): Row[] =>
  labels.map((label, i) => ({
    id: `${label}-${i}`,
    label,
    attachment: null,
    ok: null,
    remarks: "",
  }));

// -------------------------------------
// SECTION TABLE COMPONENT
// -------------------------------------
function SectionTable({
  title,
  rows,
  onChange,
}: {
  title: string;
  rows: Row[];
  onChange: (id: string, patch: Partial<Row>) => void;
}) {
  return (
    <Box mb={2}>
      <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
        {title}
      </Typography>

      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 220 }}>Parameter</TableCell>
              <TableCell>Value / Notes</TableCell>
              <TableCell sx={{ width: 160 }}>Attach</TableCell>
              <TableCell sx={{ width: 140 }}>OK</TableCell>
              <TableCell sx={{ width: 240 }}>Remarks</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((r: Row) => (
              <TableRow key={r.id}>
                <TableCell>{r.label}</TableCell>

                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    value={r.value || ""}
                    onChange={(e) => onChange(r.id, { value: e.target.value })}
                    placeholder="Enter value"
                  />
                </TableCell>

                <TableCell>
                  <input
                    accept="image/*,application/pdf"
                    style={{ display: "none" }}
                    id={`file-${r.id}`}
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      onChange(r.id, { attachment: file });
                    }}
                  />

                  <label htmlFor={`file-${r.id}`}>
                    <Button
                      component="span"
                      variant="contained"
                      size="small"
                      startIcon={<UploadFileIcon />}
                      color="primary"
                    >
                      Attach
                    </Button>
                  </label>

                  {r.attachment ? (
                    <Box mt={1} display="flex" alignItems="center" gap={1}>
                      <InsertDriveFileIcon fontSize="small" />
                      <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                        {r.attachment.name}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => onChange(r.id, { attachment: null })}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                      No file
                    </Typography>
                  )}
                </TableCell>

                <TableCell>
                  <RadioGroup
                    row
                    value={r.ok === null ? "" : String(r.ok)}
                    onChange={(e) => onChange(r.id, { ok: e.target.value === "true" })}
                  >
                    <FormControlLabel value="true" control={<Radio />} label="OK" />
                    <FormControlLabel value="false" control={<Radio />} label="NOT OK" />
                  </RadioGroup>
                </TableCell>

                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    value={r.remarks}
                    onChange={(e) => onChange(r.id, { remarks: e.target.value })}
                    placeholder="Remarks"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

// ---------------------------
// MAIN COMPONENT
// ---------------------------
export default function MetallurgicalInspection() {
  const [, setUserName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<
    | { severity: "success" | "error" | "info" | "warning"; message: string }
    | null
  >(null);

  // Sections
  const [microRows, setMicroRows] = useState<Row[]>(
    initialRows(["Cavity number", "Nodularity", "Matrix", "Carbide", "Inclusion"])
  );
  const [mechRows, setMechRows] = useState<Row[]>(
    initialRows(["Tensile strength", "Yield strength", "Elongation"])
  );
  const [impactRows, setImpactRows] = useState<Row[]>(
    initialRows(["Impact strength", "Cold Temp °C", "Room Temp °C"])
  );
  const [hardRows, setHardRows] = useState<Row[]>(initialRows(["Surface", "Core"]));
  const [ndtRows, setNdtRows] = useState<Row[]>(
    initialRows(["Cavity number", "Insp Qty", "Accp Qty", "Rej Qty", "Reason for Rej"])
  );

  useEffect(() => {
    if (alert) {
      const t = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(t);
    }
  }, [alert]);

  const updateRow =
    (setRows: Dispatch<SetStateAction<Row[]>>) =>
    (id: string, patch: Partial<Row>) => {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    };

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 1000));
      setAlert({ severity: "success", message: "Inspection saved successfully." });
    } catch (err) {
      setAlert({ severity: "error", message: "Failed saving inspection." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: 3 }}>
        <Paper elevation={2}>
          <Box flex={1} p={2}>

            {/* Heading */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">METALLURGICAL INSPECTION</Typography>

              <Box display="flex" gap={2}>
                <Autocomplete
                  freeSolo
                  options={["Inspector A", "Inspector B", "Lab User"]}
                  onChange={(_, v) => setUserName(v || "")}
                  renderInput={(params) => (
                    <TextField {...params} size="small" label="User Name" />
                  )}
                  sx={{ width: 220 }}
                />

                <TextField
                  size="small"
                  label="Date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>
            </Box>

            {alert && (
              <Alert severity={alert.severity} sx={{ mb: 2 }}>
                {alert.message}
              </Alert>
            )}

            {/* Tables */}
            <SectionTable
              title="Microstructure Examination Result"
              rows={microRows}
              onChange={updateRow(setMicroRows)}
            />
            <SectionTable
              title="Mechanical Properties"
              rows={mechRows}
              onChange={updateRow(setMechRows)}
            />
            <SectionTable
              title="Impact strength"
              rows={impactRows}
              onChange={updateRow(setImpactRows)}
            />
            <SectionTable
              title="Hardness"
              rows={hardRows}
              onChange={updateRow(setHardRows)}
            />
            <SectionTable
              title="NDT Inspection Analysis"
              rows={ndtRows}
              onChange={updateRow(setNdtRows)}
            />

            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button variant="outlined" sx={{ mr: 1 }}>
                Reset
              </Button>

              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? <CircularProgress size={18} /> : "Save & Continue"}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}