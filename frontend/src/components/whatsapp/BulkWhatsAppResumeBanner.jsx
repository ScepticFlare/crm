import { useState } from "react";

import { clearBulkWhatsAppRecovery, loadBulkWhatsAppRecovery } from "../../services/bulkWhatsAppRecovery";

// Shown on Leads / Opportunities when this user has a Bulk WhatsApp batch that
// was started but not finished (e.g. the page was refreshed mid-send). It only
// points at the batch; the dialog asks the server where it stands.
export default function BulkWhatsAppResumeBanner({ target, onResume }) {

    const [entry, setEntry] = useState(() => loadBulkWhatsAppRecovery(target));

    if (!entry) {
        return null;
    }

    return (
        <div className="alert alert-warning d-flex flex-wrap align-items-center gap-2 py-2 px-3 mb-3" role="status">

            <i className="bi bi-whatsapp"></i>

            <span className="flex-grow-1">
                You have an unfinished Bulk WhatsApp batch. Its recipients and message are fixed; you can review where it
                stands and send what has not gone out yet.
            </span>

            <button type="button" className="btn btn-sm btn-success" onClick={onResume}>
                Review / resume
            </button>

            <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                    clearBulkWhatsAppRecovery(target);
                    setEntry(null);
                }}
            >
                Dismiss
            </button>

        </div>
    );
}
