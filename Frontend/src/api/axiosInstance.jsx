import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        // Automatically attach JWT token from localStorage
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        // Handle error
        return Promise.reject(error);
    }
);

export default axiosInstance;
