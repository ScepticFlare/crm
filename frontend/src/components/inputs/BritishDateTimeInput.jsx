import { useEffect, useRef, useState } from "react";

import BritishDateInput from "./BritishDateInput";
import { isoToBritish, parseTime24 } from "../../utils/formatDate";

// Drop-in replacement for <input type="datetime-local">: a DD/MM/YYYY date
// (BritishDateInput) and an HH:MM time on a 24-hour clock, whatever the
// browser's locale (a native datetime-local shows mm/dd/yyyy and AM/PM on an
// American-English machine).
//
// Value in and out: "yyyy-MM-ddTHH:mm" exactly as datetime-local emits it (an
// incoming value with seconds is accepted), or "" until both parts are valid.
// Local wall-clock time only - no time-zone conversion happens here.
export const TIME_FORMAT_MESSAGE = "Enter the time as HH:MM on a 24-hour clock, e.g. 14:30.";

function split(value) {
    const v = typeof value === "string" ? value : "";
    const date = isoToBritish(v) ? v.slice(0, 10) : "";
    const time = date && /^\d{2}:\d{2}/.test(v.slice(11, 16)) ? v.slice(11, 16) : "";
    return { date, time };
}

export default function BritishDateTimeInput({
    value,
    onChange,
    name,
    id,
    min,
    required,
    disabled,
    className = "form-control",
    "aria-label": ariaLabel,
    timeLabel = "Time (HH:MM, 24-hour)",
}) {

    const incoming = value ? String(value).slice(0, 16) : "";

    const [synced, setSynced] = useState(incoming);
    const [date, setDate] = useState(() => split(incoming).date);
    const [timeText, setTimeText] = useState(() => split(incoming).time);
    const [touched, setTouched] = useState(false);

    if (incoming !== synced) {
        setSynced(incoming);
        setDate(split(incoming).date);
        setTimeText(split(incoming).time);
    }

    const timeRef = useRef(null);

    const minValue = min ? String(min).slice(0, 16) : "";
    const time = parseTime24(timeText);

    let timeError = "";
    if (timeText.trim() !== "" && !time) {
        timeError = TIME_FORMAT_MESSAGE;
    } else if (date && !time) {
        timeError = "Enter the time as well, as HH:MM.";
    } else if (time && date && minValue && `${date}T${time}` < minValue) {
        timeError = `Choose a time after ${isoToBritish(minValue)} ${minValue.slice(11, 16)}.`;
    }

    useEffect(() => {
        timeRef.current?.setCustomValidity(timeError);
    }, [timeError]);

    function emit(nextDate, nextTimeText) {
        const t = parseTime24(nextTimeText);
        let next = nextDate && t ? `${nextDate}T${t}` : "";
        if (next && minValue && next < minValue) {
            next = "";
        }
        if (next !== synced) {
            setSynced(next);
            onChange?.({ target: { name, value: next, type: "datetime-local" } });
        }
    }

    function handleDate(e) {
        setDate(e.target.value);
        emit(e.target.value, timeText);
    }

    function handleTime(e) {
        setTimeText(e.target.value);
        emit(date, e.target.value);
    }

    function handleTimeBlur() {
        setTouched(true);
        if (time) {
            setTimeText(time);      // 9:05 -> 09:05
        }
    }

    const small = className.includes("form-control-sm");
    const showTimeError = touched && timeError;

    return (
        <div className="d-flex gap-2 align-items-start british-datetime-input">
            <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <BritishDateInput
                    id={id}
                    name={name}
                    value={date}
                    onChange={handleDate}
                    min={minValue ? minValue.slice(0, 10) : undefined}
                    required={required}
                    disabled={disabled}
                    className={className}
                    aria-label={ariaLabel}
                />
            </div>
            <div style={{ flex: "0 0 6.5rem" }}>
                <input
                    ref={timeRef}
                    type="text"
                    className={`${small ? "form-control form-control-sm" : "form-control"}${showTimeError ? " is-invalid" : ""}`}
                    value={timeText}
                    onChange={handleTime}
                    onBlur={handleTimeBlur}
                    placeholder="HH:MM"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={5}
                    required={required}
                    disabled={disabled}
                    aria-label={timeLabel}
                    aria-invalid={showTimeError ? "true" : undefined}
                    title={showTimeError ? timeError : "HH:MM (24-hour)"}
                />
                {showTimeError && <div className="invalid-feedback">{timeError}</div>}
            </div>
        </div>
    );
}
