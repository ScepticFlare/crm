import { Navigate } from "react-router-dom";

// Same rationale/pattern as AdminRoute: backend is the source of truth
// (ActivityLogService enforces ADMIN=all/MANAGER=own+team/EMPLOYEE=own via
// AccessControlService regardless of what the frontend does) - this is a
// UX/defense-in-depth guard only, so a plain Employee navigating directly
// to an Admin/Manager-only URL doesn't land on a page whose data will just
// come back empty/403 anyway.
export default function ManagerOrAdminRoute({ children }) {

    const role = localStorage.getItem("role");

    if (role !== "ADMIN" && role !== "MANAGER") {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
