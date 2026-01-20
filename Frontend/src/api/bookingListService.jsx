import axiosInstance from "./axiosInstance";

/**
 * Service to handle staff/management booking list related API calls
 */
const bookingListService = {
    /**
     * Get list of manual bookings
     * @param {Object} params - date, fromDate, toDate, courtId, paymentStatus, page, limit
     */
    getBookings: async (params) => {
        const response = await axiosInstance.get('/staff/bookings', { params });
        return response.data;
    },

    /**
     * Get single booking details
     */
    getBookingById: async (id) => {
        const response = await axiosInstance.get(`/staff/bookings/${id}`);
        return response.data;
    },

    /**
     * Update a booking (Limited fields for staff)
     */
    updateBooking: async (id, data) => {
        const response = await axiosInstance.put(`/staff/bookings/${id}`, data);
        return response.data;
    },

    /**
     * Cancel a booking
     */
    cancelBooking: async (id) => {
        const response = await axiosInstance.patch(`/staff/bookings/${id}/cancel`);
        return response.data;
    },

    /**
     * Delete a booking permanently
     */
    deleteBooking: async (id) => {
        const response = await axiosInstance.delete(`/staff/bookings/${id}`);
        return response.data;
    }
};

export default bookingListService;
