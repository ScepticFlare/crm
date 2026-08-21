import { useEffect, useState } from "react";

import TemplateSelect from "./TemplateSelect";
import DocumentPicker from "./DocumentPicker";

import { getEmailTemplates } from "../../services/emailTemplateService";
import { getBulkKeepInTouchEligibility, sendBulkKeepInTouch } from "../../services/leadEmailService";

const TYPE = "KEEP_IN_TOUCH";

// Bulk Keep in Touch composer - opened from the Leads page's bulk action
// bar with the full selected row objects (not just ids), so eligibility
// results can be labeled with company names without any extra requests.
// Four steps: eligibility (authoritative backend check) -> compose (raw,
// un-rendered placeholders - there's no single Lead to render against in
// bulk, each recipient is personalized server-side at send time) -> review
// -> result. Only ever sends to the eligible id set from step 1, never the
// raw original selection.
export default function BulkKeepInTouchModal({ show, leads, onClose, onSent }) {

    const [step, setStep] = useState("eligibility"); // eligibility | compose | review | result

    const [loadingEligibility, setLoadingEligibility] = useState(false);
    const [eligibility, setEligibility] = useState(null);

    const [templateId, setTemplateId] = useState(null);
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [documentIds, setDocumentIds] = useState([]);

    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    const leadIds = leads.map((lead) => lead.id);
    const leadsById = Object.fromEntries(leads.map((lead) => [lead.id, lead]));

    useEffect(() => {

        if (!show) {
            return;
        }

        setStep("eligibility");
        setEligibility(null);
        setTemplateId(null);
        setSubject("");
        setBody("");
        setDocumentIds([]);
        setError(null);
        setResult(null);

        loadEligibility();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]);

    async function loadEligibility() {

        setLoadingEligibility(true);
        setError(null);

        try {

            const data = await getBulkKeepInTouchEligibility(leadIds);
            setEligibility(data);

        } catch (err) {

            console.error(err);
            setError("Unable to check which of the selected leads are eligible.");

        } finally {

            setLoadingEligibility(false);

        }

    }

    async function handleContinueToCompose() {

        setStep("compose");

        try {

            const templates = await getEmailTemplates(TYPE);
            const defaultTemplate = templates.find((t) => t.isDefault);

            if (defaultTemplate) {
                setTemplateId(defaultTemplate.id);
                setSubject(defaultTemplate.subject);
                setBody(defaultTemplate.body);
            }

        } catch (err) {

            console.error(err);

        }

    }

    async function handleTemplateChange(newTemplateId) {

        setTemplateId(newTemplateId);

        if (!newTemplateId) {
            setSubject("");
            setBody("");
            return;
        }

        try {

            const templates = await getEmailTemplates(TYPE);
            const selected = templates.find((t) => t.id === newTemplateId);

            if (selected) {
                setSubject(selected.subject);
                setBody(selected.body);
            }

        } catch (err) {

            console.error(err);

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

            const response = await sendBulkKeepInTouch({
                leadIds: eligibility.eligibleIds,
                templateId,
                subject,
                body,
                documentIds,
            });

            setResult(response);
            setStep("result");

        } catch (err) {

            console.error(err);

            if (err.response?.status === 403) {
                setError("You don't have permission to perform this action.");
            } else {
                setError(err.response?.data?.message || "Unable to send emails. Please try again.");
            }

        } finally {

            setSending(false);

        }

    }

    function handleClose() {

        const shouldRefresh = step === "result";

        onClose();

        if (shouldRefresh) {
            onSent?.();
        }

    }

    if (!show) {
        return null;
    }

    return (

        <>

            <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">

                <div className="modal-dialog modal-lg modal-dialog-centered">

                    <div className="modal-content">

                        <div className="modal-header">

                            <h5 className="modal-title">
                                <i className="bi bi-people-fill me-2"></i>
                                Send Keep in Touch
                            </h5>

                            <button className="btn-close" onClick={handleClose}></button>

                        </div>

                        <div className="modal-body">

                            {error && (
                                <div className="alert alert-danger py-2 px-3">
                                    {error}
                                </div>
                            )}

                            {step === "eligibility" && (

                                loadingEligibility ? (

                                    <div className="text-muted">Checking selected leads...</div>

                                ) : eligibility && (

                                    <>

                                        <p>
                                            <strong>{eligibility.eligibleCount}</strong> of {leads.length} selected
                                            lead(s) are eligible to receive this email.
                                        </p>

                                        {eligibility.ineligibleCount > 0 && (

                                            <div className="alert alert-light border">

                                                <div className="fw-semibold mb-2">
                                                    {eligibility.ineligibleCount} will be skipped:
                                                </div>

                                                <ul className="mb-0 small">

                                                    {eligibility.ineligibleIds.map((id) => {

                                                        const lead = leadsById[id];

                                                        // eligibleIds/ineligibleIds themselves are authoritative
                                                        // from the backend - this label is only a best-effort,
                                                        // non-authoritative guess at *why*, based on the row
                                                        // already on screen (it can't tell an out-of-scope lead
                                                        // apart from one the backend rejected for another
                                                        // reason). The definitive per-lead reason is shown after
                                                        // sending, in the result step below.
                                                        const guessedReason = lead && !lead.email
                                                            ? "no email address"
                                                            : "not eligible";

                                                        return (
                                                            <li key={id}>
                                                                {lead ? lead.companyName : `Lead #${id}`} — {guessedReason}
                                                            </li>
                                                        );

                                                    })}

                                                </ul>

                                            </div>

                                        )}

                                    </>

                                )

                            )}

                            {step === "compose" && (

                                <>

                                    <p className="text-muted small">
                                        Sending to <strong>{eligibility.eligibleCount}</strong> lead(s). Use{" "}
                                        <code>{"{{contactPerson}}"}</code>, <code>{"{{companyName}}"}</code> and{" "}
                                        <code>{"{{interestedProduct}}"}</code> — each recipient gets their own
                                        personalized version when the email is sent.
                                    </p>

                                    <div className="mb-3">

                                        <label className="form-label">Template</label>

                                        <TemplateSelect
                                            type={TYPE}
                                            value={templateId}
                                            onChange={handleTemplateChange}
                                            disabled={sending}
                                        />

                                    </div>

                                    <div className="mb-3">

                                        <label className="form-label">Subject</label>

                                        <input
                                            type="text"
                                            className="form-control"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            disabled={sending}
                                        />

                                    </div>

                                    <div className="mb-3">

                                        <label className="form-label">Body</label>

                                        <textarea
                                            className="form-control"
                                            rows="8"
                                            value={body}
                                            onChange={(e) => setBody(e.target.value)}
                                            disabled={sending}
                                        />

                                    </div>

                                    <div className="mb-2">

                                        <label className="form-label">Attachments (company profile / general documents)</label>

                                        <DocumentPicker
                                            mode="general"
                                            selectedIds={documentIds}
                                            onChange={setDocumentIds}
                                        />

                                    </div>

                                </>

                            )}

                            {step === "review" && (

                                <>

                                    <p>
                                        Ready to send to <strong>{eligibility.eligibleCount}</strong> lead(s):
                                    </p>

                                    <ul className="small">
                                        {eligibility.eligibleIds.map((id) => (
                                            <li key={id}>{leadsById[id]?.companyName || `Lead #${id}`}</li>
                                        ))}
                                    </ul>

                                    <div className="border rounded p-3 bg-light">
                                        <div className="fw-semibold">{subject}</div>
                                        <div className="text-muted small mt-1" style={{ whiteSpace: "pre-wrap" }}>
                                            {body}
                                        </div>
                                    </div>

                                    {documentIds.length > 0 && (
                                        <div className="mt-2 small text-muted">
                                            {documentIds.length} attachment(s) selected.
                                        </div>
                                    )}

                                </>

                            )}

                            {step === "result" && result && (

                                <>

                                    <div className="alert alert-success">
                                        <i className="bi bi-check-circle-fill me-2"></i>
                                        {result.succeededIds.length} email(s) sent, {result.skippedIds.length} skipped.
                                    </div>

                                    {result.skippedIds.length > 0 && (

                                        <details>

                                            <summary className="text-muted small" style={{ cursor: "pointer" }}>
                                                View skip reasons
                                            </summary>

                                            <ul className="small mt-2">
                                                {result.skippedIds.map((id) => (
                                                    <li key={id}>
                                                        {leadsById[id]?.companyName || `Lead #${id}`} —{" "}
                                                        {result.skipReasons?.[id] || "Skipped"}
                                                    </li>
                                                ))}
                                            </ul>

                                        </details>

                                    )}

                                </>

                            )}

                        </div>

                        <div className="modal-footer">

                            {step === "eligibility" && (

                                <>
                                    <button className="btn btn-secondary" onClick={handleClose}>
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleContinueToCompose}
                                        disabled={loadingEligibility || !eligibility || eligibility.eligibleCount === 0}
                                    >
                                        Continue with {eligibility?.eligibleCount ?? 0} eligible
                                    </button>
                                </>

                            )}

                            {step === "compose" && (

                                <>
                                    <button className="btn btn-secondary" onClick={() => setStep("eligibility")}>
                                        Back
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setStep("review")}
                                        disabled={!subject.trim() || !body.trim()}
                                    >
                                        Review
                                    </button>
                                </>

                            )}

                            {step === "review" && (

                                <>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setStep("compose")}
                                        disabled={sending}
                                    >
                                        Back
                                    </button>
                                    <button className="btn btn-primary" onClick={handleSend} disabled={sending}>
                                        {sending ? "Sending..." : `Send to ${eligibility.eligibleCount} lead(s)`}
                                    </button>
                                </>

                            )}

                            {step === "result" && (
                                <button className="btn btn-primary" onClick={handleClose}>
                                    Close
                                </button>
                            )}

                        </div>

                    </div>

                </div>

            </div>

            <div className="modal-backdrop fade show"></div>

        </>

    );

}
