// Lets an unfinished bulk WhatsApp batch be found again after a refresh or a
// closed tab. Only a POINTER is kept in sessionStorage - never the message,
// names, phone numbers or any credential:
//   batchId      the server-issued id (the server holds the text and recipients)
//   selectedIds  record ids that were selected, so the results can account for all
//   preExcluded  id -> exclusion CODE for records left out before sending
//   removedIds   records the user took out of the batch
// Scoped to the signed-in employee and the record type; expires after a day.
// Separate from bulkEmailRecovery so the two features never share state.

const PREFIX = "crm.bulkWhatsApp.v1";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function keyFor(target) {
    try {
        const employeeId = localStorage.getItem("employeeId");
        return employeeId && target ? `${PREFIX}.${employeeId}.${target}` : null;
    } catch {
        return null;
    }
}

export function saveBulkWhatsAppRecovery(target, entry) {

    const key = keyFor(target);

    if (!key) {
        return;
    }

    try {
        sessionStorage.setItem(key, JSON.stringify({
            batchId: entry.batchId,
            target,
            employeeId: localStorage.getItem("employeeId"),
            createdAt: entry.createdAt || Date.now(),
            selectedIds: entry.selectedIds || [],
            preExcluded: entry.preExcluded || {},
            removedIds: entry.removedIds || [],
        }));
    } catch {
        // storage unavailable: recovery is simply not offered
    }
}

export function loadBulkWhatsAppRecovery(target) {

    const key = keyFor(target);

    if (!key) {
        return null;
    }

    try {

        const raw = sessionStorage.getItem(key);

        if (!raw) {
            return null;
        }

        const entry = JSON.parse(raw);

        const valid = entry
            && typeof entry.batchId === "string"
            && entry.target === target
            && String(entry.employeeId) === String(localStorage.getItem("employeeId"))
            && Array.isArray(entry.selectedIds)
            && Date.now() - Number(entry.createdAt) < MAX_AGE_MS;

        if (!valid) {
            sessionStorage.removeItem(key);
            return null;
        }

        return entry;

    } catch {
        return null;
    }
}

export function clearBulkWhatsAppRecovery(target) {

    const key = keyFor(target);

    if (!key) {
        return;
    }

    try {
        sessionStorage.removeItem(key);
    } catch {
        // nothing to do
    }
}
