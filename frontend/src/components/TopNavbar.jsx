import { useNavigate } from "react-router-dom";
import { logout as logoutRequest } from "../services/activityService";

export default function TopNavbar() {

    const navigate = useNavigate();

    const employeeName =
        localStorage.getItem("employeeName") || "User";

    const role =
        localStorage.getItem("role") || "EMPLOYEE";

    const displayName = employeeName;

    const initial =
    employeeName.length > 0
        ? employeeName.charAt(0).toUpperCase()
        : "U";

    const logout = async () => {

        // Best-effort: records the LOGOUT activity entry, but logging out
        // locally must never be blocked by a network hiccup or the token
        // already being invalid.
        try {
            await logoutRequest();
        } catch (err) {
            console.error(err);
        }

        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("employeeName");

        navigate("/");

    };

    return (

        <header className="topbar">

            {/* Left Side */}

            <div>

                <h4 className="topbar-title mb-0">
                    Compact Systems CRM
                </h4>

                <small className="text-muted">

                    {role === "ADMIN"
                        ? "Administrator"
                        : "Employee"}

                </small>

            </div>

            {/* Right Side */}

            <div className="d-flex align-items-center">

                <button
                    className="btn btn-light rounded-circle topbar-icon-btn me-3"
                >

                    <i className="bi bi-bell"></i>

                </button>

                <div
                    className="d-flex align-items-center me-4"
                    style={{ cursor: "pointer" }}
                >

                    <div className="topbar-avatar">

                        {initial}

                    </div>

                    <div>

                        <div className="fw-semibold" style={{ fontSize: "15px" }}>

                            {displayName}

                        </div>

                        <small className="text-muted">

                            {role === "ADMIN"
                                ? "Administrator"
                                : "Employee"}

                        </small>

                    </div>

                </div>

                <button
                    className="btn btn-outline-danger"
                    onClick={logout}
                >

                    <i className="bi bi-box-arrow-right me-2"></i>

                    Logout

                </button>

            </div>

        </header>

    );

}