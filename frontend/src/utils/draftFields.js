// The email draft keeps the template's merge fields ({{contactPerson}} ...) so
// every recipient still gets their OWN values when it is sent (resolved by the
// backend's EmailPlaceholderRenderer, as on the Review step). What the user
// sees and edits is that draft filled in for ONE chosen record, using that
// record's values as the backend resolved them (the `mergeFields` map on the
// preview / eligibility responses: every accepted spelling -> { key, label,
// value }). This file maps between the two:
//   layoutDraft     raw draft -> the text shown for a record
//   applyDraftEdit  an edit of the shown text -> the new raw draft
// A filled-in value behaves as one unit: text can be typed before or after
// it, and selecting all of it removes it, but it cannot be partly edited
// (that would silently turn one recipient's value into fixed text for all).

// Same grammar as EmailPlaceholderRenderer.TOKEN.
const TOKEN = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

// Raw draft -> [{ type: "text", text } | { type: "field", raw, name }].
export function parseDraft(raw) {

    const text = normalizeNewlines(raw);
    const segments = [];
    let last = 0;

    for (const m of text.matchAll(TOKEN)) {

        if (m.index > last) {
            segments.push({ type: "text", text: text.slice(last, m.index) });
        }

        segments.push({ type: "field", raw: m[0], name: m[1] });
        last = m.index + m[0].length;
    }

    if (last < text.length) {
        segments.push({ type: "text", text: text.slice(last) });
    }

    return segments;
}

// How one {{name}} shows for a record. Never the raw token: a missing value
// or an unsupported name shows as a bracketed label and is flagged.
export function describeField(name, fields) {

    const field = fields?.[name];

    if (!field) {
        return { name, label: name, value: null, unknown: true, display: `[Unknown field "${name}"]` };
    }

    if (field.value == null || field.value === "") {
        return { name, label: field.label, key: field.key, value: null, missing: true, display: `[${field.label} missing]` };
    }

    return { name, label: field.label, key: field.key, value: field.value, display: field.value };
}

// Raw draft -> { display, parts: [{ ...segment, start, end, info }] }.
export function layoutDraft(raw, fields) {

    let display = "";

    const parts = parseDraft(raw).map((segment) => {

        const info = segment.type === "field" ? describeField(segment.name, fields) : null;
        const shown = info ? info.display : segment.text;
        const part = { ...segment, info, start: display.length, end: display.length + shown.length };

        display += shown;
        return part;
    });

    return { display, parts };
}

// The fields a draft uses, as they resolve for a record (each once).
export function fieldsUsed(raws, fields) {

    const seen = new Map();

    raws.forEach((raw) => parseDraft(raw).forEach((s) => {
        if (s.type === "field") {
            const info = describeField(s.name, fields);
            const id = info.key || `?${s.name}`;
            if (!seen.has(id)) {
                seen.set(id, info);
            }
        }
    }));

    return Array.from(seen.values());
}

// The user changed the shown text to `next` (caret = selectionStart after the
// change). Returns { raw } with the draft updated, or { rejected } (the field
// info) when the change would partly edit a filled-in value.
export function applyDraftEdit(raw, fields, next, caret) {

    const { display, parts } = layoutDraft(raw, fields);
    const shown = normalizeNewlines(next);

    if (shown === display) {
        return { raw: normalizeNewlines(raw) };
    }

    const { start, end, inserted } = locateEdit(display, shown, caret);

    for (const part of parts) {

        if (part.type !== "field") {
            continue;
        }

        const inside = start < part.end && end > part.start
            ? !(start <= part.start && end >= part.end)          // overlaps, but not all of it
            : start === end && start > part.start && start < part.end;  // typing inside it

        if (inside) {
            return { rejected: part.info };
        }
    }

    let out = "";
    let placed = false;

    for (const part of parts) {

        if (!placed && start <= part.start) {
            out += inserted;
            placed = true;
        }

        if (part.type === "field") {

            const removed = start <= part.start && end >= part.end && start < end;

            if (!removed) {
                out += part.raw;
            }

            continue;
        }

        const len = part.text.length;
        const before = part.text.slice(0, clamp(start - part.start, 0, len));
        const after = part.text.slice(clamp(end - part.start, 0, len));

        if (!placed && start >= part.start && start <= part.end) {
            out += before + inserted + after;
            placed = true;
        } else {
            out += before + after;
        }
    }

    if (!placed) {
        out += inserted;
    }

    return { raw: out };
}

// The replaced range [start, end) of `before` and the text put there. The
// caret anchors it, so typing next to a value that starts or ends with the
// same character is placed where the user typed, not inside the value.
function locateEdit(before, after, caret) {

    let prefix = 0;
    const maxPrefix = Math.min(before.length, after.length);

    while (prefix < maxPrefix && before[prefix] === after[prefix]) {
        prefix++;
    }

    const tail = caret == null ? null : after.slice(caret);

    if (tail != null && caret >= 0 && caret <= after.length && before.endsWith(tail)) {

        const end = before.length - tail.length;
        const start = Math.min(prefix, end, caret);

        return { start, end, inserted: after.slice(start, caret) };
    }

    let suffix = 0;

    while (suffix < before.length - prefix && suffix < after.length - prefix
        && before[before.length - 1 - suffix] === after[after.length - 1 - suffix]) {
        suffix++;
    }

    return { start: prefix, end: before.length - suffix, inserted: after.slice(prefix, after.length - suffix) };
}

function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
}

// A textarea always reports "\n"; templates saved elsewhere may use "\r\n".
function normalizeNewlines(text) {
    return (text || "").replace(/\r\n?/g, "\n");
}
