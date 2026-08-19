import { useEffect, useState } from "react";

// "Manage Columns" state for a list page: which of a module's known
// columns are currently visible, persisted to localStorage per module (via
// storageKey) so the choice survives a refresh. Column configuration is a
// presentation-only concern - callers never send column keys to the
// backend, they only use visibleColumns to decide what DataTable renders.
export default function usePersistedColumns(storageKey, allColumns, defaultVisibleKeys) {

    const [visibleKeys, setVisibleKeys] = useState(() => {

        try {

            const raw = localStorage.getItem(storageKey);

            if (raw) {

                const parsed = JSON.parse(raw);

                if (Array.isArray(parsed) && parsed.length > 0) {
                    // Drop any persisted key that no longer corresponds to
                    // a real column (e.g. after a column set changes).
                    const validKeys = new Set(allColumns.map((c) => c.key));
                    const filtered = parsed.filter((key) => validKeys.has(key));

                    if (filtered.length > 0) {
                        return filtered;
                    }
                }

            }

        } catch (err) {
            // Corrupt/foreign localStorage value - fall through to defaults.
        }

        return defaultVisibleKeys;

    });

    useEffect(() => {

        localStorage.setItem(storageKey, JSON.stringify(visibleKeys));

    }, [storageKey, visibleKeys]);

    function toggleColumn(key) {

        setVisibleKeys((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );

    }

    function resetColumns() {
        setVisibleKeys(defaultVisibleKeys);
    }

    const visibleColumns = allColumns.filter((col) => visibleKeys.includes(col.key));

    return { allColumns, visibleKeys, visibleColumns, toggleColumn, resetColumns };
}
