import { useEffect, useMemo, useRef, useState } from "react";

import TemplateSelect from "./TemplateSelect";

import { getEmailTemplates } from "../../services/emailTemplateService";
import {
    BULK_EMAIL_MAX_RECORDS,
    RETRYABLE_OUTCOMES,
    UNSETTLED_OUTCOMES,
    createBulkEmailBatch,
    getBulkEmailBatch,
    previewBulkEmail,
    sendBulkEmail,
} from "../../services/bulkEmailService";
import {
    clearBulkEmailRecovery,
    loadBulkEmailRecovery,
    saveBulkEmailRecovery,
} from "../../services/bulkEmailRecovery";

const OUTCOME_STYLE = {
    ACCEPTED: { className: "bg-success", label: "Accepted by provider" },
    FAILED: { className: "bg-danger", label: "Failed - not sent" },
    UNKNOWN: { className: "bg-warning text-dark", label: "Unknown - may have been sent" },
    UNVERIFIED: { className: "bg-warning text-dark", label: "Unverified - may have been sent" },
    IN_PROGRESS: { className: "bg-info text-dark", label: "In progress" },
    NOT_ATTEMPTED: { className: "bg-secondary", label: "Not sent yet" },
    EXCLUDED: { className: "bg-secondary", label: "Not included" },
    REMOVED: { className: "bg-light text-dark border", label: "Removed by you" },
};

// Used when a batch is picked up again after a refresh: only the exclusion CODE
// was kept, never the original wording or any customer detail.
const EXCLUSION_TEXT = {
    NOT_AVAILABLE: "This record was not found or you do not have access to it.",
    NO_EMAIL: "No email address on file.",
    INVALID_EMAIL: "The email address on file is not valid.",
    DUPLICATE_EMAIL: "Same email address as another selected record - one email is sent per address.",
    UNRESOLVED_PLACEHOLDER: "A placeholder in the message had no value for this record.",
    SUPPRESSED: "This email address is on the do-not-email list.",
    RECENTLY_EMAILED: "This address (or record) was already emailed - or may have been - recently.",
};

const PLACEHOLDERS = {
    LEAD: ["{{contactPerson}}", "{{companyName}}", "{{interestedProduct}}"],
    OPPORTUNITY: ["{{contactPerson}}", "{{companyName}}", "{{interestedProduct}}", "{{opportunityTitle}}"],
};

// Bulk email for the selected Leads or Opportunities. Steps:
//   (resume) -> recipients -> message -> review -> results
// Nothing is sent until the explicit Send button on the review step. Pressing it
// first creates a BATCH on the server, which pins the recipients and the message;
// from then on this window can only ask the server to send (more of) that batch -
// it cannot change who gets it or what it says. The backend validates and
// authorizes every record on every call, so what is shown here is advice, not the
// authority. Removing a recipient only leaves them out of THIS batch (the CRM
// record is never touched), and editing the message never modifies the template.
//
// An unfinished batch is remembered (id only, see bulkEmailRecovery) so it can be
// resumed or reviewed after a refresh.
export default function BulkEmailModal({ show, ...props }) {

    // The body is mounted only while the dialog is open, so every opening starts
    // from fresh state (nothing to reset, nothing carried over from last time).
    return show ? <BulkEmailModalBody {...props} /> : null;

}

function BulkEmailModalBody({ target, ids = [], resumeOnly = false, onClose, onSent }) {

    const noun = target === "OPPORTUNITY" ? "opportunity" : "lead";
    const nouns = target === "OPPORTUNITY" ? "opportunities" : "leads";

    // An earlier, unfinished batch of this user (if any).
    const [stored] = useState(() => loadBulkEmailRecovery(target));

    const [step, setStep] = useState(stored ? "resume" : (resumeOnly ? "nothing" : "recipients"));
    // recipients | message | review | results | resume | nothing

    const overCap = ids.length > BULK_EMAIL_MAX_RECORDS;

    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [actionError, setActionError] = useState(null);

    const error = step === "recipients" && overCap
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

    // The resume offer.
    const [resumeView, setResumeView] = useState(null);
    const [resumeNote, setResumeNote] = useState(null);

    // Once a batch exists (created here, or picked up again) it is frozen:
    //   batch   { batchId, recipientIds }
    //   context what happened to every OTHER selected record before sending
    //   batchRows  the server's outcome for each recipient of the batch
    const [batch, setBatch] = useState(null);
    const [context, setContext] = useState({ selectedIds: [], preExcluded: {}, removedIds: [] });
    const [batchRows, setBatchRows] = useState([]);

    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const [sendError, setSendError] = useState(null);

    // Synchronous guard against a double click before React re-renders.
    const sendingRef = useRef(false);
    const previewRequested = useRef(false);

    function describeError(err, fallback) {

        if (err.response?.status === 403) {
            return "You don't have permission to send emails.";
        }

        return err.response?.data?.message || fallback;
    }

    // Recipients check: authoritative, server-side, sends nothing.
    useEffect(() => {

        if (step !== "recipients" || previewRequested.current || recipientsPreview || overCap || ids.length === 0) {
            return undefined;
        }

        previewRequested.current = true;

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
            });

        return () => {
            cancelled = true;
            previewRequested.current = false;
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    // The resume offer: ask the server where the earlier batch stands.
    useEffect(() => {

        if (step !== "resume" || !stored) {
            return undefined;
        }

        let cancelled = false;

        getBulkEmailBatch(stored.batchId)
            .then((view) => {
                if (!cancelled) {
                    setResumeView(view);
                }
            })
            .catch((err) => {

                if (cancelled) {
                    return;
                }

                const status = err.response?.status;

                if (status === 403 || status === 404) {
                    // The batch is gone or not ours any more: forget the pointer.
                    clearBulkEmailRecovery(target);
                    setResumeNote("The earlier bulk email batch is no longer available.");
                    setStep(ids.length > 0 && !resumeOnly ? "recipients" : "nothing");
                } else {
                    setLoadError("Could not check the earlier bulk email batch. Try again in a moment.");
                }
            });

        return () => {
            cancelled = true;
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

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

    function mergeBatchRows(incoming) {

        setBatchRows((previous) => {

            const merged = new Map(previous.map((r) => [r.id, r]));
            incoming.forEach((r) => merged.set(r.id, r));

            return Array.from(merged.values());

        });

    }

    // The server's view of the whole batch replaces what we know locally.
    async function refreshFromServer(batchId) {

        try {

            const view = await getBulkEmailBatch(batchId);

            setBatchRows(view.results);

            return view;

        } catch (err) {

            console.error(err);
            setSendError((prev) => (prev ? `${prev} ` : "")
                + "Could not refresh the results from the server - use Check status.");

            return null;

        }

    }

    async function runChunks(batchId, sendIds) {

        setSendError(null);
        setProgress({ done: 0, total: sendIds.length });

        const outcome = await sendBulkEmail(
            { batchId, ids: sendIds },
            (soFar, done, total) => {
                mergeBatchRows(soFar);
                setProgress({ done, total });
            }
        );

        mergeBatchRows(outcome.results);
        setSendError(outcome.error);

        // The server's record is authoritative for what happened to the batch.
        await refreshFromServer(batchId);

    }

    // Review -> create the batch on the server, remember it, then send it in chunks.
    async function handleSend() {

        if (sendingRef.current) {
            return;
        }

        sendingRef.current = true;
        setSending(true);
        setActionError(null);

        try {

            const sendable = (reviewPreview?.recipients || []).filter((r) => r.eligible).map((r) => r.id);

            let created;

            try {
                created = await createBulkEmailBatch({ target, ids: sendable, subject, body, templateId });
            } catch (err) {
                console.error(err);
                setActionError(describeError(err, "Could not start the batch - nothing was sent."));
                return;
            }

            // Everything selected that is NOT in the batch, and why.
            const preExcluded = {};

            (recipientsPreview?.recipients || []).filter((r) => !r.eligible)
                .forEach((r) => { preExcluded[r.id] = { code: r.exclusionCode, message: r.exclusionMessage }; });

            (reviewPreview?.recipients || []).filter((r) => !r.eligible)
                .forEach((r) => { preExcluded[r.id] = { code: r.exclusionCode, message: r.exclusionMessage }; });

            const nextContext = { selectedIds: [...ids], preExcluded, removedIds: [...removedIds] };

            setContext(nextContext);
            setBatch({ batchId: created.batchId, recipientIds: sendable });
            setBatchRows(sendable.map((id) => ({ id, outcome: "NOT_ATTEMPTED", detail: "Not sent yet." })));
            setStep("results");

            const codes = {};
            Object.entries(preExcluded).forEach(([id, v]) => { codes[id] = v.code; });

            saveBulkEmailRecovery(target, {
                batchId: created.batchId,
                selectedIds: nextContext.selectedIds,
                preExcluded: codes,
                removedIds: nextContext.removedIds,
            });

            await runChunks(created.batchId, sendable);

        } finally {

            sendingRef.current = false;
            setSending(false);

        }

    }

    // Sends only what is safe to send again: confirmed failures and records the
    // server says it has not touched. Never UNKNOWN / UNVERIFIED / IN_PROGRESS.
    async function handleRetry() {

        if (sendingRef.current || !batch) {
            return;
        }

        const retryIds = batchRows.filter((r) => RETRYABLE_OUTCOMES.includes(r.outcome)).map((r) => r.id);

        if (retryIds.length === 0) {
            return;
        }

        sendingRef.current = true;
        setSending(true);

        try {
            await runChunks(batch.batchId, retryIds);
        } finally {
            sendingRef.current = false;
            setSending(false);
        }

    }

    async function handleCheckStatus() {

        if (sendingRef.current || !batch) {
            return;
        }

        sendingRef.current = true;
        setSending(true);
        setSendError(null);

        try {
            await refreshFromServer(batch.batchId);
        } finally {
            sendingRef.current = false;
            setSending(false);
        }

    }

    // Picks an earlier batch up again: the server's record is the truth.
    function adoptEarlierBatch() {

        const preExcluded = {};

        Object.entries(stored.preExcluded || {}).forEach(([id, code]) => {
            preExcluded[id] = { code, message: EXCLUSION_TEXT[code] || "Not included." };
        });

        setContext({
            selectedIds: stored.selectedIds,
            preExcluded,
            removedIds: stored.removedIds || [],
        });

        setBatch({ batchId: stored.batchId, recipientIds: resumeView.batch?.recipientIds || resumeView.results.map((r) => r.id) });
        setBatchRows(resumeView.results);
        setStep("results");

    }

    function discardEarlierBatch() {

        clearBulkEmailRecovery(target);
        setResumeView(null);

        if (ids.length > 0 && !resumeOnly) {
            setStep("recipients");
        } else {
            onClose();
        }

    }

    function handleClose() {

        if (sending) {
            return;
        }

        const inResults = step === "results";

        // A batch with nothing left to do is forgotten; an unfinished one is kept
        // so it can be resumed.
        if (inResults && !hasUnfinished(batchRows)) {
            clearBulkEmailRecovery(target);
        }

        onClose();

        if (inResults) {
            onSent?.();
        }

    }

    const reviewEligible = (reviewPreview?.recipients || []).filter((r) => r.eligible);
    const reviewExcluded = (reviewPreview?.recipients || []).filter((r) => !r.eligible);
    const previewed = reviewEligible.find((r) => r.id === selectedPreviewId) || reviewEligible[0];

    // ------- the final table: EVERY originally selected record, in selection order
    const finalRows = useMemo(() => {

        if (!batch) {
            return [];
        }

        const byId = new Map(batchRows.map((r) => [r.id, r]));
        const companyById = new Map((recipientsPreview?.recipients || []).map((r) => [r.id, r]));

        return context.selectedIds.map((id) => {

            const row = byId.get(id);

            if (row) {
                return row;
            }

            const known = companyById.get(id);
            const base = { id, companyName: known?.companyName, email: known?.email };

            if (context.removedIds.includes(id)) {
                return { ...base, outcome: "REMOVED", detail: "Taken out of this batch by you." };
            }

            const pre = context.preExcluded[id];

            return {
                ...base,
                outcome: "EXCLUDED",
                exclusionCode: pre?.code,
                detail: pre?.message || "Not included.",
            };

        });

    }, [batch, batchRows, context, recipientsPreview]);

    const counts = finalRows.reduce((acc, r) => ({ ...acc, [r.outcome]: (acc[r.outcome] || 0) + 1 }), {});
    const retryable = batchRows.filter((r) => RETRYABLE_OUTCOMES.includes(r.outcome)).length;
    const unsettled = batchRows.filter((r) => UNSETTLED_OUTCOMES.includes(r.outcome)).length;
    const eligibleCount = batch ? batch.recipientIds.length : 0;

    return (

        <>

            <div className="modal fade show" style={{ display: "block" }} tabIndex="-1" role="dialog" aria-label="Bulk email">

                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">

                    <div className="modal-content">

                        <div className="modal-header">

                            <h5 className="modal-title">
                                <i className="bi bi-envelope-paper me-2"></i>
                                {step === "resume" || step === "nothing" || (resumeOnly && step === "results")
                                    ? "Bulk Email - earlier batch"
                                    : `Bulk Email - ${ids.length} selected ${ids.length === 1 ? noun : nouns}`}
                            </h5>

                            <button className="btn-close" onClick={handleClose} disabled={sending} aria-label="Close"></button>

                        </div>

                        <div className="modal-body">

                            {error && <div className="alert alert-danger py-2 px-3">{error}</div>}

                            {resumeNote && step !== "resume" && <div className="alert alert-info py-2 px-3">{resumeNote}</div>}

                            {/* ---------------- 0. an unfinished batch ---------------- */}
                            {step === "resume" && (

                                !resumeView ? (

                                    !error && <div className="text-muted">Checking the earlier bulk email batch...</div>

                                ) : (

                                    <>
                                        <div className="alert alert-warning py-2 px-3">
                                            You have a bulk email batch that was started earlier
                                            {resumeView.batch?.createdAt && <> ({new Date(resumeView.batch.createdAt).toLocaleString()})</>}.
                                            Its recipients and message are fixed and cannot be changed.
                                        </div>

                                        <p className="mb-2">
                                            {resumeView.results.length} recipient{resumeView.results.length === 1 ? "" : "s"}:{" "}
                                            {Object.entries(OUTCOME_STYLE).map(([key, style]) => {
                                                const n = resumeView.results.filter((r) => r.outcome === key).length;
                                                return n ? <span key={key} className={`badge ${style.className} me-2`}>{n} {style.label.toLowerCase()}</span> : null;
                                            })}
                                        </p>

                                        <p className="text-muted small mb-0">
                                            Continue to review it, and to send anything that has not gone out yet. Discarding only forgets it here -
                                            whatever was already sent stays recorded and will not be sent again.
                                        </p>
                                    </>

                                )

                            )}

                            {step === "nothing" && (
                                <div className="text-muted">There is no unfinished bulk email batch to resume.</div>
                            )}

                            {/* ---------------- 1. recipients ---------------- */}
                            {step === "recipients" && (

                                !recipientsPreview ? (

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
                                        {" "}Once you press Send, the recipients and the message are fixed.
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
                                                Working... {progress.done} of {progress.total} processed. Please keep this window open.
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

                                    <p className="mb-1" data-testid="results-summary">
                                        <strong>{context.selectedIds.length}</strong> selected
                                        {" "}&middot; <strong>{eligibleCount}</strong> eligible when you pressed Send
                                        {" "}&middot; <strong>{context.selectedIds.length - eligibleCount}</strong> not included
                                    </p>

                                    <p className="mb-2">
                                        {Object.entries(OUTCOME_STYLE).map(([key, style]) => (
                                            counts[key] ? (
                                                <span key={key} className={`badge ${style.className} me-2`}>
                                                    {counts[key]} {style.label.toLowerCase()}
                                                </span>
                                            ) : null
                                        ))}
                                        <span className="small text-muted" data-testid="results-total">
                                            Total {finalRows.length} of {context.selectedIds.length}
                                        </span>
                                    </p>

                                    <div className="table-responsive" style={{ maxHeight: "340px" }}>
                                        <table className="table table-sm align-middle">
                                            <thead>
                                                <tr><th>Company</th><th>Email</th><th>Result</th><th>Details</th></tr>
                                            </thead>
                                            <tbody>
                                                {finalRows.map((r) => {
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

                                    {!sending && (counts.UNKNOWN > 0 || counts.UNVERIFIED > 0) && (
                                        <p className="small text-muted mt-2 mb-0">
                                            "Unknown" or "unverified" means there is no reliable answer, so the email may or may not
                                            have been sent. It is never retried automatically and cannot be sent again from here -
                                            check your email provider's log if you need to be sure.
                                        </p>
                                    )}

                                </>

                            )}

                        </div>

                        <div className="modal-footer">

                            {step === "resume" && (
                                <>
                                    <button className="btn btn-outline-secondary" onClick={discardEarlierBatch} disabled={!resumeView}>
                                        Discard it{ids.length > 0 && !resumeOnly ? " and start a new batch" : ""}
                                    </button>
                                    <button className="btn btn-primary" onClick={adoptEarlierBatch} disabled={!resumeView}>
                                        Continue this batch
                                    </button>
                                </>
                            )}

                            {step === "nothing" && (
                                <button className="btn btn-primary" onClick={handleClose}>Close</button>
                            )}

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
                                    <button className="btn btn-outline-secondary" onClick={() => setStep("message")} disabled={sending}>Back</button>
                                    <button className="btn btn-success" disabled={sending || reviewEligible.length === 0} onClick={handleSend}>
                                        <i className="bi bi-send me-1"></i>
                                        Send {reviewEligible.length} email{reviewEligible.length === 1 ? "" : "s"}
                                    </button>
                                </>
                            )}

                            {step === "results" && (
                                <>
                                    {!sending && unsettled > 0 && (
                                        <button className="btn btn-outline-secondary" onClick={handleCheckStatus}>
                                            Check status
                                        </button>
                                    )}
                                    {!sending && retryable > 0 && unsettled === 0 && (
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

// Anything still to do (or still to be confirmed) keeps the batch resumable.
function hasUnfinished(rows) {
    return rows.some((r) => RETRYABLE_OUTCOMES.includes(r.outcome) || UNSETTLED_OUTCOMES.includes(r.outcome));
}
