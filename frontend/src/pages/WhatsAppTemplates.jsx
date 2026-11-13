import { useEffect, useState } from "react";

import WhatsAppTemplateFormModal from "../components/whatsapp/WhatsAppTemplateFormModal";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import { formatDateTime } from "../utils/formatDate";

import {
    activateWhatsAppTemplate,
    createWhatsAppTemplate,
    deactivateWhatsAppTemplate,
    getAllWhatsAppTemplates,
    updateWhatsAppTemplate,
} from "../services/whatsappTemplateService";

// Admin-only management of CRM WhatsApp templates, laid out like
// pages/EmailTemplates.jsx. Employees choose from the active ones in Bulk
// WhatsApp and never edit the text or the {{fields}}.
export default function WhatsAppTemplates() {

    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        try {
            setLoading(true);
            setLoadError(null);
            setTemplates(await getAllWhatsAppTemplates());
        } catch (err) {
            setLoadError(err.response?.status === 403
                ? "Only an administrator can manage WhatsApp templates."
                : "Unable to load WhatsApp templates.");
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(form) {
        try {
            setSaving(true);
            setSaveError(null);
            if (editing) {
                await updateWhatsAppTemplate(editing.id, form);
            } else {
                await createWhatsAppTemplate(form);
            }
            setShowModal(false);
            setEditing(null);
            await load();
        } catch (err) {
            setSaveError(err.response?.data?.message || "The template could not be saved.");
        } finally {
            setSaving(false);
        }
    }

    async function toggleActive(t) {
        try {
            if (t.isActive) {
                await deactivateWhatsAppTemplate(t.id);
            } else {
                await activateWhatsAppTemplate(t.id);
            }
            await load();
        } catch (err) {
            setLoadError(err.response?.data?.message || "The template could not be changed.");
        }
    }

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h3 className="mb-0">WhatsApp Templates</h3>
                    <div className="text-muted small">
                        Reusable messages for Bulk WhatsApp. Fields like {"{{contactPerson}}"} are filled in from each recipient's record.
                    </div>
                </div>
                <button className="btn btn-success" onClick={() => { setEditing(null); setSaveError(null); setShowModal(true); }}>
                    <i className="bi bi-plus-lg me-1"></i>New template
                </button>
            </div>

            {loadError && <div className="alert alert-danger py-2">{loadError}</div>}

            <div className="card shadow-sm border-0">
                <div className="card-body">
                    {loading ? <LoadingState /> : templates.length === 0 ? (
                        <EmptyState message="No WhatsApp templates yet." />
                    ) : (
                        <div className="table-responsive">
                            <table className="table align-middle mb-0">
                                <thead>
                                    <tr><th>Name</th><th>Message</th><th>Version</th><th>Status</th><th>Updated</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {templates.map((t) => (
                                        <tr key={t.id}>
                                            <td>
                                                <div className="fw-semibold">{t.name}</div>
                                                {t.description && <div className="small text-muted">{t.description}</div>}
                                            </td>
                                            <td className="small" style={{ maxWidth: 380, whiteSpace: "pre-wrap" }}>
                                                {t.body.length > 160 ? `${t.body.slice(0, 160)}…` : t.body}
                                                {t.issues?.length > 0 && <div className="text-danger">{t.issues.join("; ")}</div>}
                                            </td>
                                            <td>v{t.version}</td>
                                            <td>
                                                <span className={`badge ${t.isActive ? "bg-success" : "bg-secondary"}`}>
                                                    {t.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="small">{formatDateTime(t.updatedAt)}</td>
                                            <td className="text-end text-nowrap">
                                                <button className="btn btn-sm btn-outline-primary me-2"
                                                        onClick={() => { setEditing(t); setSaveError(null); setShowModal(true); }}>
                                                    Edit
                                                </button>
                                                <button className={`btn btn-sm ${t.isActive ? "btn-outline-secondary" : "btn-outline-success"}`}
                                                        onClick={() => toggleActive(t)}>
                                                    {t.isActive ? "Deactivate" : "Activate"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <p className="small text-muted mt-3">
                Editing a template creates a new version. Batches already created keep the version they were created with.
            </p>

            <WhatsAppTemplateFormModal
                show={showModal}
                template={editing}
                saving={saving}
                error={saveError}
                onClose={() => { setShowModal(false); setEditing(null); }}
                onSave={handleSave}
            />
        </>
    );
}
