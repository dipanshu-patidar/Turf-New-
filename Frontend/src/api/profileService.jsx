import axiosInstance from "./axiosInstance";

/**
 * Service to handle profile related API calls
 */
const profileService = {
    /**
     * Fetch current admin profile
     */
    getProfile: async () => {
        const response = await axiosInstance.get('/admin/profile');
        return response.data;
    },

    /**
     * Update personal info and avatar
     * @param {FormData} formData - name, email, and optional avatar file
     */
    updateProfile: async (formData) => {
        const response = await axiosInstance.put('/admin/profile', formData, {
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
        const response = await axiosInstance.put('/admin/profile/change-password', data);
        return response.data;
    }
};

export default profileService;
