import axios from "axios";

import { clearSession } from "../utils/session";

// A request that never comes back (Render free-tier cold start after
// inactivity, or the backend simply unreachable) must fail on its own
// instead of leaving a page spinner up forever. 30s clears a warm response
// and a normal cold start with room to spare; anything slower surfaces as
// an error the user can retry against a now-warm backend.
const REQUEST_TIMEOUT_MS = 30000;

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: REQUEST_TIMEOUT_MS,
    // Multi-value filters (e.g. productId: ["1", "2"]) go out as repeated
    // keys - productId=1&productId=2 - which Spring binds to a List. (The
    // axios default, productId[]=1, would not bind.)
    paramsSerializer: { indexes: null }
});

// Render cold-start wake-up. /health is served at the backend's root, not
// under /api (see backend SecurityConfig + HealthController), so this uses
// a plain axios call against the origin rather than the `api` instance -
// that also keeps it off api's interceptors (no Authorization header, and a
// failure here must never trigger the 401/expired-session redirect below).
// Fire-and-forget: callers are not meant to await this for the UI to be
// usable, just to let it run in the background.
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export function pingHealth() {
    return axios.get(`${API_ORIGIN}/health`, { timeout: REQUEST_TIMEOUT_MS });
}

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
// Export query params for a list selection (see hooks/useServerList):
//  - null / []                        -> nothing: every matching record;
//  - [ids]                            -> ids=1,2,3 - exactly those rows;
//  - { allMatching: true, excludedIds } -> every matching record except the
//    unticked ones (excludeIds=...). The server re-applies the filters and
//    the caller's permissions, so the browser never has to load the rows.
export const selectionParams = (selection) => {

    if (!selection) {
        return {};
    }

    if (Array.isArray(selection)) {
        return selection.length > 0 ? { ids: selection.join(",") } : {};
    }

    if (selection.allMatching) {
        const excluded = selection.excludedIds || [];
        return excluded.length > 0 ? { excludeIds: excluded.join(",") } : {};
    }

    return {};

};

// An export's file, with the number of rows the server put in it (the
// X-Export-Row-Count header) attached as blob.rowCount when available.
export const withRowCount = (response) => {

    const blob = response.data;
    const count = Number(response.headers?.["x-export-row-count"]);

    if (blob && Number.isFinite(count)) {
        try {
            blob.rowCount = count;
        } catch {
            // not extensible - the count is informational only
        }
    }

    return blob;

};

export const toListParams = ({ page = 0, size = 50, search = "", sort = null, filters = {} } = {}) => ({
    page,
    size,
    search,
    sortBy: sort?.field || undefined,
    sortDir: sort?.dir || undefined,
    ...filters,
});

export default api;