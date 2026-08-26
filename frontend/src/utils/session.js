// Single source of truth for "is there a usable login session, and how do
// we tear a dead one down". Shared by the Axios layer (services/api.js) and
// the route guard (routes/ProtectedRoute.jsx) so both agree on what
// "logged in" means - a token string on its own is not enough, it also has
// to be unexpired.

import { jwtDecode } from "jwt-decode";

// Every key a successful login writes (see pages/Login.jsx).
const SESSION_KEYS = ["token", "role", "employeeId", "employeeName"];

export function getToken() {
    return localStorage.getItem("token");
}

// True only when a token exists AND its exp claim is still in the future.
// A stale 24h JWT sitting in localStorage must not count as "logged in":
// that is what previously kept the app in a fake authenticated state that
// a page refresh could not clear.
export function hasLiveSession() {

    const token = getToken();

    if (!token) {
        return false;
    }

    try {

        const { exp } = jwtDecode(token);

        // exp is seconds since epoch; a token with no exp is treated as
        // unusable rather than "never expires".
        return typeof exp === "number" && exp * 1000 > Date.now();

    } catch {

        // Unparseable / malformed token - no session.
        return false;

    }
}

// Wipes all client-side session state. Safe to call repeatedly.
export function clearSession() {
    SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
}
