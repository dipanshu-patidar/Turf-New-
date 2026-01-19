import axiosInstance from './axiosInstance';

/**
 * Service for fetching dashboard analytics and KPI metrics
 */
const dashboardService = {
    /**
     * Get summary cards data (KPIs)
     */
    getSummary: async () => {
        const response = await axiosInstance.get('/admin/dashboard/summary');
        return response.data;
    },

    /**
     * Get monthly revenue trend data for line charts
     */
    getMonthlyRevenue: async () => {
        const response = await axiosInstance.get('/admin/dashboard/monthly-revenue');
        return response.data;
    },

    /**
     * Get payment status breakdown for pie charts
     */
    getPaymentStatus: async () => {
        const response = await axiosInstance.get('/admin/dashboard/payment-status');
        return response.data;
    },

    /**
     * Get weekly earnings breakdown for bar charts
     */
    getWeeklyEarnings: async () => {
        const response = await axiosInstance.get('/admin/dashboard/weekly-earnings');
        return response.data;
    }
};

export default dashboardService;
