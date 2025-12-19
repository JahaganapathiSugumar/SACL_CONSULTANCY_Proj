import React, { useEffect, useState, useRef } from "react";
import {
    Box,
    Typography,
    CircularProgress,
    Button,
    Container,
    ThemeProvider,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Paper,
    Chip,
} from "@mui/material";
import { useLocation } from "react-router-dom";
import PrintIcon from '@mui/icons-material/Print';
import { inspectionService } from "../services/inspectionService";
import { appTheme, COLORS } from '../theme/appTheme';

const ReportSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <Box sx={{ 
        mb: 1.5, 
        breakInside: 'avoid', 
        pageBreakInside: 'avoid',
        '@media print': {
            breakInside: 'avoid',
            pageBreakInside: 'avoid',
            mb: 1
        }
    }}>
        <Typography variant="subtitle2" sx={{ 
            fontWeight: 'bold', 
            mb: 0.5, 
            borderBottom: '1px solid #333', 
            pb: 0.3, 
            fontSize: '0.75rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.3px',
            '@media print': {
                fontSize: '8pt',
                mb: 0.3
            }
        }}>
            {title}
        </Typography>
        {children}
    </Box>
);

const HandwrittenLine = ({ label, value }: { label: string, value: string | number | null }) => (
    <Box sx={{ 
        mb: 0.3, 
        display: 'flex', 
        alignItems: 'baseline', 
        fontSize: '0.7rem',
        '@media print': {
            fontSize: '7pt',
            mb: 0.2
        }
    }}>
        <Typography component="span" sx={{ fontWeight: 600, mr: 0.5, minWidth: '100px', color: '#333', fontSize: 'inherit' }}>
            {label}:
        </Typography>
        <Typography component="span" sx={{ flex: 1, color: '#555', fontFamily: 'inherit', fontSize: 'inherit', wordBreak: 'break-word' }}>
            {value || "-"}
        </Typography>
    </Box>
);

const HandwrittenData = ({ data }: { data: { label: string, value: string | number | null }[] }) => (
    <Box sx={{ 
        mb: 0.5, 
        pl: 0.3,
        '@media print': {
            mb: 0.3
        }
    }}>
        {data.map((item, index) => (
            <HandwrittenLine key={index} label={item.label} value={item.value} />
        ))}
    </Box>
);

export default function FullReportPage() {
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const useQuery = () => new URLSearchParams(location.search);
    const query = useQuery();
    const trialId = query.get("trial_id");

    useEffect(() => {
        if (!trialId) {
            setError("No Trial ID provided");
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const response = await inspectionService.getAllDepartmentData(trialId);
                if (response.success) {
                    setData(response.data);
                } else {
                    setError("Failed to fetch data");
                }
            } catch (err) {
                console.error(err);
                setError("Error fetching data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [trialId]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;
    if (error) return <Box sx={{ p: 4, textAlign: 'center', color: 'red' }}><Typography variant="h5">{error}</Typography></Box>;
    if (!data) return null;

    const trialCard = data.trial_cards?.[0] || {};
    const pouring = data.pouring_details?.[0] || {};
    const sand = data.sand_properties?.[0] || {};
    const moulding = data.mould_correction?.[0] || {};
    const meta = data.metallurgical_inspection?.[0] || {};
    const visual = data.visual_inspection?.[0] || {};
    const dimensional = data.dimensional_inspection?.[0] || {};
    const mcShop = data.machine_shop?.[0] || {};

    const safeParse = (data: any, fallback: any = {}) => {
        if (!data) return fallback;
        if (typeof data === 'object') return data;
        try {
            return JSON.parse(data);
        } catch (e) {
            console.warn("JSON parse error:", e, data);
            return fallback;
        }
    };

    const pComp = safeParse(pouring.composition);
    const pInoc = safeParse(pouring.inoculation);
    const pRem = safeParse(pouring.other_remarks);
    const mechRows = safeParse(meta.mechanical_properties, []);
    const impactRows = safeParse(meta.impact_strength, []);
    const hardRows = safeParse(meta.hardness, []);
    const ndtRows = safeParse(meta.ndt_inspection, []);
    const microRows = safeParse(meta.microstructure, []);
    const mcInspections = safeParse(mcShop.inspections, []);

    return (
        <ThemeProvider theme={appTheme}>
            <Box sx={{ 
                bgcolor: '#fff', 
                minHeight: '100vh', 
                py: 2, 
                "@media print": { 
                    py: 0,
                    '@page': {
                        size: 'A4',
                        margin: '0.5cm'
                    }
                } 
            }}>
                <Container maxWidth="xl" sx={{
                    '@media print': {
                        maxWidth: '100%',
                        padding: '0 0.3cm'
                    }
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2, "@media print": { display: 'none' } }}>
                        <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
                            Print Report
                        </Button>
                    </Box>

                    <Box ref={printRef}>
                        {/* SACL Header */}
                        <Box>
                            <Paper
                                sx={{
                                    p: 3,
                                    mb: 3,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    borderTop: `4px solid ${COLORS.secondary}`,
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                    '@media print': {
                                        p: 1.5,
                                        mb: 1,
                                        boxShadow: 'none',
                                        borderTop: `2px solid ${COLORS.secondary}`
                                    }
                                }}
                            >
                                <Box display="flex" alignItems="center" gap={2} sx={{ position: 'absolute', left: 24, '@media print': { left: 12, gap: 1 } }}>
                                    <Box
                                        component="img"
                                        src="/assets/SACL-LOGO-01.jpg"
                                        alt="Sakthi Auto"
                                        sx={{
                                            height: { xs: 45, md: 55 },
                                            width: 'auto',
                                            objectFit: 'contain',
                                            '@media print': {
                                                height: 35
                                            }
                                        }}
                                    />
                                </Box>

                                <Chip
                                    label="FOUNDRY SAMPLE CARD"
                                    sx={{
                                        backgroundColor: '#FCD34D',
                                        color: COLORS.primary,
                                        fontWeight: 700,
                                        fontSize: { xs: '0.75rem', md: '0.875rem' },
                                        borderRadius: '12px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        "& .MuiChip-label": {
                                            padding: '12px 20px',
                                            display: 'block',
                                            textAlign: 'center',
                                        },
                                        '@media print': {
                                            fontSize: '8pt',
                                            "& .MuiChip-label": {
                                                padding: '6px 12px'
                                            }
                                        }
                                    }}
                                />
                            </Paper>
                        </Box>

                        <Box sx={{ 
                            textAlign: 'center', 
                            mb: 1, 
                            mt: 0.5, 
                            borderBottom: '1.5px solid #000', 
                            pb: 0.5,
                            '@media print': {
                                mb: 0.5,
                                mt: 0,
                                pb: 0.3
                            }
                        }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ 
                                mb: 0.2, 
                                fontSize: '1rem',
                                '@media print': {
                                    fontSize: '10pt',
                                    mb: 0.1
                                }
                            }}>FULL INSPECTION REPORT</Typography>
                            <Typography variant="body2" sx={{
                                fontSize: '0.75rem',
                                '@media print': {
                                    fontSize: '8pt'
                                }
                            }}>Trial ID: {trialId}</Typography>
                        </Box>

                        <Box sx={{ 
                            columnCount: 2,
                            columnGap: 2,
                            columnRule: '1px solid #ddd',
                            fontSize: '0.75rem',
                            '@media print': {
                                columnCount: 2,
                                columnGap: '0.8cm',
                                columnRule: '1px solid #ccc',
                                fontSize: '7pt'
                            }
                        }}>

                        {Object.keys(trialCard).length > 0 && (
                            <ReportSection title="0. TRIAL CARD DETAILS">
                                <HandwrittenData data={[
                                    { label: "Part Name", value: trialCard.part_name },
                                    { label: "Pattern Code", value: trialCard.pattern_code },
                                    { label: "Trial No", value: trialCard.trial_id },
                                    { label: "Date of Sampling", value: trialCard.date_of_sampling },
                                    { label: "Mould Count", value: trialCard.no_of_moulds },
                                    { label: "Machine", value: trialCard.disa },
                                    { label: "Reason", value: trialCard.reason_for_sampling },
                                ]} />
                            </ReportSection>
                        )}

                        {Object.keys(pouring).length > 0 && (
                            <ReportSection title="1. POURING DETAILS">
                                <HandwrittenData data={[
                                    { label: "Pour Date", value: pouring.pour_date },
                                    { label: "Heat Code", value: pouring.heat_code },
                                    { label: "Pouring Temp (°C)", value: pouring.pouring_temp_c },
                                    { label: "Pouring Time (sec)", value: pouring.pouring_time_sec },
                                    { label: "F/C Heat No.", value: pRem["F/C & Heat No."] },
                                    { label: "Stream Inoc.", value: pInoc.Stream },
                                    { label: "Inmould Inoc.", value: pInoc.Inmould }
                                ]} />
                                <Typography variant="body2" sx={{ 
                                    mt: 0.5, 
                                    mb: 0.3, 
                                    fontWeight: 'bold', 
                                    pl: 0.3, 
                                    fontSize: '0.7rem',
                                    '@media print': {
                                        fontSize: '7pt',
                                        mt: 0.3,
                                        mb: 0.2
                                    }
                                }}>Chemical Composition:</Typography>
                                <Box sx={{ overflow: 'visible' }}>
                                    <Table size="small" sx={{ 
                                        border: '1px solid #ddd',
                                        width: '100%',
                                        tableLayout: 'fixed',
                                        '& td, & th': { 
                                            border: '1px solid #ddd',
                                            padding: '3px',
                                            fontSize: '0.65rem',
                                            whiteSpace: 'normal',
                                            wordBreak: 'break-word',
                                            '@media print': {
                                                padding: '2px',
                                                fontSize: '6pt'
                                            }
                                        }
                                    }}>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                                <TableCell sx={{ fontWeight: 'bold', width: '50%' }}>Element</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', width: '50%' }}>Value (%)</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {Object.entries(pComp).map(([key, value]) => (
                                                <TableRow key={key}>
                                                    <TableCell>{key}</TableCell>
                                                    <TableCell>{value != null ? String(value) : '-'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Box>
                            </ReportSection>
                        )}

                        {Object.keys(sand).length > 0 && (
                            <ReportSection title="2. SAND PROPERTIES">
                                <Box sx={{ overflow: 'visible' }}>
                                    <Table size="small" sx={{ 
                                        border: '1px solid #ddd',
                                        width: '100%',
                                        tableLayout: 'fixed',
                                        '& td, & th': { 
                                            border: '1px solid #ddd',
                                            padding: '3px',
                                            fontSize: '0.65rem',
                                            whiteSpace: 'normal',
                                            wordBreak: 'break-word',
                                            '@media print': {
                                                padding: '2px',
                                                fontSize: '6pt'
                                            }
                                        }
                                    }}>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                                <TableCell sx={{ fontWeight: 'bold', width: '50%' }}>Property</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', width: '50%' }}>Value</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            <TableRow><TableCell>Date</TableCell><TableCell>{sand.date || '-'}</TableCell></TableRow>
                                            <TableRow><TableCell>T. Clay %</TableCell><TableCell>{sand.t_clay || '-'}</TableCell></TableRow>
                                            <TableRow><TableCell>A. Clay %</TableCell><TableCell>{sand.a_clay || '-'}</TableCell></TableRow>
                                            <TableRow><TableCell>V.C.M. %</TableCell><TableCell>{sand.vcm || '-'}</TableCell></TableRow>
                                            <TableRow><TableCell>L.O.I. %</TableCell><TableCell>{sand.loi || '-'}</TableCell></TableRow>
                                            <TableRow><TableCell>A.F.S.</TableCell><TableCell>{sand.afs || '-'}</TableCell></TableRow>
                                            <TableRow><TableCell>G.C.S.</TableCell><TableCell>{sand.gcs || '-'}</TableCell></TableRow>
                                            <TableRow><TableCell>M.O.I.</TableCell><TableCell>{sand.moi || '-'}</TableCell></TableRow>
                                            <TableRow><TableCell>Compactability</TableCell><TableCell>{sand.compactability || '-'}</TableCell></TableRow>
                                            <TableRow><TableCell>Permeability</TableCell><TableCell>{sand.permeability || '-'}</TableCell></TableRow>
                                            <TableRow><TableCell>Remarks</TableCell><TableCell>{sand.remarks || '-'}</TableCell></TableRow>
                                        </TableBody>
                                    </Table>
                                </Box>
                            </ReportSection>
                        )}

                        {Object.keys(moulding).length > 0 && (
                            <ReportSection title="3. MOULD CORRECTION">
                                <HandwrittenData data={[
                                    { label: "Date", value: moulding.date },
                                    { label: "Mould Thickness", value: moulding.mould_thickness },
                                    { label: "Compressibility", value: moulding.compressability },
                                    { label: "Squeeze Pressure", value: moulding.squeeze_pressure },
                                    { label: "Mould Hardness", value: moulding.mould_hardness },
                                    { label: "Remarks", value: moulding.remarks }
                                ]} />
                            </ReportSection>
                        )}

                        {Object.keys(meta).length > 0 && (
                            <ReportSection title="4. METALLURGICAL INSPECTION">
                                {mechRows.length > 0 && (
                                    <Box mb={0.5}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.3, pl: 0.3, fontSize: '0.7rem', '@media print': { fontSize: '7pt', mb: 0.2 } }}>Mechanical Properties:</Typography>
                                        <Box sx={{ overflow: 'visible' }}>
                                            <Table size="small" sx={{ border: '1px solid #ddd', width: '100%', tableLayout: 'fixed', '& td, & th': { border: '1px solid #ddd', padding: '2px', fontSize: '0.6rem', whiteSpace: 'normal', wordBreak: 'break-word', '@media print': { padding: '1px', fontSize: '5.5pt' } } }}>
                                                <TableHead>
                                                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                                        <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Parameter</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Value</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Status</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Remarks</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {mechRows.map((r: any, idx: number) => (
                                                        <TableRow key={idx}>
                                                            <TableCell>{r.label || '-'}</TableCell>
                                                            <TableCell>{r.value || '-'}</TableCell>
                                                            <TableCell>{r.ok ? "OK" : "NOT OK"}</TableCell>
                                                            <TableCell>{r.remarks || '-'}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </Box>
                                    </Box>
                                )}

                                {impactRows.length > 0 && (
                                    <Box mb={0.5}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.3, pl: 0.3, fontSize: '0.7rem', '@media print': { fontSize: '7pt', mb: 0.2 } }}>Impact Strength:</Typography>
                                        <Box sx={{ overflow: 'visible' }}>
                                            <Table size="small" sx={{ border: '1px solid #ddd', width: '100%', tableLayout: 'fixed', '& td, & th': { border: '1px solid #ddd', padding: '2px', fontSize: '0.6rem', whiteSpace: 'normal', wordBreak: 'break-word', '@media print': { padding: '1px', fontSize: '5.5pt' } } }}>
                                                <TableHead>
                                                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                                        <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Parameter</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Value</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Status</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Remarks</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {impactRows.map((r: any, idx: number) => (
                                                        <TableRow key={idx}>
                                                            <TableCell>{r.label || '-'}</TableCell>
                                                            <TableCell>{r.value || '-'}</TableCell>
                                                            <TableCell>{r.ok ? "OK" : "NOT OK"}</TableCell>
                                                            <TableCell>{r.remarks || '-'}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </Box>
                                    </Box>
                                )}

                                {hardRows.length > 0 && (
                                    <Box mb={0.5}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.3, pl: 0.3, fontSize: '0.7rem', '@media print': { fontSize: '7pt', mb: 0.2 } }}>Hardness:</Typography>
                                        <Box sx={{ overflow: 'visible' }}>
                                            <Table size="small" sx={{ border: '1px solid #ddd', width: '100%', tableLayout: 'fixed', '& td, & th': { border: '1px solid #ddd', padding: '2px', fontSize: '0.6rem', whiteSpace: 'normal', wordBreak: 'break-word', '@media print': { padding: '1px', fontSize: '5.5pt' } } }}>
                                                <TableHead>
                                                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                                        <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Parameter</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Value</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Status</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Remarks</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {hardRows.map((r: any, idx: number) => (
                                                        <TableRow key={idx}>
                                                            <TableCell>{r.label || '-'}</TableCell>
                                                            <TableCell>{r.value || '-'}</TableCell>
                                                            <TableCell>{r.ok ? "OK" : "NOT OK"}</TableCell>
                                                            <TableCell>{r.remarks || '-'}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </Box>
                                    </Box>
                                )}

                                {ndtRows.length > 0 && (
                                    <Box mb={0.5}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.3, pl: 0.3, fontSize: '0.7rem', '@media print': { fontSize: '7pt', mb: 0.2 } }}>NDT Inspection:</Typography>
                                        <Box sx={{ overflow: 'visible' }}>
                                            <Table size="small" sx={{ border: '1px solid #ddd', width: '100%', tableLayout: 'fixed', '& td, & th': { border: '1px solid #ddd', padding: '2px', fontSize: '0.6rem', whiteSpace: 'normal', wordBreak: 'break-word', '@media print': { padding: '1px', fontSize: '5.5pt' } } }}>
                                                <TableHead>
                                                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                                        <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Parameter</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Value</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Status</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Remarks</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {ndtRows.map((r: any, idx: number) => (
                                                        <TableRow key={idx}>
                                                            <TableCell>{r.label || '-'}</TableCell>
                                                            <TableCell>{r.value || '-'}</TableCell>
                                                            <TableCell>{r.ok ? "OK" : "NOT OK"}</TableCell>
                                                            <TableCell>{r.remarks || '-'}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </Box>
                                    </Box>
                                )}

                                {microRows.length > 0 && (
                                    <Box mb={0.5}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.3, pl: 0.3, fontSize: '0.7rem', '@media print': { fontSize: '7pt', mb: 0.2 } }}>Microstructure:</Typography>
                                        <Box sx={{ overflow: 'visible' }}>
                                            <Table size="small" sx={{ border: '1px solid #ddd', width: '100%', tableLayout: 'fixed', '& td, & th': { border: '1px solid #ddd', padding: '2px', fontSize: '0.6rem', whiteSpace: 'normal', wordBreak: 'break-word', '@media print': { padding: '1px', fontSize: '5.5pt' } } }}>
                                                <TableHead>
                                                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                                        <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Parameter</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>Values</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>Status</TableCell>
                                                        <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Remarks</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {microRows.map((row: any, idx: number) => (
                                                        <TableRow key={idx}>
                                                            <TableCell>{row.label || '-'}</TableCell>
                                                            <TableCell>{row.values?.join(", ") || '-'}</TableCell>
                                                            <TableCell>{row.ok ? "OK" : "NOT OK"}</TableCell>
                                                            <TableCell>{row.remarks || '-'}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </Box>
                                    </Box>
                                )}
                            </ReportSection>
                        )}

                        {Object.keys(visual).length > 0 && (
                            <ReportSection title="5. VISUAL INSPECTION">
                                <HandwrittenData data={[
                                    { label: "Inspector", value: visual.user_name || '-' },
                                    { label: "Result", value: visual.visual_ok ? "OK" : "NOT OK" },
                                ]} />
                                {visual.remarks && (
                                    <>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.2, pl: 0.3, fontSize: '0.65rem', '@media print': { fontSize: '6.5pt' } }}>Remarks:</Typography>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 0.5, pl: 0.5, color: '#555', fontSize: '0.65rem', '@media print': { fontSize: '6pt', mb: 0.3 } }}>{visual.remarks}</Typography>
                                    </>
                                )}
                                {(() => {
                                    const visInspections = safeParse(visual.inspections, []);
                                    if (Array.isArray(visInspections) && visInspections.length > 0) {
                                        return (
                                            <Box sx={{ mb: 0.5 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.3, pl: 0.3, fontSize: '0.65rem', '@media print': { fontSize: '6.5pt', mb: 0.2 } }}>Inspection Details:</Typography>
                                                <Box sx={{ overflow: 'visible' }}>
                                                    <Table size="small" sx={{ border: '1px solid #ddd', width: '100%', tableLayout: 'fixed', '& td, & th': { border: '1px solid #ddd', padding: '2px', fontSize: '0.6rem', whiteSpace: 'normal', wordBreak: 'break-word', '@media print': { padding: '1px', fontSize: '5.5pt' } } }}>
                                                        <TableHead>
                                                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                                                <TableCell sx={{ fontWeight: 'bold' }}>Cavity No.</TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold' }}>Insp. Qty</TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold' }}>Acc. Qty</TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold' }}>Rej. Qty</TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold' }}>Rej. %</TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold' }}>Reason</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {visInspections.map((row: any, idx: number) => (
                                                                <TableRow key={idx}>
                                                                    <TableCell>{row['Cavity number'] || '-'}</TableCell>
                                                                    <TableCell>{row['Inspected Quantity'] || '-'}</TableCell>
                                                                    <TableCell>{row['Accepted Quantity'] || '-'}</TableCell>
                                                                    <TableCell>{row['Rejected Quantity'] || '-'}</TableCell>
                                                                    <TableCell>{row['Rejection Percentage'] || '-'}</TableCell>
                                                                    <TableCell>{row['Reason for rejection'] || '-'}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </Box>
                                            </Box>
                                        );
                                    }
                                    return null;
                                })()}
                            </ReportSection>
                        )}

                        {Object.keys(dimensional).length > 0 && (
                            <ReportSection title="6. DIMENSIONAL INSPECTION">
                                <HandwrittenData data={[
                                    { label: "Inspection Date", value: dimensional.inspection_date },
                                    { label: "Casting Weight (kg)", value: dimensional.casting_weight },
                                    { label: "Bunch Weight (kg)", value: dimensional.bunch_weight },
                                    { label: "No. of Cavities", value: dimensional.no_of_cavities },
                                    { label: "Yields (%)", value: dimensional.yields },
                                ]} />
                                {dimensional.remarks && (
                                    <>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.2, pl: 0.3, fontSize: '0.65rem', '@media print': { fontSize: '6.5pt' } }}>Remarks:</Typography>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 0.5, pl: 0.5, color: '#555', fontSize: '0.65rem', '@media print': { fontSize: '6pt', mb: 0.3 } }}>{dimensional.remarks}</Typography>
                                    </>
                                )}
                                {(() => {
                                    const dimInspections = safeParse(dimensional.inspections, []);
                                    if (Array.isArray(dimInspections) && dimInspections.length > 0) {
                                        return (
                                            <Box sx={{ mb: 0.5 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.3, pl: 0.3, fontSize: '0.65rem', '@media print': { fontSize: '6.5pt', mb: 0.2 } }}>Cavity Details:</Typography>
                                                <Box sx={{ overflow: 'visible' }}>
                                                    <Table size="small" sx={{ border: '1px solid #ddd', width: '100%', tableLayout: 'fixed', '& td, & th': { border: '1px solid #ddd', padding: '2px', fontSize: '0.6rem', whiteSpace: 'normal', wordBreak: 'break-word', '@media print': { padding: '1px', fontSize: '5.5pt' } } }}>
                                                        <TableHead>
                                                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                                                <TableCell sx={{ fontWeight: 'bold', width: '50%' }}>Cavity Number</TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold', width: '50%' }}>Casting Weight</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {dimInspections.map((row: any, idx: number) => (
                                                                <TableRow key={idx}>
                                                                    <TableCell>{row["Cavity Number"] || '-'}</TableCell>
                                                                    <TableCell>{row["Casting Weight"] || '-'}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </Box>
                                            </Box>
                                        );
                                    }
                                    return null;
                                })()}
                            </ReportSection>
                        )}

                        {mcInspections.length > 0 && (
                            <ReportSection title="7. MACHINE SHOP INSPECTION">
                                <Box sx={{ overflow: 'visible' }}>
                                    <Table size="small" sx={{ border: '1px solid #ddd', width: '100%', tableLayout: 'auto', '& td, & th': { border: '1px solid #ddd', padding: '2px', fontSize: '0.6rem', whiteSpace: 'normal', wordBreak: 'break-word', '@media print': { padding: '1px', fontSize: '5.5pt' } } }}>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                                {mcInspections.length > 0 && Object.keys(mcInspections[0]).map((key) => (
                                                    <TableCell key={key} sx={{ fontWeight: 'bold' }}>{key}</TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {mcInspections.map((row: any, idx: number) => (
                                                <TableRow key={idx}>
                                                    {Object.values(row).map((value: any, vIdx: number) => (
                                                        <TableCell key={vIdx}>{value != null ? String(value) : '-'}</TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Box>
                            </ReportSection>
                        )}

                        </Box>
                    </Box>
                </Container>
            </Box>
        </ThemeProvider>
    );
}
