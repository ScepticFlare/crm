// User-facing date formatting for the whole CRM. Dates are always shown in
// Indian format DD/MM/YYYY (e.g. 26/08/2026); timestamps keep their time
// after it (e.g. 26/08/2026, 08:00 pm). This ONLY controls how an
// already-parsed value is rendered - it never changes what is stored or
// what is sent to/from the API.

// Accepts whatever the API returns (ISO string, epoch millis, Date) and
// returns a valid Date, or null when there is nothing usable to show.
function toDate(value) {

    if (value === null || value === undefined || value === "") {
        return null;
    }

    const date = value instanceof Date ? value : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}

// DD/MM/YYYY. Returns "-" when there is no usable date.
export function formatDate(value) {

    const date = toDate(value);

    if (!date) {
        return "-";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

// DD/MM/YYYY, hh:mm am/pm - the date portion in Indian format, the time
// portion exactly as the detail pages already showed it. Returns "-" when
// there is no usable date.
export function formatDateTime(value) {

    const date = toDate(value);

    if (!date) {
        return "-";
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
