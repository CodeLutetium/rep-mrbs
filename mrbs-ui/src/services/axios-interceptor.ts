import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api/v1',
    timeout: 5000,
});


export default axiosInstance;


