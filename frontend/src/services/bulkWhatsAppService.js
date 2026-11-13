import api from "./api";
import { cachedFetch } from "../utils/apiCache";

// Bulk WhatsApp - the client side of /api/bulk-whatsapp (see the backend's
// BulkWhatsAppService). Same model as bulk email: the server issues a batch that
// pins the recipients and the template text, and the browser asks it to send
// that batch in small chunks. The browser never sees or edits {{placeholders}}
// and never talks to the WhatsApp provider: every message is rendered and sent
// by the backend.
//
// Kept separate from bulkEmailService on purpose: WhatsApp chunks can come back
// `paused` (the provider stopped responding) with a normal 200, which must stop
// further chunks - and the email engine must not change to accommodate that.

// Upper bounds; the server's own limits (from /access or the batch) win.
export const BULK_WHATSAPP_CHUNK_SIZE = 5;
export const BULK_WHATSAPP_MAX_RECORDS = 100;

// target: "LEAD" | "OPPORTUNITY"; templateId optional (recipients-only check without it).
export const previewBulkWhatsApp = async (payload) => (await api.post("/bulk-whatsapp/preview", payload)).data;

// { target, ids, templateId } -> the server-issued batch. Sends nothing.
export const createBulkWhatsAppBatch = async (payload) => (await api.post("/bulk-whatsapp/batches", payload)).data;

// A chunk is only { batchId, ids }.
export const sendBulkWhatsAppChunk = async (payload) => (await api.post("/bulk-whatsapp/send", payload)).data;

// The whole batch as the server records it, incl. delivery statuses (also the
// reconciliation point after a lost or ambiguous response).
export const getBulkWhatsAppBatch = async (batchId) => (await api.get(`/bulk-whatsapp/batches/${batchId}`)).data;

// Live provider status - not cached (the session can disconnect at any time).
export const getWhatsAppAccess = async () => (await api.get("/bulk-whatsapp/access")).data;

// Whether to show the action at all (cached per login; cleared on login/logout).
export const getWhatsAppAccessCached = () => cachedFetch("whatsappAccess", getWhatsAppAccess);

export function chunkIds(ids, size = BULK_WHATSAPP_CHUNK_SIZE) {
    const chunks = [];
    for (let i = 0; i < ids.length; i += size) {
        chunks.push(ids.slice(i, i + size));
    }
    return chunks;
}

// Outcomes that may safely be sent again. ACCEPTED, UNKNOWN (it may already have
// gone out) and EXCLUDED never are; UNVERIFIED / IN_PROGRESS are checked first.
export const RETRYABLE_OUTCOMES = ["FAILED", "NOT_ATTEMPTED"];
export const UNSETTLED_OUTCOMES = ["IN_PROGRESS", "UNVERIFIED"];

const DEFAULT_TIMING = { reconcileAttempts: 3, settleAttempts: 5, delayMs: 1500 };

const sleep = (ms) => (ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve());

// Honest wording for a failed request: a 4xx was a clear "no"; a missing answer
// or a 408/5xx says nothing about whether the server did the work.
export function describeFailure(err) {

    const status = err?.response?.status;

    if (!err?.response) {
        return "The connection to the server was lost before it answered.";
    }

    if (status === 401) {
        return "Your session has expired. Sign in again, then reopen Bulk WhatsApp to continue this batch.";
    }

    if (status === 403) {
        return err.response.data?.message || "You do not have permission to send these WhatsApp messages.";
    }

    if (status === 503) {
        return err.response.data?.message || "WhatsApp is not available right now. Nothing was sent in this step.";
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
//   onProgress(resultsSoFar, doneCount, total) after every chunk.
// Returns { results, error, paused }.
//
// Stops ("pauses") when:
//   - the server answers a chunk with `paused: true` (the provider stopped
//     responding normally; the untouched recipients come back NOT_ATTEMPTED);
//   - a request fails for any reason - then the batch is checked with the server
//     before anything is concluded: a recorded outcome is kept, a recipient the
//     server never touched is NOT_ATTEMPTED (safe to resume), and one that cannot
//     be checked is UNVERIFIED (never resent blindly).
export async function sendBulkWhatsApp({ batchId, ids, chunkSize = BULK_WHATSAPP_CHUNK_SIZE }, onProgress, timing = {}) {

    const { reconcileAttempts, settleAttempts, delayMs } = { ...DEFAULT_TIMING, ...timing };

    const byId = new Map();
    let error = null;
    let paused = false;

    const snapshot = () => ids.map((id) => byId.get(id) || { id, outcome: "NOT_ATTEMPTED", detail: "Not sent yet." });
    const report = () => onProgress?.(snapshot(), ids.filter((id) => byId.has(id)).length, ids.length);

    for (const chunk of chunkIds(ids, Math.max(1, Math.min(chunkSize, BULK_WHATSAPP_CHUNK_SIZE)))) {

        if (paused) {
            break;
        }

        try {

            const response = await sendBulkWhatsAppChunk({ batchId, ids: chunk });

            response.results.forEach((r) => byId.set(r.id, r));

            if (response.paused) {
                paused = true;
                error = (response.pauseReason || "Sending paused: the WhatsApp provider stopped responding normally.")
                    + " Check the WhatsApp connection, then resume - recipients not sent yet can be sent safely.";
            }

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
                    view = await getBulkWhatsAppBatch(batchId);
                    confirmed = true;
                } catch {
                    // try again, then fall through below
                }
            }

            for (let attempt = 0; confirmed && attempt < settleAttempts
                && view.results.some((r) => chunk.includes(r.id) && r.outcome === "IN_PROGRESS"); attempt++) {

                await sleep(delayMs);

                try {
                    view = await getBulkWhatsAppBatch(batchId);
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
