import axiosInstance from "./axiosInstance";

/**
 * Service to handle reports related API calls
 */
const reportService = {
    /**
     * Fetch daily report data
     * @param {Object} params - { date, courtId }
     */
    getDailyReport: async (params) => {
        const response = await axiosInstance.get('/admin/reports/daily', { params });
        return response.data;
    },

    /**
     * Fetch monthly report data
     * @param {Object} params - { month }
     */
    getMonthlyReport: async (params) => {
        const response = await axiosInstance.get('/admin/reports/monthly', { params });
        return response.data;
    },

    /**
     * Fetch revenue report data
     * @param {Object} params - { from, to }
     */
    getRevenueReport: async (params) => {
        const response = await axiosInstance.get('/admin/reports/revenue', { params });
        return response.data;
    },

    /**
     * Fetch pending balance report data
     */
    getPendingReport: async () => {
        const response = await axiosInstance.get('/admin/reports/pending');
        return response.data;
    },

    /**
     * Fetch recurring booking report data
     * @param {Object} params - { from, to }
     */
    getRecurringReport: async (params) => {
        const response = await axiosInstance.get('/admin/reports/recurring', { params });
        return response.data;
    },

    /**
     * Fetch list of courts for filters
     */
    getCourts: async () => {
        const response = await axiosInstance.get('/courts');
        return response.data;
    }
};

export default reportService;
