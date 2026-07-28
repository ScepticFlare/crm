import axios from "axios";

const api = axios.create({
    baseURL: "https://crm-backend-bfwr.onrender.com/api"
});

// Automatically attach JWT token
api.interceptors.request.use((config) => {

    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;