import { useEffect, useState } from "react";

import EmailTemplateFormModal from "../components/email/EmailTemplateFormModal";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";

import {
    getEmailTemplates,
    createEmailTemplate,
    updateEmailTemplate,
    deactivateEmailTemplate,
    activateEmailTemplate,
} from "../services/emailTemplateService";

const TYPE_LABELS = {
    PRODUCT_BROCHURE: "Product Brochure",
    KEEP_IN_TOUCH: "Keep in Touch",
};

// Admin-only management for the shared email template library used by the
// Lead email composer (components/email/EmailComposerModal.jsx and
// BulkKeepInTouchModal.jsx). Styled like pages/Products.jsx/MasterPage.jsx
// (header + card + table + modal) but bespoke rather than built on the
// generic MasterPage/MasterModal, since templates have several fields
// (subject/body/type/default) instead of just a name.
export default function EmailTemplates() {

    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {

        try {

            setLoading(true);

            // No type filter - lists every active template (both types) for
            // management.
            const data = await getEmailTemplates();

            setTemplates(data);

        } catch (err) {

            console.error(err);
            alert("Unable to load email templates.");

        } finally {

            setLoading(false);

        }

    }

    async function handleSave(form) {

        try {

            setSaving(true);

            if (editing) {
                await updateEmailTemplate(editing.id, form);
            } else {
                await createEmailTemplate(form);
            }

            setShowModal(false);
            setEditing(null);

            await loadData();

        } catch (err) {

            console.error(err);
            alert(err.response?.data?.message || "Unable to save the template.");

        } finally {

            setSaving(false);

        }

    }

    // GET /api/email-templates only ever returns active templates, so a
    // full reload after deactivating would make the row disappear with no
    // way to find it again to reactivate. Toggling the row in place instead
    // keeps it (and its Reactivate button) visible for the rest of this
    // session - a fresh page load still won't show already-deactivated
    // templates, which matches how Products/MasterPage behaves today too.
    async function handleToggleActive(template) {

        try {

            if (template.isActive) {

                if (!window.confirm(`Deactivate "${template.name}"?`)) {
                    return;
                }

                await deactivateEmailTemplate(template.id);

            } else {

                await activateEmailTemplate(template.id);

            }

            setTemplates((prev) =>
                prev.map((t) => (t.id === template.id ? { ...t, isActive: !t.isActive } : t))
            );

        } catch (err) {

            console.error(err);
            alert("Unable to update the template's status.");

        }

    }

    return (

        <div className="container-fluid">

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>
                    <h2 className="fw-bold mb-1">Email Templates</h2>
                    <p className="text-muted mb-0">
                        Reusable templates for Product Brochure and Keep in Touch emails sent from the Leads page.
                    </p>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={() => { setEditing(null); setShowModal(true); }}
                >
                    <i className="bi bi-plus-lg me-2"></i>
                    Add Template
                </button>

            </div>

            <div className="card shadow-sm border-0">

                <div className="table-responsive">

                    <table className="table table-hover align-middle mb-0">

                        <thead className="table-light">
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Subject</th>
                                <th>Default</th>
                                <th>Status</th>
                                <th width="180">Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {loading ? (

                                <tr><td colSpan="6"><LoadingState /></td></tr>

                            ) : templates.length === 0 ? (

                                <tr>
                                    <td colSpan="6">
                                        <EmptyState
                                            title="No Templates Found"
                                            message='Click "Add Template" to create your first one.'
                                        />
                                    </td>
                                </tr>

                            ) : (

                                templates.map((t) => (

                                    <tr key={t.id}>

                                        <td>{t.name}</td>

                                        <td>{TYPE_LABELS[t.type] || t.type}</td>

                                        <td className="text-truncate" style={{ maxWidth: "250px" }}>
                                            {t.subject}
                                        </td>

                                        <td>
                                            {t.isDefault && <span className="badge bg-info">Default</span>}
                                        </td>

                                        <td>
                                            <StatusBadge status={t.isActive ? "Active" : "Inactive"} />
                                        </td>

                                        <td>

                                            <div className="btn-group">

                                                <button
                                                    className="btn btn-sm btn-warning"
                                                    onClick={() => { setEditing(t); setShowModal(true); }}
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </button>

                                                <button
                                                    className={`btn btn-sm ${t.isActive ? "btn-danger" : "btn-success"}`}
                                                    onClick={() => handleToggleActive(t)}
                                                    title={t.isActive ? "Deactivate" : "Reactivate"}
                                                >
                                                    <i className={`bi ${t.isActive ? "bi-slash-circle" : "bi-check-circle"}`}></i>
                                                </button>

                                            </div>

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

            <EmailTemplateFormModal
                show={showModal}
                editing={editing}
                saving={saving}
                onSave={handleSave}
                onClose={() => { setShowModal(false); setEditing(null); }}
            />

        </div>

    );

}
