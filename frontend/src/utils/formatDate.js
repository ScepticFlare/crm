// User-facing date formatting for the whole CRM. Dates are always shown in
// British format dd/MM/yyyy (e.g. 04/05/2026 is 4 May 2026); timestamps keep
// their time after it on a 24-hour clock (e.g. 04/05/2026 20:00). Built from
// the date parts rather than toLocale*String, so the result never depends on
// the browser's language. This ONLY controls how an already-parsed value is
// rendered - it never changes what is stored or what is sent to/from the API,
// which stays ISO (see toIsoDate).

const pad = (n) => String(n).padStart(2, "0");

// Accepts whatever the API returns (ISO string, epoch millis, Date) and
// returns a valid Date, or null when there is nothing usable to show.
function toDate(value) {

    if (value === null || value === undefined || value === "") {
        return null;
    }

    // A date-only value ("2026-10-13" - closing / review dates) has no time
    // or zone. new Date() would read it as UTC midnight and, in any zone
    // behind UTC, display the previous day; build it as a local date instead.
    if (typeof value === "string") {

        const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

        if (dateOnly) {
            return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
        }
    }

    const date = value instanceof Date ? value : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}

// dd/MM/yyyy. Returns "-" when there is no usable date.
export function formatDate(value) {

    const date = toDate(value);

    if (!date) {
        return "-";
    }

    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

// dd/MM/yyyy HH:mm (24-hour). Returns "-" when there is no usable date.
export function formatDateTime(value) {

    const date = toDate(value);

    if (!date) {
        return "-";
    }

    return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// yyyy-MM-dd (what the API and <input type="date"> use) for the LOCAL
// calendar day. Date.toISOString() converts to UTC first, which in India
// (UTC+05:30) turns local midnight into the previous day.
export function toIsoDate(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
