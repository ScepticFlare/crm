import { useEffect, useState } from "react";

export default function MasterModal({
    show,
    title,
    initialValue = "",
    saving,
    onSave,
    onClose
}) {

    const [name, setName] = useState("");

    useEffect(() => {
        setName(initialValue);
    }, [initialValue]);

    if (!show) return null;

    return (
        <>
            <div
                className="modal fade show"
                style={{ display: "block" }}
            >
                <div className="modal-dialog">

                    <div className="modal-content">

                        <div className="modal-header">

                            <h5 className="modal-title">

                                {initialValue
                                    ? `Edit ${title}`
                                    : `Add ${title}`}

                            </h5>

                            <button
                                className="btn-close"
                                onClick={onClose}
                            />

                        </div>

                        <div className="modal-body">

                            <label className="form-label">

                                {title} Name

                            </label>

                            <input
                                className="form-control"
                                value={name}
                                onChange={(e) =>
                                    setName(e.target.value)
                                }
                            />

                        </div>

                        <div className="modal-footer">

                            <button
                                className="btn btn-secondary"
                                onClick={onClose}
                            >
                                Cancel
                            </button>

                            <button
                                className="btn btn-primary"
                                disabled={saving}
                                onClick={() => onSave(name)}
                            >
                                {saving ? "Saving..." : "Save"}
                            </button>

                        </div>

                    </div>

                </div>

            </div>

            <div className="modal-backdrop fade show"></div>

        </>
    );

}