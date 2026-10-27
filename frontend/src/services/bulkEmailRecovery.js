// Lets an unfinished bulk email batch be found again after a refresh or a
// closed tab. Only a POINTER is kept in sessionStorage - never the message,
// recipients' names or addresses, or any credential:
//   batchId       the server-issued id (the server holds the message and recipients)
//   selectedIds   record ids that were selected, so the results can account for all of them
//   preExcluded   id -> exclusion CODE for records that were left out before sending
//   removedIds    records the user took out of the batch
// It is scoped to the signed-in employee and the record type, and expires after a day.

const PREFIX = "crm.bulkEmail.v1";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function keyFor(target) {

    try {
        const employeeId = localStorage.getItem("employeeId");
        return employeeId && target ? `${PREFIX}.${employeeId}.${target}` : null;
    } catch {
        return null;
    }
}

export function saveBulkEmailRecovery(target, entry) {

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
        // storage unavailable (private window, quota): recovery is simply not offered
    }
}

export function loadBulkEmailRecovery(target) {

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

export function clearBulkEmailRecovery(target) {

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
