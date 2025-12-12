import { useState } from 'react';

/**
 * Custom hook for managing file uploads
 * Provides methods to add, remove, and clear files
 * 
 * @example
 * ```tsx
 * const { files, addFiles, removeFile, clearFiles } = useFileUpload();
 * 
 * const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 *   const newFiles = Array.from(e.target.files || []);
 *   addFiles(newFiles);
 * };
 * ```
 */
export function useFileUpload(initialFiles: File[] = []) {
    const [files, setFiles] = useState<File[]>(initialFiles);

    const addFiles = (newFiles: File | File[]) => {
        const filesToAdd = Array.isArray(newFiles) ? newFiles : [newFiles];
        setFiles(prev => [...prev, ...filesToAdd]);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeFileByName = (fileName: string) => {
        setFiles(prev => prev.filter(file => file.name !== fileName));
    };

    const clearFiles = () => {
        setFiles([]);
    };

    const hasFiles = files.length > 0;

    return {
        files,
        addFiles,
        removeFile,
        removeFileByName,
        clearFiles,
        hasFiles,
        fileCount: files.length
    };
}
