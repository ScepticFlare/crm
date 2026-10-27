import { useEffect, useRef, useState } from "react";

import TemplateSelect from "./TemplateSelect";

import { getEmailTemplates } from "../../services/emailTemplateService";
import {
    BULK_EMAIL_MAX_RECORDS,
    RETRYABLE_OUTCOMES,
    newBatchId,
    previewBulkEmail,
    sendBulkEmail,
} from "../../services/bulkEmailService";

const OUTCOME_STYLE = {
    ACCEPTED: { className: "bg-success", label: "Accepted by provider" },
    FAILED: { className: "bg-danger", label: "Failed - not sent" },
    UNKNOWN: { className: "bg-warning text-dark", label: "Unknown - may have been sent" },
    NO_RESPONSE: { className: "bg-warning text-dark", label: "No response - may have been sent" },
    IN_PROGRESS: { className: "bg-info text-dark", label: "In progress" },
    EXCLUDED: { className: "bg-secondary", label: "Not sent" },
    NOT_ATTEMPTED: { className: "bg-secondary", label: "Not attempted" },
};

const PLACEHOLDERS = {
    LEAD: ["{{contactPerson}}", "{{companyName}}", "{{interestedProduct}}"],
    OPPORTUNITY: ["{{contactPerson}}", "{{companyName}}", "{{interestedProduct}}", "{{opportunityTitle}}"],
};

// Bulk email for the selected Leads or Opportunities. Steps:
//   recipients -> message -> review -> results
// Nothing is sent until the explicit Send button on the review step. The
// backend validates and authorizes every record on every call (preview and
// each chunk of the send), so what is shown here is advice, not the authority.
// Removing a recipient here only leaves them out of THIS batch - the CRM
// record is never touched. Editing the subject/body only affects this batch;
// the shared template is never modified.
export default function BulkEmailModal({ show, ...props }) {

    // The body is mounted only while the dialog is open, so every opening starts
    // from fresh state (nothing to reset, nothing carried over from last time).
    return show ? <BulkEmailModalBody {...props} /> : null;

}

function BulkEmailModalBody({ target, ids, onClose, onSent }) {

    const noun = target === "OPPORTUNITY" ? "opportunity" : "lead";
    const nouns = target === "OPPORTUNITY" ? "opportunities" : "leads";

    const [step, setStep] = useState("recipients"); // recipients | message | review | results

    const overCap = ids.length > BULK_EMAIL_MAX_RECORDS;

    const [loading, setLoading] = useState(!overCap);
    const [loadError, setLoadError] = useState(null);
    const [actionError, setActionError] = useState(null);

    const error = overCap
        ? `At most ${BULK_EMAIL_MAX_RECORDS} ${nouns} can be emailed in one batch - you selected ${ids.length}. Clear some and try again.`
        : (actionError || loadError);

    const [recipientsPreview, setRecipientsPreview] = useState(null);
    const [removedIds, setRemovedIds] = useState([]);

    const [templates, setTemplates] = useState([]);
    const [templateId, setTemplateId] = useState(null);
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");

    const [reviewPreview, setReviewPreview] = useState(null);
    const [selectedPreviewId, setSelectedPreviewId] = useState(null);

    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const [results, setResults] = useState([]);
    const [sendError, setSendError] = useState(null);

    // One id per batch, kept across retries - it is what makes a repeat safe.
    const batchIdRef = useRef(null);
    // Synchronous guard against a double click before React re-renders.
    const sendingRef = useRef(false);

    function describeError(err, fallback) {

        if (err.response?.status === 403) {
            return "You don't have permission to send emails.";
        }

        return err.response?.data?.message || fallback;
    }

    // Recipients check: authoritative, server-side, sends nothing.
    useEffect(() => {

        if (overCap) {
            return undefined;
        }

        let cancelled = false;

        previewBulkEmail({ target, ids, subject: "", body: "" })
            .then((data) => {
                if (!cancelled) {
                    setRecipientsPreview(data);
                }
            })
            .catch((err) => {
                console.error(err);
                if (!cancelled) {
                    setLoadError(describeError(err, "Unable to check the selected records."));
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const eligible = (recipientsPreview?.recipients || []).filter((r) => r.eligible);
    const excluded = (recipientsPreview?.recipients || []).filter((r) => !r.eligible);
    const kept = eligible.filter((r) => !removedIds.includes(r.id));

    function toggleRemoved(id) {
        setRemovedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }

    async function goToMessage() {

        setStep("message");

        try {
            setTemplates(await getEmailTemplates());
        } catch (err) {
            console.error(err);
        }

    }

    function handleTemplateChange(newTemplateId) {

        setTemplateId(newTemplateId);

        const selected = templates.find((t) => t.id === newTemplateId);

        if (selected) {
            setSubject(selected.subject);
            setBody(selected.body);
        } else {
            setSubject("");
            setBody("");
        }

    }

    async function goToReview() {

        if (!subject.trim() || !body.trim()) {
            setActionError("Subject and message are required.");
            return;
        }

        setLoading(true);
        setActionError(null);

        try {

            const data = await previewBulkEmail({ target, ids: kept.map((r) => r.id), subject, body });

            setReviewPreview(data);
            setSelectedPreviewId(data.recipients.find((r) => r.eligible)?.id ?? null);
            setStep("review");

        } catch (err) {

            console.error(err);
            setActionError(describeError(err, "Unable to prepare the personalised messages."));

        } finally {

            setLoading(false);

        }

    }

    async function runSend(sendIds) {

        if (sendingRef.current) {
            return;
        }

        sendingRef.current = true;
        setSending(true);
        setSendError(null);
        setStep("results");

        if (!batchIdRef.current) {
            batchIdRef.current = newBatchId();
        }

        setProgress({ done: 0, total: sendIds.length });

        try {

            const outcome = await sendBulkEmail(
                { target, ids: sendIds, subject, body, templateId, batchId: batchIdRef.current },
                (soFar, done, total) => {
                    setResults((prev) => mergeResults(prev, soFar));
                    setProgress({ done, total });
                }
            );

            setResults((prev) => mergeResults(prev, outcome.results));
            setSendError(outcome.error);

        } finally {

            sendingRef.current = false;
            setSending(false);

        }

    }

    function mergeResults(previous, incoming) {

        const merged = new Map(previous.map((r) => [r.id, r]));
        incoming.forEach((r) => merged.set(r.id, r));

        return Array.from(merged.values());

    }

    function handleSend() {

        const sendable = (reviewPreview?.recipients || []).filter((r) => r.eligible).map((r) => r.id);

        // The review's excluded recipients are shown in the results as "Not sent".
        const notSent = (reviewPreview?.recipients || [])
            .filter((r) => !r.eligible)
            .map((r) => ({ id: r.id, companyName: r.companyName, email: r.email, outcome: "EXCLUDED", detail: r.exclusionMessage }));

        setResults(notSent);
        runSend(sendable);

    }

    function handleRetry() {

        const retryIds = results.filter((r) => RETRYABLE_OUTCOMES.includes(r.outcome)).map((r) => r.id);

        if (retryIds.length > 0) {
            runSend(retryIds);
        }

    }

    function handleClose() {

        if (sending) {
            return;
        }

        const shouldRefresh = step === "results";

        onClose();

        if (shouldRefresh) {
            onSent?.();
        }

    }

    const reviewEligible = (reviewPreview?.recipients || []).filter((r) => r.eligible);
    const reviewExcluded = (reviewPreview?.recipients || []).filter((r) => !r.eligible);
    const previewed = reviewEligible.find((r) => r.id === selectedPreviewId) || reviewEligible[0];

    const counts = results.reduce((acc, r) => ({ ...acc, [r.outcome]: (acc[r.outcome] || 0) + 1 }), {});
    const retryable = results.filter((r) => RETRYABLE_OUTCOMES.includes(r.outcome)).length;

    return (

        <>

            <div className="modal fade show" style={{ display: "block" }} tabIndex="-1" role="dialog" aria-label="Bulk email">

                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">

                    <div className="modal-content">

                        <div className="modal-header">

                            <h5 className="modal-title">
                                <i className="bi bi-envelope-paper me-2"></i>
                                Bulk Email - {ids.length} selected {ids.length === 1 ? noun : nouns}
                            </h5>

                            <button className="btn-close" onClick={handleClose} disabled={sending} aria-label="Close"></button>

                        </div>

                        <div className="modal-body">

                            {error && <div className="alert alert-danger py-2 px-3">{error}</div>}

                            {/* ---------------- 1. recipients ---------------- */}
                            {step === "recipients" && (

                                loading || !recipientsPreview ? (

                                    !error && <div className="text-muted">Checking the selected {nouns}...</div>

                                ) : (

                                    <>

                                        <p className="mb-2">
                                            <strong>{kept.length}</strong> of {recipientsPreview.requested} selected{" "}
                                            {recipientsPreview.requested === 1 ? noun : nouns} will receive an email.
                                        </p>

                                        <p className="text-muted small">
                                            Each person gets their own individual email. Removing someone here only
                                            leaves them out of <em>this batch</em> - the {noun} itself is not changed.
                                            {target === "OPPORTUNITY" && " Opportunity emails go to the originating lead's address."}
                                        </p>

                                        <h6>Recipients ({kept.length})</h6>

                                        <div className="table-responsive mb-3" style={{ maxHeight: "260px" }}>
                                            <table className="table table-sm align-middle">
                                                <thead>
                                                    <tr><th>Company</th><th>Contact</th><th>Email</th><th></th></tr>
                                                </thead>
                                                <tbody>
                                                    {eligible.map((r) => {
                                                        const removed = removedIds.includes(r.id);
                                                        return (
                                                            <tr key={r.id} className={removed ? "text-muted text-decoration-line-through" : ""}>
                                                                <td>{r.companyName}</td>
                                                                <td>{r.contactPerson || "-"}</td>
                                                                <td>
                                                                    {r.email}
                                                                    {r.warnings?.map((w) => (
                                                                        <div key={w} className="small text-warning-emphasis">
                                                                            <i className="bi bi-exclamation-triangle me-1"></i>{w}
                                                                        </div>
                                                                    ))}
                                                                </td>
                                                                <td className="text-end">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-outline-secondary"
                                                                        onClick={() => toggleRemoved(r.id)}
                                                                    >
                                                                        {removed ? "Add back" : "Remove from batch"}
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {excluded.length > 0 && (

                                            <>
                                                <h6>Not included ({excluded.length})</h6>

                                                <div className="table-responsive mb-2" style={{ maxHeight: "200px" }}>
                                                    <table className="table table-sm align-middle">
                                                        <thead>
                                                            <tr><th>Company</th><th>Email</th><th>Reason</th></tr>
                                                        </thead>
                                                        <tbody>
                                                            {excluded.map((r) => (
                                                                <tr key={r.id}>
                                                                    <td>{r.companyName || `Record #${r.id}`}</td>
                                                                    <td>{r.email || "-"}</td>
                                                                    <td className="text-danger">{r.exclusionMessage}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </>

                                        )}

                                    </>

                                )

                            )}

                            {/* ---------------- 2. message ---------------- */}
                            {step === "message" && (

                                <>

                                    <div className="mb-3">
                                        <label className="form-label">Template</label>
                                        <TemplateSelect value={templateId} onChange={handleTemplateChange} />
                                        <div className="form-text">
                                            Pick an approved template, or write your own. Edits below apply to this batch only - the
                                            shared template is never changed.
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Subject</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={subject}
                                            maxLength={255}
                                            onChange={(e) => setSubject(e.target.value)}
                                        />
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label">Message</label>
                                        <textarea
                                            className="form-control"
                                            rows={10}
                                            value={body}
                                            maxLength={20000}
                                            onChange={(e) => setBody(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-text">
                                        Personalisation, filled in separately for every recipient:{" "}
                                        {PLACEHOLDERS[target].map((p) => <code key={p} className="me-2">{p}</code>)}
                                        <br />
                                        A recipient whose data is missing for a placeholder, or a message with an unfinished
                                        <code> [[...]] </code> section, will not be sent - you will see it on the next step.
                                    </div>

                                </>

                            )}

                            {/* ---------------- 3. review ---------------- */}
                            {step === "review" && reviewPreview && (

                                <>

                                    <div className="alert alert-primary py-2 px-3">
                                        <strong>{reviewEligible.length}</strong> individual email{reviewEligible.length === 1 ? "" : "s"} will be sent
                                        {reviewExcluded.length > 0 && <> - {reviewExcluded.length} not included</>}.
                                    </div>

                                    {reviewEligible.length > 0 && (

                                        <div className="row g-3 mb-3">

                                            <div className="col-md-4">
                                                <label className="form-label">Preview for</label>
                                                <select
                                                    className="form-select"
                                                    value={previewed?.id ?? ""}
                                                    onChange={(e) => setSelectedPreviewId(Number(e.target.value))}
                                                >
                                                    {reviewEligible.map((r) => (
                                                        <option key={r.id} value={r.id}>{r.companyName} - {r.email}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="col-md-8">
                                                <div className="border rounded p-3 bg-light">
                                                    <div className="small text-muted">To: {previewed?.email}</div>
                                                    <div className="fw-semibold mb-2">{previewed?.renderedSubject}</div>
                                                    <div style={{ whiteSpace: "pre-wrap" }}>{previewed?.renderedBody}</div>
                                                </div>
                                            </div>

                                        </div>

                                    )}

                                    {reviewExcluded.length > 0 && (

                                        <>
                                            <h6>Not included</h6>
                                            <ul className="small">
                                                {reviewExcluded.map((r) => (
                                                    <li key={r.id}>
                                                        <strong>{r.companyName || `Record #${r.id}`}</strong>: {r.exclusionMessage}
                                                    </li>
                                                ))}
                                            </ul>
                                        </>

                                    )}

                                    <p className="text-muted small mb-0">
                                        "Accepted" will mean the email provider accepted the message for delivery - it is not a
                                        guarantee that it reached the inbox.
                                    </p>

                                </>

                            )}

                            {/* ---------------- 4. results ---------------- */}
                            {step === "results" && (

                                <>

                                    {sending && (
                                        <div className="mb-3">
                                            <div className="small mb-1">
                                                Sending... {progress.done} of {progress.total} processed. Please keep this window open.
                                            </div>
                                            <div className="progress">
                                                <div
                                                    className="progress-bar"
                                                    style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                    {sendError && <div className="alert alert-warning py-2 px-3">{sendError}</div>}

                                    <p className="mb-2">
                                        {Object.entries(OUTCOME_STYLE).map(([key, style]) => (
                                            counts[key] ? (
                                                <span key={key} className={`badge ${style.className} me-2`}>
                                                    {counts[key]} {style.label.toLowerCase()}
                                                </span>
                                            ) : null
                                        ))}
                                    </p>

                                    <div className="table-responsive" style={{ maxHeight: "340px" }}>
                                        <table className="table table-sm align-middle">
                                            <thead>
                                                <tr><th>Company</th><th>Email</th><th>Result</th><th>Details</th></tr>
                                            </thead>
                                            <tbody>
                                                {results.map((r) => {
                                                    const style = OUTCOME_STYLE[r.outcome] || OUTCOME_STYLE.EXCLUDED;
                                                    return (
                                                        <tr key={r.id}>
                                                            <td>{r.companyName || `Record #${r.id}`}</td>
                                                            <td>{r.email || "-"}</td>
                                                            <td><span className={`badge ${style.className}`}>{style.label}</span></td>
                                                            <td className="small">
                                                                {r.detail}
                                                                {r.alreadyProcessed && " (already handled earlier - not sent again)"}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {!sending && (counts.UNKNOWN > 0 || counts.NO_RESPONSE > 0) && (
                                        <p className="small text-muted mt-2 mb-0">
                                            "Unknown" means the provider gave no reliable answer, so the email may or may not have
                                            been sent. It is never retried automatically - check your email provider's log before
                                            sending again.
                                        </p>
                                    )}

                                </>

                            )}

                        </div>

                        <div className="modal-footer">

                            {step === "recipients" && (
                                <>
                                    <button className="btn btn-outline-secondary" onClick={handleClose}>Cancel</button>
                                    <button className="btn btn-primary" disabled={loading || kept.length === 0} onClick={goToMessage}>
                                        Continue ({kept.length})
                                    </button>
                                </>
                            )}

                            {step === "message" && (
                                <>
                                    <button className="btn btn-outline-secondary" onClick={() => setStep("recipients")}>Back</button>
                                    <button className="btn btn-primary" disabled={loading} onClick={goToReview}>
                                        {loading ? "Preparing..." : "Review"}
                                    </button>
                                </>
                            )}

                            {step === "review" && (
                                <>
                                    <button className="btn btn-outline-secondary" onClick={() => setStep("message")}>Back</button>
                                    <button className="btn btn-success" disabled={sending || reviewEligible.length === 0} onClick={handleSend}>
                                        <i className="bi bi-send me-1"></i>
                                        Send {reviewEligible.length} email{reviewEligible.length === 1 ? "" : "s"}
                                    </button>
                                </>
                            )}

                            {step === "results" && (
                                <>
                                    {!sending && retryable > 0 && (
                                        <button className="btn btn-outline-primary" onClick={handleRetry}>
                                            Retry {retryable} that did not go out
                                        </button>
                                    )}
                                    <button className="btn btn-primary" disabled={sending} onClick={handleClose}>Close</button>
                                </>
                            )}

                        </div>

                    </div>

                </div>

            </div>

            <div className="modal-backdrop fade show"></div>

        </>

    );

}
