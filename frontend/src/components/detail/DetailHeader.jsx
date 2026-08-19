import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../ui/StatusBadge";

// Shared header for every record-detail page (Leads/Opportunities/
// Customers/FollowUps): Back, name, status badge, an optional primary
// workflow action (e.g. Convert to Opportunity), Edit, and a "..." menu for
// secondary/destructive actions (e.g. Delete). One implementation so the
// Phase 7 visual pass only has to happen once.
export default function DetailHeader({
    backTo,
    backLabel = "Back",
    title,
    subtitle,
    status,
    meta,
    primaryAction,
    onEdit,
    menuItems = [],
}) {

    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {

        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);

    }, []);

    return (

        <div className="card border-0 shadow-sm mb-4 detail-header">

            <div className="card-body">

                <button
                    type="button"
                    className="btn btn-link p-0 mb-3 text-decoration-none detail-back-link"
                    onClick={() => navigate(backTo)}
                >
                    <i className="bi bi-arrow-left me-1"></i>
                    {backLabel}
                </button>

                <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">

                    <div>

                        <div className="d-flex flex-wrap align-items-center gap-2">

                            <h2 className="fw-bold mb-0 detail-title">{title}</h2>

                            {status && <StatusBadge status={status} className="px-3 py-2" />}

                        </div>

                        {subtitle && <h6 className="text-muted mt-1 mb-0 fw-normal">{subtitle}</h6>}

                        {meta && <small className="text-muted d-block mt-1">{meta}</small>}

                    </div>

                    <div className="d-flex align-items-center gap-2 flex-shrink-0">

                        {primaryAction && (
                            <button
                                type="button"
                                className={`btn ${primaryAction.variant || "btn-success"}`}
                                disabled={primaryAction.disabled}
                                title={primaryAction.title || ""}
                                onClick={primaryAction.onClick}
                            >
                                {primaryAction.icon && <i className={`bi ${primaryAction.icon} me-2`}></i>}
                                {primaryAction.label}
                            </button>
                        )}

                        {onEdit && (
                            <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={onEdit}
                            >
                                <i className="bi bi-pencil me-2"></i>
                                Edit
                            </button>
                        )}

                        {menuItems.length > 0 && (
                            <div className="dropdown" ref={menuRef}>

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    aria-label="More actions"
                                    onClick={() => setMenuOpen((v) => !v)}
                                >
                                    <i className="bi bi-three-dots"></i>
                                </button>

                                {menuOpen && (
                                    <ul
                                        className="dropdown-menu dropdown-menu-end show"
                                        style={{ right: 0, left: "auto" }}
                                    >
                                        {menuItems.map((item) => (
                                            <li key={item.label}>
                                                <button
                                                    type="button"
                                                    className={`dropdown-item ${item.danger ? "text-danger" : ""}`}
                                                    disabled={item.disabled}
                                                    onClick={() => {
                                                        setMenuOpen(false);
                                                        item.onClick();
                                                    }}
                                                >
                                                    {item.icon && <i className={`bi ${item.icon} me-2`}></i>}
                                                    {item.label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                            </div>
                        )}

                    </div>

                </div>

            </div>

        </div>

    );

}
