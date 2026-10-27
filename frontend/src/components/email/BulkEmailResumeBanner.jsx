import { useState } from "react";

import { clearBulkEmailRecovery, loadBulkEmailRecovery } from "../../services/bulkEmailRecovery";

// Shown on the Leads / Opportunities page when this user has a bulk email batch
// that was started but not finished (e.g. the page was refreshed mid-send). It
// only points at the batch; the modal asks the server where it stands. Without it
// the batch could only be found again by selecting records first.
export default function BulkEmailResumeBanner({ target, onResume }) {

    const [entry, setEntry] = useState(() => loadBulkEmailRecovery(target));

    if (!entry) {
        return null;
    }

    return (

        <div className="alert alert-warning d-flex flex-wrap align-items-center gap-2 py-2 px-3 mb-3" role="status">

            <i className="bi bi-envelope-exclamation"></i>

            <span className="flex-grow-1">
                You have an unfinished bulk email batch. Its recipients and message are fixed; you can review where it stands
                and send what has not gone out yet.
            </span>

            <button type="button" className="btn btn-sm btn-primary" onClick={onResume}>
                Review / resume
            </button>

            <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                    clearBulkEmailRecovery(target);
                    setEntry(null);
                }}
            >
                Dismiss
            </button>

        </div>

    );
}
