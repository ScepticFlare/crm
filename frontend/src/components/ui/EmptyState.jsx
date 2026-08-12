export default function EmptyState({
    icon = "bi-inbox",
    title = "No records found",
    message = "There is nothing to display.",
    action = null,
    className = "text-center py-5"
}) {

    return (

        <div className={className}>

            <i className={`bi ${icon} display-4 text-secondary`}></i>

            <h5 className="mt-3">{title}</h5>

            {message && (
                <p className={action ? "text-muted" : "text-muted mb-0"}>{message}</p>
            )}

            {action && (
                <div className="mt-2">{action}</div>
            )}

        </div>

    );

}
