import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, ListItemIcon, Button, Paper, IconButton, Chip } from '@mui/material';
import GearSpinner from './GearSpinner';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import { documentService } from '../../services/documentService';
import { formatFileSize } from '../../utils';
import Swal from 'sweetalert2';

interface DocumentViewerProps {
    trialId?: number | string;
    category?: string;
    label?: string;
    refreshTrigger?: number;
    documents?: Document[];
    onRefresh?: () => void;
}

interface Document {
    document_id: number;
    file_name: string;
    document_type: string;
    file_base64: string;
    uploaded_by: string;
    uploaded_by_username?: string;
    uploaded_at: string;
    remarks: string;
    is_confidential?: boolean | number;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ trialId, category, label = "Previously Attached Files", refreshTrigger = 0, documents: externalDocuments, onRefresh }) => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

    useEffect(() => {
        const fetchDocuments = async () => {
            if (externalDocuments) {
                setDocuments(externalDocuments);
                return;
            }

            if (!trialId) return;

            setLoading(true);
            try {
                const response = await documentService.getDocument(trialId);
                if (response && response.success && Array.isArray(response.data)) {
                    let docs = response.data;
                    if (category) {
                        docs = docs.filter((d: Document) => d.document_type?.trim().toUpperCase() === category.trim().toUpperCase());
                    }
                    setDocuments(docs);
                } else {
                    console.error("Failed to fetch documents", response);
                    setError("Failed to fetch documents");
                }
            } catch (err) {
                console.error("Error fetching documents:", err);
                setError("Failed to load documents");
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
    }, [trialId, category, refreshTrigger, externalDocuments]);

    const handleViewFile = (file: Document) => {
        try {
            const ext = file.file_name.split('.').pop()?.toLowerCase();
            let mimeType = 'application/octet-stream';
            if (ext === 'pdf') mimeType = 'application/pdf';
            else if (ext === 'png') mimeType = 'image/png';
            else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
            else if (ext === 'gif') mimeType = 'image/gif';

            const base64Content = file.file_base64.split(',').pop() || '';
            const byteCharacters = atob(base64Content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });
            const fileURL = URL.createObjectURL(blob);

            const win = window.open(fileURL, '_blank');
            if (win) {
                setTimeout(() => URL.revokeObjectURL(fileURL), 60000);
            }
        } catch (err) {
            console.error("Error viewing file:", err);
            alert("Could not open this file version. It might be too large or corrupted.");
        }
    };

    const handleDelete = async (file: Document) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You want to delete "${file.file_name}"? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            setDeleteLoading(file.document_id);
            try {
                const response = await documentService.deleteDocument(file.document_id);
                if (response && response.success) {
                    Swal.fire('Deleted!', 'Document has been deleted.', 'success');
                    if (externalDocuments) {
                        if (onRefresh) onRefresh();
                    } else {
                        setDocuments(prev => prev.filter(d => d.document_id !== file.document_id));
                    }
                } else {
                    Swal.fire('Error', response?.message || 'Failed to delete document', 'error');
                }
            } catch (err) {
                console.error("Error deleting document:", err);
                Swal.fire('Error', 'An error occurred while deleting the document', 'error');
            } finally {
                setDeleteLoading(null);
            }
        }
    };

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return <PictureAsPdfIcon color="error" />;
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return <ImageIcon color="primary" />;
        return <DescriptionIcon />;
    };

    if (loading) return <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}><div style={{ transform: 'scale(0.4)', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GearSpinner /></div><Typography variant="body2">Loading documents...</Typography></Box>;

    if (documents.length === 0) {
        return null;
    }

    return (
        <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary', textTransform: 'uppercase' }}>
                {label}
            </Typography>
            <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                {documents.map((doc) => (
                    <ListItem
                        key={doc.document_id}
                        secondaryAction={
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <IconButton
                                    size="small"
                                    onClick={() => handleViewFile(doc)}
                                    sx={{ color: 'primary.main' }}
                                    title="View Document"
                                >
                                    <VisibilityIcon />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={() => handleDelete(doc)}
                                    sx={{ color: 'error.main' }}
                                    disabled={deleteLoading === doc.document_id}
                                    title="Delete Document"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        }
                        sx={{ borderBottom: '1px solid #f0f0f0', '&:last-child': { borderBottom: 'none' } }}
                    >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            {getFileIcon(doc.file_name)}
                        </ListItemIcon>
                        <ListItemText
                            primary={
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {doc.file_name}
                                    {(doc.is_confidential === true || doc.is_confidential === 1) && (
                                        <Chip
                                            label="Confidential"
                                            size="small"
                                            color="error"
                                            variant="outlined"
                                            sx={{ height: 20, fontSize: '0.65rem' }}
                                        />
                                    )}
                                </Box>
                            }
                            secondary={`Uploaded by ${doc.uploaded_by_username || doc.uploaded_by} on ${new Date(doc.uploaded_at).toLocaleDateString()}`}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                        />
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default DocumentViewer;
