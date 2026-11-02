import { insertAt, mergeFieldsFor, mergeToken } from "../../utils/mergeFields";

// Small "Insert field" menu for a subject / body box: inserts the chosen merge
// field at the cursor of the box `inputRef` points at (or at the end), so
// nobody has to type {{...}} placeholders by hand. Each recipient's own value
// is filled in by the backend when the email is sent.
export default function MergeFieldPicker({ target = "LEAD", inputRef, value, onChange, disabled, label }) {

    function handleSelect(e) {

        const key = e.target.value;
        e.target.value = "";

        if (!key) {
            return;
        }

        const el = inputRef?.current;
        const { text, caret } = insertAt(value, el?.selectionStart, el?.selectionEnd, mergeToken(key));

        onChange(text);

        // Put the cursor back after the inserted field once React re-renders.
        if (el) {
            requestAnimationFrame(() => {
                el.focus();
                el.setSelectionRange?.(caret, caret);
            });
        }
    }

    return (
        <select
            className="form-select form-select-sm w-auto"
            defaultValue=""
            onChange={handleSelect}
            disabled={disabled}
            aria-label={label || "Insert field"}
        >
            <option value="">Insert field…</option>
            {mergeFieldsFor(target).map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
            ))}
        </select>
    );
}
