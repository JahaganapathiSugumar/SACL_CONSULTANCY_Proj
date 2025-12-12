import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import ConstructionIcon from '@mui/icons-material/Construction';

type MouldCorrection = { compressibility?: string; squeeze_pressure?: string; filler_size?: string };

type TrialData = {
  trial_id?: string;
  part_name?: string;
  pattern_code?: string;
  material_grade?: string;
  initiated_by?: string;
  date_of_sampling?: string;
  no_of_moulds?: number;
  reason_for_sampling?: string;
  status?: string;
  tooling_modification?: string;
  remarks?: string;
  current_department_id?: number;
  disa?: string;
  sample_traceability?: string;
  mould_correction?: MouldCorrection[];
  tooling_files?: { name: string }[];
};

const COLORS = {
  primary: "#1e293b",
  secondary: "#ea580c",
  background: "#f8fafc",
  surface: "#ffffff",
  border: "#e2e8f0",
  textPrimary: "#0f172a",
  textSecondary: "#64748b",
  accentBlue: "#0ea5e9",
  accentGreen: "#10b981",
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
});

const SectionHeader = ({ icon, title, color }: { icon: React.ReactNode; title: string; color: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, pb: 1, borderBottom: `2px solid ${color}`, width: '100%' }}>
    <Box sx={{ color: color, display: "flex" }}>{icon}</Box>
    <Typography variant="subtitle2" sx={{ color: COLORS.primary, flexGrow: 1 }}>
      {title}
    </Typography>
  </Box>
);

interface CommonProps {
  trialId?: string;
}

/**
 * Common - updated UI (card style similar to FoundrySampleCard1)
 * - uses prop trialId for fetching (no input field)
 */
const Common: React.FC<CommonProps> = ({ trialId: initialTrialId = "" }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrialData | null>(null);

  const fetchTrial = async (id: string) => {
    if (!id) {
      setError("Please provide a Trial ID");
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`http://localhost:3000/api/trial/trial_id?trial_id=${encodeURIComponent(id)}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();
      console.log("Fetched trial data:", json);
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setData(json.data[0]);
      } else {
        setData(null);
        setError('No trial found');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch trial');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTrialId) {
      fetchTrial(initialTrialId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTrialId]);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: COLORS.background, minHeight: "100vh" }}>

        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
          <Card elevation={4} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: COLORS.primary, color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PrecisionManufacturingIcon sx={{ fontSize: 32, color: 'white' }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>PART IDENTIFICATION & TRIAL DETAILS</Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Box sx={{ bgcolor: 'white', color: COLORS.textPrimary, px: 2, py: 0.5, borderRadius: 1, minWidth: 220, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {initialTrialId || 'No Trial ID'}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  size="medium"
                  onClick={() => fetchTrial(initialTrialId)}
                  disabled={!initialTrialId || loading}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
                  sx={{
                    bgcolor: COLORS.secondary,
                    color: 'white',
                    fontWeight: 700,
                    px: 3,
                    '&:hover': { bgcolor: '#c2410c' },
                  }}
                >
                  {loading ? 'Loading' : 'Refresh'}
                </Button>
              </Box>
            </Box>

            <CardContent sx={{ p: 3 }}>
              {error && (
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ color: '#dc2626', fontWeight: 700 }}>⚠️ {error}</Typography>
                </Box>
              )}

              {!data && !loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 6 }}>
                  <PrecisionManufacturingIcon sx={{ fontSize: 80, color: COLORS.border }} />
                  <Typography variant="h6" sx={{ color: COLORS.textSecondary, fontWeight: 600 }}>
                    No Trial Data Loaded
                  </Typography>
                  <Typography variant="body2" sx={{ color: COLORS.textSecondary, textAlign: 'center', maxWidth: 560 }}>
                    This component uses the trialId prop. Provide a trialId to load details.
                  </Typography>
                </Box>
              ) : loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress size={48} sx={{ color: COLORS.secondary }} />
                </Box>
              ) : data ? (
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label="Trial data loaded"
                      sx={{
                        bgcolor: COLORS.accentGreen + "20",
                        color: COLORS.primary,
                        border: `1px dashed ${COLORS.accentGreen}`,
                        fontWeight: 600,
                      }}
                    />
                  </Box>

                  <Paper variant="outlined" sx={{ mb: 3, p: 2, border: `1px solid ${COLORS.border}` }}>
                    <SectionHeader icon={<ConstructionIcon />} title="Part Identification" color={COLORS.accentBlue} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Pattern Code</Typography>
                        <TextField fullWidth size="small" value={data.pattern_code || ''} disabled />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Component Name</Typography>
                        <TextField fullWidth size="small" value={data.part_name || ''} disabled />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Trial Reference</Typography>
                        <TextField fullWidth size="small" value={data.trial_id || ''} disabled />
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Material Grade</Typography>
                        <TextField fullWidth size="small" value={data.material_grade || ''} disabled />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Initiated By</Typography>
                        <TextField fullWidth size="small" value={data.initiated_by || ''} disabled />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Date of Sampling</Typography>
                        <TextField fullWidth size="small" value={data.date_of_sampling || ''} disabled />
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>No. of Moulds</Typography>
                        <TextField fullWidth size="small" value={String(data.no_of_moulds ?? '')} disabled />
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Reason for Sampling</Typography>
                        <TextField fullWidth size="small" value={data.reason_for_sampling || ''} disabled multiline rows={2} />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Tooling Modification</Typography>
                        <TextField fullWidth size="small" value={data.tooling_modification || ''} disabled />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Sample Traceability</Typography>
                        <TextField fullWidth size="small" value={data.sample_traceability || ''} disabled />
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="caption" sx={{ color: COLORS.textSecondary, fontWeight: 700 }}>Remarks</Typography>
                        <TextField fullWidth size="small" multiline rows={3} value={data.remarks || ''} disabled />
                      </Grid>
                    </Grid>
                  </Paper>

                  <Paper variant="outlined" sx={{ mb: 3, p: 2, border: `1px solid ${COLORS.border}` }}>
                    <SectionHeader icon={<PrecisionManufacturingIcon />} title="Mould Correction" color={COLORS.accentGreen} />
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Compressibility</TableCell>
                          <TableCell>Squeeze Pressure</TableCell>
                          <TableCell>Filler Size</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(data.mould_correction || []).length > 0 ? (
                          (data.mould_correction || []).map((r, i) => (
                            <TableRow key={i}>
                              <TableCell>{r.compressibility || '-'}</TableCell>
                              <TableCell>{r.squeeze_pressure || '-'}</TableCell>
                              <TableCell>{r.filler_size || '-'}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align="center" sx={{ color: COLORS.textSecondary, py: 2 }}>
                              No mould correction data available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2, border: `1px solid ${COLORS.border}` }}>
                    <SectionHeader icon={<ConstructionIcon />} title="Tooling Files" color={COLORS.accentBlue} />
                    <Box>
                      {(data.tooling_files || []).length > 0 ? (
                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                          {(data.tooling_files || []).map((f, i) => (
                            <Chip key={i} label={f.name} sx={{ bgcolor: COLORS.accentBlue + "20" }} />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>No tooling files attached</Typography>
                      )}
                    </Box>
                  </Paper>
                </Box>
              ) : null}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Common;