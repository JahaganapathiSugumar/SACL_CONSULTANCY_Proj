/**
 * Generates a unique identifier with optional prefix
 * @param prefix - Optional prefix for the ID
 * @returns Unique identifier string
 */
export const generateUid = (prefix: string = ''): string => {
    return `${prefix}${Math.random().toString(36).slice(2, 9)}`;
};

/**
 * Generates multiple unique IDs
 * @param count - Number of IDs to generate
 * @param prefix - Optional prefix for each ID
 * @returns Array of unique identifiers
 */
export const generateUids = (count: number, prefix: string = ''): string[] => {
    return Array.from({ length: count }, () => generateUid(prefix));
};

/**
 * Generates a timestamp-based ID
 * @param prefix - Optional prefix for the ID
 * @returns Timestamp-based unique identifier
 */
export const generateTimestampId = (prefix: string = ''): string => {
    return `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
};
