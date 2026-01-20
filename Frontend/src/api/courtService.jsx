import axiosInstance from "./axiosInstance";

/**
 * Service to handle court related API calls
 */
const courtService = {
    /**
     * Fetch all courts
     */
    getCourts: async () => {
        const response = await axiosInstance.get('/courts');
        return response.data;
    },

    /**
     * Fetch a single court by ID
     */
    getCourtById: async (id) => {
        const response = await axiosInstance.get(`/courts/${id}`);
        return response.data;
    }
};

export default courtService;
