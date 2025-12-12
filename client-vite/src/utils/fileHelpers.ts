import type { FileMetadata } from '../types/inspection';

/**
 * Converts a File object to metadata object
 * @param file - File object or null
 * @returns File metadata or null
 */
export const fileToMeta = (file: File | null): FileMetadata | null => {
    if (!file) return null;

    return {
        name: file.name,
        size: file.size,
        type: file.type,
    };
};

/**
 * Converts multiple files to metadata array
 * @param files - Array of File objects
 * @returns Array of file metadata
 */
export const filesToMeta = (files: File[]): FileMetadata[] => {
    return files.map(fileToMeta).filter((meta): meta is FileMetadata => meta !== null);
};

/**
 * Formats file size to human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validates if file type is allowed
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns True if file type is allowed
 */
export const isFileTypeAllowed = (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.some(type => {
        if (type.endsWith('/*')) {
            const baseType = type.split('/')[0];
            return file.type.startsWith(baseType + '/');
        }
        return file.type === type;
    });
};
