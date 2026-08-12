import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api"
});

// Automatically attach JWT token
api.interceptors.request.use((config) => {

    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Shared helper for the "Month" list filters: converts a "YYYY-MM" string
// (or "" for "All Months") into the { year, month } query params the
// backend list endpoints accept. Returns {} when no month is selected, so
// axios omits both params and the request is unfiltered, exactly as before.
export const monthParams = (month) => {

    if (!month) {
        return {};
    }

    const [year, monthNum] = month.split("-").map(Number);

    return { year, month: monthNum };

};

export default api;