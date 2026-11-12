import { useCallback, useEffect, useRef, useState } from "react";

import {
    BackupIntegrityError,
    downloadBackup,
    getBackup,
    listBackups,
    startBackup,
} from "../services/backupService";
import { exportErrorMessage } from "../utils/downloadFile";
import { formatBytes } from "../utils/formatBytes";
import { formatDateTime } from "../utils/formatDate";

const POLL_MS = 3000;

const STATUS = {
    RUNNING: { label: "Running", badge: "bg-info text-dark" },
    SUCCEEDED: { label: "Succeeded", badge: "bg-success" },
    FAILED: { label: "Failed", badge: "bg-danger" },
};

function formatDuration(ms) {

    if (typeof ms !== "number") {
        return "-";
    }

    const seconds = Math.round(ms / 1000);
    return seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
}

function errorText(err, fallback) {

    if (err.response?.status === 403) {
        return "Only an administrator can take or download backups.";
    }

    return err.response?.data?.message || fallback;
}

// Admin-only "Take Backup": a backup of the CRM database, made on the server in
// the background, verified, and kept in private storage (the newest 14). The
// page polls until it finishes and then says clearly whether it worked.
export default function Backups() {

    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const startingRef = useRef(false);
    const [runningId, setRunningId] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState(null);

    const timer = useRef(null);
    const mounted = useRef(true);

    const refresh = useCallback(async () => {

        try {

            const list = await listBackups();

            if (!mounted.current) {
                return null;
            }

            setBackups(list);
            return list;

        } catch (err) {

            console.error(err);

            if (mounted.current) {
                setError(errorText(err, "Unable to load the backups."));
            }

            return null;

        } finally {

            if (mounted.current) {
                setLoading(false);
            }

        }

    }, []);

    const poll = useCallback((id) => {

        clearTimeout(timer.current);
        setRunningId(id);

        timer.current = setTimeout(async function check() {

            try {

                const b = await getBackup(id);

                if (!mounted.current) {
                    return;
                }

                if (b.status === "RUNNING") {
                    timer.current = setTimeout(check, POLL_MS);
                    return;
                }

                setRunningId(null);

                if (b.status === "SUCCEEDED") {
                    setError(null);
                    setNotice(`Backup completed successfully (${formatBytes(b.sizeBytes)}, ${formatDuration(b.durationMs)}).`);
                } else {
                    setNotice(null);
                    setError(`Backup failed: ${b.errorMessage || "unknown error"}`);
                }

                refresh();

            } catch (err) {

                console.error(err);

                if (mounted.current) {
                    // a cold start or a blip: keep watching rather than give up
                    timer.current = setTimeout(check, POLL_MS * 2);
                }

            }

        }, POLL_MS);

    }, [refresh]);

    useEffect(() => {

        mounted.current = true;

        refresh().then((list) => {
            const running = list?.find((b) => b.status === "RUNNING");
            if (running) {
                poll(running.id);
            }
        });

        return () => {
            mounted.current = false;
            clearTimeout(timer.current);
        };

    }, [refresh, poll]);

    const handleStart = async () => {

        // The ref closes the gap before React re-renders: two clicks in the
        // same frame both still see starting === false. (The server answers
        // 409 to a second request anyway - this keeps it from being sent.)
        if (startingRef.current || starting || runningId) {
            return;
        }

        startingRef.current = true;
        setStarting(true);
        setError(null);
        setNotice(null);

        try {

            const b = await startBackup();
            setNotice("Backup started. This page will tell you when it has finished.");
            poll(b.id);
            refresh();

        } catch (err) {

            console.error(err);
            setError(errorText(err, "Unable to start the backup."));

            if (err.response?.status === 409) {
                const list = await refresh();
                const running = list?.find((b) => b.status === "RUNNING");
                if (running) {
                    poll(running.id);
                }
            }

        } finally {

            startingRef.current = false;
            setStarting(false);

        }

    };

    const handleDownload = async (backup) => {

        setDownloadingId(backup.id);
        setError(null);

        try {

            await downloadBackup(backup);

        } catch (err) {

            console.error(err);
            setError(err instanceof BackupIntegrityError
                ? err.message
                : await exportErrorMessage(err, "this backup"));

        } finally {

            setDownloadingId(null);

        }

    };

    const busy = starting || runningId !== null;

    return (
        <div className="container-fluid">

            <div className="mb-3">
                <h2 className="mb-1">Database backups</h2>
                <p className="text-muted mb-1">
                    Take Backup saves a complete copy of the CRM's records (leads, opportunities, customers,
                    follow-ups, employees, activity history and settings) to private storage. The newest 14
                    successful backups are kept.
                </p>
                <p className="small text-muted mb-0">
                    <strong>Not included:</strong> uploaded document files (brochures, company profiles and other
                    attachments). Only their names and details are in the backup, not the files themselves.
                    Backup files contain personal and business data - store downloaded copies securely and
                    delete them when no longer needed.
                </p>
            </div>

            {error && <div className="alert alert-danger py-2 px-3" role="alert">{error}</div>}
            {notice && <div className="alert alert-success py-2 px-3" role="status">{notice}</div>}

            <div className="card shadow-sm border-0 mb-3">
                <div className="card-body d-flex flex-wrap align-items-center gap-3">
                    <button type="button" className="btn btn-primary" onClick={handleStart} disabled={busy}>
                        {busy
                            ? (<><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Taking backup...</>)
                            : (<><i className="bi bi-database-down me-2" />Take Backup</>)}
                    </button>
                    {runningId !== null && (
                        <span className="small text-muted">
                            A backup is running. You can leave this page; it continues on the server.
                        </span>
                    )}
                </div>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body">

                    <h5 className="mb-3">Backup history</h5>

                    {loading && <div className="text-muted">Loading...</div>}

                    {!loading && backups.length === 0 && (
                        <div className="text-muted">No backups have been taken yet.</div>
                    )}

                    {!loading && backups.length > 0 && (
                        <div className="table-responsive">
                            <table className="table table-sm align-middle">
                                <thead>
                                    <tr>
                                        <th>Started</th>
                                        <th>By</th>
                                        <th>Status</th>
                                        <th>Size</th>
                                        <th>Duration</th>
                                        <th className="text-end">File</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {backups.map((b) => (
                                        <tr key={b.id}>
                                            <td className="small">{formatDateTime(b.startedAt)}</td>
                                            <td className="small">{b.initiatedByName}</td>
                                            <td>
                                                <span className={`badge ${STATUS[b.status]?.badge || "bg-secondary"}`}>
                                                    {STATUS[b.status]?.label || b.status}
                                                </span>
                                                {b.status === "FAILED" && b.errorMessage && (
                                                    <div className="small text-danger mt-1">{b.errorMessage}</div>
                                                )}
                                            </td>
                                            <td className="small">{formatBytes(b.sizeBytes)}</td>
                                            <td className="small">{formatDuration(b.durationMs)}</td>
                                            <td className="text-end">
                                                {b.available ? (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => handleDownload(b)}
                                                        disabled={downloadingId !== null}
                                                    >
                                                        {downloadingId === b.id ? "Downloading..." : "Download"}
                                                    </button>
                                                ) : (
                                                    <span className="small text-muted">
                                                        {b.status === "SUCCEEDED" ? "Removed by retention" : "-"}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                </div>
            </div>

        </div>
    );
}
