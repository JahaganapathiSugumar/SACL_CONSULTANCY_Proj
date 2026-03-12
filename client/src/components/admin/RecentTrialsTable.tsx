import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import LoadingState from '../common/LoadingState';
import { trialService } from '../../services/trialService';
import DocumentViewer from '../common/DocumentViewer';

interface Trial {
  trial_id: number | string;
  document_id?: number;
  trial_no: string;
  part_name: string;
  pattern_code: string;
  material_grade: string;
  date_of_sampling: string;
  department: string;
  status: string;
  file_base64?: string;
  file_name?: string;
  document_type?: string;
}

const RecentTrialsTable: React.FC = () => {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewReport, setViewReport] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [fetchingReport, setFetchingReport] = useState<number | string | null>(null);

  useEffect(() => {
    const fetchTrials = async () => {
      try {
        setLoading(true);
        const data = await trialService.getRecentTrialReports();
        setTrials(data);
      } catch (error) {
        console.error('Error fetching trials:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrials();
  }, []);

  const handleViewReport = async (trial: Trial) => {
    try {
      setFetchingReport(trial.trial_id);
      
      let reportData = trial;
      if (!trial.file_base64) {
        const response = await trialService.getTrialReportFile(trial.trial_id);
        if (response && response.file_base64) {
          reportData = { ...trial, ...response };
        } else {
          alert('Report file content not found.');
          return;
        }
      }

      const document = {
        document_id: Date.now(),
        file_name: reportData.file_name || `Report_${reportData.trial_id}.pdf`,
        document_type: reportData.document_type || 'TRIAL_REPORT',
        file_base64: reportData.file_base64,
        uploaded_by: 'System',
        uploaded_at: new Date().toISOString(),
        remarks: 'Auto-generated Report'
      };
      setViewReport({
        trialId: reportData.trial_id,
        trialNo: reportData.trial_no,
        partName: reportData.part_name,
        documents: [document]
      });
    } catch (error) {
      console.error('Error fetching recent trial report base64:', error);
      alert('Failed to load report file.');
    } finally {
      setFetchingReport(null);
    }
  };

  return (
    <>
      <TableContainer className="premium-table-container" sx={{ maxHeight: '400px', overflow: 'auto', position: 'relative', minHeight: loading || trials.length === 0 ? '300px' : 'auto' }}>
        {loading ? (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: 'rgba(255,255,255,0.7)',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            borderRadius: '12px',
            backdropFilter: 'blur(2px)'
          }}>
            <LoadingState message="Fetching trials..." />
          </Box>
        ) : null}
        <Table stickyHeader size="medium">
          <TableHead className="premium-table-head">
            <TableRow>
              <TableCell className="premium-table-header-cell">Trial No</TableCell>
              <TableCell className="premium-table-header-cell">Part Name</TableCell>
              <TableCell className="premium-table-header-cell">Pattern Code</TableCell>
              <TableCell className="premium-table-header-cell">Grade</TableCell>
              <TableCell className="premium-table-header-cell">Date</TableCell>
              <TableCell className="premium-table-header-cell">Department</TableCell>
              <TableCell className="premium-table-header-cell">Status</TableCell>
              <TableCell className="premium-table-header-cell" style={{ textAlign: 'center' }}>Report</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trials.length > 0 ? (
              trials.map((trial) => (
                <TableRow key={trial.trial_id} className="premium-table-row">
                  <TableCell className="premium-table-cell-bold">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f39c12' }} />
                      {trial.trial_no}
                    </Box>
                  </TableCell>
                  <TableCell className="premium-table-cell">
                    <Box sx={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {trial.part_name}
                    </Box>
                  </TableCell>
                  <TableCell className="premium-table-cell">{trial.pattern_code}</TableCell>
                  <TableCell className="premium-table-cell">{trial.material_grade}</TableCell>
                  <TableCell className="premium-table-cell">{new Date(trial.date_of_sampling).toLocaleDateString('en-GB')}</TableCell>
                  <TableCell className="premium-table-cell">
                    <Box sx={{ fontWeight: 600, color: '#3498db' }}>
                      {trial.department || 'N/A'}
                    </Box>
                  </TableCell>
                  <TableCell className="premium-table-cell">
                    <span
                      className={`status-pill ${trial.status?.toUpperCase() === 'CLOSED' ? 'status-pill-success' :
                        trial.status?.toUpperCase() === 'CREATED' ? 'status-pill-info' :
                          'status-pill-warning'
                        }`}
                    >
                      {trial.status || 'PENDING'}
                    </span>
                  </TableCell>
                  <TableCell className="premium-table-cell" align="center">
                    {
                      (trial.status === 'CLOSED' && trial.document_id) ? (
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={fetchingReport === trial.trial_id}
                          startIcon={fetchingReport === trial.trial_id ? <CircularProgress size={14} /> : null}
                          onClick={() => handleViewReport(trial)}
                          sx={{
                            borderRadius: 1,
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            padding: '2px 10px',
                            minWidth: 'auto',
                            borderColor: '#3498db',
                            color: '#3498db',
                            '&:hover': {
                              borderColor: '#2980b9',
                              bgcolor: '#ebf5fb'
                            }
                          }}
                        >
                          {fetchingReport === trial.trial_id ? 'Loading...' : 'View'}
                        </Button>
                      ) : (
                        <Typography variant="caption" color="text.secondary">N/A</Typography>
                      )
                    }
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" className="premium-table-cell" sx={{ py: 20 }}>
                  <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    No trials found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!viewReport} onClose={() => setViewReport(null)} maxWidth="md" fullWidth>
        <DialogTitle>Trial Report - {viewReport?.partName} - {viewReport?.trialNo}</DialogTitle>
        <DialogContent>
          {viewReport && (
            <DocumentViewer
              documents={viewReport.documents}
              label="Generated Report"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewReport(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RecentTrialsTable;
