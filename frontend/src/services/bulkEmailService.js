import api from "./api";

// Records sent per request. The backend enforces the same limit (and the
// browser times out at 30 s), so a batch is sent as a series of small requests
// that all share one batchId - which is also what makes a repeat or a retry
// safe: the backend never sends a recipient of the same batch twice.
export const BULK_EMAIL_CHUNK_SIZE = 10;
export const BULK_EMAIL_MAX_RECORDS = 100;

// target: "LEAD" | "OPPORTUNITY". subject/body may be blank for a
// recipients-only check. Sends nothing.
export const previewBulkEmail = async (payload) => {
    const response = await api.post("/bulk-email/preview", payload);
    return response.data;
};

export const sendBulkEmailChunk = async (payload) => {
    const response = await api.post("/bulk-email/send", payload);
    return response.data;
};

export const getBulkEmailBatch = async (batchId) => {
    const response = await api.get(`/bulk-email/batches/${batchId}`);
    return response.data;
};

export function newBatchId() {

    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `batch-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function chunkIds(ids, size = BULK_EMAIL_CHUNK_SIZE) {

    const chunks = [];

    for (let i = 0; i < ids.length; i += size) {
        chunks.push(ids.slice(i, i + size));
    }

    return chunks;
}

// Outcomes a retry may safely send again: the backend never resends ACCEPTED,
// UNKNOWN (it may already have gone out) or EXCLUDED recipients anyway.
export const RETRYABLE_OUTCOMES = ["FAILED", "NOT_ATTEMPTED", "NO_RESPONSE", "IN_PROGRESS"];

// Sends `ids` chunk by chunk and reports per-recipient results.
//   onProgress(resultsSoFar, doneCount, total) is called after every chunk.
// Returns { results: [...in ids order], error: string|null }.
// If a chunk gets no answer from the server (timeout / network), the batch log
// is consulted to reconcile it, anything still unaccounted for is marked
// NO_RESPONSE, and sending STOPS - nothing is assumed either way.
export async function sendBulkEmail({ target, ids, subject, body, templateId, batchId }, onProgress) {

    const byId = new Map();
    let error = null;
    let stopped = false;

    const snapshot = () => ids.map((id) => byId.get(id) || { id, outcome: "NOT_ATTEMPTED", detail: "Not sent yet." });

    for (const chunk of chunkIds(ids)) {

        if (stopped) {
            break;
        }

        try {

            const response = await sendBulkEmailChunk({ target, ids: chunk, subject, body, templateId, batchId });

            response.results.forEach((r) => byId.set(r.id, r));

        } catch (err) {

            stopped = true;

            if (err.response) {

                // The server answered with an error (validation, permission...): nothing was sent for this chunk.
                error = err.response.data?.message
                    || (err.response.status === 403
                        ? "You do not have permission to send these emails."
                        : "The server rejected the request.");

            } else {

                error = "No response from the server. Some emails may or may not have been sent - check the results below before retrying.";

                try {

                    const batch = await getBulkEmailBatch(batchId);
                    batch.results.forEach((r) => byId.set(r.id, r));

                } catch {
                    // could not reconcile - fall through to NO_RESPONSE below
                }

                chunk.forEach((id) => {
                    if (!byId.has(id)) {
                        byId.set(id, {
                            id,
                            outcome: "NO_RESPONSE",
                            detail: "No answer from the server - it may or may not have been sent.",
                        });
                    }
                });
            }
        }

        onProgress?.(snapshot(), Math.min(byId.size, ids.length), ids.length);
    }

    return { results: snapshot(), error };
}
