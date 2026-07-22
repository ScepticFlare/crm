import { NavLink } from "react-router-dom";

export default function Sidebar() {

    const menuItems = [

        {
            name: "Dashboard",
            path: "/dashboard",
            icon: "bi-speedometer2",
        },

        {
            name: "Leads",
            path: "/leads",
            icon: "bi-person-lines-fill",
        },

        {
            name: "Customers",
            path: "/customers",
            icon: "bi-people-fill",
        },

        {
            name: "Opportunities",
            path: "/opportunities",
            icon: "bi-briefcase-fill",
        },

        {
            name: "Follow Ups",
            path: "/followups",
            icon: "bi-calendar-check",
        }

    ];

    return (

        <aside className="sidebar">

            <div className="logo">
                Compact<span>CRM</span>
            </div>

            <div className="mt-4">

                {menuItems.map((item) => (

                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            isActive
                                ? "sidebar-link active"
                                : "sidebar-link"
                        }
                    >
                        <i className={`bi ${item.icon}`}></i>

                        <span>{item.name}</span>

                    </NavLink>

                ))}

            </div>

            <div
                style={{
                    position: "absolute",
                    bottom: "30px",
                    left: "18px",
                    right: "18px",
                }}
            >

                <div
                    className="card"
                    style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "white",
                    }}
                >

                    <div className="card-body">

                        <div className="fw-bold">
                            Compact Systems
                        </div>

                        <small style={{ color: "#cbd5e1" }}>
                            CRM
                        </small>

                    </div>

                </div>

            </div>

        </aside>

    );

}