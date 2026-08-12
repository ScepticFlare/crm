import StatusBadge from "./ui/StatusBadge";

export default function DetailField({
    icon,
    label,
    value,
    badge = null,
    badgeColor = "primary",
    status = null
}) {

    const displayValue =
        value !== null &&
        value !== undefined &&
        value !== ""
            ? value
            : "-";

    const badgeValue =
        badge !== null &&
        badge !== undefined &&
        badge !== ""
            ? badge
            : "-";

    return (

        <div className="mb-3">

            <div className="text-muted small mb-1 d-flex align-items-center">

                {icon && (
                    <i className={`bi ${icon} me-2`}></i>
                )}

                <span>{label}</span>

            </div>

            {status !== null ? (

                <StatusBadge status={status} />

            ) : badge !== null ? (

                <span className={`badge bg-${badgeColor}`}>
                    {badgeValue}
                </span>

            ) : (

                <div className="fw-semibold">
                    {displayValue}
                </div>

            )}

        </div>

    );

}