import React, { useEffect, useState } from "react";
import {
  Box,
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
  Container,
  Alert,
} from "@mui/material";
import { COLORS, appTheme } from "../../theme/appTheme";
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import ConstructionIcon from '@mui/icons-material/Construction';
import ScienceIcon from '@mui/icons-material/Science';
import EditIcon from '@mui/icons-material/Edit';
import FactoryIcon from '@mui/icons-material/Factory';
import PersonIcon from "@mui/icons-material/Person";
import { trialService } from "../../services/trialService";

// Helper component for consistent input styling
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

type MouldCorrection = {
  compressibility?: string;
  squeezePressure?: string;
  fillerSize?: string;
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
  pattern_data_sheet_files?: { name: string }[];
  chemical_composition?: any;
  micro_structure?: any;
  tensile?: any;
  hardness?: any;
  xray?: string;
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
        // Parse JSON fields if they are strings
        const parsedTrial = { ...trial };
        ['chemical_composition', 'micro_structure', 'tensile', 'hardness', 'mould_correction'].forEach(key => {
          if (typeof parsedTrial[key] === 'string') {
            try {
              parsedTrial[key] = JSON.parse(parsedTrial[key]);
            } catch (e) {
              console.error(`Failed to parse ${key}`, e);
            }
          }
        });
        setData(parsedTrial);
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

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
              <CircularProgress size={60} />
            </Box>
          ) : (
            <>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* Part Identification */}
                <Grid size={12}>
                  <Card elevation={0} sx={{ border: `1px solid ${COLORS.border}` }}>
                    <CardContent>
                      <SectionHeader icon={<PrecisionManufacturingIcon />} title="Part Identification" color={COLORS.primary} />
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary }}>PATTERN CODE</Typography>
                          <TextField
                            fullWidth
                            value={data?.pattern_code || ''}
                            InputProps={{ readOnly: true, sx: { bgcolor: "#f8fafc" } }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary }}>COMPONENT NAME</Typography>
                          <TextField
                            fullWidth
                            value={data?.part_name || ''}
                            InputProps={{ readOnly: true, sx: { bgcolor: "#f8fafc" } }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary }}>TRIAL REFERENCE</Typography>
                          <TextField
                            fullWidth
                            value={initialTrialId || 'No Trial ID'}
                            InputProps={{
                              readOnly: true,
                              sx: { bgcolor: "#f1f5f9", fontWeight: 700, color: COLORS.primary }
                            }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {data && (
                <>
                  {/* Sampling Details Table */}
                  <Paper sx={{ overflowX: "auto", p: 2, mb: 3 }}>
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
                            <TableCell
                              key={head}
                              align="center"
                              sx={{
                                backgroundColor: '#f1f5f9',
                                color: 'black',
                                fontWeight: 600,
                                borderBottom: `1px solid ${COLORS.headerBg}`
                              }}
                            >
                              {head}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell align="center">
                            <TextField
                              fullWidth
                              size="small"
                              value={data.date_of_sampling || '-'}
                              InputProps={{ readOnly: true, sx: { textAlign: 'center' } }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              fullWidth
                              size="small"
                              value={data.no_of_moulds || '-'}
                              InputProps={{ readOnly: true, sx: { textAlign: 'center' } }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              fullWidth
                              size="small"
                              value={data.disa || '-'}
                              InputProps={{ readOnly: true, sx: { textAlign: 'center' } }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              fullWidth
                              size="small"
                              value={data.reason_for_sampling || '-'}
                              InputProps={{ readOnly: true, sx: { textAlign: 'center' } }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              fullWidth
                              size="small"
                              value={data.sample_traceability || '-'}
                              InputProps={{ readOnly: true, sx: { textAlign: 'center' } }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                              {(data.pattern_data_sheet_files || []).length > 0 ? (
                                (data.pattern_data_sheet_files || []).map((f, i) => (
                                  <Chip key={i} label={f.name} size="small" />
                                ))
                              ) : (
                                <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontStyle: 'italic' }}>
                                  No files
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Paper>

                  {/* Tooling Modification */}
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <SectionHeader
                      icon={<ConstructionIcon />}
                      title="Tooling Modification Done"
                      color={COLORS.secondary}
                    />
                    <Grid container spacing={3}>
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary, display: 'block', mb: 1 }}>
                          Tooling Modification
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          variant="outlined"
                          value={data.tooling_modification || '-'}
                          InputProps={{ readOnly: true, sx: { bgcolor: '#f8fafc' } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: COLORS.textSecondary, display: 'block', mb: 1 }}>
                          Tooling Files
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', p: 2, border: `1px solid ${COLORS.border}`, borderRadius: 1, bgcolor: '#f8fafc', minHeight: 100 }}>
                          {(data.tooling_files || []).length > 0 ? (
                            (data.tooling_files || []).map((f, i) => (
                              <Chip key={i} label={f.name} size="small" />
                            ))
                          ) : (
                            <Typography variant="body2" sx={{ color: COLORS.textSecondary, fontStyle: 'italic' }}>
                              No files attached
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Mould Correction Details */}
                  <Paper sx={{ p: 3, overflowX: "auto", mb: 3 }}>
                    <SectionHeader icon={<EditIcon />} title="Mould Correction Details" color={COLORS.primary} />
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {["Compressibility", "Squeeze Pressure", "Filler Size"].map(h => (
                            <TableCell
                              key={h}
                              align="center"
                              sx={{
                                backgroundColor: '#f1f5f9',
                                color: 'black',
                                fontWeight: 600,
                                borderBottom: `1px solid ${COLORS.headerBg}`
                              }}
                            >
                              {h}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(data.mould_correction || []).length > 0 ? (
                          (data.mould_correction || []).map((row, i) => (
                            <TableRow key={i}>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={row.compressibility || '-'}
                                  InputProps={{ readOnly: true, sx: { textAlign: 'center' } }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={row.squeezePressure || '-'}
                                  InputProps={{ readOnly: true, sx: { textAlign: 'center' } }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={row.fillerSize || '-'}
                                  InputProps={{ readOnly: true, sx: { textAlign: 'center' } }}
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align="center" sx={{ color: COLORS.textSecondary, py: 3, fontStyle: 'italic' }}>
                              No mould correction data available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Paper>

                  {/* Remarks */}
                  <Paper sx={{ p: 3, mb: 3 }}>
                    <SectionHeader icon={<EditIcon />} title="Remarks" color={COLORS.primary} />
                    <TextField
                      multiline
                      rows={3}
                      fullWidth
                      variant="outlined"
                      value={data.remarks || '-'}
                      InputProps={{ readOnly: true, sx: { bgcolor: '#f8fafc' } }}
                    />
                  </Paper>
                </>
              )}

              {!data && !loading && (
                <Paper sx={{ p: 6, textAlign: 'center', mt: 3 }}>
                  <PrecisionManufacturingIcon sx={{ fontSize: 80, color: COLORS.border, mb: 2 }} />
                  <Typography variant="h6" sx={{ color: COLORS.textSecondary, fontWeight: 600, mb: 1 }}>
                    No Trial Data Loaded
                  </Typography>
                  <Typography variant="body2" sx={{ color: COLORS.textSecondary }}>
                    Provide a valid Trial ID to load details
                  </Typography>
                </Paper>
              )}
            </>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Common;