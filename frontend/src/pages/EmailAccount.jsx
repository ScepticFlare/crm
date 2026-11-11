import { useEffect, useState } from "react";

import {
    CONNECT_ERRORS,
    disconnectMailbox,
    getMyMailbox,
    startMailboxConnection,
} from "../services/emailAccountService";
import { formatDateTime } from "../utils/formatDate";

const PROVIDERS = [
    { key: "google", label: "Google (Gmail / Google Workspace)", icon: "bi-google" },
    { key: "microsoft", label: "Microsoft (Outlook / Microsoft 365)", icon: "bi-microsoft" },
];

const providerLabel = (key) => (key === "microsoft" ? "Microsoft 365" : key === "google" ? "Gmail" : key);

// What the backend appended to this page's URL after a connection attempt.
function readResult() {

    const params = new URLSearchParams(window.location.search);
    const result = params.get("result");

    if (!result) {
        return null;
    }

    if (result === "connected") {
        return { ok: true, text: `Your ${providerLabel(params.get("provider"))} mailbox is connected.` };
    }

    const reason = params.get("reason");

    return { ok: false, text: CONNECT_ERRORS[reason] || "The mailbox could not be connected. Please try again." };
}

// The signed-in employee's own sending mailbox. All CRM email (Send Email, Keep
// in Touch, Bulk Email) is sent from it, so replies come back to the employee.
export default function EmailAccount() {

    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState(() => readResult());
    const [busy, setBusy] = useState(false);
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {

        let live = true;

        getMyMailbox()
            .then((s) => live && setStatus(s))
            .catch((err) => live && setError(err.response?.data?.message || "Unable to load your email account."))
            .finally(() => live && setLoading(false));

        // Drop ?result=... so a reload does not show the message again.
        if (window.location.search) {
            window.history.replaceState(null, "", window.location.pathname);
        }

        return () => {
            live = false;
        };

    }, []);

    const connect = async (provider) => {

        setBusy(true);
        setError(null);

        try {
            window.location.assign(await startMailboxConnection(provider));
        } catch (err) {
            setError(err.response?.data?.message || "Unable to start connecting the mailbox.");
            setBusy(false);
        }
    };

    const disconnect = async () => {

        setBusy(true);
        setError(null);

        try {
            const after = await disconnectMailbox();
            setStatus(after);
            setConfirming(false);
            setNotice({
                ok: true,
                text: after.providerRevoked
                    ? "Your mailbox was disconnected and the CRM's access was revoked."
                    : "Your mailbox was disconnected. The CRM no longer holds any access to it.",
            });
        } catch (err) {
            setError(err.response?.data?.message || "Unable to disconnect the mailbox.");
        } finally {
            setBusy(false);
        }
    };

    const anyProvider = status && Object.values(status.providers || {}).some(Boolean);

    return (

        <>

            <div className="mb-3">
                <h2 className="mb-1">Email Account</h2>
                <p className="text-muted mb-0">
                    CRM email is sent from your own mailbox, so customers see your address and their replies reach your inbox.
                    The CRM can only send email - it cannot read, list or delete your mail.
                </p>
            </div>

            {notice && (
                <div className={`alert ${notice.ok ? "alert-success" : "alert-warning"} py-2 px-3`} role="status">
                    {notice.text}
                </div>
            )}
            {error && <div className="alert alert-danger py-2 px-3">{error}</div>}

            <div className="card shadow-sm border-0">
                <div className="card-body">

                    {loading && <div className="text-muted">Loading...</div>}

                    {!loading && status && !status.canConnect && (
                        <p className="mb-0">Your role does not include sending CRM email, so there is no mailbox to connect.</p>
                    )}

                    {!loading && status && status.canConnect && status.connected && (

                        <>
                            <h5 className="mb-2">
                                <i className={`bi ${status.provider === "microsoft" ? "bi-microsoft" : "bi-google"} me-2`}></i>
                                {status.emailAddress}
                            </h5>

                            <dl className="row small mb-3">
                                <dt className="col-sm-3">Provider</dt>
                                <dd className="col-sm-9">{providerLabel(status.provider)}</dd>
                                <dt className="col-sm-3">Status</dt>
                                <dd className="col-sm-9">
                                    {status.needsReconnect
                                        ? <span className="badge bg-warning text-dark">Needs reconnecting</span>
                                        : <span className="badge bg-success">Connected</span>}
                                </dd>
                                <dt className="col-sm-3">Connected</dt>
                                <dd className="col-sm-9">{formatDateTime(status.connectedAt)}</dd>
                                <dt className="col-sm-3">Last used</dt>
                                <dd className="col-sm-9">{status.lastUsedAt ? formatDateTime(status.lastUsedAt) : "Not yet"}</dd>
                            </dl>

                            {status.needsReconnect && (
                                <div className="alert alert-warning py-2 px-3">
                                    {status.statusDetail || "The provider no longer accepts this connection."}{" "}
                                    Nothing can be sent until you reconnect.
                                </div>
                            )}

                            <div className="d-flex flex-wrap gap-2">

                                {status.needsReconnect && status.providers?.[status.provider] && (
                                    <button className="btn btn-primary" disabled={busy} onClick={() => connect(status.provider)}>
                                        Reconnect {providerLabel(status.provider)}
                                    </button>
                                )}

                                {!confirming && (
                                    <button className="btn btn-outline-danger" disabled={busy} onClick={() => setConfirming(true)}>
                                        Disconnect
                                    </button>
                                )}

                                {confirming && (
                                    <>
                                        <span className="align-self-center small">
                                            Disconnect {status.emailAddress}? You will not be able to send CRM email until you connect a mailbox again.
                                        </span>
                                        <button className="btn btn-danger" disabled={busy} onClick={disconnect}>Yes, disconnect</button>
                                        <button className="btn btn-outline-secondary" disabled={busy} onClick={() => setConfirming(false)}>Cancel</button>
                                    </>
                                )}

                            </div>
                        </>

                    )}

                    {!loading && status && status.canConnect && !status.connected && (

                        <>
                            <p>No mailbox is connected. Connect the work mailbox you sign in to the CRM with:</p>

                            {!anyProvider && (
                                <div className="alert alert-secondary py-2 px-3">
                                    Mailbox sending is not set up on this server yet. Please contact an administrator.
                                </div>
                            )}

                            <div className="d-flex flex-wrap gap-2">
                                {PROVIDERS.map((p) => (
                                    <button
                                        key={p.key}
                                        className="btn btn-outline-primary"
                                        disabled={busy || !status.providers?.[p.key]}
                                        onClick={() => connect(p.key)}
                                    >
                                        <i className={`bi ${p.icon} me-2`}></i>Connect {p.label}
                                    </button>
                                ))}
                            </div>

                            <p className="small text-muted mt-3 mb-0">
                                You will be asked to allow the CRM to send email as you. Your provider&apos;s normal sending limits apply.
                            </p>
                        </>

                    )}

                </div>
            </div>

        </>

    );
}
