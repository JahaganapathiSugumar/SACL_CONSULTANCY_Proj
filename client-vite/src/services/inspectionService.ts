/**
 * Inspection Service
 * Handles API calls for all inspection types (Metallurgical, Visual, Dimensional, etc.)
 */

const API_BASE_URL = 'http://localhost:3000/api';

export const inspectionService = {
    /**
     * Submits metallurgical inspection data
     * @param payload - Inspection data payload
     * @returns Promise resolving to API response
     */
    async submitMetallurgicalInspection(payload: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/metallurgical-inspection`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('authToken') || ''
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit metallurgical inspection');
            }

            return data;
        } catch (error) {
            console.error('Error submitting metallurgical inspection:', error);
            throw error;
        }
    },

    /**
     * Submits visual inspection data
     * @param payload - Inspection data payload
     * @returns Promise resolving to API response
     */
    async submitVisualInspection(payload: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/visual-inspection`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('authToken') || ''
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit visual inspection');
            }

            return data;
        } catch (error) {
            console.error('Error submitting visual inspection:', error);
            throw error;
        }
    },

    /**
     * Submits dimensional inspection data
     * @param payload - Inspection data payload
     * @returns Promise resolving to API response
     */
    async submitDimensionalInspection(payload: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/dimensional-inspection`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('authToken') || ''
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit dimensional inspection');
            }

            return data;
        } catch (error) {
            console.error('Error submitting dimensional inspection:', error);
            throw error;
        }
    },

    /**
     * Submits machine shop inspection data
     * @param payload - Inspection data payload
     * @returns Promise resolving to API response
     */
    async submitMachineShopInspection(payload: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/machine-shop`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('authToken') || ''
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit machine shop inspection');
            }

            return data;
        } catch (error) {
            console.error('Error submitting machine shop inspection:', error);
            throw error;
        }
    },

    /**
     * Submits pouring details data
     * @param payload - Pouring details payload
     * @returns Promise resolving to API response
     */
    async submitPouringDetails(payload: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/pouring-details`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to save pouring details');
            }

            return data;
        } catch (error) {
            console.error('Error saving pouring details:', error);
            throw error;
        }
    },

    /**
     * Submits sand properties data
     * @param payload - Sand properties payload
     * @returns Promise resolving to API response
     */
    async submitSandProperties(payload: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/sand-properties`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('authToken') || ''
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => null);

            if (!response.ok || !data?.success) {
                throw new Error(data?.message || 'Failed to submit sand properties');
            }

            return data;
        } catch (error) {
            console.error('Error submitting sand properties:', error);
            throw error;
        }
    },

    /**
     * Submits moulding correction data
     * @param payload - Moulding correction payload
     * @returns Promise resolving to API response
     */
    async submitMouldingCorrection(payload: any): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/moulding-correction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('authToken') || ''
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => null);

            if (!response.ok || !data?.success) {
                throw new Error(data?.message || 'Failed to save mould correction');
            }

            return data;
        } catch (error) {
            console.error('Error submitting moulding correction:', error);
            throw error;
        }
    }
};
