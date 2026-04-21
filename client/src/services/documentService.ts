import { apiService } from './commonService';

export const documentService = {
    async uploadDocument(trial_id: number | string | null, document_type: string, file_name: string, file_base64: string, uploaded_by: string, uploaded_at: string, remarks: string, is_confidential: boolean = false, pattern_code: string | null = null) {
        const body = {
            "trial_id": trial_id,
            "pattern_code": pattern_code,
            "document_type": document_type,
            "file_name": file_name,
            "file_base64": file_base64,
            "uploaded_by": uploaded_by,
            "uploaded_at": uploaded_at,
            "remarks": remarks,
            "is_confidential": is_confidential
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
    },

    async getDocumentsByPatternCode(patternCode: string) {
        return apiService.request(`/documents?pattern_code=${encodeURIComponent(patternCode)}`, {
            method: "GET"
        });
    },

    async deleteDocument(id: number | string) {
        return apiService.request(`/documents/${id}`, {
            method: "DELETE"
        });
    }
};