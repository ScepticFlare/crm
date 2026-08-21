import { useEffect, useState } from "react";

import DocumentUploadModal from "../components/email/DocumentUploadModal";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import StatusBadge from "../components/ui/StatusBadge";

import { downloadBlob } from "../utils/downloadFile";

import {
    getDocuments,
    uploadDocument,
    deactivateDocument,
    downloadDocument,
} from "../services/documentService";

const CATEGORY_LABELS = {
    PRODUCT_BROCHURE: "Product Brochure",
    COMPANY_PROFILE: "Company Profile",
    GENERAL: "General",
};

// Admin-only management for documents attachable to Lead emails (product
// brochures, company profile, general files) - the counterpart to
// pages/EmailTemplates.jsx. Same page shell convention as
// Products.jsx/MasterPage.jsx, bespoke rather than generic since documents
// need a file upload + category + optional product link.
export default function Documents() {

    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {

        try {

            setLoading(true);

            const data = await getDocuments();

            setDocuments(data);

        } catch (err) {

            console.error(err);
            alert("Unable to load documents.");

        } finally {

            setLoading(false);

        }

    }

    async function handleUpload({ file, category, productId }) {

        try {

            setSaving(true);

            await uploadDocument({ file, category, productId });

            setShowModal(false);

            await loadData();

        } catch (err) {

            console.error(err);
            alert(err.response?.data?.message || "Unable to upload the document.");

        } finally {

            setSaving(false);

        }

    }

    async function handleDeactivate(document) {

        if (!window.confirm(`Deactivate "${document.fileName}"? It can no longer be attached to new emails.`)) {
            return;
        }

        try {

            await deactivateDocument(document.id);

            // No reactivate endpoint exists for documents (unlike email
            // templates) - once deactivated it's gone for good, so removing
            // it from view matches what actually happened rather than
            // leaving a dead-end "Deactivate" button behind.
            setDocuments((prev) => prev.filter((d) => d.id !== document.id));

        } catch (err) {

            console.error(err);
            alert("Unable to deactivate the document.");

        }

    }

    async function handleDownload(document) {

        try {

            const blob = await downloadDocument(document.id);
            downloadBlob(blob, document.fileName);

        } catch (err) {

            console.error(err);
            alert("Unable to download the document.");

        }

    }

    return (

        <div className="container-fluid">

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>
                    <h2 className="fw-bold mb-1">Documents</h2>
                    <p className="text-muted mb-0">
                        Product brochures, company profile and other files available to attach to Lead emails.
                    </p>
                </div>

                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <i className="bi bi-upload me-2"></i>
                    Upload Document
                </button>

            </div>

            <div className="card shadow-sm border-0">

                <div className="table-responsive">

                    <table className="table table-hover align-middle mb-0">

                        <thead className="table-light">
                            <tr>
                                <th>File</th>
                                <th>Category</th>
                                <th>Product</th>
                                <th>Uploaded By</th>
                                <th>Status</th>
                                <th width="150">Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {loading ? (

                                <tr><td colSpan="6"><LoadingState /></td></tr>

                            ) : documents.length === 0 ? (

                                <tr>
                                    <td colSpan="6">
                                        <EmptyState
                                            title="No Documents Found"
                                            message='Click "Upload Document" to add your first one.'
                                        />
                                    </td>
                                </tr>

                            ) : (

                                documents.map((doc) => (

                                    <tr key={doc.id}>

                                        <td>{doc.fileName}</td>

                                        <td>{CATEGORY_LABELS[doc.category] || doc.category}</td>

                                        <td>{doc.product?.name || "-"}</td>

                                        <td>{doc.uploadedByName || "-"}</td>

                                        <td>
                                            <StatusBadge status={doc.isActive ? "Active" : "Inactive"} />
                                        </td>

                                        <td>

                                            <div className="btn-group">

                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    title="Download"
                                                    onClick={() => handleDownload(doc)}
                                                >
                                                    <i className="bi bi-download"></i>
                                                </button>

                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    title="Deactivate"
                                                    onClick={() => handleDeactivate(doc)}
                                                >
                                                    <i className="bi bi-slash-circle"></i>
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

            <DocumentUploadModal
                show={showModal}
                saving={saving}
                onSave={handleUpload}
                onClose={() => setShowModal(false)}
            />

        </div>

    );

}
