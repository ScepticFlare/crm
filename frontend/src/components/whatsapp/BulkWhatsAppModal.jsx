import { useEffect, useMemo, useRef, useState } from "react";

import { getActiveWhatsAppTemplates } from "../../services/whatsappTemplateService";
import {
    BULK_WHATSAPP_CHUNK_SIZE,
    BULK_WHATSAPP_MAX_RECORDS,
    RETRYABLE_OUTCOMES,
    UNSETTLED_OUTCOMES,
    createBulkWhatsAppBatch,
    describeFailure,
    getBulkWhatsAppBatch,
    getWhatsAppAccess,
    previewBulkWhatsApp,
    sendBulkWhatsApp,
} from "../../services/bulkWhatsAppService";
import {
    clearBulkWhatsAppRecovery,
    loadBulkWhatsAppRecovery,
    saveBulkWhatsAppRecovery,
} from "../../services/bulkWhatsAppRecovery";

const OUTCOME_STYLE = {
    ACCEPTED: { className: "bg-success", label: "Accepted by WhatsApp provider" },
    FAILED: { className: "bg-danger", label: "Failed - not sent" },
    UNKNOWN: { className: "bg-warning text-dark", label: "Unknown - may have been sent" },
    UNVERIFIED: { className: "bg-warning text-dark", label: "Unverified - may have been sent" },
    IN_PROGRESS: { className: "bg-info text-dark", label: "In progress" },
    NOT_ATTEMPTED: { className: "bg-secondary", label: "Not sent yet" },
    EXCLUDED: { className: "bg-secondary", label: "Not included" },
    REMOVED: { className: "bg-light text-dark border", label: "Removed by you" },
};

// Only shown once the provider has reported it (webhooks). Accepted is NOT delivered.
const DELIVERY_STYLE = {
    PENDING: { className: "bg-light text-dark border", label: "Waiting for WhatsApp" },
    SENT: { className: "bg-info text-dark", label: "Sent" },
    DELIVERED: { className: "bg-primary", label: "Delivered" },
    READ: { className: "bg-success", label: "Read" },
    FAILED: { className: "bg-danger", label: "Delivery failed" },
};

// After a refresh only the exclusion CODE was kept, never wording or personal data.
const EXCLUSION_TEXT = {
    NOT_AVAILABLE: "This record was not found or you do not have access to it.",
    NO_PHONE: "No phone number on file.",
    INVALID_PHONE: "The phone number on file is not a valid mobile number for WhatsApp.",
    NO_OPT_IN: "No WhatsApp opt-in is recorded for this number.",
    OPTED_OUT: "This number has opted out of WhatsApp messages.",
    DUPLICATE_PHONE: "Same WhatsApp number as another selected record - one message per number.",
    RECENTLY_MESSAGED: "This number (or record) was already messaged - or may have been - recently.",
    UNRESOLVED_VARIABLE: "The template needs a value this record does not have.",
    PROVIDER_UNAVAILABLE: "Not sent: the WhatsApp provider stopped responding. Safe to send later.",
};

// Bulk WhatsApp for the selected Leads or Opportunities. Steps:
//   (resume) -> recipients -> message -> review -> results
// The message is an admin-made template: nobody types or edits {{...}} fields
// here. Each recipient's text is rendered by the SERVER from their own record
// and shown read-only. Nothing is sent until the explicit, confirmed Send on the
// review step; that creates a server batch pinning the recipients and the
// template version, which this window can then only ask to send.
export default function BulkWhatsAppModal({ show, ...props }) {
    return show ? <BulkWhatsAppModalBody {...props} /> : null;
}

function BulkWhatsAppModalBody({ target, ids = [], resumeOnly = false, onClose, onSent }) {

    const nouns = target === "OPPORTUNITY" ? "opportunities" : "leads";

    const [stored] = useState(() => loadBulkWhatsAppRecovery(target));
    const [step, setStep] = useState(stored ? "resume" : (resumeOnly ? "nothing" : "recipients"));

    const overCap = ids.length > BULK_WHATSAPP_MAX_RECORDS;

    const [access, setAccess] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [actionError, setActionError] = useState(null);

    const [recipientsPreview, setRecipientsPreview] = useState(null);
    const [removedIds, setRemovedIds] = useState([]);

    const [templates, setTemplates] = useState(null);
    const [templateId, setTemplateId] = useState("");
    const [messagePreview, setMessagePreview] = useState(null);
    const [shownId, setShownId] = useState(null);
    const [confirmed, setConfirmed] = useState(false);

    const [batch, setBatch] = useState(null);
    const [context, setContext] = useState({ selectedIds: [], preExcluded: {}, removedIds: [] });
    const [rows, setRows] = useState([]);
    const [sending, setSending] = useState(false);
    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const [sendError, setSendError] = useState(null);

    const sendingRef = useRef(false);
    const requested = useRef(false);

    const ready = !!access?.ready;
    const chunkSize = Math.min(access?.chunkSize || BULK_WHATSAPP_CHUNK_SIZE, BULK_WHATSAPP_CHUNK_SIZE);

    // ---------------------------------------------------------------- loading

    useEffect(() => {
        getWhatsAppAccess().then(setAccess).catch(() => setAccess(null));
    }, []);

    useEffect(() => {

        if (step !== "recipients" || requested.current || recipientsPreview || overCap || ids.length === 0) {
            return;
        }

        requested.current = true;
        setLoading(true);

        previewBulkWhatsApp({ target, ids })
            .then(setRecipientsPreview)
            .catch((err) => setLoadError(describeFailure(err)))
            .finally(() => setLoading(false));

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    useEffect(() => {

        if (step !== "resume" || !stored) {
            return;
        }

        getBulkWhatsAppBatch(stored.batchId)
            .then((view) => {
                setBatch({ batchId: stored.batchId, recipientIds: view.batch?.recipientIds || [], templateName: view.batch?.templateName });
                setContext({ selectedIds: stored.selectedIds, preExcluded: stored.preExcluded || {}, removedIds: stored.removedIds || [] });
                setRows(view.results);
                setStep("results");
            })
            .catch((err) => {
                const status = err?.response?.status;
                if (status === 404 || status === 403) {
                    clearBulkWhatsAppRecovery(target);
                    setStep(ids.length > 0 && !resumeOnly ? "recipients" : "nothing");
                } else {
                    setLoadError(describeFailure(err));
                }
            });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    const eligible = useMemo(
        () => (recipientsPreview?.recipients || []).filter((r) => r.eligible),
        [recipientsPreview]);

    const excluded = useMemo(
        () => (recipientsPreview?.recipients || []).filter((r) => !r.eligible),
        [recipientsPreview]);

    const kept = eligible.filter((r) => !removedIds.includes(r.id));

    const willReceive = (messagePreview?.recipients || []).filter((r) => r.eligible && !removedIds.includes(r.id));
    const notIncluded = (messagePreview?.recipients || []).filter((r) => !r.eligible);

    // ---------------------------------------------------------------- steps

    async function goToMessage() {

        setActionError(null);
        setStep("message");

        if (templates === null) {
            try {
                setTemplates(await getActiveWhatsAppTemplates());
            } catch (err) {
                setTemplates([]);
                setActionError(describeFailure(err));
            }
        }
    }

    async function chooseTemplate(id) {

        setTemplateId(id);
        setMessagePreview(null);
        setConfirmed(false);
        setActionError(null);

        if (!id) {
            return;
        }

        try {
            setLoading(true);
            const data = await previewBulkWhatsApp({ target, ids: kept.map((r) => r.id), templateId: Number(id) });
            setMessagePreview(data);
            setShownId(data.recipients.find((r) => r.eligible)?.id ?? null);
        } catch (err) {
            setActionError(describeFailure(err));
        } finally {
            setLoading(false);
        }
    }

    async function handleSend() {

        if (sendingRef.current || !confirmed) {
            return;
        }

        sendingRef.current = true;
        setSending(true);
        setActionError(null);

        try {

            const sendable = willReceive.map((r) => r.id);

            let created;

            try {
                created = await createBulkWhatsAppBatch({ target, ids: sendable, templateId: Number(templateId) });
            } catch (err) {
                setActionError(describeFailure(err) + " Nothing was sent.");
                return;
            }

            const preExcluded = {};
            excluded.forEach((r) => { preExcluded[r.id] = { code: r.exclusionCode, message: r.exclusionMessage }; });
            notIncluded.forEach((r) => { preExcluded[r.id] = { code: r.exclusionCode, message: r.exclusionMessage }; });

            const nextContext = { selectedIds: [...ids], preExcluded, removedIds: [...removedIds] };

            setContext(nextContext);
            setBatch({ batchId: created.batchId, recipientIds: sendable, templateName: created.templateName });
            setRows(sendable.map((id) => ({ id, outcome: "NOT_ATTEMPTED", detail: "Not sent yet." })));
            setStep("results");

            const codes = {};
            Object.entries(preExcluded).forEach(([id, v]) => { codes[id] = v.code; });

            saveBulkWhatsAppRecovery(target, {
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

    async function runChunks(batchId, chunkIdsToSend) {

        setSendError(null);
        setProgress({ done: 0, total: chunkIdsToSend.length });

        const { results, error } = await sendBulkWhatsApp(
            { batchId, ids: chunkIdsToSend, chunkSize },
            (soFar, done, total) => {
                mergeRows(soFar);
                setProgress({ done, total });
            });

        mergeRows(results);
        setSendError(error);
        settleRecovery(results);
        onSent?.();
    }

    function mergeRows(updates) {
        setRows((current) => {
            const byId = new Map(current.map((r) => [r.id, r]));
            updates.forEach((u) => byId.set(u.id, { ...byId.get(u.id), ...u }));
            return [...byId.values()];
        });
    }

    // Retry: only what is safe to send again.
    async function handleRetry() {

        if (sendingRef.current || !batch) {
            return;
        }

        const retryable = rows.filter((r) => RETRYABLE_OUTCOMES.includes(r.outcome)).map((r) => r.id);

        if (retryable.length === 0) {
            return;
        }

        sendingRef.current = true;
        setSending(true);

        try {
            await runChunks(batch.batchId, retryable);
        } finally {
            sendingRef.current = false;
            setSending(false);
        }
    }

    // Check status: the server's record of the whole batch (incl. delivery updates).
    async function handleCheckStatus() {

        if (!batch) {
            return;
        }

        try {
            setSendError(null);
            const view = await getBulkWhatsAppBatch(batch.batchId);
            setRows(view.results);
            settleRecovery(view.results);
        } catch (err) {
            setSendError(describeFailure(err));
        }
    }

    function settleRecovery(results) {
        const open = results.some((r) => RETRYABLE_OUTCOMES.includes(r.outcome) || UNSETTLED_OUTCOMES.includes(r.outcome));
        if (!open) {
            clearBulkWhatsAppRecovery(target);
        }
    }

    // ---------------------------------------------------------------- results view

    const resultRows = useMemo(() => {

        if (!batch) {
            return [];
        }

        const byId = new Map(rows.map((r) => [r.id, r]));
        const all = [];

        for (const id of context.selectedIds.length ? context.selectedIds : batch.recipientIds) {

            if (byId.has(id)) {
                all.push(byId.get(id));
            } else if (context.removedIds.includes(id)) {
                all.push({ id, outcome: "REMOVED", detail: "You removed this record from the batch." });
            } else if (context.preExcluded[id]) {
                const pre = context.preExcluded[id];
                const code = typeof pre === "string" ? pre : pre.code;
                all.push({ id, outcome: "EXCLUDED", exclusionCode: code,
                    detail: (typeof pre === "object" && pre.message) || EXCLUSION_TEXT[code] || "Not included." });
            }
        }

        return all;

    }, [batch, rows, context]);

    const counts = useMemo(() => {
        const c = {};
        resultRows.forEach((r) => { c[r.outcome] = (c[r.outcome] || 0) + 1; });
        return c;
    }, [resultRows]);

    const retryableCount = rows.filter((r) => RETRYABLE_OUTCOMES.includes(r.outcome)).length;

    const shown = willReceive.find((r) => r.id === shownId) || willReceive[0];

    // ---------------------------------------------------------------- render

    return (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,0.4)" }}>
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
                <div className="modal-content">

                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="bi bi-whatsapp me-2 text-success"></i>
                            Bulk WhatsApp {step === "results" && batch?.templateName ? `- ${batch.templateName}` : ""}
                        </h5>
                        <button type="button" className="btn-close" aria-label="Close" onClick={onClose} disabled={sending}></button>
                    </div>

                    <div className="modal-body">

                        {access && !ready && step !== "results" && (
                            <div className="alert alert-warning py-2" role="alert">
                                <i className="bi bi-plug me-2"></i>
                                {access.message || "WhatsApp is not available right now."} You can review recipients, but nothing can be sent.
                            </div>
                        )}

                        {(loadError || (step === "recipients" && overCap)) && (
                            <div className="alert alert-danger py-2">
                                {overCap
                                    ? `At most ${BULK_WHATSAPP_MAX_RECORDS} ${nouns} can be messaged in one batch. Select fewer records.`
                                    : loadError}
                            </div>
                        )}

                        {actionError && <div className="alert alert-danger py-2">{actionError}</div>}

                        {step === "resume" && !loadError && <p className="text-muted">Checking your unfinished batch with the server…</p>}

                        {step === "nothing" && <p className="text-muted">There is no unfinished Bulk WhatsApp batch.</p>}

                        {step === "recipients" && !overCap && !loadError && (
                            loading || !recipientsPreview
                                ? <p className="text-muted">Checking the selected {nouns}…</p>
                                : (
                                    <>
                                        <p>
                                            <strong>{kept.length}</strong> of {recipientsPreview.requested} selected {nouns} can be messaged.
                                            Only numbers with a recorded WhatsApp opt-in are included. Removing someone here only affects this batch - the record is not changed.
                                        </p>

                                        <RecipientTable
                                            rows={eligible}
                                            removedIds={removedIds}
                                            onToggle={(id) => setRemovedIds((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])}
                                        />

                                        {excluded.length > 0 && (
                                            <>
                                                <h6 className="mt-4">Not included ({excluded.length})</h6>
                                                <ExcludedTable rows={excluded} />
                                            </>
                                        )}
                                    </>
                                )
                        )}

                        {step === "message" && (
                            <>
                                <label className="form-label fw-semibold" htmlFor="wa-template">WhatsApp template</label>

                                {templates === null && <p className="text-muted">Loading templates…</p>}

                                {templates && templates.length === 0 && (
                                    <div className="alert alert-info py-2">
                                        No active WhatsApp templates yet. An administrator can create one under WhatsApp Templates.
                                    </div>
                                )}

                                {templates && templates.length > 0 && (
                                    <select id="wa-template" className="form-select mb-3" value={templateId}
                                            onChange={(e) => chooseTemplate(e.target.value)}>
                                        <option value="">Choose a template…</option>
                                        {templates.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                )}

                                {loading && <p className="text-muted">Preparing each recipient's message…</p>}

                                {messagePreview && !loading && (
                                    <>
                                        {willReceive.length > 0 ? (
                                            <>
                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                    <span className="small text-muted">Message for</span>
                                                    <select className="form-select form-select-sm w-auto" aria-label="Show the message for"
                                                            value={shown?.id ?? ""} onChange={(e) => setShownId(Number(e.target.value))}>
                                                        {willReceive.map((r) => (
                                                            <option key={r.id} value={r.id}>{r.companyName}{r.contactPerson ? ` - ${r.contactPerson}` : ""}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <MessageBubble text={shown?.renderedText} />
                                                <p className="small text-muted mt-2 mb-0">
                                                    Every recipient gets this template filled in from their own record by the server. The text cannot be edited here.
                                                </p>
                                            </>
                                        ) : (
                                            <div className="alert alert-warning py-2">No recipient can receive this template.</div>
                                        )}

                                        {notIncluded.length > 0 && (
                                            <>
                                                <h6 className="mt-4">Not included with this template ({notIncluded.length})</h6>
                                                <ExcludedTable rows={notIncluded} />
                                            </>
                                        )}
                                    </>
                                )}
                            </>
                        )}

                        {step === "review" && messagePreview && (
                            <>
                                <div className="row g-3 mb-3">
                                    <Stat label="Selected" value={ids.length} />
                                    <Stat label="Will receive a WhatsApp message" value={willReceive.length} highlight />
                                    <Stat label="Not included" value={ids.length - willReceive.length} />
                                </div>

                                <h6>Examples</h6>
                                {willReceive.slice(0, 3).map((r) => (
                                    <div key={r.id} className="mb-3">
                                        <div className="small text-muted mb-1">{r.companyName} · {r.phoneMasked}</div>
                                        <MessageBubble text={r.renderedText} />
                                    </div>
                                ))}

                                <div className="form-check mt-3">
                                    <input className="form-check-input" type="checkbox" id="wa-confirm" checked={confirmed}
                                           onChange={(e) => setConfirmed(e.target.checked)} disabled={sending} />
                                    <label className="form-check-label" htmlFor="wa-confirm">
                                        Send {willReceive.length} individual WhatsApp message(s) now. I confirm these people have opted in to WhatsApp messages from us.
                                    </label>
                                </div>
                            </>
                        )}

                        {step === "results" && batch && (
                            <>
                                {sending && (
                                    <div className="alert alert-info py-2">
                                        Sending… {progress.done} of {progress.total}. Keep this window open.
                                    </div>
                                )}

                                {sendError && <div className="alert alert-warning py-2">{sendError}</div>}

                                <div className="d-flex flex-wrap gap-2 mb-3 small">
                                    {Object.entries(counts).map(([outcome, n]) => (
                                        <span key={outcome} className={`badge ${OUTCOME_STYLE[outcome]?.className || "bg-secondary"}`}>
                                            {OUTCOME_STYLE[outcome]?.label || outcome}: {n}
                                        </span>
                                    ))}
                                </div>

                                <p className="small text-muted">
                                    "Accepted" means the WhatsApp provider took the message - not that it was delivered.
                                    Delivered / Read appear when WhatsApp reports them; use Check status to refresh.
                                </p>

                                <ResultsTable rows={resultRows} />
                            </>
                        )}

                    </div>

                    <div className="modal-footer">

                        {step === "recipients" && (
                            <>
                                <button className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
                                <button className="btn btn-success" onClick={goToMessage} disabled={kept.length === 0 || overCap || loading}>
                                    Continue ({kept.length})
                                </button>
                            </>
                        )}

                        {step === "message" && (
                            <>
                                <button className="btn btn-outline-secondary" onClick={() => setStep("recipients")}>Back</button>
                                <button className="btn btn-success" onClick={() => setStep("review")}
                                        disabled={!messagePreview || willReceive.length === 0 || loading}>
                                    Review ({willReceive.length})
                                </button>
                            </>
                        )}

                        {step === "review" && (
                            <>
                                <button className="btn btn-outline-secondary" onClick={() => setStep("message")} disabled={sending}>Back</button>
                                <button className="btn btn-success" onClick={handleSend}
                                        disabled={!confirmed || sending || !ready || willReceive.length === 0}>
                                    {sending ? "Sending…" : `Send ${willReceive.length} WhatsApp message(s)`}
                                </button>
                            </>
                        )}

                        {step === "results" && (
                            <>
                                <button className="btn btn-outline-secondary" onClick={handleCheckStatus} disabled={sending}>
                                    <i className="bi bi-arrow-clockwise me-1"></i>Check status
                                </button>
                                {retryableCount > 0 && (
                                    <button className="btn btn-outline-success" onClick={handleRetry} disabled={sending}>
                                        Send remaining / retry failed ({retryableCount})
                                    </button>
                                )}
                                <button className="btn btn-secondary" onClick={onClose} disabled={sending}>Close</button>
                            </>
                        )}

                        {(step === "nothing" || step === "resume") && (
                            <button className="btn btn-secondary" onClick={onClose}>Close</button>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------- pieces

function Stat({ label, value, highlight }) {
    return (
        <div className="col-md-4">
            <div className={`border rounded p-3 text-center ${highlight ? "border-success" : ""}`}>
                <div className="fs-4 fw-semibold">{value}</div>
                <div className="small text-muted">{label}</div>
            </div>
        </div>
    );
}

// Read-only: the server-rendered text, never an editable draft with {{fields}}.
function MessageBubble({ text }) {
    return (
        <div className="border rounded p-3 bg-light" data-testid="wa-message" style={{ whiteSpace: "pre-wrap", maxWidth: 560 }}>
            {text}
        </div>
    );
}

function RecipientTable({ rows, removedIds, onToggle }) {

    if (rows.length === 0) {
        return <div className="alert alert-light border py-2">None of the selected records can be messaged.</div>;
    }

    return (
        <div className="table-responsive">
            <table className="table table-sm align-middle">
                <thead><tr><th>Company</th><th>Contact</th><th>WhatsApp number</th><th></th></tr></thead>
                <tbody>
                    {rows.map((r) => {
                        const removed = removedIds.includes(r.id);
                        return (
                            <tr key={r.id} className={removed ? "text-muted text-decoration-line-through" : ""}>
                                <td>
                                    {r.companyName}
                                    {r.warnings?.map((w) => <div key={w} className="small text-warning">{w}</div>)}
                                </td>
                                <td>{r.contactPerson}</td>
                                <td><code>{r.phoneMasked}</code></td>
                                <td className="text-end">
                                    <button className="btn btn-sm btn-link" onClick={() => onToggle(r.id)}>
                                        {removed ? "Add back" : "Remove from batch"}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function ExcludedTable({ rows }) {
    return (
        <div className="table-responsive">
            <table className="table table-sm align-middle">
                <thead><tr><th>Record</th><th>Number</th><th>Why not</th></tr></thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={r.id}>
                            <td>{r.companyName || `Record #${r.id}`}</td>
                            <td>{r.phoneMasked ? <code>{r.phoneMasked}</code> : "-"}</td>
                            <td className="small">{r.exclusionMessage || EXCLUSION_TEXT[r.exclusionCode] || r.exclusionCode}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ResultsTable({ rows }) {
    return (
        <div className="table-responsive">
            <table className="table table-sm align-middle">
                <thead><tr><th>Record</th><th>Number</th><th>Outcome</th><th>Delivery</th><th>Detail</th></tr></thead>
                <tbody>
                    {rows.map((r) => {
                        const o = OUTCOME_STYLE[r.outcome] || { className: "bg-secondary", label: r.outcome };
                        const d = r.deliveryStatus ? DELIVERY_STYLE[r.deliveryStatus] : null;
                        return (
                            <tr key={r.id}>
                                <td>{r.companyName || `Record #${r.id}`}</td>
                                <td>{r.phoneMasked ? <code>{r.phoneMasked}</code> : "-"}</td>
                                <td><span className={`badge ${o.className}`}>{o.label}</span></td>
                                <td>{d ? <span className={`badge ${d.className}`}>{d.label}</span> : <span className="text-muted small">-</span>}</td>
                                <td className="small">{r.detail || (r.exclusionCode ? EXCLUSION_TEXT[r.exclusionCode] : "")}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
