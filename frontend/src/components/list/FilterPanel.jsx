import { useEffect, useState } from "react";

const DATE_PRESETS = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "last7", label: "Last 7 days" },
    { key: "last30", label: "Last 30 days" },
    { key: "thisMonth", label: "This month" },
    { key: "lastMonth", label: "Last month" },
];

function toIso(date) {
    return date.toISOString().split("T")[0];
}

function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Computes the [from, to] ISO date strings for a CRM-style quick range
// preset. Purely a frontend convenience over the existing createdFrom/
// createdTo (etc.) query params - no backend changes needed since these
// already accept plain ISO dates.
function presetRange(key) {

    const now = new Date();

    switch (key) {

        case "today": {
            const d = startOfDay(now);
            return [toIso(d), toIso(d)];
        }

        case "yesterday": {
            const d = startOfDay(now);
            d.setDate(d.getDate() - 1);
            return [toIso(d), toIso(d)];
        }

        case "last7": {
            const end = startOfDay(now);
            const start = startOfDay(now);
            start.setDate(start.getDate() - 6);
            return [toIso(start), toIso(end)];
        }

        case "last30": {
            const end = startOfDay(now);
            const start = startOfDay(now);
            start.setDate(start.getDate() - 29);
            return [toIso(start), toIso(end)];
        }

        case "thisMonth": {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            const end = startOfDay(now);
            return [toIso(start), toIso(end)];
        }

        case "lastMonth": {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0);
            return [toIso(start), toIso(end)];
        }

        default:
            return [undefined, undefined];

    }

}

// Generic combinable filter drawer, driven entirely by a filterDefs config
// array so every module (Leads/Opportunities/Customers/FollowUps) reuses
// this one component instead of hand-building its own filter UI.
// filterDefs: [{ key, label, type: "select" | "text" | "date" | "daterange", options, fromKey, toKey }]
//
// Self-contained: renders its own "Filters" trigger button (with an active-
// count badge) plus the drawer. Filters are staged locally (draft) and only
// pushed to the parent's `filters` state (the actual server-side query
// params) when "Apply Filters" is pressed - "Clear Filters" resets both
// immediately. Opening the drawer re-syncs the draft from the current
// applied filters.
export default function FilterPanel({ filterDefs, filters, onChange, onClear }) {

    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(filters);

    useEffect(() => {

        if (open) {
            setDraft(filters);
        }

    }, [open]);

    const activeCount = Object.values(filters).filter(
        (v) => v !== undefined && v !== null && v !== ""
    ).length;

    function updateDraft(key, value) {
        setDraft((prev) => ({ ...prev, [key]: value === "" ? undefined : value }));
    }

    function applyPreset(def, presetKey) {

        const [from, to] = presetRange(presetKey);

        setDraft((prev) => ({ ...prev, [def.fromKey]: from, [def.toKey]: to }));

    }

    function handleApply() {
        onChange(draft);
        setOpen(false);
    }

    function handleClear() {
        setDraft({});
        onClear();
    }

    return (

        <>

            <button
                type="button"
                className="btn btn-outline-secondary position-relative"
                onClick={() => setOpen(true)}
            >
                <i className="bi bi-funnel me-2"></i>
                Filters
                {activeCount > 0 && (
                    <span className="badge bg-primary rounded-pill ms-2">{activeCount}</span>
                )}
            </button>

            {open && (

                <>

                    <div className="filter-drawer-backdrop" onClick={() => setOpen(false)}></div>

                    <div className="filter-drawer">

                        <div className="filter-drawer-header">

                            <h5 className="mb-0">Filters</h5>

                            <button
                                type="button"
                                className="btn-close"
                                aria-label="Close"
                                onClick={() => setOpen(false)}
                            ></button>

                        </div>

                        <div className="filter-drawer-body">

                            {filterDefs.map((def) => (

                                <div className="mb-3" key={def.key || `${def.fromKey}-${def.toKey}`}>

                                    <label className="form-label small fw-semibold mb-1">{def.label}</label>

                                    {def.type === "select" && (
                                        <select
                                            className="form-select form-select-sm"
                                            value={draft[def.key] ?? ""}
                                            onChange={(e) => updateDraft(def.key, e.target.value)}
                                        >
                                            <option value="">All</option>
                                            {def.options.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {def.type === "text" && (
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={draft[def.key] ?? ""}
                                            onChange={(e) => updateDraft(def.key, e.target.value)}
                                        />
                                    )}

                                    {def.type === "date" && (
                                        <input
                                            type="date"
                                            className="form-control form-control-sm"
                                            value={draft[def.key] ?? ""}
                                            onChange={(e) => updateDraft(def.key, e.target.value)}
                                        />
                                    )}

                                    {def.type === "daterange" && (
                                        <>
                                            <div className="d-flex flex-wrap gap-1 mb-2">
                                                {DATE_PRESETS.map((preset) => (
                                                    <button
                                                        key={preset.key}
                                                        type="button"
                                                        className="btn btn-sm btn-outline-secondary filter-preset-chip"
                                                        onClick={() => applyPreset(def, preset.key)}
                                                    >
                                                        {preset.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="d-flex gap-2">
                                                <input
                                                    type="date"
                                                    className="form-control form-control-sm"
                                                    aria-label={`${def.label} from`}
                                                    value={draft[def.fromKey] ?? ""}
                                                    onChange={(e) => updateDraft(def.fromKey, e.target.value)}
                                                />
                                                <input
                                                    type="date"
                                                    className="form-control form-control-sm"
                                                    aria-label={`${def.label} to`}
                                                    value={draft[def.toKey] ?? ""}
                                                    onChange={(e) => updateDraft(def.toKey, e.target.value)}
                                                />
                                            </div>
                                        </>
                                    )}

                                </div>

                            ))}

                        </div>

                        <div className="filter-drawer-footer">

                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={handleClear}
                            >
                                Clear Filters
                            </button>

                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleApply}
                            >
                                Apply Filters
                            </button>

                        </div>

                    </div>

                </>

            )}

        </>

    );

}
