import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api"
});

// Automatically attach JWT token. Login must NOT send a stale/expired
// token from a previous session - the backend would otherwise have to
// process it before it can even evaluate the submitted credentials.
api.interceptors.request.use((config) => {

    const isLoginRequest = config.url?.replace(/\/+$/, "").endsWith("/auth/login");

    if (isLoginRequest) {
        return config;
    }

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

// Shared shape every reusable-list fetch function (see hooks/useServerList)
// is called with: { page, size, search, sort: {field, dir}|null, filters }.
// This is the one place that turns it into query params, so every module's
// service file stays a one-line wrapper instead of repeating the mapping.
export const toListParams = ({ page = 0, size = 50, search = "", sort = null, filters = {} } = {}) => ({
    page,
    size,
    search,
    sortBy: sort?.field || undefined,
    sortDir: sort?.dir || undefined,
    ...filters,
});

export default api;