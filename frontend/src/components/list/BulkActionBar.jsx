// actions: [{ key, label, icon, variant, onClick, disabled }]
export default function BulkActionBar({ count, actions, onClear }) {

    if (count === 0) {
        return null;
    }

    return (

        <div className="d-flex align-items-center justify-content-between bulk-action-bar mb-3">

            <div className="d-flex align-items-center gap-2">
                <strong>{count} selected</strong>
                <button type="button" className="btn btn-sm btn-link p-0" onClick={onClear}>
                    Clear
                </button>
            </div>

            <div className="d-flex gap-2">

                {actions.map((action) => (

                    <button
                        key={action.key}
                        type="button"
                        className={`btn btn-sm ${action.variant || "btn-outline-primary"}`}
                        onClick={action.onClick}
                        disabled={action.disabled}
                    >
                        {action.icon && <i className={`bi ${action.icon} me-1`}></i>}
                        {action.label}
                    </button>

                ))}

            </div>

        </div>

    );

}
