import { NavLink } from "react-router-dom";

export default function Sidebar() {

    const role = localStorage.getItem("role");

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
            name: "Opportunities",
            path: "/opportunities",
            icon: "bi-briefcase-fill",
        },

        {
            name: "In Progress",
            path: "/opportunities/in-progress",
            icon: "bi bi-hourglass-split"
        },
        
        
        {
            name: "Postponed",
            path: "/opportunities/postponed",
            icon: "bi bi-pause-circle"
        },

        {
            name: "Customers",
            path: "/customers",
            icon: "bi-people-fill",
        },

        

        {
            name: "Follow Ups",
            path: "/followups",
            icon: "bi-calendar-check",
        },
        

    ];

    if (role === "ADMIN") {

        menuItems.push({
            name: "Employees",
            path: "/employees",
            icon: "bi-person-badge-fill",
        });

        menuItems.push({
            name: "Import Leads",
            path: "/import-leads",
            icon: "bi-file-earmark-arrow-up-fill",
        });

        menuItems.push({
            
            name: "Reports",
            path: "/reports",
            icon: "bi-bar-chart-fill",
        
        });

    }

    return (

        <aside
    className="sidebar"
    style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
    }}
>

            <div className="logo">
                Compact<span>CRM</span>
            </div>

            <div
            className="mt-4"
                style={{
                    flex: 1,
                    overflowY: "auto",
                }}
            >

                {menuItems.map((item) => (

                    <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/opportunities"}
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

            <div className="mt-auto p-3">
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