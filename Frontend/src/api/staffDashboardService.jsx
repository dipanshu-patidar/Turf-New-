import axiosInstance from './axiosInstance';

/**
 * Service for fetching Staff/Management (Operational) dashboard analytics
 */
const staffDashboardService = {
    /**
     * Get summary cards data (KPIs)
     */
    getSummary: async () => {
        const response = await axiosInstance.get('/management/dashboard/summary');
        return response.data;
    },

    /**
     * Get bookings trend (Line chart)
     */
    getBookingsPerDay: async (from, to) => {
        const response = await axiosInstance.get(`/management/dashboard/bookings-per-day?from=${from}&to=${to}`);
        return response.data;
    },

    /**
     * Get payment status distribution (Donut chart)
     */
    getPaymentStatus: async () => {
        const response = await axiosInstance.get('/management/dashboard/payment-status');
        return response.data;
    },

    /**
     * Get court utilization (Bar chart)
     */
    getCourtUtilization: async () => {
        const response = await axiosInstance.get('/management/dashboard/court-utilization');
        return response.data;
    }
};

export default staffDashboardService;
