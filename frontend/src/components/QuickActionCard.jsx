export default function QuickActionCard({
    icon,
    title,
    onClick
}) {
    return (
        <button
            className="btn btn-light border rounded-4 w-100 p-3 d-flex align-items-center shadow-sm quick-action-btn"
            onClick={onClick}
        >
            <div
                className="rounded-circle bg-primary text-white d-flex justify-content-center align-items-center"
                style={{
                    width: 45,
                    height: 45,
                    fontSize: 20
                }}
            >
                <i className={`bi ${icon}`}></i>
            </div>

            <div className="ms-3 text-start">
                <div className="fw-semibold">{title}</div>
            </div>
        </button>
    );
}