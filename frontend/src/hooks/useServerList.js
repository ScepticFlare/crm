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

// Whether a filter value actually restricts anything. A multi-select filter
// holds an array, which counts only when it has at least one value.
export function isActiveFilterValue(value) {

    if (Array.isArray(value)) {
        return value.some((v) => v !== "" && v !== null && v !== undefined);
    }

    return value !== "" && value !== null && value !== undefined;

}

// Empty-valued keys (including empty multi-select arrays) are dropped so
// "cleared" filters leave no trace in the URL - and never reach the backend
// as an empty selection.
export function serializeFilters(filters) {

    const clean = Object.fromEntries(
        Object.entries(filters || {})
            .filter(([, v]) => isActiveFilterValue(v))
            .map(([k, v]) => [k, Array.isArray(v) ? v.filter((x) => x !== "" && x != null) : v])
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

    // "Select all N matching records": the selection is every record that
    // matches the current search + filters (on the server, across all pages)
    // except excludedIds - the rows the user unticked afterwards. No rows
    // are downloaded for it; an export re-runs the same query server-side
    // with the exclusions (see services/api.selectionParams).
    const [allMatching, setAllMatching] = useState(false);
    const [excludedIds, setExcludedIds] = useState([]);

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
            // or sort change. (An "all matching" selection is not tied to
            // one page; it is reset below whenever what matches changes.)
            setSelectedIds([]);

        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchFn, page, pageSize, urlSearch, filtersKey, sort?.field, sort?.dir]);

    useEffect(() => {

        load();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load]);

    // A different search, filter set or data source means a different set
    // of matching records: an "all matching" selection made for the old one
    // must never carry over (it would silently export other records).
    // Paging and sorting keep it - the set is the same. Reset while
    // rendering (not in an effect), so no render ever pairs the new filters
    // with the old selection.
    const [selectionScope, setSelectionScope] = useState({ fetchFn, search: urlSearch, filtersKey });

    if (selectionScope.fetchFn !== fetchFn
        || selectionScope.search !== urlSearch
        || selectionScope.filtersKey !== filtersKey) {

        setSelectionScope({ fetchFn, search: urlSearch, filtersKey });
        setAllMatching(false);
        setExcludedIds([]);
    }

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

    function isSelected(id) {
        return allMatching ? !excludedIds.includes(id) : selectedIds.includes(id);
    }

    // In "all matching" mode a row's checkbox toggles its exclusion.
    function toggleSelect(id) {

        const toggle = (prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

        if (allMatching) {
            setExcludedIds(toggle);
        } else {
            setSelectedIds(toggle);
        }

    }

    // The header checkbox only ever applies to the rows currently on screen.
    // Selecting every matching record across pages is a separate, explicit
    // step (selectAllMatching) offered once this page is fully selected.
    function toggleSelectAll() {

        const pageIds = data.map((row) => row.id);

        if (allMatching) {

            setExcludedIds((prev) => {

                const pageFullySelected = pageIds.every((id) => !prev.includes(id));

                return pageFullySelected
                    ? Array.from(new Set([...prev, ...pageIds]))
                    : prev.filter((id) => !pageIds.includes(id));

            });

            return;
        }

        setSelectedIds((prev) => {

            const allSelected = pageIds.length > 0 && pageIds.every((id) => prev.includes(id));

            if (allSelected) {
                return prev.filter((id) => !pageIds.includes(id));
            }

            return Array.from(new Set([...prev, ...pageIds]));

        });

    }

    function selectAllMatching() {

        if (totalElements === 0) {
            return;
        }

        setAllMatching(true);
        setExcludedIds([]);
        setSelectedIds([]);

    }

    function clearSelection() {
        setSelectedIds([]);
        setAllMatching(false);
        setExcludedIds([]);
    }

    // How many records the selection covers. In "all matching" mode every
    // excluded id was a matching row on some page, so this is exact for the
    // result set as last loaded.
    const selectedCount = allMatching
        ? Math.max(0, totalElements - excludedIds.length)
        : selectedIds.length;

    const pageIds = data.map((row) => row.id);
    const pageFullySelected = pageIds.length > 0 && pageIds.every((id) => isSelected(id));

    // What an export / bulk action should act on - see api.selectionParams.
    // null when nothing is selected.
    const selection = allMatching
        ? (selectedCount > 0 ? { allMatching: true, excludedIds } : null)
        : (selectedIds.length > 0 ? selectedIds : null);

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
        isSelected,
        allMatching,
        excludedIds,
        selectAllMatching,
        selectedCount,
        pageFullySelected,
        selection,
        reload: load,
    };
}
