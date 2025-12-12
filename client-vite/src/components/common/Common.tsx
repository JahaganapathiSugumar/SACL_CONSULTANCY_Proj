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
  Container,
} from "@mui/material";
import {COLORS, appTheme} from "../../theme/appTheme";
import RefreshIcon from '@mui/icons-material/Refresh';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import ConstructionIcon from '@mui/icons-material/Construction';
import FactoryIcon from '@mui/icons-material/Factory';
import PersonIcon from "@mui/icons-material/Person";
import { trialService } from "../../services/trialService";

type MouldCorrection = {
  compressibility?: string;
  squeeze_pressure?: string;
  filler_size?: string
};

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

const Common: React.FC<CommonProps> = ({ trialId: initialTrialId = "" }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrialData | null>(null);
  const [userIP, setUserIP] = useState<string>("");

  useEffect(() => {
    const fetchIP = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const ipData = await response.json();
        setUserIP(ipData.ip);
      } catch {
        setUserIP('N/A');
      }
    };
    fetchIP();
  }, []);

  const fetchTrial = async (id: string) => {
    if (!id) {
      setError("Please provide a Trial ID");
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const trial = await trialService.getTrialByTrialId(id);
      if (trial) {
        setData(trial);
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
  }, [initialTrialId]);

  return (
    <ThemeProvider theme={appTheme}>
      <Box sx={{ minHeight: "100vh", bgcolor: COLORS.background, py: { xs: 2, md: 4 }, px: { xs: 1, sm: 3 } }}>
        <Container maxWidth="xl" disableGutters>

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
                  TRIAL DETAILS VIEWER
                </Typography>
                <Typography variant="subtitle2" sx={{ color: COLORS.textSecondary }}>
                  Part Identification & Sampling Information
                </Typography>
              </Box>
            </Box>
            <Box display="flex" gap={2} alignItems="center" width={{ xs: "100%", md: "auto" }} justifyContent="space-between">
              <Chip label={userIP} size="small" variant="outlined" />
              <Chip label="USER NAME" color="warning" size="small" icon={<PersonIcon />} />
            </Box>
          </Paper>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 10 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* Trial ID Section */}
              <Grid item xs={12}>
                <Card elevation={0} sx={{ border: `1px solid ${COLORS.border}` }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <SectionHeader icon={<PrecisionManufacturingIcon />} title="Trial Reference" color={COLORS.primary} />
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => fetchTrial(initialTrialId)}
                        disabled={!initialTrialId || loading}
                        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
                        sx={{ bgcolor: COLORS.secondary }}
                      >
                        Refresh
                      </Button>
                    </Box>
                    <TextField
                      fullWidth
                      value={initialTrialId || 'No Trial ID'}
                      InputProps={{
                        readOnly: true,
                        sx: { bgcolor: "#f1f5f9", fontWeight: 700, color: COLORS.primary, fontSize: '1.1rem' }
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              {error && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: '#fee2e2', border: '1px solid #dc2626' }}>
                    <Typography sx={{ color: '#dc2626', fontWeight: 600 }}>⚠️ {error}</Typography>
                  </Paper>
                </Grid>
              )}

              {data && (
                <>
                  {/* Part Identification */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: { xs: 2, md: 3 } }}>
                      <SectionHeader icon={<ConstructionIcon />} title="Part Identification" color={COLORS.accentBlue} />
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary }}>PATTERN CODE</Typography>
                          <TextField fullWidth size="small" value={data.pattern_code || ''} disabled />
                        </Grid>
                        <Grid item xs={12} sm={6} md={5}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary }}>COMPONENT NAME</Typography>
                          <TextField fullWidth size="small" value={data.part_name || ''} disabled />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary }}>MATERIAL GRADE</Typography>
                          <TextField fullWidth size="small" value={data.material_grade || ''} disabled />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Sampling Details */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: { xs: 2, md: 3 } }}>
                      <SectionHeader icon={<PrecisionManufacturingIcon />} title="Sampling Details" color={COLORS.secondary} />
                      <Box sx={{ overflowX: "auto", width: "100%", pb: 1 }}>
                        <Table size="small" sx={{ minWidth: 900 }}>
                          <TableHead>
                            <TableRow>
                              <TableCell align="center">Date of Sampling</TableCell>
                              <TableCell align="center">No. of Moulds</TableCell>
                              <TableCell align="center">DISA / Machine</TableCell>
                              <TableCell align="center">Reason For Sampling</TableCell>
                              <TableCell align="center">Sample Traceability</TableCell>
                              <TableCell align="center">Initiated By</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow>
                              <TableCell align="center">{data.date_of_sampling || '-'}</TableCell>
                              <TableCell align="center">{data.no_of_moulds || '-'}</TableCell>
                              <TableCell align="center">{data.disa || '-'}</TableCell>
                              <TableCell align="center">{data.reason_for_sampling || '-'}</TableCell>
                              <TableCell align="center">{data.sample_traceability || '-'}</TableCell>
                              <TableCell align="center">{data.initiated_by || '-'}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Tooling Modification & Remarks */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: { xs: 2, md: 3 } }}>
                      <SectionHeader icon={<ConstructionIcon />} title="Tooling Modification & Remarks" color={COLORS.accentGreen} />
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary }}>TOOLING MODIFICATION</Typography>
                          <TextField fullWidth size="small" value={data.tooling_modification || ''} disabled multiline rows={2} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary }}>REMARKS</Typography>
                          <TextField fullWidth size="small" value={data.remarks || ''} disabled multiline rows={2} />
                        </Grid>
                      </Grid>

                      {/* Tooling Files */}
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary }}>TOOLING FILES</Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {(data.tooling_files || []).length > 0 ? (
                            (data.tooling_files || []).map((f, i) => (
                              <Chip key={i} label={f.name} size="small" sx={{ bgcolor: COLORS.accentBlue + "20" }} />
                            ))
                          ) : (
                            <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontStyle: 'italic' }}>
                              No tooling files attached
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Mould Corrections */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: { xs: 2, md: 3 } }}>
                      <SectionHeader icon={<PrecisionManufacturingIcon />} title="Mould Corrections" color={COLORS.primary} />
                      <Box sx={{ overflowX: "auto", width: "100%", pb: 1 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell align="center">Compressibility</TableCell>
                              <TableCell align="center">Squeeze Pressure</TableCell>
                              <TableCell align="center">Filler Size</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(data.mould_correction || []).length > 0 ? (
                              (data.mould_correction || []).map((r, i) => (
                                <TableRow key={i}>
                                  <TableCell align="center">{r.compressibility || '-'}</TableCell>
                                  <TableCell align="center">{r.squeeze_pressure || '-'}</TableCell>
                                  <TableCell align="center">{r.filler_size || '-'}</TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={3} align="center" sx={{ color: COLORS.textSecondary, py: 2, fontStyle: 'italic' }}>
                                  No mould correction data available
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </Box>
                    </Paper>
                  </Grid>
                </>
              )}

              {!data && !loading && !error && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 6, textAlign: 'center' }}>
                    <PrecisionManufacturingIcon sx={{ fontSize: 80, color: COLORS.border, mb: 2 }} />
                    <Typography variant="h6" sx={{ color: COLORS.textSecondary, fontWeight: 600, mb: 1 }}>
                      No Trial Data Loaded
                    </Typography>
                    <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                      Provide a valid Trial ID to load details
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Common;