import { useRef, useState } from "react";

import { applyDraftEdit, fieldsUsed, layoutDraft } from "../../utils/draftFields";

// A subject / message box that shows the draft filled in with ONE record's
// values instead of {{...}} placeholders (see utils/draftFields). `value` and
// `onChange` carry the raw draft, so what is sent - and every other
// recipient's personalisation - is unchanged.
export default function ResolvedDraftField({ id, value, onChange, fields, multiline = false, rows, disabled }) {

    const ref = useRef(null);
    const [notice, setNotice] = useState(null);

    const { display } = layoutDraft(value, fields);

    function handleChange(e) {

        const caret = e.target.selectionStart;
        const result = applyDraftEdit(value, fields, e.target.value, caret);

        if (result.rejected) {

            const what = result.rejected.missing || result.rejected.unknown
                ? result.rejected.display
                : `"${result.rejected.display}" (${result.rejected.label})`;

            setNotice(`${what} is filled in separately for each recipient, so it can't be partly edited. `
                + "Type before or after it, or select all of it to remove it.");

            // The text is put back as it was; keep the cursor where it was too.
            const back = Math.max(0, Math.min(display.length, caret - (e.target.value.length - display.length)));
            requestAnimationFrame(() => ref.current?.setSelectionRange?.(back, back));
            return;
        }

        setNotice(null);
        onChange(result.raw);
    }

    const props = {
        id,
        ref,
        className: "form-control",
        value: display,
        onChange: handleChange,
        disabled,
    };

    return (
        <>
            {multiline ? <textarea rows={rows} {...props} /> : <input type="text" {...props} />}
            {notice && <div className="form-text text-warning-emphasis" role="status">{notice}</div>}
        </>
    );
}

// Which record's values the draft shows, the values it fills in, and every
// record that is missing one. `recipients`: [{ id, label, mergeFields }].
export function DraftValuesNote({ raws, recipients, shownId, onShow, noun = "recipient" }) {

    const shown = recipients.find((r) => r.id === shownId) || recipients[0];

    if (!shown) {
        return null;
    }

    const used = fieldsUsed(raws, shown.mergeFields);

    const problems = recipients
        .map((r) => ({ r, bad: fieldsUsed(raws, r.mergeFields).filter((f) => f.missing || f.unknown) }))
        .filter((x) => x.bad.length > 0);

    return (
        <div className="mb-3">

            <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                <label className="form-label mb-0" htmlFor="draft-shown-record">Draft shows the values of</label>
                {recipients.length > 1 ? (
                    <select
                        id="draft-shown-record"
                        className="form-select form-select-sm w-auto"
                        value={shown.id}
                        onChange={(e) => onShow(Number(e.target.value))}
                    >
                        {recipients.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                ) : (
                    <strong id="draft-shown-record">{shown.label}</strong>
                )}
            </div>

            {recipients.length > 1 && (
                <div className="form-text mt-0">
                    Only for this {noun}: every other {noun} gets their own name, company, products and so on.
                    Check any of them on the Review step.
                </div>
            )}

            {used.length > 0 && (
                <div className="small mt-1" data-testid="draft-filled-values">
                    Filled in for {shown.label}:{" "}
                    {used.map((f, i) => (
                        <span key={f.key || f.name}>
                            {i > 0 && " · "}
                            {f.label}{" "}
                            {f.missing || f.unknown
                                ? <span className="text-danger fw-semibold">{f.unknown ? "(not a supported field)" : "(missing)"}</span>
                                : <strong>{f.value}</strong>}
                        </span>
                    ))}
                </div>
            )}

            {problems.length > 0 && (
                <div className="alert alert-warning py-2 px-3 mt-2 mb-0 small" role="alert" data-testid="draft-missing-values">
                    <i className="bi bi-exclamation-triangle-fill me-1"></i>
                    These {problems.length === 1 ? noun : `${noun}s`} cannot be sent this message as it is - a value it uses is missing:
                    <ul className="mb-0 mt-1">
                        {problems.map(({ r, bad }) => (
                            <li key={r.id}>
                                <strong>{r.label}</strong>:{" "}
                                {bad.map((f) => (f.unknown ? `unsupported field "${f.name}"` : `${f.label} is missing`)).join(", ")}
                            </li>
                        ))}
                    </ul>
                    Add the missing details to the record, or change the message.
                </div>
            )}

        </div>
    );
}
