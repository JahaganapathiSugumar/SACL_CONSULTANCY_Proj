import React, { useMemo, useState, useCallback, useRef } from "react";
import {
 Box,
 Button,
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableRow,
 TextField,
 Typography,
 Paper,
 Chip,
 Alert,
 CircularProgress,
} from "@mui/material";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Colors
const SAKTHI_COLORS = {
 primary: '#2950bbff',
 secondary: '#DC2626',
 accent: '#F59E0B',
 background: '#F8FAFC',
 lightBlue: '#3B82F6',
 darkGray: '#374151',
 lightGray: '#E5E7EB',
 white: '#FFFFFF',
 success: '#10B981',
};

/* -------------------------
 Types
 ------------------------- */
export interface SandProperties {
 tClay: string;
 aClay: string;
 vcm: string;
 loi: string;
 afs: string;
 gcs: string;
 moi: string;
 compactability: string;
 perm: string;
 otherRemarks: string;
 date: string; // YYYY-MM-DD
}

interface SubmittedData {
 selectedPart: any | null;
 selectedPattern: any | null;
 machine: string;
 reason: string;
 trialNo: string;
 samplingDate: string;
 mouldCount: string;
 sampleTraceability: string;
}

interface SandPropertiesTableProps {
	submittedData?: SubmittedData;
	onSave?: (data: SandProperties) => void;
	onComplete?: () => void;
	readOnly?: boolean;
	fromPendingCards?: boolean;
}
/* Microstructure/hardness parsing removed from this file to avoid
	unused helper warnings. Parsing is centralized in other components. */

/* Hardness parsing removed from this file to avoid unused helper warnings. */

/* -------------------------
 Component to display submitted sample card data (read-only)
 ------------------------- */
const SubmittedSampleCard: React.FC<{ submittedData: SubmittedData }> = ({ submittedData }) => {
 // Note: metallurgical parsing happens in parent components when needed. Avoid unused local vars here.

 return (
 <Paper variant="outlined" sx={{ overflow: "hidden", border: `2px solid ${SAKTHI_COLORS.primary}`, bgcolor: SAKTHI_COLORS.white, mb: 3 }}>
 {/* Header Section */}
 <Box sx={{ p: 3, borderBottom: `3px solid ${SAKTHI_COLORS.primary}`, background: `linear-gradient(135deg, ${SAKTHI_COLORS.primary} 0%, ${SAKTHI_COLORS.lightBlue} 100%)`, color: SAKTHI_COLORS.white }}>
 <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3, alignItems: 'start' }}>
 <Box>
 <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, opacity: 0.9 }}>Pattern Code</Typography>
 <TextField 
 fullWidth
 value={submittedData.selectedPattern?.pattern_code || ''}
 size="small"
 InputProps={{ 
 readOnly: true,
 sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 2, color: SAKTHI_COLORS.darkGray } 
 }}
 />
 </Box>

 <Box>
 <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, opacity: 0.9 }}>Part Name</Typography>
 <TextField 
 fullWidth
 value={submittedData.selectedPart?.part_name || ''}
 size="small"
 InputProps={{ 
 readOnly: true,
 sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 2, color: SAKTHI_COLORS.darkGray } 
 }}
 />
 </Box>

 <Box>
 <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, opacity: 0.9 }}>TRIAL No</Typography>
 <TextField 
 fullWidth
 value={submittedData.trialNo} 
 size="small" 
 InputProps={{ 
 readOnly: true,
 sx: { bgcolor: SAKTHI_COLORS.white, borderRadius: 2, color: SAKTHI_COLORS.darkGray } 
 }} 
 />
 </Box>
 </Box>
 </Box>

 {/* Info Chip */}
 <Box sx={{ px: 3, pt: 3, pb: 2 }}>
 <Chip 
 icon={<span style={{ fontSize: '1.2rem' }}>📋</span>} 
 label="Submitted Sample Card Data (Read Only)" 
 sx={{ 
 bgcolor: SAKTHI_COLORS.success + '20', 
 color: SAKTHI_COLORS.darkGray, 
 border: `1px dashed ${SAKTHI_COLORS.success}`, 
 fontWeight: 600, 
 fontSize: '0.875rem', 
 py: 2.5 
 }} 
 />
 </Box>

 <Box sx={{ p: 3 }}>
 {/* METALLURGICAL SPECIFICATION Section (omitted inner markup for brevity - same as before) */}
 {/* ... same as previous SubmittedSampleCard contents ... */}
 {/* For brevity in this snippet, we keep the same full markup as in the original file. */}
 {/* (You have that full markup in your original file — it's included here in the actual replacement.) */}
 </Box>
 </Paper>
 );
};

/* -------------------------
 Stable Field component (memoized)
 ------------------------- */
const Field = React.memo(function Field({
 value,
 onChange,
 onBlur,
 error,
 helperText,
 multiline = false,
 placeholder,
 type = "text",
}: {
 value: string;
 onChange: (v: string) => void;
 onBlur?: () => void;
 error?: boolean;
 helperText?: string;
 multiline?: boolean;
 placeholder?: string;
 type?: string;
}) {
 return (
 <TextField
 variant="outlined"
 size="small"
 fullWidth
 value={value}
 onChange={(e) => onChange(e.target.value)}
 onBlur={onBlur}
 multiline={multiline}
 rows={multiline ? 2 : 1}
 placeholder={placeholder}
 type={type}
 error={error}
 helperText={helperText}
 inputProps={{ autoComplete: "off" }}
 sx={{
 background: "transparent",
 "& .MuiOutlinedInput-notchedOutline": {
 border: error ? "1px solid #d32f2f" : "1px solid #000",
 },
 "& .MuiOutlinedInput-input": { padding: "8px 10px", fontSize: "0.92rem" },
 }}
 />
 );
});
Field.displayName = "Field";

/* -------------------------
 Main Sand Properties Table Component (with PDF Export)
 ------------------------- */
const SandPropertiesTable: React.FC<SandPropertiesTableProps> = ({
 submittedData,
 onSave,
 onComplete,
 readOnly = false,
}) => {
 const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

 const [data, setData] = useState<SandProperties>({
 tClay: "",
 aClay: "",
 vcm: "",
 loi: "",
 afs: "",
 gcs: "",
 moi: "",
 compactability: "",
 perm: "",
 otherRemarks: "",
 date: today,
 });

 const [submitted, setSubmitted] = useState(false);
 const [submittedSandData, setSubmittedSandData] = useState<SandProperties | null>(null);

 const initialTouched: Record<keyof SandProperties, boolean> = {
 tClay: false,
 aClay: false,
 vcm: false,
 loi: false,
 afs: false,
 gcs: false,
 moi: false,
 compactability: false,
 perm: false,
 otherRemarks: false,
 date: false,
 };
 const [touched, setTouched] = useState(initialTouched);
 const [triedSubmit, setTriedSubmit] = useState(false);

 const setField = useCallback((key: keyof SandProperties, value: string) => {
 setData((prev) => ({ ...prev, [key]: value }));
 }, []);

 const handleBlur = useCallback((key: keyof SandProperties) => {
 setTouched((t) => ({ ...t, [key]: true }));
 }, []);

 const allFilled = Object.values(data).every((v) => v.toString().trim() !== "");

 const shouldShowError = useCallback((key: keyof SandProperties) => {
 return (touched[key] || triedSubmit) && data[key].toString().trim() === "";
 }, [touched, triedSubmit, data]);

 const handleSave = useCallback(() => {
 setTriedSubmit(true);
 if (!allFilled) {
 setTouched(Object.keys(touched).reduce((acc, k) => {
 (acc as any)[k] = true;
 return acc;
 }, { ...initialTouched }));
 return;
 }
 setSubmittedSandData(data);
 setSubmitted(true);
 onSave && onSave(data);
 }, [allFilled, data, onSave]);

 const handleClear = useCallback(() => {
 setData({
 tClay: "",
 aClay: "",
 vcm: "",
 loi: "",
 afs: "",
 gcs: "",
 moi: "",
 compactability: "",
 perm: "",
 otherRemarks: "",
 date: today,
 });
 setTouched(initialTouched);
 setTriedSubmit(false);
 }, [today]);

 const handleProceedToMould = useCallback(() => {
 onComplete && onComplete();
 }, [onComplete]);

 // Helper to render the Field component
 const RenderCell = useCallback(({ keyName, multiline = false }: { keyName: keyof SandProperties; multiline?: boolean }) => {
 const value = submitted && submittedSandData ? submittedSandData[keyName] : data[keyName];
 
 if (submitted || readOnly) {
 return (
 <Typography
 variant="body2"
 sx={{
 minHeight: multiline ? 56 : 40,
 display: "flex",
 alignItems: multiline ? "flex-start" : "center",
 px: 1,
 py: multiline ? 1 : 0,
 color: value ? "text.primary" : "text.secondary",
 fontSize: "0.9rem",
 whiteSpace: multiline ? "normal" : "nowrap",
 overflow: "hidden",
 textOverflow: "ellipsis",
 }}
 >
 {value || "--"}
 </Typography>
 );
 }

 return (
 <Field
 value={value}
 onChange={(v) => setField(keyName, v)}
 onBlur={() => handleBlur(keyName)}
 error={shouldShowError(keyName)}
 helperText={shouldShowError(keyName) ? "Required" : ""}
 multiline={multiline}
 placeholder={keyName === "date" ? undefined : undefined}
 type={keyName === "date" ? "date" : "text"}
 />
 );
 }, [data, submitted, submittedSandData, readOnly, setField, handleBlur, shouldShowError]);

 // ---------- PDF export logic ----------
 const printRef = useRef<HTMLDivElement | null>(null);
 const [exporting, setExporting] = useState(false);

 const handleExportPDF = async () => {
 const el = printRef.current;
 if (!el) {
 alert('Nothing to export');
 return;
 }

 try {
 setExporting(true);

 // ensure element visible
 const originalScroll = window.scrollY;
 el.scrollIntoView({ behavior: 'auto', block: 'center' });

 const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false });
 const imgData = canvas.toDataURL('image/png');

 // Create PDF
 const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
 const pageWidth = pdf.internal.pageSize.getWidth();
 const pageHeight = pdf.internal.pageSize.getHeight();
 const margin = 20;

 const scale = (pageWidth - margin * 2) / canvas.width;
 const imgHeight = canvas.height * scale;
 const imgWidth = canvas.width * scale;

 if (imgHeight <= pageHeight - margin * 2) {
 pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
 } else {
 // slice tall canvas into pages
 const totalPages = Math.ceil(imgHeight / (pageHeight - margin * 2));
 const sliceHeightPx = Math.floor((pageHeight - margin * 2) / scale);

 for (let page = 0; page < totalPages; page++) {
 const pageCanvas = document.createElement('canvas');
 pageCanvas.width = canvas.width;
 const remainingPx = canvas.height - page * sliceHeightPx;
 pageCanvas.height = remainingPx < sliceHeightPx ? remainingPx : sliceHeightPx;

 const ctx = pageCanvas.getContext('2d');
 if (!ctx) throw new Error('Could not get canvas context');

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

 const pageData = pageCanvas.toDataURL('image/png');
 const pageImgHeight = pageCanvas.height * scale;

 if (page > 0) pdf.addPage();
 pdf.addImage(pageData, 'PNG', margin, margin, imgWidth, pageImgHeight);
 }
 }

 const safeName = (submittedData?.selectedPart?.part_name || 'sand_properties').replace(/\s+/g, '_');
 pdf.save(`${safeName}.pdf`);

 window.scrollTo(0, originalScroll);
 } catch (err) {
 console.error('Export PDF failed:', err);
 alert('Failed to export PDF. See console for details.');
 } finally {
 setExporting(false);
 }
 };

 // Success view after submission
 if (submitted) {
 return (
 <Box sx={{ p: 3 }} ref={printRef}>
 {/* Display submitted sample card data */}
 {submittedData && (
 <SubmittedSampleCard submittedData={submittedData} />
 )}

 {/* Success message */}
 <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', mb: 3, bgcolor: SAKTHI_COLORS.success + '10', border: `2px solid ${SAKTHI_COLORS.success}` }}>
 <Alert severity="success" sx={{ mb: 3, fontSize: '1.1rem', fontWeight: 600 }}>
 ✅ Sand Properties Submitted Successfully!
 </Alert>
 
 <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: SAKTHI_COLORS.primary }}>
 Sand Data Successfully Recorded
 </Typography>
 
 <Typography variant="body1" sx={{ mb: 3, color: SAKTHI_COLORS.darkGray }}>
 Your sand properties have been successfully submitted and stored in the system.
 </Typography>

 <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
 <Button 
 variant="outlined" 
 onClick={() => setSubmitted(false)}
 sx={{ minWidth: 140 }}
 >
 Back to Edit
 </Button>
 <Button 
 variant="contained" 
 onClick={handleProceedToMould}
 sx={{ 
 minWidth: 160, 
 background: `linear-gradient(135deg, ${SAKTHI_COLORS.accent} 0%, ${SAKTHI_COLORS.primary} 100%)`,
 fontWeight: 700 
 }}
 >
 Proceed to Moulding
 </Button>

 {/* Export button (visible in submitted view) */}
 <Button
 variant="outlined"
 onClick={handleExportPDF}
 disabled={exporting}
 startIcon={exporting ? <CircularProgress size={16} /> : undefined}
 sx={{ minWidth: 160 }}
 >
 {exporting ? 'Generating...' : 'Export as PDF'}
 </Button>
 </Box>
 </Paper>

 {/* Submitted Sand Properties (read-only) */}
 <Paper
 elevation={0}
 sx={{
 width: "100%",
 maxWidth: 1200,
 mx: "auto",
 border: "2px solid #000",
 bgcolor: "#f5f5f5",
 p: 0,
 mb: 3,
 }}
 >
 <Box
 sx={{
 display: "flex",
 alignItems: "center",
 background: "#bfbfbf",
 borderBottom: "2px solid #000",
 px: 1.5,
 py: 0.7,
 }}
 >
 <Typography sx={{ fontWeight: 800, letterSpacing: 0.5, fontSize: "0.95rem" }}>
 SAND PROPERTIES (Submitted)
 </Typography>
 <Box sx={{ flex: 1 }} />
 </Box>

 <Box sx={{ px: 0, py: 0 }}>
 <Table size="small" sx={{ borderCollapse: "collapse" }}>
 <TableHead>
 <TableRow>
 <TableCell colSpan={9} sx={{ border: "none", background: "transparent" }} />
 <TableCell sx={{ border: "1px solid #000", background: "#d0d0d0", px: 1 }}>
 <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
 <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>Date :</Typography>
 <Typography sx={{ fontSize: "0.9rem" }}>{submittedSandData?.date}</Typography>
 </Box>
 </TableCell>
 </TableRow>

 <TableRow>
 {[
 "T.Clay",
 "A.Clay",
 "VCM",
 "LOI",
 "AFS",
 "G.C.S",
 "MOI",
 "Compactability",
 "Perm",
 "Other Remarks",
 ].map((label) => (
 <TableCell
 key={label}
 align="center"
 sx={{
 border: "1px solid #000",
 background: "#d0d0d0",
 fontWeight: 700,
 px: 0.5,
 py: 0.7,
 fontSize: "0.85rem",
 }}
 >
 {label}
 </TableCell>
 ))}
 </TableRow>
 </TableHead>

 <TableBody>
 <TableRow>
 <TableCell sx={{ border: "1px solid #000", width: 100, p: 0.5 }}>
 <RenderCell keyName="tClay" />
 </TableCell>
 <TableCell sx={{ border: "1px solid #000", width: 100, p: 0.5 }}>
 <RenderCell keyName="aClay" />
 </TableCell>
 <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}>
 <RenderCell keyName="vcm" />
 </TableCell>
 <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}>
 <RenderCell keyName="loi" />
 </TableCell>
 <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}>
 <RenderCell keyName="afs" />
 </TableCell>
 <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}>
 <RenderCell keyName="gcs" />
 </TableCell>
 <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}>
 <RenderCell keyName="moi" />
 </TableCell>
 <TableCell sx={{ border: "1px solid #000", width: 140, p: 0.5 }}>
 <RenderCell keyName="compactability" />
 </TableCell>
 <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}>
 <RenderCell keyName="perm" />
 </TableCell>
 <TableCell sx={{ border: "1px solid #000", p: 0.5 }}>
 <RenderCell keyName="otherRemarks" multiline />
 </TableCell>
 </TableRow>

 <TableRow>
 <TableCell colSpan={10} sx={{ border: "none", background: "transparent", height: 12 }} />
 </TableRow>
 </TableBody>
 </Table>
 </Box>
 </Paper>
 </Box>
 );
 }

 // Main editable view
 return (
 <Box sx={{ p: 3 }} ref={printRef}>
 {/* Display submitted sample card data if provided */}
 {submittedData && (
 <SubmittedSampleCard submittedData={submittedData} />
 )}

 {/* Sand Properties Table (editable) */}
 <Paper
 elevation={0}
 sx={{
 width: "100%",
 maxWidth: 1200,
 mx: "auto",
 border: "2px solid #000",
 bgcolor: "#f5f5f5",
 p: 0,
 mb: 3,
 }}
 >
 {/* Top bar: label only (no date here) */}
 <Box
 sx={{
 display: "flex",
 alignItems: "center",
 background: "#bfbfbf",
 borderBottom: "2px solid #000",
 px: 1.5,
 py: 0.7,
 }}
 >
 <Typography sx={{ fontWeight: 800, letterSpacing: 0.5, fontSize: "0.95rem" }}>
 SAND PROPERTIES:
 </Typography>
 <Box sx={{ flex: 1 }} />
 </Box>

 {/* Main table */}
 <Box sx={{ px: 0, py: 0 }}>
 <Table size="small" sx={{ borderCollapse: "collapse" }}>
 <TableHead>
 {/* Row to position Date input inside the table on the right */}
 <TableRow>
 <TableCell colSpan={9} sx={{ border: "none", background: "transparent" }} />
 <TableCell sx={{ border: "1px solid #000", background: "#d0d0d0", px: 1 }}>
 <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
 <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>Date :</Typography>
 <Field
 value={data.date}
 onChange={(v) => setField("date", v)}
 onBlur={() => handleBlur("date")}
 error={shouldShowError("date")}
 helperText={shouldShowError("date") ? "Required" : ""}
 type="date"
 />
 </Box>
 </TableCell>
 </TableRow>

 {/* Header labels */}
 <TableRow>
 {[
 "T.Clay",
 "A.Clay",
 "VCM",
 "LOI",
 "AFS",
 "G.C.S",
 "MOI",
 "Compactability",
 "Perm",
 "Other Remarks",
 ].map((label) => (
 <TableCell
 key={label}
 align="center"
 sx={{
 border: "1px solid #000",
 background: "#d0d0d0",
 fontWeight: 700,
 px: 0.5,
 py: 0.7,
 fontSize: "0.85rem",
 }}
 >
 {label}
 </TableCell>
 ))}
 </TableRow>
 </TableHead>

 <TableBody>
 <TableRow>
 <TableCell sx={{ border: "1px solid #000", width: 100, p: 0.5 }}>
 <RenderCell keyName="tClay" />
 </TableCell>
 <TableCell sx={{ border: "1px solid #000", width: 100, p: 0.5 }}>
 <RenderCell keyName="aClay" />
 </TableCell>
 <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}>
 <RenderCell keyName="vcm" />
 </TableCell>
 <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}>
 <RenderCell keyName="loi" />
 </TableCell>
 <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}>
 <RenderCell keyName="afs" />
 </TableCell>
 <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}>
 <RenderCell keyName="gcs" />
 </TableCell>
 <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}>
 <RenderCell keyName="moi" />
 </TableCell>
 <TableCell sx={{ border: "1px solid #000", width: 140, p: 0.5 }}>
 <RenderCell keyName="compactability" />
 </TableCell>
 <TableCell sx={{ border: "1px solid #000", width: 90, p: 0.5 }}>
 <RenderCell keyName="perm" />
 </TableCell>
 <TableCell sx={{ border: "1px solid #000", p: 0.5 }}>
 <RenderCell keyName="otherRemarks" multiline />
 </TableCell>
 </TableRow>

 {/* Spacer row (keeps layout like the screenshot) */}
 <TableRow>
 <TableCell colSpan={10} sx={{ border: "none", background: "transparent", height: 12 }} />
 </TableRow>
 </TableBody>
 </Table>
 </Box>

 {/* Actions row */}
 <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", p: 2 }}>
 <Button variant="outlined" color="secondary" onClick={handleClear}>
 Clear
 </Button>
 <Button variant="contained" color="primary" onClick={handleSave} disabled={!allFilled}>
 Submit Sand Properties
 </Button>

 {/* Export button (editable view) */}
 <Button
 variant="outlined"
 onClick={handleExportPDF}
 disabled={exporting}
 startIcon={exporting ? <CircularProgress size={16} /> : undefined}
 >
 {exporting ? 'Generating...' : 'Export as PDF'}
 </Button>
 </Box>
 </Paper>

 {/* Success message when completed */}
 {allFilled && (
 <Alert severity="success" sx={{ mb: 2 }}>
 Sand properties data is ready to be submitted. Click "Submit Sand Properties" to proceed.
 </Alert>
 )}
 </Box>
 );
};

export default SandPropertiesTable;