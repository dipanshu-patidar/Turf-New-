import axiosInstance from "./axiosInstance";

/**
 * Helper to get base path based on current URL
 */
const getBasePath = () => {
    const path = window.location.pathname;
    if (path.startsWith('/management')) return '/management/profile';
    return '/admin/profile';
};

/**
 * Service to handle profile related API calls
 */
const profileService = {
    /**
     * Fetch current user profile
     */
    getProfile: async () => {
        const response = await axiosInstance.get(getBasePath());
        return response.data;
    },

    /**
     * Update personal info and avatar
     * @param {FormData} formData - name, email, and optional avatar file
     */
    updateProfile: async (formData) => {
        const response = await axiosInstance.put(getBasePath(), formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    /**
     * Secure password change
     * @param {Object} data - { oldPassword, newPassword, confirmPassword }
     */
    changePassword: async (data) => {
        const response = await axiosInstance.put(`${getBasePath()}/change-password`, data);
        return response.data;
    }
};

export default profileService;
