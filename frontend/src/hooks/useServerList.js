import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

function parseFilters(raw) {

    if (!raw) return {};

    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
        return {};
    }

}

// Empty-valued keys are dropped so "cleared" filters leave no trace in the URL.
export function serializeFilters(filters) {

    const clean = Object.fromEntries(
        Object.entries(filters || {}).filter(([, v]) => v !== "" && v !== null && v !== undefined)
    );

    return Object.keys(clean).length ? JSON.stringify(clean) : null;

}

// null = "use the page default"; "none" = the user explicitly cleared sorting.
export function serializeSort(sort, initialSort) {

    if (!sort) return initialSort ? "none" : null;
    if (initialSort && sort.field === initialSort.field && sort.dir === initialSort.dir) return null;

    return `${sort.field}:${sort.dir}`;

}

// The one reusable data-fetching/state hook backing every CRM list page
// (Leads, Opportunities, Customers, FollowUps, and the status-bucket
// wrapper pages that reuse them with a different fetchFn). A module page
// only supplies fetchFn - everything else (search debouncing, filter/sort/
// pagination state, row selection) is identical across modules by design,
// so there's exactly one implementation of this behavior, not four.
//
// fetchFn is called as fetchFn({ page, size, search, sort, filters }) and
// must resolve to a Spring Page shape: { content, totalPages, totalElements }.
export default function useServerList({
    fetchFn,
    initialSort = null,
    defaultPageSize = 50,
}) {

    const [searchParams, setSearchParams] = useSearchParams();

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const [selectedIds, setSelectedIds] = useState([]);

    // Search, filters, sort, page and page size live in the URL query string
    // rather than component state. The list page unmounts when a record's
    // detail page opens, so component state was lost on the way back; the
    // URL is part of the history entry, so Back/Forward (and a Back button
    // that returns to the exact list URL) restores it for free. A fresh
    // visit (sidebar link, no query) starts from defaults, so nothing is
    // carried between unrelated pages or sessions.
    const urlSearch = searchParams.get("q") || "";
    const rawFilters = searchParams.get("filters") || "";
    const rawSort = searchParams.get("sort");
    const page = Math.max(0, (parseInt(searchParams.get("page"), 10) || 1) - 1);
    const pageSize = parseInt(searchParams.get("size"), 10) || defaultPageSize;

    const filters = useMemo(() => parseFilters(rawFilters), [rawFilters]);
    const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

    const sort = useMemo(() => {

        if (rawSort === null) return initialSort;
        if (rawSort === "none") return null;

        const [field, dir] = rawSort.split(":");
        return field ? { field, dir: dir === "desc" ? "desc" : "asc" } : initialSort;

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rawSort, initialSort?.field, initialSort?.dir]);

    // Applies a set of param changes (null/"" removes the key) as a history
    // *replace* - tweaking a filter shouldn't add a Back-button stop per
    // keystroke; the entry created by navigating to the list is the one
    // that matters. Any change except an explicit page change returns to
    // page 1, since the old page may not exist in the new result set.
    const updateParams = useCallback((changes, { keepPage = false } = {}) => {

        setSearchParams((prev) => {

            const next = new URLSearchParams(prev);

            Object.entries(changes).forEach(([key, value]) => {
                if (value === null || value === "") next.delete(key);
                else next.set(key, value);
            });

            if (!keepPage) next.delete("page");

            return next;

        }, { replace: true });

    }, [setSearchParams]);

    // The input box is local state (instant typing); the URL only receives
    // the value after the debounce so every keystroke doesn't fire a request.
    const [search, setSearch] = useState(urlSearch);
    const lastCommitted = useRef(urlSearch);

    useEffect(() => {

        if (search === lastCommitted.current) return undefined;

        const timer = setTimeout(() => {
            lastCommitted.current = search;
            updateParams({ q: search });
        }, 350);

        return () => clearTimeout(timer);

    }, [search, updateParams]);

    // Back/Forward changed the URL's search term - reflect it in the input.
    useEffect(() => {

        if (urlSearch !== lastCommitted.current) {
            lastCommitted.current = urlSearch;
            setSearch(urlSearch);
        }

    }, [urlSearch]);

    const setFilters = useCallback((value) => {

        const next = typeof value === "function" ? value(filters) : value;
        updateParams({ filters: serializeFilters(next) });

    }, [filters, updateParams]);

    const setSort = useCallback((value) => {

        const next = typeof value === "function" ? value(sort) : value;
        updateParams({ sort: serializeSort(next, initialSort) });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sort, initialSort?.field, initialSort?.dir, updateParams]);

    const setPage = useCallback((value) => {
        updateParams({ page: value > 0 ? String(value + 1) : null }, { keepPage: true });
    }, [updateParams]);

    const setPageSize = useCallback((value) => {
        updateParams({ size: Number(value) === defaultPageSize ? null : String(value) });
    }, [defaultPageSize, updateParams]);

    const load = useCallback(async () => {

        setLoading(true);
        setError(null);

        try {

            const response = await fetchFn({
                page,
                size: pageSize,
                search: urlSearch,
                sort,
                filters,
            });

            setData(response.content || []);
            setTotalPages(response.totalPages || 0);
            setTotalElements(
                response.totalElements ?? (response.content ? response.content.length : 0)
            );

        } catch (err) {

            console.error(err);
            setError(err);
            setData([]);

        } finally {

            setLoading(false);

            // A freshly loaded page is a new row set - any prior selection
            // no longer safely corresponds to what's on screen, regardless
            // of whether the reload was caused by a page, filter, search,
            // or sort change.
            setSelectedIds([]);

        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchFn, page, pageSize, urlSearch, filtersKey, sort?.field, sort?.dir]);

    useEffect(() => {

        load();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load]);

    // If rows were removed (e.g. the last record on the final page was
    // deleted) and the current page no longer exists, step back to the last
    // page that does, rather than leaving the user on an empty page.
    useEffect(() => {

        if (!loading && !error && page > 0 && totalPages > 0 && page >= totalPages) {
            setPage(totalPages - 1);
        }

    }, [loading, error, page, totalPages, setPage]);

    function toggleSort(field) {

        setSort((prev) => {

            if (!prev || prev.field !== field) {
                return { field, dir: "asc" };
            }

            if (prev.dir === "asc") {
                return { field, dir: "desc" };
            }

            return null;

        });

    }

    function clearFilters() {
        setFilters({});
    }

    function toggleSelect(id) {

        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );

    }

    // Select-all only ever applies to the rows currently on screen - never
    // implies "every matching record across every page".
    function toggleSelectAll() {

        const pageIds = data.map((row) => row.id);

        setSelectedIds((prev) => {

            const allSelected = pageIds.length > 0 && pageIds.every((id) => prev.includes(id));

            if (allSelected) {
                return prev.filter((id) => !pageIds.includes(id));
            }

            return Array.from(new Set([...prev, ...pageIds]));

        });

    }

    function clearSelection() {
        setSelectedIds([]);
    }

    return {
        data,
        loading,
        error,
        search,
        setSearch,
        filters,
        setFilters,
        clearFilters,
        sort,
        setSort,
        toggleSort,
        page,
        setPage,
        pageSize,
        setPageSize,
        totalPages,
        totalElements,
        selectedIds,
        toggleSelect,
        toggleSelectAll,
        clearSelection,
        reload: load,
    };
}
