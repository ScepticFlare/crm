import { useEffect, useRef, useState } from "react";

import MergeFieldPicker from "../email/MergeFieldPicker";
import { previewWhatsAppTemplate } from "../../services/whatsappTemplateService";

const MAX_LENGTH = 4096;

// Admin editor for a CRM WhatsApp template. The admin writes the text and
// inserts {{fields}} with the same "Insert field" picker as email templates;
// the preview beside it is rendered by the SERVER with clearly-labelled sample
// data, so what is shown is exactly what the renderer will do. Problems
// (unsupported fields, stray braces, too long) are listed and saving is blocked
// until they are fixed - the server enforces the same rules.
export default function WhatsAppTemplateFormModal({ show, template, ...props }) {

    // Mounted only while open, and remounted per template, so every opening
    // starts from that template's values (no state to reset).
    return show ? <TemplateForm key={template?.id ?? "new"} template={template} {...props} /> : null;
}

function TemplateForm({ template, saving, error, onClose, onSave }) {

    const [name, setName] = useState(template?.name || "");
    const [description, setDescription] = useState(template?.description || "");
    const [body, setBody] = useState(template?.body || "");
    const [result, setResult] = useState(null);   // { body, preview } of the last server preview
    const [previewError, setPreviewError] = useState(null);

    const bodyRef = useRef(null);

    // Debounced server preview while typing; state is only set in the callbacks.
    useEffect(() => {

        if (!body.trim()) {
            return undefined;
        }

        let live = true;

        const handle = setTimeout(() => {
            previewWhatsAppTemplate({ body })
                .then((p) => { if (live) { setResult({ body, preview: p }); setPreviewError(null); } })
                .catch(() => { if (live) setPreviewError("The preview could not be loaded."); });
        }, 400);

        return () => {
            live = false;
            clearTimeout(handle);
        };

    }, [body]);

    // Only a preview of the CURRENT text is shown (none for an empty message).
    const preview = body.trim() && result?.body === body ? result.preview : null;

    const issues = preview?.issues || [];
    const canSave = name.trim() && body.trim() && body.length <= MAX_LENGTH && issues.length === 0 && !saving;

    return (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,0.4)" }}>
            <div className="modal-dialog modal-xl">
                <div className="modal-content">

                    <div className="modal-header">
                        <h5 className="modal-title">{template ? "Edit WhatsApp template" : "New WhatsApp template"}</h5>
                        <button type="button" className="btn-close" aria-label="Close" onClick={onClose} disabled={saving}></button>
                    </div>

                    <div className="modal-body">

                        {error && <div className="alert alert-danger py-2">{error}</div>}

                        <div className="row g-4">

                            <div className="col-lg-6">

                                <div className="mb-3">
                                    <label className="form-label fw-semibold" htmlFor="wat-name">Template name</label>
                                    <input id="wat-name" className="form-control" maxLength={150} value={name}
                                           onChange={(e) => setName(e.target.value)} />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold" htmlFor="wat-description">Description (internal)</label>
                                    <input id="wat-description" className="form-control" maxLength={500} value={description}
                                           onChange={(e) => setDescription(e.target.value)} />
                                </div>

                                <div className="d-flex justify-content-between align-items-end mb-1">
                                    <label className="form-label fw-semibold mb-0" htmlFor="wat-body">Message</label>
                                    <MergeFieldPicker target="OPPORTUNITY" inputRef={bodyRef} value={body} onChange={setBody}
                                                      label="Insert field into the message" />
                                </div>

                                <textarea id="wat-body" ref={bodyRef} className="form-control" rows={9} value={body}
                                          onChange={(e) => setBody(e.target.value)} />

                                <div className={`small mt-1 ${body.length > MAX_LENGTH ? "text-danger" : "text-muted"}`}>
                                    {body.length} / {MAX_LENGTH} characters. Fields are filled in separately for every recipient from their own record.
                                    "Opportunity title" only works when messaging opportunities.
                                </div>

                            </div>

                            <div className="col-lg-6">

                                <div className="fw-semibold mb-1">Preview</div>
                                <div className="small text-muted mb-2">Rendered by the server with sample data (not a real customer).</div>

                                <div className="border rounded p-3 bg-light" data-testid="wat-preview" style={{ whiteSpace: "pre-wrap", minHeight: 120 }}>
                                    {preview ? preview.renderedText : <span className="text-muted">Start typing to see the message.</span>}
                                </div>

                                {previewError && <div className="small text-danger mt-2">{previewError}</div>}

                                {issues.length > 0 && (
                                    <div className="alert alert-warning py-2 mt-3 mb-0">
                                        <div className="fw-semibold">Fix before saving:</div>
                                        <ul className="mb-0">{issues.map((i) => <li key={i}>{i}</li>)}</ul>
                                    </div>
                                )}

                                {preview?.fields?.length > 0 && (
                                    <details className="mt-3">
                                        <summary className="small">Sample values used</summary>
                                        <table className="table table-sm small mt-2 mb-0">
                                            <tbody>
                                                {preview.fields.map((f) => (
                                                    <tr key={f.key}><td><code>{`{{${f.key}}}`}</code></td><td>{f.label}</td><td>{f.value}</td></tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </details>
                                )}

                                <p className="small text-muted mt-3 mb-0">
                                    These are CRM templates for messages sent through the CRM's WhatsApp connection. They are not
                                    submitted to or approved by WhatsApp / Meta.
                                </p>

                            </div>

                        </div>

                    </div>

                    <div className="modal-footer">
                        <button className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>Cancel</button>
                        <button className="btn btn-success" disabled={!canSave}
                                onClick={() => onSave({ name: name.trim(), description: description.trim() || null, body })}>
                            {saving ? "Saving…" : "Save template"}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
