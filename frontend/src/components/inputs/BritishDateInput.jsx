import { useEffect, useRef, useState } from "react";

import { isoToBritish, parseBritishDate } from "../../utils/formatDate";

// Drop-in replacement for <input type="date">. A native date input is drawn in
// the BROWSER'S locale (mm/dd/yyyy on an American-English machine) and the page
// cannot change that, so every employee would see a different format. This one
// always shows and accepts DD/MM/YYYY, whatever the browser or OS language.
//
// The value in and out is exactly what <input type="date"> uses: "yyyy-MM-dd",
// or "" when empty or not (yet) a valid date. onChange gets the same
// { target: { name, value } } shape, so existing handlers work unchanged. Typed
// text is parsed day first only and never guessed; anything that is not a real
// date blocks the form's submit with a message (setCustomValidity), so a
// half-typed date can never be sent as "no date". The calendar button opens the
// browser's own date picker for choosing a day.
export const DATE_FORMAT_MESSAGE = "Enter the date as DD/MM/YYYY, e.g. 12/11/2026.";

function rangeMessage(iso, min, max) {
    if (min && iso < min) {
        return `The date must be on or after ${isoToBritish(min)}.`;
    }
    if (max && iso > max) {
        return `The date must be on or before ${isoToBritish(max)}.`;
    }
    return "";
}

export default function BritishDateInput({
    value,
    onChange,
    name,
    id,
    min,
    max,
    required,
    disabled,
    className = "form-control",
    "aria-label": ariaLabel,
    pickerLabel = "Choose a date",
}) {

    const iso = value || "";

    // `synced` is the value the text currently stands for. When the parent
    // passes a different value (a reset, a loaded record), the text follows it.
    const [synced, setSynced] = useState(iso);
    const [text, setText] = useState(() => isoToBritish(iso));
    const [touched, setTouched] = useState(false);

    if (iso !== synced) {
        setSynced(iso);
        setText(isoToBritish(iso));
    }

    const inputRef = useRef(null);
    const pickerRef = useRef(null);

    const parsed = parseBritishDate(text);
    const error = text.trim() === "" ? "" : parsed ? rangeMessage(parsed, min, max) : DATE_FORMAT_MESSAGE;

    useEffect(() => {
        inputRef.current?.setCustomValidity(error);
    }, [error]);

    function emit(next) {
        if (next !== synced) {
            setSynced(next);
            onChange?.({ target: { name, value: next, type: "date" } });
        }
    }

    function handleText(e) {
        const t = e.target.value;
        setText(t);
        const p = parseBritishDate(t);
        emit(p && !rangeMessage(p, min, max) ? p : "");
    }

    function handleBlur() {
        setTouched(true);
        if (parsed) {
            setText(isoToBritish(parsed));      // 1/2/2026 -> 01/02/2026
        }
    }

    function handlePicked(e) {
        const v = e.target.value;
        setText(isoToBritish(v));
        emit(v);
    }

    function openPicker() {
        const picker = pickerRef.current;
        if (!picker) {
            return;
        }
        try {
            picker.showPicker();
        } catch {
            picker.focus();
            picker.click();
        }
    }

    const small = className.includes("form-control-sm");
    const showError = touched && error;

    return (
        <div className={`input-group${small ? " input-group-sm" : ""} british-date-input`} style={{ position: "relative" }}>
            <input
                ref={inputRef}
                type="text"
                id={id}
                name={name}
                className={`${className}${showError ? " is-invalid" : ""}`}
                value={text}
                onChange={handleText}
                onBlur={handleBlur}
                placeholder="DD/MM/YYYY"
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
                required={required}
                disabled={disabled}
                aria-label={ariaLabel}
                aria-invalid={showError ? "true" : undefined}
                title={showError ? error : "DD/MM/YYYY"}
            />
            <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={openPicker}
                disabled={disabled}
                aria-label={pickerLabel}
                title={pickerLabel}
            >
                <i className="bi bi-calendar3"></i>
            </button>
            <input
                ref={pickerRef}
                type="date"
                tabIndex={-1}
                aria-hidden="true"
                value={parsed || ""}
                min={min}
                max={max}
                onChange={handlePicked}
                style={{ position: "absolute", left: 0, bottom: 0, width: 1, height: 1, opacity: 0, pointerEvents: "none", border: 0, padding: 0 }}
            />
            {showError && <div className="invalid-feedback">{error}</div>}
        </div>
    );
}
