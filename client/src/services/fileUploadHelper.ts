import { documentService } from './documentService';

/**
 * Result of a single file upload attempt
 */
export interface UploadResult {
    fileName: string;
    success: boolean;
    error?: string;
}

/**
 * Converts a File object to a base64 string
 * @param file - The file to convert
 * @returns Promise resolving to base64 string (data URL format)
 */
export const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            if (typeof reader.result === 'string') {
                const base64String = reader.result.split(',')[1] || reader.result;
                resolve(base64String);
            } else {
                reject(new Error('Failed to read file as string'));
            }
        };

        reader.onerror = () => {
            reject(new Error(`Failed to read file: ${file.name}`));
        };

        reader.readAsDataURL(file);
    });
};

/**
 * Uploads multiple files to the document service
 * @param files - Array of files to upload
 * @param trialId - Trial ID for the document
 * @param documentType - Type of document (e.g., "SAND_PROPERTIES")
 * @param uploadedBy - Username of the uploader
 * @param remarks - Optional remarks for all files
 * @returns Promise resolving to array of upload results
 */
export const uploadFiles = async (
    files: File[],
    trialId: number | string,
    documentType: string,
    uploadedBy: string,
    remarks: string = ''
): Promise<UploadResult[]> => {
    const uploadResults: UploadResult[] = [];

    for (const file of files) {
        try {
            const base64String = await convertFileToBase64(file);

            const response = await documentService.uploadDocument(
                trialId,
                documentType,
                file.name,
                base64String,
                uploadedBy,
                new Date().toISOString(),
                remarks
            );

            if (response.ok) {
                uploadResults.push({
                    fileName: file.name,
                    success: true
                });
            } else {
                const errorText = await response.text();
                uploadResults.push({
                    fileName: file.name,
                    success: false,
                    error: `Upload failed: ${errorText}`
                });
            }
        } catch (error) {
            uploadResults.push({
                fileName: file.name,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    return uploadResults;
};
