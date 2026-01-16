/**
 * IP Address Service
 * Provides utility function to fetch user's public IP address
 */

const IP_API_URL = 'https://api.ipify.org?format=json';

export const ipService = {
    /**
     * Fetches the user's public IP address
     * @returns Promise resolving to the IP address string, or "Offline" on failure
     */
    async getUserIP(): Promise<string> {
        try {
            const response = await fetch(IP_API_URL);
            const data = await response.json();
            return data.ip || 'Unknown';
        } catch (error) {
            console.error('Failed to fetch IP address:', error);
            return 'Offline';
        }
    }
};
