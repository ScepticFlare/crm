import { useEffect, useState } from "react";

const TYPE_OPTIONS = [
    { value: "PRODUCT_BROCHURE", label: "Product Brochure" },
    { value: "KEEP_IN_TOUCH", label: "Keep in Touch" },
];

// Create/edit form for pages/EmailTemplates.jsx (ADMIN only). Separate from
// components/MasterModal.jsx since templates need subject/body/type/default
// fields, not just a name - MasterModal's single-field shape doesn't fit.
export default function EmailTemplateFormModal({ show, editing, saving, onSave, onClose }) {

    const [form, setForm] = useState({
        name: "", subject: "", body: "", type: "PRODUCT_BROCHURE", isDefault: false,
    });

    useEffect(() => {

        if (editing) {
            setForm({
                name: editing.name || "",
                subject: editing.subject || "",
                body: editing.body || "",
                type: editing.type || "PRODUCT_BROCHURE",
                isDefault: !!editing.isDefault,
            });
        } else {
            setForm({ name: "", subject: "", body: "", type: "PRODUCT_BROCHURE", isDefault: false });
        }

    }, [editing, show]);

    if (!show) {
        return null;
    }

    function handleChange(e) {

        const { name, value, type, checked } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));

    }

    return (

        <>

            <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">

                <div className="modal-dialog modal-lg">

                    <div className="modal-content">

                        <div className="modal-header">

                            <h5 className="modal-title">
                                {editing ? "Edit Email Template" : "Add Email Template"}
                            </h5>

                            <button className="btn-close" onClick={onClose}></button>

                        </div>

                        <div className="modal-body">

                            <div className="mb-3">
                                <label className="form-label">Name</label>
                                <input
                                    className="form-control"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="mb-3">

                                <label className="form-label">Type</label>

                                <select
                                    className="form-select"
                                    name="type"
                                    value={form.type}
                                    onChange={handleChange}
                                >
                                    {TYPE_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>

                            </div>

                            <div className="mb-3">
                                <label className="form-label">Subject</label>
                                <input
                                    className="form-control"
                                    name="subject"
                                    value={form.subject}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="mb-3">

                                <label className="form-label">Body</label>

                                <textarea
                                    className="form-control"
                                    rows="8"
                                    name="body"
                                    value={form.body}
                                    onChange={handleChange}
                                />

                                <div className="form-text">
                                    Supported placeholders: <code>{"{{contactPerson}}"}</code>,{" "}
                                    <code>{"{{companyName}}"}</code>, <code>{"{{interestedProduct}}"}</code>
                                </div>

                            </div>

                            <div className="form-check">

                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="isDefaultTemplate"
                                    name="isDefault"
                                    checked={form.isDefault}
                                    onChange={handleChange}
                                />

                                <label className="form-check-label" htmlFor="isDefaultTemplate">
                                    Use as the default template for this type
                                </label>

                            </div>

                        </div>

                        <div className="modal-footer">

                            <button className="btn btn-secondary" onClick={onClose}>
                                Cancel
                            </button>

                            <button
                                className="btn btn-primary"
                                disabled={saving || !form.name.trim() || !form.subject.trim() || !form.body.trim()}
                                onClick={() => onSave(form)}
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
