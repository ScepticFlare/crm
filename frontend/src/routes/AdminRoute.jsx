import { Navigate } from "react-router-dom";

// Backend is the source of truth (EmployeeService requires EMPLOYEE_MANAGE
// for these operations, and Report/Import endpoints are ADMIN-only) - this
// is a UX/defense-in-depth guard only, so a Manager/Employee navigating
// directly to an admin-only URL doesn't land on a page whose actions will
// just 403 anyway.
export default function AdminRoute({ children }) {

    const role = localStorage.getItem("role");

    if (role !== "ADMIN") {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
