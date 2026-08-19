// details: optional array of short strings describing dependent records
// that will also be deleted (e.g. "1 Opportunity", "3 Follow-Ups") - see
// utils/deleteImpact.js, which builds this from the backend's delete-impact
// preview. warning: optional stronger callout shown above that list (e.g.
// "This Lead has progressed to a Won Customer..."). Both are omitted for a
// record with no dependents, which just shows the plain message - see the
// task's "if there are no dependencies, a simple confirmation is fine."
export default function DeleteModal({
    show,
    title,
    message,
    details = [],
    warning = null,
    onClose,
    onConfirm,
}) {

    if (!show) return null;

    return (

        <>
            <div
                className="modal fade show"
                style={{ display: "block" }}
                tabIndex="-1"
            >
                <div className="modal-dialog modal-dialog-centered">

                    <div className="modal-content">

                        <div className="modal-header">

                            <h5 className="modal-title text-danger">

                                <i className="bi bi-trash3-fill me-2"></i>

                                {title}

                            </h5>

                            <button
                                className="btn-close"
                                onClick={onClose}
                            ></button>

                        </div>

                        <div className="modal-body">

                            <p className="mb-2">

                                {message}

                            </p>

                            {warning && (
                                <div className="alert alert-warning py-2 px-3 mb-2">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    {warning}
                                </div>
                            )}

                            {details.length > 0 && (
                                <>
                                    <p className="mb-1 fw-semibold">This will also delete:</p>
                                    <ul className="mb-2">
                                        {details.map((line) => (
                                            <li key={line}>{line}</li>
                                        ))}
                                    </ul>
                                </>
                            )}

                            <small className="text-muted">

                                This action cannot be undone.

                            </small>

                        </div>

                        <div className="modal-footer">

                            <button
                                className="btn btn-secondary"
                                onClick={onClose}
                            >
                                Cancel
                            </button>

                            <button
                                className="btn btn-danger"
                                onClick={onConfirm}
                            >
                                <i className="bi bi-trash me-2"></i>

                                Delete
                            </button>

                        </div>

                    </div>

                </div>
            </div>

            <div className="modal-backdrop fade show"></div>

        </>

    );

}