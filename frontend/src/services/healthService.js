import axios from "axios";

// Deliberately a separate, minimal axios instance rather than the shared
// `api` in ./api.js - GET /health is public and unauthenticated (see
// backend config.SecurityConfig), and pingHealth() must never go through
// api.js's request interceptor (which conditionally attaches a JWT) or its
// response interceptor (which redirects to login on a 401 - meaningless for
// a health check, and would be actively wrong to trigger from this page).
// Same reasoning as services/publicLeadService.js's own separate instance.
//
// Timeout is intentionally generous (not the shared 30s default) - this
// call exists specifically to tolerate a Render free-tier cold start, which
// can take significantly longer than a normal warm request. See Login.jsx
// for how this is used: fired once in the background on page load to nudge
// a sleeping backend awake before the user finishes typing credentials,
// without blocking the form or retrying on a timer.
const HEALTH_TIMEOUT_MS = 60000;

// /health is mounted at the app root (see backend HealthController), not
// under /api - VITE_API_URL points at .../api, so that suffix is stripped
// here rather than appended to.
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const ROOT_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const healthApi = axios.create({
    baseURL: ROOT_BASE_URL,
    timeout: HEALTH_TIMEOUT_MS
});

// Resolves true/false, never throws - callers only ever care "did the
// backend answer," not the specific network/timeout error, and a health
// check failing is never itself a user-facing error.
export const pingHealth = async () => {

    try {

        await healthApi.get("/health");
        return true;

    } catch {

        return false;
    }
};

export default healthApi;
