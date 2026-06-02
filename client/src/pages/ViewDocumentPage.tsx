import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, IconButton, AppBar, Toolbar, CircularProgress, Container } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { apiService } from '../services/commonService';

interface DocumentData {
    document_id: number;
    file_name: string;
    document_type: string;
    file_base64: string;
    uploaded_by: number;
    remarks: string;
    is_confidential: boolean | number;
}

const ViewDocumentPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [doc, setDoc] = useState<DocumentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [zoom, setZoom] = useState(100);

    useEffect(() => {
        const fetchDocument = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const response = await apiService.request(`/documents/${id}`);
                if (response && response.success && response.data) {
                    setDoc(response.data);
                } else {
                    setError(response.message || "Failed to load document.");
                }
            } catch (err: any) {
                console.error("Error loading document:", err);
                setError(err.message || "An unexpected error occurred while loading the document.");
            } finally {
                setLoading(false);
            }
        };

        fetchDocument();
    }, [id]);

    const handleDownload = () => {
        if (!doc) return;
        try {
            const ext = doc.file_name.split('.').pop()?.toLowerCase();
            let mimeType = 'application/octet-stream';
            if (ext === 'pdf') mimeType = 'application/pdf';
            else if (ext === 'png') mimeType = 'image/png';
            else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
            else if (ext === 'gif') mimeType = 'image/gif';

            const base64Content = doc.file_base64.split(',').pop() || '';
            const byteCharacters = atob(base64Content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });
            const blobUrl = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = doc.file_name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Error downloading file:", err);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 2 }}>
                <CircularProgress size={60} thickness={4} color="primary" />
                <Typography variant="h6" color="textSecondary">Loading document...</Typography>
            </Box>
        );
    }

    if (error || !doc) {
        return (
            <Container maxWidth="sm" sx={{ mt: 10 }}>
                <Paper elevation={4} sx={{ p: 4, borderRadius: '16px', textAlign: 'center', border: '1px solid #fee2e2', bgcolor: '#fef2f2' }}>
                    <Typography variant="h5" color="error" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Error Viewing Document
                    </Typography>
                    <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                        {error || "We could not find the document you were looking for."}
                    </Typography>
                    <Button variant="contained" color="primary" startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')} sx={{ borderRadius: '8px', textTransform: 'none', px: 4 }}>
                        Go to Dashboard
                    </Button>
                </Paper>
            </Container>
        );
    }

    const ext = doc.file_name.split('.').pop()?.toLowerCase();
    const isImage = ['png', 'jpg', 'jpeg', 'gif'].includes(ext || '');
    const isPdf = ext === 'pdf';

    const base64Content = doc.file_base64.split(',').pop() || '';
    const fileUrl = `data:${isPdf ? 'application/pdf' : isImage ? `image/${ext}` : 'application/octet-stream'};base64,${base64Content}`;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#f8fafc' }}>
            <AppBar position="static" color="inherit" elevation={1} sx={{ borderBottom: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton onClick={() => navigate(-1)} color="primary">
                            <ArrowBackIcon />
                        </IconButton>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a' }}>
                                {doc.file_name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                Category: {doc.document_type?.replace('_', ' ')}
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {isImage && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                                <IconButton onClick={() => setZoom(prev => Math.max(prev - 20, 20))} title="Zoom Out">
                                    <ZoomOutIcon />
                                </IconButton>
                                <Typography variant="body2" sx={{ width: '45px', textAlign: 'center', fontWeight: 600, color: '#334155' }}>
                                    {zoom}%
                                </Typography>
                                <IconButton onClick={() => setZoom(prev => Math.min(prev + 20, 200))} title="Zoom In">
                                    <ZoomInIcon />
                                </IconButton>
                            </Box>
                        )}
                        <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownload} sx={{ textTransform: 'none', borderRadius: '8px', px: 3 }}>
                            Download
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            <Box sx={{ flex: 1, overflow: 'auto', p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {isPdf ? (
                    <Box sx={{ width: '100%', height: '100%', maxWidth: '1100px', display: 'flex', justifyContent: 'center' }}>
                        <object data={fileUrl} type="application/pdf" width="100%" height="100%" style={{ borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)' }}>
                            <embed src={fileUrl} type="application/pdf" />
                            <Box sx={{ textAlign: 'center', p: 4 }}>
                                <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
                                    Your browser does not support inline PDFs.
                                </Typography>
                                <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownload}>
                                    Download PDF to view
                                </Button>
                            </Box>
                        </object>
                    </Box>
                ) : isImage ? (
                    <Box sx={{ maxHeight: '100%', maxWidth: '100%', overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                        <img 
                            src={fileUrl} 
                            alt={doc.file_name} 
                            style={{ 
                                width: `${zoom}%`, 
                                maxWidth: '100%', 
                                maxHeight: '80vh', 
                                objectFit: 'contain', 
                                borderRadius: '12px', 
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03)' 
                            }} 
                        />
                    </Box>
                ) : (
                    <Paper elevation={3} sx={{ p: 5, borderRadius: '16px', textAlign: 'center', maxWidth: '400px' }}>
                        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: '#0f172a' }}>
                            Unsupported Preview
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
                            Inline previews for this file type ({ext?.toUpperCase()}) are not supported. Please download and view it locally.
                        </Typography>
                        <Button variant="contained" color="primary" startIcon={<DownloadIcon />} onClick={handleDownload} fullWidth sx={{ py: 1.5, borderRadius: '8px', textTransform: 'none' }}>
                            Download Document
                        </Button>
                    </Paper>
                )}
            </Box>
        </Box>
    );
};

export default ViewDocumentPage;
