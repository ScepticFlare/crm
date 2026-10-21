import api from "./api";
import { clearAllCache } from "../utils/apiCache";

// api.js's shared default (30s) is fine for every other endpoint, but the
// login POST is the one request that can legitimately land on a cold Render
// free-tier backend (see Login.jsx / services/healthService.js) - it needs
// more room than every other authenticated call, without raising the
// shared default for those. Passed as a per-request axios config override
// here rather than changing api.js's REQUEST_TIMEOUT_MS.
const LOGIN_TIMEOUT_MS = 60000;

export async function login(email, password) {

    const response = await api.post(
        "/auth/login",
        {
            email,
            password
        },
        {
            timeout: LOGIN_TIMEOUT_MS
        }
    );

    // A different user logging in in the same tab (e.g. after a session
    // expired and the previous logout skipped, or switching accounts
    // without closing the tab) must never see the previous user's cached
    // RBAC-scoped master data - see utils/apiCache.
    clearAllCache();

    return response.data;
}