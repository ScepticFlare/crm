import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import TemplateSelect from "./TemplateSelect";
import DocumentPicker from "./DocumentPicker";
import ResolvedDraftField from "./ResolvedDraftField";

import { previewLeadEmail, sendLeadEmail } from "../../services/leadEmailService";

const EMAIL_TYPES = {
    PRODUCT_BROCHURE: {
        label: "Send Product Brochure",
        description: "Share product information and the relevant brochure with this lead.",
        icon: "bi-file-earmark-richtext",
    },
    KEEP_IN_TOUCH: {
        label: "Keep in Touch",
        description: "Send a friendly check-in, optionally with the company profile attached.",
        icon: "bi-people",
    },
    AMC: {
        label: "AMC Offer",
        description: "Offer an Annual Maintenance Contract (the offer wording comes from the AMC template).",
        icon: "bi-tools",
    },
};

// Individual Lead email composer - opened from a Leads row's "..." menu
// (see components/list/RowActionsMenu.jsx via pages/Leads.jsx). Two-step:
// choose Product Brochure vs Keep in Touch, then compose. Opening a type
// only ever calls the preview endpoint (GET .../email/preview) - the send
// endpoint (POST .../email/send) is only ever called from the explicit
// Send button, per the backend's deliberate preview/send separation.
export default function EmailComposerModal({ show, lead, onClose, onSent }) {

    const navigate = useNavigate();

    const [step, setStep] = useState("choose"); // "no-email" | "choose" | "compose"
    const [type, setType] = useState(null);
    const [templateId, setTemplateId] = useState(null);
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [documentIds, setDocumentIds] = useState([]);
    // Fields the preview could not fill for this lead (left as {{...}} in
    // the draft, shown as "[... missing]"), and how each field resolves for it.
    const [issues, setIssues] = useState([]);
    const [mergeFields, setMergeFields] = useState({});

    const [loadingPreview, setLoadingPreview] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {

        if (!show || !lead) {
            return;
        }

        setType(null);
        setTemplateId(null);
        setSubject("");
        setBody("");
        setDocumentIds([]);
        setIssues([]);
        setMergeFields({});
        setError(null);

        setStep(lead.email ? "choose" : "no-email");

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show, lead?.id]);

    if (!show || !lead) {
        return null;
    }

    async function handleChooseType(chosenType) {

        setType(chosenType);
        setStep("compose");
        setLoadingPreview(true);
        setError(null);

        try {

            const preview = await previewLeadEmail(lead.id, { type: chosenType });

            setTemplateId(preview.templateId || null);
            setSubject(preview.subject || "");
            setBody(preview.body || "");
            setIssues(preview.issues || []);
            setMergeFields(preview.mergeFields || {});
            setDocumentIds(preview.suggestedDocumentIds || []);

        } catch (err) {

            // No default template configured for this type isn't fatal -
            // the user can still pick one from the dropdown or write their
            // own subject/body from a blank composer.
            console.error(err);

        } finally {

            setLoadingPreview(false);

        }

    }

    // Changing the template replaces subject/body with that template's
    // rendering for this lead. Attachments are left exactly as they are -
    // they were only ever auto-populated once, from suggestedDocumentIds on
    // the initial type choice, so a deliberate attachment selection is
    // never silently undone by switching templates afterwards.
    async function handleTemplateChange(newTemplateId) {

        setTemplateId(newTemplateId);

        if (!newTemplateId) {
            setSubject("");
            setBody("");
            setIssues([]);
            return;
        }

        setLoadingPreview(true);
        setError(null);

        try {

            const preview = await previewLeadEmail(lead.id, { type, templateId: newTemplateId });

            setSubject(preview.subject || "");
            setBody(preview.body || "");
            setIssues(preview.issues || []);
            setMergeFields(preview.mergeFields || {});

        } catch (err) {

            console.error(err);
            setError("Unable to load that template. Please try another.");

        } finally {

            setLoadingPreview(false);

        }

    }

    async function handleSend() {

        if (!subject.trim() || !body.trim()) {
            setError("Subject and body are required.");
            return;
        }

        setSending(true);
        setError(null);

        try {

            const response = await sendLeadEmail(lead.id, {
                type,
                templateId,
                subject,
                body,
                documentIds,
            });

            onClose();
            onSent?.();

            alert(`Email sent to ${response.recipient}.`);

        } catch (err) {

            console.error(err);
            setSending(false);

            if (err.response?.status === 403) {
                setError("You don't have permission to perform this action.");
                return;
            }

            setError(err.response?.data?.message || "Unable to send the email. Please try again.");

        }

    }

    return (

        <>

            <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">

                <div className="modal-dialog modal-lg modal-dialog-centered">

                    <div className="modal-content">

                        <div className="modal-header">

                            <h5 className="modal-title">
                                <i className="bi bi-envelope me-2"></i>
                                Send Email
                            </h5>

                            <button className="btn-close" onClick={onClose}></button>

                        </div>

                        <div className="modal-body">

                            <div className="mb-3 pb-2 border-bottom">
                                <div className="fw-semibold">{lead.companyName}</div>
                                <div className="text-muted small">
                                    {lead.contactPerson}
                                    {lead.email ? ` — ${lead.email}` : ""}
                                </div>
                            </div>

                            {step === "no-email" && (

                                <div className="alert alert-warning mb-0">

                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    This lead does not have an email address on file. Add one before sending an email.

                                    <div className="mt-3">
                                        <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => {
                                                onClose();
                                                navigate(`/leads/edit/${lead.id}`);
                                            }}
                                        >
                                            Edit Lead
                                        </button>
                                    </div>

                                </div>

                            )}

                            {step === "choose" && (

                                <div className="d-grid gap-3">

                                    {Object.entries(EMAIL_TYPES).map(([key, info]) => (

                                        <button
                                            key={key}
                                            type="button"
                                            className="btn btn-outline-primary text-start p-3"
                                            onClick={() => handleChooseType(key)}
                                        >
                                            <div className="fw-semibold">
                                                <i className={`bi ${info.icon} me-2`}></i>
                                                {info.label}
                                            </div>
                                            <div className="small text-muted mt-1">
                                                {info.description}
                                            </div>
                                        </button>

                                    ))}

                                </div>

                            )}

                            {step === "compose" && (

                                <>

                                    {error && (
                                        <div className="alert alert-danger py-2 px-3">
                                            {error}
                                        </div>
                                    )}

                                    <div className="mb-3">

                                        <label className="form-label">Template</label>

                                        <TemplateSelect
                                            type={type}
                                            value={templateId}
                                            onChange={handleTemplateChange}
                                            disabled={loadingPreview || sending}
                                        />

                                    </div>

                                    {issues.length > 0 && (
                                        <div className="alert alert-warning py-2 px-3" role="alert">
                                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                            This lead has no value for some fields in the message, so it cannot be sent
                                            as it is: {issues.join("; ")}. Edit the text below, or add the missing
                                            details to the lead.
                                        </div>
                                    )}

                                    <div className="mb-3">

                                        <label className="form-label" htmlFor="lead-email-subject">Subject</label>

                                        <ResolvedDraftField
                                            id="lead-email-subject"
                                            value={subject}
                                            onChange={setSubject}
                                            fields={mergeFields}
                                            disabled={loadingPreview || sending}
                                        />

                                    </div>

                                    <div className="mb-3">

                                        <label className="form-label" htmlFor="lead-email-body">Body</label>

                                        <ResolvedDraftField
                                            id="lead-email-body"
                                            value={body}
                                            onChange={setBody}
                                            fields={mergeFields}
                                            multiline
                                            rows={8}
                                            disabled={loadingPreview || sending}
                                        />

                                    </div>

                                    <div className="mb-2">

                                        <label className="form-label">
                                            Attachments {type === "PRODUCT_BROCHURE"
                                                ? "(product brochures)"
                                                : "(company profile / documents)"}
                                        </label>

                                        <DocumentPicker
                                            mode={type === "PRODUCT_BROCHURE" ? "brochure" : "general"}
                                            selectedIds={documentIds}
                                            onChange={setDocumentIds}
                                        />

                                    </div>

                                </>

                            )}

                        </div>

                        {step === "compose" && (

                            <div className="modal-footer">

                                <button className="btn btn-secondary" onClick={onClose} disabled={sending}>
                                    Cancel
                                </button>

                                <button
                                    className="btn btn-primary"
                                    onClick={handleSend}
                                    disabled={loadingPreview || sending}
                                >
                                    {sending ? "Sending..." : "Send Email"}
                                </button>

                            </div>

                        )}

                        {(step === "choose" || step === "no-email") && (

                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={onClose}>
                                    Cancel
                                </button>
                            </div>

                        )}

                    </div>

                </div>

            </div>

            <div className="modal-backdrop fade show"></div>

        </>

    );

}
