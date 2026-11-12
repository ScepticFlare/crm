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

// ---- typed date / time input (see components/inputs/BritishDateInput) -------
// Parsing is strictly DAY FIRST and never guesses: "03/04/2026" is always
// 3 April 2026, and anything that is not a real calendar date (31/02/2026,
// 2026-04-03, 04/03/26) is rejected rather than reinterpreted.

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function validParts(y, m, d) {
    if (m < 1 || m > 12 || d < 1 || y < 1000 || y > 9999) {
        return false;
    }
    const check = new Date(y, m - 1, d);
    return check.getFullYear() === y && check.getMonth() === m - 1 && check.getDate() === d;
}

// "dd/MM/yyyy" (also d/M/yyyy, with "." or "-" as the separator, or 8 digits
// ddMMyyyy) -> "yyyy-MM-dd", or null when it is not a real date.
export function parseBritishDate(text) {

    if (typeof text !== "string") {
        return null;
    }

    const t = text.trim();
    const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(t) || /^(\d{2})(\d{2})(\d{4})$/.exec(t);

    if (!m) {
        return null;
    }

    const d = Number(m[1]);
    const mo = Number(m[2]);
    const y = Number(m[3]);

    return validParts(y, mo, d) ? `${y}-${pad(mo)}-${pad(d)}` : null;
}

// "yyyy-MM-dd" (or the date part of "yyyy-MM-ddTHH:mm[:ss]") -> "dd/MM/yyyy";
// "" for anything else. Pure string work: no Date, so no time-zone shift.
export function isoToBritish(iso) {

    const m = typeof iso === "string" ? ISO_DATE.exec(iso.slice(0, 10)) : null;

    if (!m || !validParts(Number(m[1]), Number(m[2]), Number(m[3]))) {
        return "";
    }

    return `${m[3]}/${m[2]}/${m[1]}`;
}

// "HH:mm" on a 24-hour clock (also H:mm, H.mm or HHmm) -> "HH:mm", or null.
export function parseTime24(text) {

    if (typeof text !== "string") {
        return null;
    }

    const m = /^(\d{1,2})[:.](\d{2})$/.exec(text.trim()) || /^(\d{2})(\d{2})$/.exec(text.trim());

    if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) {
        return null;
    }

    return `${pad(Number(m[1]))}:${m[2]}`;
}

// Today's calendar day in the business time zone (India), as "yyyy-MM-dd" -
// the same day the backend uses (util.BusinessClock). NOT
// new Date().toISOString().slice(0, 10), which is the UTC day and so is still
// "yesterday" before 05:30 IST; and independent of the computer's own time
// zone, so a laptop set to UTC or a US zone offers the same "today".
export const BUSINESS_TIME_ZONE = "Asia/Kolkata";

export function businessTodayIso(now = new Date()) {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: BUSINESS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(now);
    const get = (type) => parts.find((p) => p.type === type)?.value;
    return `${get("year")}-${get("month")}-${get("day")}`;
}
