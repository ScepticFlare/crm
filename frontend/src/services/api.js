import axios from "axios";

import { clearSession } from "../utils/session";

// A request that never comes back (Render free-tier cold start after
// inactivity, or the backend simply unreachable) must fail on its own
// instead of leaving a page spinner up forever. 30s clears a warm response
// and a normal cold start with room to spare; anything slower surfaces as
// an error the user can retry against a now-warm backend.
const REQUEST_TIMEOUT_MS = 30000;

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
    timeout: REQUEST_TIMEOUT_MS
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

// Once a redirect to the login page is under way, further failing
// responses from other in-flight requests must not each kick off their own.
let handlingExpiredSession = false;

// The backend returns 401 only for a genuinely absent / expired / invalid
// token (see SecurityConfig's authenticationEntryPoint). That is the single
// signal that the session is dead: clear it and get the user to the login
// page, with a full-page navigation so no component is left stranded on a
// stale loading state.
//
// 403 is deliberately left untouched - this CRM uses it for "authenticated
// but not permitted" (RBAC), which individual pages already handle. A 401
// on the login call itself is just "wrong email/password", which Login.jsx
// shows inline.
api.interceptors.response.use(
    (response) => response,
    (error) => {

        const status = error.response?.status;

        const requestUrl = (error.config?.url || "").replace(/\/+$/, "");
        const isLoginRequest = requestUrl.endsWith("/auth/login");

        if (status === 401 && !isLoginRequest && !handlingExpiredSession) {

            clearSession();

            // If we're already on the login page (e.g. a request that
            // rejected just after a redirect) there's nothing more to do.
            // Only latch the guard once an actual redirect is under way.
            if (window.location.pathname !== "/") {
                handlingExpiredSession = true;
                window.location.replace("/");
            }
        }

        return Promise.reject(error);
    }
);

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