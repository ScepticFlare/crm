export default function DeleteModal({
    show,
    title,
    message,
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