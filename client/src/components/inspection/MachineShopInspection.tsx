import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";

import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  IconButton,
  Button,
  Alert,
  ThemeProvider,
  Container,
  Grid,
  Chip,
  Divider,
  useMediaQuery
} from "@mui/material";
import Swal from 'sweetalert2';

import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from '@mui/icons-material/Save';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { apiService } from '../../services/commonService';
import { inspectionService } from '../../services/inspectionService';
import { uploadFiles } from '../../services/fileUploadHelper';
import { COLORS, appTheme } from '../../theme/appTheme';
import { useAlert } from '../../hooks/useAlert';
import { AlertMessage } from '../common/AlertMessage';
import { fileToMeta, generateUid, formatDate } from '../../utils';
import type { InspectionRow } from '../../types/inspection';
import departmentProgressService from "../../services/departmentProgressService";
import Header from "../dashboard/Header";
import ProfileModal from "../dashboard/ProfileModal";
import { getDepartmentInfo } from "../../utils/dashboardUtils";
import { EmptyState, ActionButtons, FileUploadSection, PreviewModal, DocumentViewer } from '../common';
import BasicInfo from "../dashboard/BasicInfo";
import { safeParse } from "../../utils/jsonUtils";


type Row = InspectionRow;


export default function McShopInspection({
  initialCavities = ["", "", ""],
  onSave = async (payload: any) => {

    return { ok: true };
  },
}: {
  initialCavities?: string[];
  onSave?: (payload: any) => Promise<any> | any;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(appTheme.breakpoints.down('sm'));


  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [userIP, setUserIP] = useState<string>("Loading...");
  const [isEditing, setIsEditing] = useState(false);
  const [dataExists, setDataExists] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [headerRefreshKey, setHeaderRefreshKey] = useState(0);
  const departmentInfo = getDepartmentInfo(user);
  const [cavities, setCavities] = useState<string[]>([...initialCavities]);
  const [cachedCavityNumbers, setCachedCavityNumbers] = useState<string[]>([]);



  const makeInitialRows = (cavLabels: string[]): Row[] => [
    { id: `cavity-${generateUid()}`, label: "Cavity Number", values: cavLabels?.map(() => "") },
    { id: `fdy-ok-${generateUid()}`, label: "FDY OK Quantity", values: cavLabels?.map(() => ""), total: null },
    { id: `received-${generateUid()}`, label: "Received Quantity", values: cavLabels?.map(() => ""), total: null },
    { id: `insp-${generateUid()}`, label: "Inspected Quantity", values: cavLabels?.map(() => ""), total: null },
    { id: `rej-${generateUid()}`, label: "Rejected Quantity", values: cavLabels?.map(() => ""), total: null },
    { id: `accp-${generateUid()}`, label: "Accepted Quantity", values: cavLabels?.map(() => ""), total: null },
    { id: `rej-perc-${generateUid()}`, label: "Rejection Percentage", values: cavLabels?.map(() => ""), total: null },
    { id: `reason-${generateUid()}`, label: "Reason for rejection", values: cavLabels?.map(() => "") },
  ];

  const [rows, setRows] = useState<Row[]>(() => makeInitialRows(initialCavities));
  const [remarks, setRemarks] = useState<string>("");

  const [dimensionalRemarks, setDimensionalRemarks] = useState<string>("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [confidentialFiles, setConfidentialFiles] = useState<File[]>([]);
  const [additionalRemarks, setAdditionalRemarks] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { alert, showAlert } = useAlert();
  const [previewMode, setPreviewMode] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<any | null>(null);
  const [previewSubmitted, setPreviewSubmitted] = useState(false);

  const trialId = new URLSearchParams(window.location.search).get('trial_id') || "";
  const [isAssigned, setIsAssigned] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAssignment = async () => {
      if (user && trialId) {
        if (user.role === 'Admin' || user.department_id === 2 || user.department_id === 3) {
          setIsAssigned(true);
          return;
        }
        try {
          const pending = await departmentProgressService.getProgress(user.username, user.department_id);
          const found = pending?.find(p => String(p?.trial_id) === String(trialId));
          setIsAssigned(!!found);
        } catch (error) {
          console.error("Failed to check assignment:", error);
          setIsAssigned(false);
        }
      } else {
        setIsAssigned(false);
      }
    };
    checkAssignment();
  }, [user, trialId]);

  useEffect(() => {
    const fetchUserIP = async () => {
      const ip = await apiService.getIP();
      setUserIP(ip);
    };
    fetchUserIP();
  }, []);

  useEffect(() => {
    const fetchCavityNumbers = async () => {
      if (trialId) {
        try {
          const res = await inspectionService.getCavityNumbers(trialId);
          if (res.success && Array.isArray(res.data)) {
            const fetchedValues = res.data;
            if (fetchedValues.length > 0) {
              setCachedCavityNumbers(fetchedValues);
              setCavities(fetchedValues);
              setRows(prevRows => prevRows.map(row => {
                let newValues = [...row.values];
                if (row.label === "Cavity Number") {
                  newValues = fetchedValues;
                } else if (newValues.length < fetchedValues.length) {
                  newValues = [...newValues, ...Array(fetchedValues.length - newValues.length).fill("")];
                } else if (newValues.length > fetchedValues.length) {
                  newValues = newValues.slice(0, fetchedValues.length);
                }
                return { ...row, values: newValues };
              }));
            } else {
              setCavities([""]);
              setRows(prev => prev.map(row => ({ ...row, values: [""] })));
            }
          } else {
            setCavities([""]);
            setRows(prev => prev.map(row => ({ ...row, values: [""] })));
          }
        } catch (error) {
          console.error("Failed to fetch cavity numbers:", error);
        }
      }
    };
    fetchCavityNumbers();
  }, [trialId]);

  useEffect(() => {
    const fetchData = async () => {
      if (trialId) {
        try {
          const response = await inspectionService.getMachineShopInspection(trialId);

          const acceptedMap: Record<string, string> = {};
          try {
            const visualRes = await inspectionService.getVisualInspection(trialId);
            if (visualRes.success && visualRes.data?.[0]) {
              const visualData = visualRes.data[0];
              const ndtList = safeParse<any[]>(visualData.ndt_inspection, []);
              ndtList.forEach(item => {
                const cav = String(item?.['Cavity Number'] || '').trim();
                const acc = String(item?.['Accepted Quantity'] || '').trim();
                if (cav) acceptedMap[cav] = acc;
              });
            }
          } catch (e) {
            console.error("Error fetching NDT values for pre-fill:", e);
          }

          if (response?.success && response?.data && response?.data?.length > 0) {
            const data = response.data[0];
            setDate(data?.inspection_date ? new Date(data.inspection_date).toISOString().slice(0, 10) : "");
            const parsedInspections = safeParse<any[]>(data?.inspections, []);

            if (parsedInspections && parsedInspections?.length > 0) {
              const newCavities = parsedInspections?.map((item: any) => item?.['Cavity Number'] || "");
              setCavities(newCavities);

              const getVals = (key: string) => parsedInspections?.map((item: any) => item?.[key] ?? "");

              setRows(prevRows => {
                const newRows = [...(prevRows || [])];
                const findRowByLabel = (labelPart: string) => newRows?.find(r => r?.label?.toLowerCase()?.includes(labelPart?.toLowerCase()));

                const updateRowVals = (labelSnippet: string, key: string) => {
                  const targetRow = findRowByLabel(labelSnippet);
                  if (targetRow) {
                    const values = getVals(key);
                    const isMetadata = labelSnippet?.includes('cavity') || labelSnippet?.includes('reason') || labelSnippet?.includes('rejection percentage');

                    targetRow.values = values?.map(String);
                    const totalVal = values?.reduce((acc: number, v: any) => {
                      const n = parseFloat(String(v));
                      return acc + (isNaN(n) ? 0 : n);
                    }, 0);
                    const hasData = values?.some((v: any) => v !== null && v !== undefined && String(v).trim() !== "");
                    targetRow.total = isMetadata ? null : (hasData ? totalVal : null);
                  }
                };

                updateRowVals('cavity number', 'Cavity Number');
                updateRowVals('fdy ok quantity', 'FDY OK Quantity');
                updateRowVals('received quantity', 'Received Quantity');
                updateRowVals('inspected quantity', 'Inspected Quantity');
                updateRowVals('accepted quantity', 'Accepted Quantity');
                updateRowVals('rejected quantity', 'Rejected Quantity');
                updateRowVals('rejection percentage', 'Rejection Percentage');
                updateRowVals('reason for rejection', 'Reason for rejection');

                const inspRow = newRows?.find(r => r?.label === "Inspected Quantity");
                const rejRow = newRows?.find(r => r?.label === "Rejected Quantity");
                const percRow = newRows?.find(r => r?.label === "Rejection Percentage");

                if (inspRow && rejRow && percRow) {
                  const totalInsp = (inspRow.total as number) || 0;
                  const totalRej = (rejRow.total as number) || 0;
                  if (totalInsp > 0) {
                    percRow.total = parseFloat(((totalRej / totalInsp) * 100).toFixed(2));
                  }
                }

                return newRows;
              });
            }

            setRemarks(data?.remarks || "");
            setDataExists(true);
          } else {
            if (Object.keys(acceptedMap).length > 0) {
              setRows(prevRows => prevRows.map(row => {
                if (row.label === "FDY OK Quantity") {
                  const cavityRow = prevRows.find(r => r.label === "Cavity Number");
                  const currentCavities = cavityRow ? cavityRow.values : [];
                  const newValues = currentCavities.map(cav => acceptedMap[String(cav).trim()] || "");

                  const totalVal = newValues.reduce((acc, v) => {
                    const n = parseFloat(String(v));
                    return acc + (isNaN(n) ? 0 : n);
                  }, 0);

                  return { ...row, values: newValues, total: totalVal > 0 ? totalVal : null };
                }
                return row;
              }));
            }
          }
        } catch (error) {
          console.error("Failed to fetch machine shop data:", error);
          showAlert('error', 'Failed to load existing data.');
        }
      }
    };
    if (trialId) fetchData();
  }, [user, trialId]); // eslint-disable-line react-hooks/exhaustive-deps


  const handleAttachFiles = (newFiles: File[]) => {
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateCavityLabel = (index: number, label: string) => {
    setCavities((prev) => prev.map((c, i) => (i === index ? label : c)));
  };

  const updateCell = (rowId: string, colIndex: number, value: string) => {
    setRows((prev) => {
      const updatedRows = [...(prev || [])];
      const rIndex = updatedRows?.findIndex(r => r?.id === rowId);
      if (rIndex === -1) return prev;

      const newValues = updatedRows[rIndex]?.values?.map((v, i) => (i === colIndex ? value : v));
      const isCavityOrReason = updatedRows[rIndex]?.label?.toLowerCase()?.includes("cavity") || updatedRows[rIndex]?.label?.toLowerCase()?.includes("reason");

      if (isCavityOrReason) {
        updatedRows[rIndex] = { ...updatedRows[rIndex], values: newValues };
        return updatedRows;
      }

      const totalVal = newValues?.reduce((sum, val) => {
        const n = parseFloat(String(val).trim());
        return sum + (isNaN(n) ? 0 : n);
      }, 0);
      const hasData = newValues?.some(v => v !== null && v !== undefined && String(v).trim() !== "");
      const total = hasData ? totalVal : null;

      updatedRows[rIndex] = { ...updatedRows[rIndex], values: newValues, total };

      // Auto-calculation logic
      let updated = [...updatedRows];
      const findInUpdated = (labelPart: string) => updated?.find(r => r?.label?.toLowerCase()?.includes(labelPart?.toLowerCase()));
      const inspectedRow = findInUpdated("inspected quantity");
      const acceptedRow = findInUpdated("accepted quantity");
      const rejectedRow = findInUpdated("rejected quantity");
      const percentageRow = findInUpdated("rejection percentage");
      const receivedRow = findInUpdated("received quantity");

      if (inspectedRow && receivedRow) {
        const inspectedNum = parseFloat(String(inspectedRow?.values?.[colIndex] || '').trim());
        const receivedNum = parseFloat(String(receivedRow?.values?.[colIndex] || '').trim());

        if (!isNaN(inspectedNum) && !isNaN(receivedNum) && inspectedNum > receivedNum) {
          showAlert('error', `Column ${colIndex + 1}: Inspected quantity (${inspectedNum}) cannot be greater than Received quantity (${receivedNum})`);
          const newInspectedValues = [...(inspectedRow.values || [])];
          newInspectedValues[colIndex] = '';
          updated = updated?.map(r => r.id === inspectedRow.id ? { ...r, values: newInspectedValues } : r);
        }
      }

      const curInspectedRow = updated.find(r => r?.label?.toLowerCase()?.includes("inspected quantity"));
      const curRejectedRow = updated.find(r => r?.label?.toLowerCase()?.includes("rejected quantity"));
      const curAcceptedRow = updated.find(r => r?.label?.toLowerCase()?.includes("accepted quantity"));
      const curPercentageRow = updated.find(r => r?.label?.toLowerCase()?.includes("rejection percentage"));

      if (curInspectedRow && curRejectedRow && curAcceptedRow) {
        const insNum = parseFloat(String(curInspectedRow.values[colIndex] || '').trim());
        const rejNum = parseFloat(String(curRejectedRow.values[colIndex] || '').trim());

        const newAcceptedValues = [...curAcceptedRow.values];
        
        if (!isNaN(insNum) && !isNaN(rejNum)) {
          if (rejNum > insNum) {
            showAlert('error', `Column ${colIndex + 1}: Rejected quantity (${rejNum}) cannot be greater than Inspected quantity (${insNum})`);
            newAcceptedValues[colIndex] = "Invalid";
          } else {
            const accepted = insNum - rejNum;
            newAcceptedValues[colIndex] = accepted >= 0 ? accepted.toString() : '';
          }
        } else {
          newAcceptedValues[colIndex] = '';
        }

        updated = updated.map(r => r.id === curAcceptedRow.id ? { ...r, values: newAcceptedValues } : r);
      }

      updated = updated.map(r => {
        const labelLower = r?.label?.toLowerCase() || "";
        if (labelLower.includes("cavity") || labelLower.includes("reason") || labelLower.includes("percentage")) {
          return { ...r, total: null };
        }
        const total = r?.values?.reduce((sum, val) => {
          const n = parseFloat(String(val).trim());
          return sum + (isNaN(n) ? 0 : n);
        }, 0);
        const hasData = r?.values?.some(v => v !== null && v !== undefined && String(v).trim() !== "");
        return { ...r, total: hasData ? total : null };
      });

      const finalInsRow = updated.find(r => r?.label?.toLowerCase()?.includes("inspected quantity"));
      const finalRejRow = updated.find(r => r?.label?.toLowerCase()?.includes("rejected quantity"));
      const finalPercRow = updated.find(r => r?.label?.toLowerCase()?.includes("rejection percentage"));

      if (finalInsRow && finalRejRow && finalPercRow) {
        const newPercVals = [...finalPercRow.values];
        const ins = parseFloat(String(finalInsRow.values[colIndex] || '').trim());
        const rej = parseFloat(String(finalRejRow.values[colIndex] || '').trim());

        if (!isNaN(ins) && ins > 0 && !isNaN(rej)) {
          newPercVals[colIndex] = ((rej / ins) * 100).toFixed(2);
        } else {
          newPercVals[colIndex] = '';
        }

        const totalIns = Number(finalInsRow.total) || 0;
        const totalRej = Number(finalRejRow.total) || 0;
        let totalPerc = null;
        if (totalIns > 0) {
          totalPerc = parseFloat(((totalRej / totalIns) * 100).toFixed(2));
        }

        updated = updated.map(r => r.id === finalPercRow.id ? { ...r, values: newPercVals, total: totalPerc } : r);
      }

      return updated;
    });
  };

  const handleReset = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setCavities([...initialCavities]);
    setRows(makeInitialRows(initialCavities));
    setRemarks("");
    setDimensionalRemarks("");
    setAttachedFiles([]);
    setAdditionalRemarks("");

    setPreviewSubmitted(false);
  };

  const buildPayload = () => {
    return {
      inspection_type: "mc_shop",
      inspection_date: date || null,
      user_name: user?.username || null,
      user_ip: userIP || null,
      cavities: cavities?.slice(),
      rows: rows?.map((r) => ({
        label: r?.label,
        values: r?.values?.map((v) => (v === "" ? null : v)),
        freeText: r?.freeText || null,
        total: r?.total ?? null,
      })),
      remarks: remarks || null,
      dimensional_report_remarks: dimensionalRemarks || null,
      attachedFiles: attachedFiles?.map(f => f?.name),
      additionalRemarks: additionalRemarks,
      created_at: new Date().toISOString(),
    };
  };

  const buildServerPayload = (isDraft: boolean = false) => {
    const findRowByLabel = (labelPart: string) => rows?.find(r => r?.label?.toLowerCase()?.includes(labelPart.toLowerCase()));

    const inspectedRow = findRowByLabel("inspected quantity");
    const receivedRow = findRowByLabel("received quantity");
    const acceptedRow = findRowByLabel("accepted quantity");
    const rejectedRow = findRowByLabel("rejected quantity");
    const percentageRow = findRowByLabel("rejection percentage");
    const reasonRow = findRowByLabel("reason for rejection");


    const inspections: any[] = cavities?.map((cav, idx) => {
      const inspected = inspectedRow?.values?.[idx] ?? null;
      const rejected = rejectedRow?.values?.[idx] ?? null;
      const fdyOk = findRowByLabel("fdy ok quantity")?.values?.[idx] ?? "";
      const rejectionPercentage = (() => {
        const ins = parseFloat(String(inspected ?? '0'));
        const rej = parseFloat(String(rejected ?? '0'));
        if (isNaN(ins) || isNaN(rej) || ins === 0) return "0.00";
        return ((rej / ins) * 100).toFixed(2);
      })();

      return {
        'Cavity Number': String(cav || (rows?.[0]?.values?.[idx] ?? '')),
        'FDY OK Quantity': String(fdyOk),
        'Received Quantity': String(receivedRow?.values?.[idx] ?? ""),
        'Inspected Quantity': String(inspected ?? ""),
        'Accepted Quantity': String(acceptedRow?.values?.[idx] ?? ""),
        'Rejected Quantity': String(rejected ?? ""),
        'Rejection Percentage': String(rejectionPercentage),
        'Reason for rejection': String(reasonRow?.values?.[idx] ?? ""),
      };
    }) || [];

    return {
      trial_id: trialId,
      inspection_date: date || null,
      inspections: inspections,
      remarks: remarks || null,
      is_edit: isEditing || dataExists,
      is_draft: isDraft
    };
  };

  const handleSaveAndContinue = async () => {
    const payload = buildPayload();

    setPreviewPayload(payload);
    setPreviewMode(true);
    setPreviewSubmitted(false);
    setMessage(null);
  };

  const performSave = async (isDraft: boolean) => {
    if (!isDraft && !previewPayload) return;
    setSaving(true);
    try {
      const serverPayload = buildServerPayload(isDraft);

      const upload = async (files: File[], isConfidential: boolean) => {
        if (files.length > 0) {
          await uploadFiles(
            files,
            trialId,
            "MC_SHOP_INSPECTION",
            user?.username || "system",
            isConfidential ? "MC_SHOP_INSPECTION_CONFIDENTIAL" : "MC_SHOP_INSPECTION",
            isConfidential
          ).catch(err => console.error(`${isDraft ? 'Draft ' : ''}file upload error`, err));
        }
      };

      await upload(attachedFiles, false);
      await upload(confidentialFiles, true);
      
      if (dataExists || ((user?.role === 'HOD' || user?.role === 'Admin') && trialId)) {
        await inspectionService.updateMachineShopInspection(serverPayload);
      } else {
        await inspectionService.submitMachineShopInspection(serverPayload);
      }


      setPreviewSubmitted(true);
      if (!isDraft) setPreviewMode(false);

      await Swal.fire({
        icon: 'success',
        title: isDraft ? 'Saved as Draft' : 'Success',
        text: isDraft
          ? 'Draft saved successfully.'
          : `Machine Shop Inspection ${dataExists ? 'updated' : 'created'} successfully.`
      });
      navigate(-1);
    } catch (err: any) {
      console.error(`Error ${isDraft ? 'saving draft' : 'saving inspection'}:`, err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || `Failed to ${isDraft ? 'save draft' : 'save inspection'}.`
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFinalSave = () => performSave(false);
  const handleSaveDraft = () => performSave(true);


  return (
    <ThemeProvider theme={appTheme}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', bgcolor: COLORS.background }}>
        <Header
          setShowProfile={setShowProfile}
          departmentInfo={departmentInfo}
          photoRefreshKey={headerRefreshKey}
          showBackButton={true}
        />
        <Box sx={{ flexGrow: 1, overflow: 'auto', py: { xs: 1.5, md: 4 }, px: { xs: 1, sm: 2 } }}>
          <Container maxWidth="xl" sx={{ p: { xs: 0, sm: 2 } }}>
            <AlertMessage alert={alert} />

            {isAssigned === false && (user?.role !== 'Admin') ? (
              <EmptyState
                title="No Pending Works"
                description="This trial is not currently assigned to you."
                severity="warning"
                action={{
                  label: "Go to Dashboard",
                  onClick: () => navigate('/dashboard')
                }}
              />
            ) : (
              <>
                <BasicInfo trialId={trialId || ""} />

                <Paper sx={{ p: { xs: 2, md: 4 }, overflow: 'hidden' }}>

                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography variant="subtitle2" sx={{ color: COLORS.primary }}>INSPECTION DETAILS</Typography>
                  </Box>
                  <Divider sx={{ mb: 3, borderColor: COLORS.border }} />



                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Inspection Date</Typography>
                      <TextField
                        size="small"
                        type="date"
                        value={date}
                        onChange={(e) => {
                          setDate(e.target.value);
                        }}
                        fullWidth
                        sx={{ bgcolor: 'white' }}
                        disabled={user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 2 || user?.department_id === 3}
                      />
                    </Grid>

                  </Grid>

                  <Box sx={{ overflowX: "auto", border: `1px solid ${COLORS.border}`, borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', textAlign: 'center', color: COLORS.blueHeaderText, backgroundColor: COLORS.blueHeaderBg }}>Parameter</TableCell>
                          {cavities?.map((cav, i) => (
                            <TableCell key={i} sx={{ fontWeight: 600, fontSize: '0.8rem', textAlign: 'center', color: COLORS.blueHeaderText, backgroundColor: COLORS.blueHeaderBg }}>
                              <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                <TextField
                                  variant="standard"
                                  value={""}
                                  onChange={(e) => updateCavityLabel(i, e.target.value)}
                                  InputProps={{ disableUnderline: true, style: { color: COLORS.blueHeaderText, textAlign: 'center' } }}
                                  size="small"
                                  sx={{ input: { textAlign: 'center' } }}
                                  disabled={true}
                                />
                              </Box>
                            </TableCell>
                          ))}
                          <TableCell sx={{ width: 120, bgcolor: '#f1f5f9', fontWeight: 700, textAlign: 'center' }}>Total</TableCell>
                          <TableCell sx={{ minWidth: 300, maxWidth: 300, bgcolor: COLORS.orangeHeaderBg, color: COLORS.orangeHeaderText }}>Remarks</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {rows?.map((r, ri) => {
                          const isReasonRow = r?.label?.toLowerCase()?.includes("reason");
                          return (
                            <TableRow key={r?.id}>
                              <TableCell sx={{ fontWeight: 600, color: COLORS.textSecondary, bgcolor: '#f8fafc' }}>{r?.label}</TableCell>

                              {r?.values?.map((val, ci) => (
                                <TableCell key={ci}>
                                  <TextField
                                    size="small"
                                    fullWidth
                                    value={val ?? ""}
                                    onChange={(e) => updateCell(r?.id, ci, e.target.value)}
                                    variant="outlined"
                                    sx={{
                                      "& .MuiOutlinedInput-root": {
                                        borderRadius: 2,
                                        backgroundColor: 'white'
                                      },
                                      "& .MuiInputBase-input": {
                                        fontFamily: 'Roboto Mono',
                                        textAlign: 'center',
                                        backgroundColor: val === 'Invalid' ? '#fee2e2' :
                                          r?.label?.toLowerCase()?.includes("accepted quantity") ? '#f3f4f6' : 'white'
                                      }
                                    }}
                                    disabled={r.label === "Cavity Number" || r.label === "FDY OK Quantity" || ((user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 2 || user?.department_id === 3) && !isEditing) || r?.label?.toLowerCase()?.includes("accepted quantity") || r?.label?.toLowerCase()?.includes("rejection percentage")}
                                  />
                                </TableCell>
                              ))}
                              <TableCell sx={{ textAlign: 'center', fontWeight: 700, bgcolor: '#f1f5f9' }}>
                                {r?.label?.toLowerCase()?.includes("cavity") || r?.label?.toLowerCase()?.includes("reason") ? "-" : (r?.total !== null && r?.total !== undefined ? r.total : "-")}
                              </TableCell>

                              {ri === 0 && (
                                <TableCell rowSpan={rows?.length || 1} sx={{ verticalAlign: "top", bgcolor: '#fff7ed', padding: 2, minWidth: 300, maxWidth: 300 }}>
                                  <Box display="flex" flexDirection="column" height="100%" gap={2}>
                                    <TextField
                                      size="small"
                                      fullWidth
                                      multiline
                                      rows={8}
                                      placeholder="Enter remarks..."
                                      value={remarks || ""}
                                      onChange={(e) => setRemarks(e.target.value)}


                                      variant="outlined"
                                      sx={{ bgcolor: 'white' }}
                                      disabled={(user?.role === 'HOD' || user?.role === 'Admin' || user?.department_id === 2 || user?.department_id === 3) && !isEditing}
                                    />

                                  </Box>
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Box>
                  {isMobile && <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'center', mt: 1 }}> Swipe to view more </Typography>}


                  <Box sx={{ p: 3, bgcolor: "#fff", borderTop: `1px solid ${COLORS.border}` }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, textTransform: "uppercase" }}>
                      Attach PDF / Image Files
                    </Typography>
                    <FileUploadSection
                      files={attachedFiles}
                      onFilesChange={(newFiles) => setAttachedFiles(prev => [...prev, ...newFiles])}
                      onFileRemove={(index) => setAttachedFiles(prev => prev.filter((_, i) => i !== index))}
                      showAlert={showAlert}
                      label="Attach PDF"
                      disabled={user?.department_id === 2 || user?.department_id === 3}
                    />

                    <Box sx={{ mt: 3, p: 2, border: `1px dashed ${COLORS.border}`, borderRadius: 2, bgcolor: '#fff5f5' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'error.main', textTransform: "uppercase", display: 'flex', alignItems: 'center', gap: 1 }}>
                        Confidential Files (Admin Only)
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary' }}>
                        Upload sensitive documents here. These will only be visible to Admins.
                      </Typography>
                      <FileUploadSection
                        files={confidentialFiles}
                        onFilesChange={(newFiles) => setConfidentialFiles(prev => [...prev, ...newFiles])}
                        onFileRemove={(index) => setConfidentialFiles(prev => prev.filter((_, i) => i !== index))}
                        showAlert={showAlert}
                        label="Attach Confidential PDF"
                        disabled={user?.department_id === 2 || user?.department_id === 3}
                      />
                    </Box>

                    <DocumentViewer trialId={trialId || ""} category="MC_SHOP_INSPECTION" />
                  </Box>


                  <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" alignItems="stretch" gap={2} sx={{ mt: 2, mb: 4 }}>
                    <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} width={{ xs: '100%', sm: 'auto' }}>
                        <ActionButtons
                          {...(user?.role !== 'HOD' && user?.role !== 'Admin' ? { onReset: handleReset } : {})}
                          onSave={handleSaveAndContinue}
                          showSubmit={false}
                          saveLabel={((user?.role === 'HOD' && user?.department_id === 8) || user?.role === 'Admin') ? 'Approve' : 'Save & Continue'}
                          saveIcon={((user?.role === 'HOD' && user?.department_id === 8) || user?.role === 'Admin') ? <CheckCircleIcon /> : <SaveIcon />}
                          disabled={user?.department_id === 2 || user?.department_id === 3}
                        >
                          {(user?.role !== 'HOD' && user?.role !== 'Admin') && (
                            <Button
                              variant="outlined"
                              startIcon={<SaveIcon />}
                              onClick={handleSaveDraft}
                              disabled={saving || user?.department_id === 2 || user?.department_id === 3}
                              sx={{ mr: 2 }}
                            >
                              Save as Draft
                            </Button>
                          )}
                          {((user?.role === 'HOD' && user?.department_id === 8) || user?.role === 'Admin') && (
                            <Button
                              variant="outlined"
                              onClick={() => setIsEditing(!isEditing)}
                              sx={{ color: COLORS.secondary, borderColor: COLORS.secondary }}
                              disabled={user?.department_id === 2 || user?.department_id === 3}
                            >
                              {isEditing ? "Cancel Edit" : "Edit Details"}
                            </Button>
                          )}
                        </ActionButtons>
                    </Box>
                  </Box>

                </Paper>
              </>
            )}

            <PreviewModal
              open={previewMode && previewPayload}
              onClose={() => setPreviewMode(false)}
              onSubmit={handleFinalSave}
              title="Verify Machine Shop Inspection Details"
              submitted={previewSubmitted}
              isSubmitting={saving}
            >
              <Box sx={{ p: 4 }}>
                <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" sx={{ textTransform: 'uppercase' }}>Machine Shop Inspection Report</Typography>
                    <Typography variant="body2" color="textSecondary">Date: {formatDate(previewPayload?.inspection_date)}</Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />

                  <Box sx={{ overflowX: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Parameter</TableCell>
                          {previewPayload?.cavities?.map((c: string, i: number) => (
                            <TableCell key={i} sx={{ fontWeight: 600, fontSize: '0.75rem', textAlign: 'center' }}></TableCell>
                          ))}
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', textAlign: 'center' }}>Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {previewPayload?.rows?.map((r: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>{r?.label}</TableCell>
                            {r?.freeText !== undefined && r?.freeText !== null ? (
                              <TableCell colSpan={(previewPayload?.cavities?.length || 0) + 1} sx={{ textAlign: 'left', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                {r?.freeText}
                              </TableCell>
                            ) : (
                              <>
                                {r?.values?.map((v: any, j: number) => (
                                  <TableCell key={j} sx={{ textAlign: 'center', fontSize: '0.8rem', fontFamily: 'Roboto Mono' }}>
                                    {v === null ? "-" : String(v)}
                                  </TableCell>
                                ))}
                                <TableCell sx={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                                  {r?.label?.toLowerCase()?.includes("cavity") ? "-" : (r?.total !== null && r?.total !== undefined ? r.total : "-")}
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>

                  {previewPayload?.remarks && (
                    <Box mt={3} p={2} sx={{ bgcolor: '#f8fafc', borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
                      <Typography variant="subtitle2" mb={1} color="textSecondary">REMARKS</Typography>
                      <Typography variant="body2">{previewPayload.remarks}</Typography>
                    </Box>
                  )}

                  {previewPayload?.attachedFiles && previewPayload.attachedFiles.length > 0 && (
                    <Box mt={3} p={2} sx={{ bgcolor: '#f8fafc', borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
                      <Typography variant="subtitle2" mb={1} color="textSecondary">ATTACHED FILES</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {previewPayload?.attachedFiles?.map((fileName: string, idx: number) => (
                          <Chip
                            key={idx}
                            icon={<InsertDriveFileIcon />}
                            label={fileName}
                            variant="outlined"
                            sx={{ bgcolor: 'white' }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {previewPayload?.additionalRemarks && (
                    <Box mt={3} p={2} sx={{ bgcolor: '#f8fafc', borderRadius: 2, border: `1px solid ${COLORS.border}` }}>
                      <Typography variant="subtitle2" mb={1} color="textSecondary">ADDITIONAL REMARKS</Typography>
                      <Typography variant="body2">{previewPayload.additionalRemarks}</Typography>
                    </Box>
                  )}

                  <Box sx={{ mt: 3 }}>
                    <AlertMessage alert={alert} />
                  </Box>
                </Box>
              </Box>
            </PreviewModal>


          </Container>
        </Box>
      </Box>

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          onPhotoUpdate={() => setHeaderRefreshKey(prev => prev + 1)}
        />
      )}
    </ThemeProvider>
  );
}
