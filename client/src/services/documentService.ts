import { apiService } from './commonService';

export const documentService = {
    async uploadDocument(trial_id: number | string, document_type: string, file_name: string, file_base64: string, uploaded_by: string, uploaded_at: string, remarks: string) {
        const body = {
            "trial_id": trial_id,
            "document_type": document_type,
            "file_name": file_name,
            "file_base64": file_base64,
            "uploaded_by": uploaded_by,
            "uploaded_at": uploaded_at,
            "remarks": remarks
        };
        return apiService.request('/documents', {
            method: "POST",
            body: JSON.stringify(body)
        });
    },

    async getDocument(trial_id: number | string) {
        return apiService.request(`/documents?trial_id=${encodeURIComponent(String(trial_id))}`, {
            method: "GET"
        });
    }
};