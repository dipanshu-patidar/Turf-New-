import axiosInstance from "./axiosInstance";

/**
 * Service to handle staff booking related API calls
 */
const staffBookingService = {
    /**
     * Create a new booking (Staff/Admin)
     * @param {Object} bookingData - customerName, phoneNumber, bookingDate, startTime, endTime, courtId, sport, advancePaid, remainingBalance, paymentMode
     */
    createBooking: async (bookingData) => {
        const response = await axiosInstance.post('/staff/bookings', bookingData);
        return response.data;
    }
};

export default staffBookingService;
