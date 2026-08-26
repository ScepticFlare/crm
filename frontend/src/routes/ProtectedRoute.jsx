import { Navigate } from "react-router-dom";

import { hasLiveSession, clearSession } from "../utils/session";

export default function ProtectedRoute({ children }) {

    // Presence of a token is not enough - an expired or malformed one must
    // not keep the user "inside" the app, otherwise every API call 401s and
    // even a refresh can't get them out. Checking the token here means a
    // returning user with a dead token lands on the login page immediately,
    // before a single request is attempted.
    if (!hasLiveSession()) {
        clearSession();
        return <Navigate to="/" replace />;
    }

    return children;
}
