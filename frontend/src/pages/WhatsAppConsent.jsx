import { useCallback, useEffect, useState } from "react";

import {
    bulkWhatsAppOptIn,
    listWhatsAppConsent,
    listWhatsAppConsentAudit,
    recordWhatsAppConsentForPhone,
} from "../services/whatsappConsentService";
import { businessTodayIso, formatDate, formatDateTime } from "../utils/formatDate";
import BritishDateInput from "../components/inputs/BritishDateInput";

const PAGE_SIZE = 25;

const OUTCOME_LABELS = {
    OPTED_IN: "Opted in",
    ALREADY_OPTED_IN: "Already opted in - unchanged",
    SKIPPED_OPTED_OUT: "Skipped - this number opted out",
    INVALID_PHONE: "Not a valid WhatsApp mobile number",
    DUPLICATE_IN_LIST: "Repeated in the list",
};

function errorText(err, fallback) {
    if (err.response?.status === 403) {
        return "Only an administrator can manage WhatsApp consent.";
    }
    return err.response?.data?.message || fallback;
}

// The Indian calendar day - the UTC day (toISOString) is still yesterday before 05:30 IST.
function today() {
    return businessTodayIso();
}

// Admin-only WhatsApp consent management. A number is only ever messaged in
// bulk with a recorded opt-in, and an opt-out always wins. A pasted list of
// numbers is NOT consent by itself: the import needs the source, the date the
// consent was given and what documents it, and it never touches a number that
// has opted out. Every change appears in the history below.
export default function WhatsAppConsent() {

    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [query, setQuery] = useState("");
    const [audit, setAudit] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState(null);

    // single number
    const [phone, setPhone] = useState("");
    const [status, setStatus] = useState("OPTED_OUT");
    const [source, setSource] = useState("");
    const [evidence, setEvidence] = useState("");
    const [date, setDate] = useState(today());
    const [saving, setSaving] = useState(false);

    // bulk import
    const [importText, setImportText] = useState("");
    const [importSource, setImportSource] = useState("");
    const [importEvidence, setImportEvidence] = useState("");
    const [importDate, setImportDate] = useState("");
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    // Fetches and applies a page; state is only set once the data is back.
    const load = useCallback((nextPage, q) => Promise.all([
        listWhatsAppConsent({ query: q, page: nextPage, size: PAGE_SIZE }),
        listWhatsAppConsentAudit({ page: 0, size: 25 }),
    ]).then(([list, history]) => {
        setItems(list.content);
        setTotal(list.totalElements);
        setAudit(history.content);
        setError(null);
    }).catch((err) => {
        setError(errorText(err, "Unable to load WhatsApp consent."));
    }).finally(() => {
        setLoading(false);
    }), []);

    useEffect(() => {
        load(page, query);
    }, [load, page]); // eslint-disable-line react-hooks/exhaustive-deps

    function goToPage(next) {
        setLoading(true);
        setPage(next);
    }

    async function recordSingle(e) {
        e.preventDefault();
        setSaving(true);
        setNotice(null);
        setError(null);
        try {
            await recordWhatsAppConsentForPhone({
                phone, status, source: source || undefined, evidence: evidence || undefined,
                consentedAt: date || undefined,
            });
            setNotice(status === "OPTED_OUT" ? "Opt-out recorded." : "Opt-in recorded.");
            setPhone(""); setSource(""); setEvidence("");
            await load(0, query);
            setPage(0);
        } catch (err) {
            setError(errorText(err, "Could not record consent."));
        } finally {
            setSaving(false);
        }
    }

    async function runImport(e) {
        e.preventDefault();
        const phones = importText.split(/[\n,;]+/).map((p) => p.trim()).filter(Boolean);
        if (phones.length === 0) {
            setError("Add at least one phone number to import.");
            return;
        }
        setImporting(true);
        setError(null);
        setImportResult(null);
        try {
            const result = await bulkWhatsAppOptIn({
                phones, source: importSource, evidence: importEvidence, consentedAt: importDate,
            });
            setImportResult(result);
            setImportText("");
            await load(0, query);
            setPage(0);
        } catch (err) {
            setError(errorText(err, "The import failed - nothing was changed."));
        } finally {
            setImporting(false);
        }
    }

    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const importReady = importText.trim() && importSource.trim() && importEvidence.trim() && importDate;

    return (
        <>
            <h3 className="mb-1">WhatsApp Consent</h3>
            <p className="text-muted small">
                Bulk WhatsApp only messages numbers with a recorded opt-in. An opt-out - recorded here, on a lead, or by the
                customer replying STOP / UNSUBSCRIBE - immediately blocks every record that shares the number.
            </p>

            {error && <div className="alert alert-danger py-2">{error}</div>}
            {notice && <div className="alert alert-success py-2">{notice}</div>}

            <div className="row g-4 mb-4">

                <div className="col-lg-5">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-header bg-white fw-semibold">Record for one number</div>
                        <form className="card-body" onSubmit={recordSingle}>
                            <div className="mb-2">
                                <label className="form-label small" htmlFor="wc-phone">Phone number</label>
                                <input id="wc-phone" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)}
                                       placeholder="9876543210" required />
                            </div>
                            <div className="mb-2">
                                <label className="form-label small" htmlFor="wc-status">Consent</label>
                                <select id="wc-status" className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                                    <option value="OPTED_OUT">Opted out (do not message)</option>
                                    <option value="OPTED_IN">Opted in</option>
                                </select>
                            </div>
                            <div className="mb-2">
                                <label className="form-label small" htmlFor="wc-source">Source {status === "OPTED_IN" && "(required)"}</label>
                                <input id="wc-source" className="form-control" value={source} onChange={(e) => setSource(e.target.value)}
                                       placeholder="e.g. Enquiry form, Phone call" required={status === "OPTED_IN"} />
                            </div>
                            <div className="mb-2">
                                <label className="form-label small" htmlFor="wc-evidence">Evidence {status === "OPTED_IN" && "(required)"}</label>
                                <input id="wc-evidence" className="form-control" value={evidence} onChange={(e) => setEvidence(e.target.value)}
                                       placeholder="Form reference, call note…" required={status === "OPTED_IN"} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label small" htmlFor="wc-date">Date given</label>
                                <BritishDateInput id="wc-date" className="form-control" value={date} max={today()}
                                       onChange={(e) => setDate(e.target.value)} required={status === "OPTED_IN"} />
                            </div>
                            <button className="btn btn-success" disabled={saving}>{saving ? "Saving…" : "Record"}</button>
                        </form>
                    </div>
                </div>

                <div className="col-lg-7">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-header bg-white fw-semibold">Import documented opt-ins</div>
                        <form className="card-body" onSubmit={runImport}>
                            <p className="small text-muted">
                                Only import numbers whose consent you can document. All numbers in one import share the source,
                                date and evidence below. Numbers that opted out are never changed.
                            </p>
                            <div className="mb-2">
                                <label className="form-label small" htmlFor="wc-import">Phone numbers (one per line)</label>
                                <textarea id="wc-import" className="form-control" rows={5} value={importText}
                                          onChange={(e) => setImportText(e.target.value)} />
                            </div>
                            <div className="row g-2 mb-3">
                                <div className="col-md-4">
                                    <label className="form-label small" htmlFor="wc-import-source">Source</label>
                                    <input id="wc-import-source" className="form-control" value={importSource}
                                           onChange={(e) => setImportSource(e.target.value)} placeholder="Website enquiry form" />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small" htmlFor="wc-import-date">Date consent was given</label>
                                    <BritishDateInput id="wc-import-date" className="form-control" value={importDate} max={today()}
                                           onChange={(e) => setImportDate(e.target.value)} />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label small" htmlFor="wc-import-evidence">Evidence</label>
                                    <input id="wc-import-evidence" className="form-control" value={importEvidence}
                                           onChange={(e) => setImportEvidence(e.target.value)} placeholder="Export file / form id" />
                                </div>
                            </div>
                            <button className="btn btn-success" disabled={!importReady || importing}>
                                {importing ? "Importing…" : "Import opt-ins"}
                            </button>

                            {importResult && (
                                <div className="mt-3">
                                    <div className="small mb-2">
                                        {importResult.optedIn} opted in · {importResult.alreadyOptedIn} already opted in ·
                                        {" "}{importResult.skippedOptedOut} skipped (opted out) · {importResult.invalid} invalid ·
                                        {" "}{importResult.duplicates} repeated
                                    </div>
                                    <table className="table table-sm small">
                                        <tbody>
                                            {importResult.rows.map((r, i) => (
                                                <tr key={i}>
                                                    <td><code>{r.phoneMasked || r.input}</code></td>
                                                    <td>{OUTCOME_LABELS[r.outcome] || r.outcome}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm border-0 mb-4">
                <div className="card-header bg-white d-flex flex-wrap gap-2 align-items-center">
                    <span className="fw-semibold flex-grow-1">Numbers on record ({total})</span>
                    <input className="form-control form-control-sm w-auto" placeholder="Search number" value={query}
                           onChange={(e) => setQuery(e.target.value)}
                           onKeyDown={(e) => { if (e.key === "Enter") { setLoading(true); setPage(0); load(0, query); } }} />
                </div>
                <div className="card-body table-responsive">
                    {loading ? <p className="text-muted mb-0">Loading…</p> : items.length === 0 ? (
                        <p className="text-muted mb-0">No consent recorded yet.</p>
                    ) : (
                        <table className="table table-sm align-middle mb-0">
                            <thead><tr><th>Number</th><th>Status</th><th>Source</th><th>Date given</th><th>Evidence</th><th>Updated</th></tr></thead>
                            <tbody>
                                {items.map((c) => (
                                    <tr key={c.phone}>
                                        <td><code>{c.phone}</code></td>
                                        <td>
                                            <span className={`badge ${c.status === "OPTED_IN" ? "bg-success" : "bg-danger"}`}>
                                                {c.status === "OPTED_IN" ? "Opted in" : "Opted out"}
                                            </span>
                                        </td>
                                        <td className="small">{c.source}</td>
                                        <td className="small">{formatDate(c.consentedAt)}</td>
                                        <td className="small">{c.evidence}</td>
                                        <td className="small">{formatDateTime(c.updatedAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {pages > 1 && (
                        <div className="d-flex gap-2 mt-3">
                            <button className="btn btn-sm btn-outline-secondary" disabled={page === 0} onClick={() => goToPage(page - 1)}>Previous</button>
                            <span className="small align-self-center">Page {page + 1} of {pages}</span>
                            <button className="btn btn-sm btn-outline-secondary" disabled={page + 1 >= pages} onClick={() => goToPage(page + 1)}>Next</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-header bg-white fw-semibold">Recent changes</div>
                <div className="card-body table-responsive">
                    {audit.length === 0 ? <p className="text-muted mb-0">No changes yet.</p> : (
                        <table className="table table-sm small mb-0">
                            <thead><tr><th>When</th><th>Number</th><th>Change</th><th>Source</th><th>Evidence</th><th>By</th></tr></thead>
                            <tbody>
                                {audit.map((a) => (
                                    <tr key={a.id}>
                                        <td>{formatDateTime(a.performedAt)}</td>
                                        <td><code>{a.phone}</code></td>
                                        <td>{(a.previousStatus || "none").replace("_", " ")} → {a.newStatus.replace("_", " ")}</td>
                                        <td>{a.source}</td>
                                        <td>{a.evidence}</td>
                                        <td>{a.performedByName || "System"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}
