import axiosInstance from "./axiosInstance";

/**
 * Service to handle settings related API calls
 */
const settingService = {
    /**
     * Fetch centralized system configuration
     */
    getSettings: async () => {
        const response = await axiosInstance.get('/admin/settings');
        return response.data;
    },

    /**
     * Update system configuration
     * @param {Object} data - { turfName, openingTime, closingTime, weekendDays, currency }
     */
    updateSettings: async (data) => {
        const response = await axiosInstance.put('/admin/settings', data);
        return response.data;
    }
};

export default settingService;
