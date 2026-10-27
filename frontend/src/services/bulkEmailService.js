import api from "./api";

// Records sent per request. The backend enforces the same limit (and the
// browser times out at 30 s), so a batch is sent as a series of small requests
// against ONE server-issued batch. The batch pins the recipient list and the
// message on the server, which is what makes every repeat, retry or resume safe:
// a request can only ever send a subset of the original recipients, with the
// original content, and the backend never sends a recipient of the batch twice.
export const BULK_EMAIL_CHUNK_SIZE = 10;
export const BULK_EMAIL_MAX_RECORDS = 100;

// target: "LEAD" | "OPPORTUNITY". subject/body may be blank for a
// recipients-only check. Sends nothing.
export const previewBulkEmail = async (payload) => {
    const response = await api.post("/bulk-email/preview", payload);
    return response.data;
};

// Creates the batch ({ target, ids, subject, body, templateId }); the server
// answers with the batch id. Sends nothing.
export const createBulkEmailBatch = async (payload) => {
    const response = await api.post("/bulk-email/batches", payload);
    return response.data;
};

// A chunk is only { batchId, ids }: the message and the recipient list belong to
// the batch, not to the request.
export const sendBulkEmailChunk = async (payload) => {
    const response = await api.post("/bulk-email/send", payload);
    return response.data;
};

// The whole batch as the server records it (also the reconciliation point).
export const getBulkEmailBatch = async (batchId) => {
    const response = await api.get(`/bulk-email/batches/${batchId}`);
    return response.data;
};

export function chunkIds(ids, size = BULK_EMAIL_CHUNK_SIZE) {

    const chunks = [];

    for (let i = 0; i < ids.length; i += size) {
        chunks.push(ids.slice(i, i + size));
    }

    return chunks;
}

// Outcomes a retry may safely send again. The backend never resends ACCEPTED,
// UNKNOWN (it may already have gone out) or EXCLUDED recipients anyway, and
// UNVERIFIED / IN_PROGRESS are first checked against the server.
export const RETRYABLE_OUTCOMES = ["FAILED", "NOT_ATTEMPTED"];

// Outcomes that still need a status check with the server before anything else.
export const UNSETTLED_OUTCOMES = ["IN_PROGRESS", "UNVERIFIED"];

const DEFAULT_TIMING = { reconcileAttempts: 3, settleAttempts: 5, delayMs: 1500 };

const sleep = (ms) => (ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve());

// What the user is told when a request fails. The status decides the wording:
// a server answer in the 4xx range was a clear "no"; a missing answer or a
// 408/5xx (also what a proxy returns on a timeout) says nothing about whether
// the server did the work.
export function describeFailure(err) {

    const status = err?.response?.status;

    if (!err?.response) {
        return "The connection to the server was lost before it answered.";
    }

    if (status === 401) {
        return "Your session has expired. Sign in again, then reopen Bulk Email to continue this batch.";
    }

    if (status === 403) {
        return err.response.data?.message || "You do not have permission to send these emails.";
    }

    if (status === 408 || status >= 500) {
        return `The server did not confirm this step (HTTP ${status}). It may have processed it.`;
    }

    return err.response.data?.message || `The server rejected the request (HTTP ${status}).`;
}

function isDefinitive(err) {
    const status = err?.response?.status;
    return Boolean(err?.response) && status !== 408 && status < 500;
}

// Sends `ids` (a subset of the batch's recipients) chunk by chunk.
//   onProgress(resultsSoFar, doneCount, total) is called after every chunk.
// Returns { results: [...in ids order], error: string|null, paused: boolean }.
//
// When a chunk fails for ANY reason the batch is checked with the server before
// anything is concluded (a lost response or a 504 does not mean nothing was
// sent), and sending then PAUSES - the user decides how to continue:
//   - a recipient the server has a record for keeps exactly that outcome;
//   - one the server confirms it never touched is NOT_ATTEMPTED (safe to resume);
//   - one that cannot be checked at all is UNVERIFIED (never resent blindly).
// Results of earlier chunks are always kept.
export async function sendBulkEmail({ batchId, ids }, onProgress, timing = {}) {

    const { reconcileAttempts, settleAttempts, delayMs } = { ...DEFAULT_TIMING, ...timing };

    const byId = new Map();
    let error = null;
    let paused = false;

    const snapshot = () => ids.map((id) => byId.get(id) || { id, outcome: "NOT_ATTEMPTED", detail: "Not sent yet." });

    const report = () => onProgress?.(snapshot(), ids.filter((id) => byId.has(id)).length, ids.length);

    for (const chunk of chunkIds(ids)) {

        if (paused) {
            break;
        }

        try {

            const response = await sendBulkEmailChunk({ batchId, ids: chunk });

            response.results.forEach((r) => byId.set(r.id, r));

        } catch (err) {

            paused = true;

            error = describeFailure(err);

            const attempts = isDefinitive(err) ? 1 : reconcileAttempts;
            let confirmed = false;
            let view = null;

            for (let attempt = 0; attempt < attempts && !confirmed; attempt++) {

                if (attempt > 0) {
                    await sleep(delayMs);
                }

                try {
                    view = await getBulkEmailBatch(batchId);
                    confirmed = true;
                } catch {
                    // try again, then fall through to UNVERIFIED / NOT_ATTEMPTED below
                }
            }

            // A request that was still running when the proxy gave up may yet finish:
            // wait for in-flight records to settle (bounded) before reporting them.
            for (let attempt = 0; confirmed && attempt < settleAttempts
                && view.results.some((r) => chunk.includes(r.id) && r.outcome === "IN_PROGRESS"); attempt++) {

                await sleep(delayMs);

                try {
                    view = await getBulkEmailBatch(batchId);
                } catch {
                    break;
                }
            }

            const known = new Map((view?.results || []).map((r) => [r.id, r]));

            chunk.forEach((id) => {

                if (known.has(id)) {
                    byId.set(id, { ...known.get(id), confirmed: true });
                } else if (isDefinitive(err)) {
                    byId.set(id, { id, outcome: "NOT_ATTEMPTED", detail: "Not sent - the server refused this step." });
                } else {
                    byId.set(id, {
                        id,
                        outcome: "UNVERIFIED",
                        detail: "Could not confirm with the server - it may or may not have been sent. Use Check status.",
                    });
                }
            });

            error += confirmed
                ? " The results below were checked with the server. Sending is paused."
                : " The server could not be reached to confirm what happened. Sending is paused - use Check status before doing anything else.";
        }

        report();
    }

    return { results: snapshot(), error, paused };
}
