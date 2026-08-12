// Single source of truth for status/stage -> badge color across the app.
// Keep this mapping in sync if a new status/stage value is introduced.
const STATUS_COLORS = {
    NEW: "primary",
    CONTACTED: "info",
    QUOTATION_SENT: "warning",
    NEGOTIATION: "dark",
    POSTPONED: "secondary",
    IN_PROGRESS: "primary",
    WON: "success",
    LOST: "danger",
    DROPPED: "secondary",
    UNRESPONSIVE: "warning",

    VALID: "success",
    INVALID: "danger",

    ACTIVE: "success",
    INACTIVE: "secondary",

    PENDING: "warning",
    COMPLETED: "success",
    MISSED: "danger",
    CANCELLED: "secondary",
};

// For callers that need the color only (e.g. a badge showing a count,
// not the status text itself) rather than the full <StatusBadge/>.
export function getStatusColor(status) {

    const key = typeof status === "string" ? status.toUpperCase() : status;

    return STATUS_COLORS[key] || "primary";

}

export default function StatusBadge({ status, className = "" }) {

    const color = getStatusColor(status);

    const label = typeof status === "string"
        ? status.replaceAll("_", " ")
        : status;

    return (

        <span className={`badge bg-${color} ${className}`.trim()}>

            {label}

        </span>

    );

}
