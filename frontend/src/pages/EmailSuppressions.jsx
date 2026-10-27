import { useCallback, useEffect, useState } from "react";

import {
    addEmailSuppression,
    listEmailSuppressionAudit,
    listEmailSuppressions,
    removeEmailSuppression,
} from "../services/emailSuppressionService";

const REASONS = {
    OPT_OUT: "Opted out",
    BOUNCE: "Bounced",
    COMPLAINT: "Complaint",
    MANUAL: "Added manually",
};

const PAGE_SIZE = 25;

function errorText(err, fallback) {

    if (err.response?.status === 403) {
        return "Only an administrator can manage the do-not-email list.";
    }

    return err.response?.data?.message || fallback;
}

// Admin-only management of the do-not-email list. An address on the list is never
// emailed by the single-send, Keep-in-Touch or Bulk Email flows - for every lead and
// opportunity that shares it. Every addition and removal is recorded below.
export default function EmailSuppressions() {

    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState(null);

    const [email, setEmail] = useState("");
    const [reason, setReason] = useState("OPT_OUT");
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);

    const [removingId, setRemovingId] = useState(null);
    const [justification, setJustification] = useState("");

    const [audit, setAudit] = useState([]);

    const load = useCallback(async (nextPage, q) => {

        setLoading(true);
        setError(null);

        try {

            const [list, history] = await Promise.all([
                listEmailSuppressions({ q, page: nextPage, size: PAGE_SIZE }),
                listEmailSuppressionAudit({ page: 0, size: 10 }),
            ]);

            setItems(list.items);
            setTotal(list.total);
            setAudit(history.items);

        } catch (err) {

            console.error(err);
            setError(errorText(err, "Unable to load the do-not-email list."));

        } finally {

            setLoading(false);

        }

    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load(0, "");
    }, [load]);

    async function handleAdd(e) {

        e.preventDefault();

        setSaving(true);
        setError(null);
        setNotice(null);

        try {

            const added = await addEmailSuppression({ email, reason, note });

            setNotice(`${added.email} will no longer be emailed.`);
            setEmail("");
            setNote("");
            setPage(0);
            await load(0, query);

        } catch (err) {

            console.error(err);
            setError(errorText(err, "Unable to add that address."));

        } finally {

            setSaving(false);

        }

    }

    async function handleRemove(id) {

        setSaving(true);
        setError(null);
        setNotice(null);

        try {

            await removeEmailSuppression(id, justification);

            setNotice("The address was removed from the list. The removal and your explanation are in the history.");
            setRemovingId(null);
            setJustification("");
            await load(page, query);

        } catch (err) {

            console.error(err);
            setError(errorText(err, "Unable to remove that address."));

        } finally {

            setSaving(false);

        }

    }

    function handleSearch(e) {

        e.preventDefault();
        setPage(0);
        load(0, query);

    }

    function goTo(nextPage) {

        setPage(nextPage);
        load(nextPage, query);

    }

    const lastPage = Math.max(Math.ceil(total / PAGE_SIZE) - 1, 0);

    return (

        <>

            <div className="mb-3">
                <h2 className="mb-1">Do-not-email list</h2>
                <p className="text-muted mb-1">
                    An address on this list is never emailed - by single Send Email, Keep in Touch or Bulk Email - for every lead and
                    opportunity that uses it.
                </p>
                <p className="small text-muted mb-0">
                    This list is a technical safeguard only. It does not by itself make a mailing lawful: consent, opt-out handling and
                    company policy still have to be followed.
                </p>
            </div>

            {error && <div className="alert alert-danger py-2 px-3">{error}</div>}
            {notice && <div className="alert alert-success py-2 px-3">{notice}</div>}

            <div className="card shadow-sm border-0 mb-3">
                <div className="card-body">

                    <form className="row g-2 align-items-end" onSubmit={handleAdd}>

                        <div className="col-md-4">
                            <label className="form-label" htmlFor="suppression-email">Email address</label>
                            <input
                                id="suppression-email"
                                type="email"
                                className="form-control"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="col-md-2">
                            <label className="form-label" htmlFor="suppression-reason">Reason</label>
                            <select
                                id="suppression-reason"
                                className="form-select"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            >
                                {Object.entries(REASONS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-4">
                            <label className="form-label" htmlFor="suppression-note">Note (optional)</label>
                            <input
                                id="suppression-note"
                                type="text"
                                className="form-control"
                                value={note}
                                maxLength={500}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>

                        <div className="col-md-2">
                            <button type="submit" className="btn btn-primary w-100" disabled={saving}>
                                Add to list
                            </button>
                        </div>

                    </form>

                </div>
            </div>

            <div className="card shadow-sm border-0 mb-3">
                <div className="card-body">

                    <form className="d-flex gap-2 mb-3" onSubmit={handleSearch}>
                        <input
                            type="search"
                            className="form-control"
                            placeholder="Search addresses"
                            aria-label="Search addresses"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button type="submit" className="btn btn-outline-secondary">Search</button>
                    </form>

                    {loading ? (

                        <div className="text-muted">Loading...</div>

                    ) : items.length === 0 ? (

                        <div className="text-muted">No addresses on the list.</div>

                    ) : (

                        <div className="table-responsive">
                            <table className="table table-sm align-middle">
                                <thead>
                                    <tr><th>Email</th><th>Reason</th><th>Note</th><th>Added by</th><th>Added</th><th></th></tr>
                                </thead>
                                <tbody>
                                    {items.map((s) => (
                                        <tr key={s.id}>
                                            <td>{s.email}</td>
                                            <td>{REASONS[s.reason] || s.reason}</td>
                                            <td className="small">{s.note || "-"}</td>
                                            <td>{s.createdByName || "-"}</td>
                                            <td className="small">{new Date(s.createdAt).toLocaleString()}</td>
                                            <td className="text-end" style={{ minWidth: "260px" }}>
                                                {removingId === s.id ? (
                                                    <div className="d-flex gap-2">
                                                        <input
                                                            type="text"
                                                            className="form-control form-control-sm"
                                                            placeholder="Why may it be emailed again? (required)"
                                                            aria-label="Reason for removal"
                                                            value={justification}
                                                            maxLength={500}
                                                            onChange={(e) => setJustification(e.target.value)}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-danger"
                                                            disabled={saving || justification.trim().length < 5}
                                                            onClick={() => handleRemove(s.id)}
                                                        >
                                                            Remove
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-secondary"
                                                            onClick={() => { setRemovingId(null); setJustification(""); }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => { setRemovingId(s.id); setJustification(""); }}
                                                    >
                                                        Remove...
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                    )}

                    {total > PAGE_SIZE && (
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="small text-muted">{total} addresses</span>
                            <div className="btn-group">
                                <button className="btn btn-sm btn-outline-secondary" disabled={page === 0} onClick={() => goTo(page - 1)}>Previous</button>
                                <button className="btn btn-sm btn-outline-secondary" disabled={page >= lastPage} onClick={() => goTo(page + 1)}>Next</button>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body">

                    <h6>Recent changes</h6>

                    {audit.length === 0 ? (
                        <div className="text-muted small">Nothing yet.</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-sm align-middle mb-0">
                                <thead>
                                    <tr><th>When</th><th>Action</th><th>Email</th><th>Who</th><th>Note / justification</th></tr>
                                </thead>
                                <tbody>
                                    {audit.map((a) => (
                                        <tr key={a.id}>
                                            <td className="small">{new Date(a.performedAt).toLocaleString()}</td>
                                            <td>{a.action === "ADDED" ? "Added" : "Removed"}</td>
                                            <td>{a.email}</td>
                                            <td>{a.performedByName || "-"}</td>
                                            <td className="small">{a.note || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                </div>
            </div>

        </>

    );
}
