import { useState } from "react";
import { createActivityType } from "../services/activityTypeService";

export default function ActivityTypeModal({
    show,
    onClose,
    onCreated
}) {

    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);

    if (!show) return null;

    async function handleSave() {

        if (!name.trim()) {
            alert("Please enter an activity name.");
            return;
        }

        try {

            setSaving(true);

            const activity = await createActivityType({
                name: name.trim()
            });

            setName("");

            onCreated(activity);

            onClose();

        } catch (err) {

            console.error(err);

            alert(
                err?.response?.data?.message ||
                "Unable to create activity."
            );

        } finally {

            setSaving(false);

        }

    }

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
                                Add Activity Type
                            </h5>

                            <button
                                className="btn-close"
                                onClick={onClose}
                            />

                        </div>

                        <div className="modal-body">

                            <label className="form-label">
                                Activity Name
                            </label>

                            <input
                                className="form-control"
                                placeholder="Example: Installation"
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
                                onClick={handleSave}
                            >
                                {saving ? "Saving..." : "Save"}
                            </button>

                        </div>

                    </div>

                </div>

            </div>

            <div
                className="modal-backdrop fade show"
            ></div>

        </>

    );

}