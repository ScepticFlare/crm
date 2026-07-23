import { useNavigate } from "react-router-dom";

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

    const logout = () => {

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
                    className="btn btn-light rounded-circle me-3"
                    style={{
                        width: "42px",
                        height: "42px",
                        border: "1px solid #e5e7eb"
                    }}
                >

                    <i className="bi bi-bell"></i>

                </button>

                <div
                    className="d-flex align-items-center me-4"
                    style={{ cursor: "pointer" }}
                >

                    <div
                        style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "50%",
                            background: "#2563eb",
                            color: "white",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            fontWeight: "bold",
                            marginRight: "10px"
                        }}
                    >

                        {initial}

                    </div>

                    <div>

                        <div
                            style={{
                                fontWeight: 600,
                                fontSize: "15px"
                            }}
                        >

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