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
            icon: "bi-hourglass-split"
        },

        {
            name: "Postponed",
            path: "/opportunities/postponed",
            icon: "bi-pause-circle"
        },

        {
            name: "Dropped",
            path: "/dropped",
            icon: "bi-x-circle"
        },

        {
            name: "Lost",
            path: "/lost",
            icon: "bi-slash-circle"
        },

        {
            name: "Unresponsive",
            path: "/unresponsive",
            icon: "bi-telephone-x"
        },

        {
            name: "Invalid",
            path: "/invalid",
            icon: "bi-exclamation-octagon"
        },

        {
            name: "Won",
            path: "/customers",
            icon: "bi-trophy-fill",
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

        menuItems.push({

            name: "Full Report",
            path: "/full-report",
            icon: "bi-file-earmark-spreadsheet-fill",

        });

    }

    // Employee Activity is visible to Admin and Manager (Manager sees
    // their own + direct reports' activity, Admin sees everyone's - the
    // backend enforces this via AccessControlService regardless of this
    // check, see ManagerOrAdminRoute). Not exposed to a plain Employee in
    // this iteration.
    if (role === "ADMIN" || role === "MANAGER") {

        menuItems.push({
            name: "Employee Activity",
            path: "/activity",
            icon: "bi-clock-history",
        });

    }

    return (

        <aside
    className="sidebar"
    style={{
        display: "flex",
        flexDirection: "column",
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

                        <small style={{ color: "var(--color-sidebar-text)" }}>
                            CRM
                        </small>

                    </div>

                </div>

            </div>

        </aside>

    );

}