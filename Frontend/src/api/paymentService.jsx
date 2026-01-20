import axiosInstance from './axiosInstance';

const paymentService = {
    // Get all payments with optional filters
    getPayments: async (filters) => {
        const { dateFrom, dateTo, courtId, paymentStatus } = filters;
        const response = await axiosInstance.get('/admin/payments', {
            params: {
                dateFrom,
                dateTo,
                courtId: courtId === 'All Courts' ? undefined : courtId,
                paymentStatus: paymentStatus === 'All' ? undefined : paymentStatus.toUpperCase()
            }
        });
        return response.data;
    },

    // Mark balance as paid
    markAsPaid: async (id, data) => {
        const response = await axiosInstance.patch(`/admin/payments/${id}/mark-paid`, data);
        return response.data;
    },

    // Update payment mode
    updatePaymentMode: async (id, data) => {
        const response = await axiosInstance.patch(`/admin/payments/${id}/update-mode`, data);
        return response.data;
    },

    // Get payment details
    getPaymentById: async (id) => {
        const response = await axiosInstance.get(`/admin/payments/${id}`);
        return response.data;
    }
};

export default paymentService;
