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
    // Prefix for this list's URL keys (q, filters, sort, page, size). Empty
    // for a page with one list; a page showing two lists (Dropped,
    // Unresponsive, Invalid: leads + opportunities) gives the second one its
    // own prefix so paging or searching one list never moves the other.
    paramPrefix = "",
}) {

    const [searchParams, setSearchParams] = useSearchParams();

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Ticked record ids - kept across pages, page sizes and sort orders, so
    // records ticked on page 1, 2 and 3 are all acted on together. Cleared
    // when the search or filters change (a different set of records - see
    // below), by clearSelection, or when the list page is left (component
    // state only, never stored in the browser).
    const [selectedIds, setSelectedIds] = useState([]);

    // The row objects behind selectedIds, as last seen on screen. Rows on
    // other pages are not loaded, so an action that needs more than ids
    // (e.g. names for a confirmation) reads them from here.
    const [selectedRowsById, setSelectedRowsById] = useState({});

    // Shown once after the selection had to be cleared because the search or
    // filters changed (null when there is nothing to say).
    const [selectionNotice, setSelectionNotice] = useState(null);

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
    const key = useCallback((name) => `${paramPrefix}${name}`, [paramPrefix]);

    const urlSearch = searchParams.get(key("q")) || "";
    const rawFilters = searchParams.get(key("filters")) || "";
    const rawSort = searchParams.get(key("sort"));
    const page = Math.max(0, (parseInt(searchParams.get(key("page")), 10) || 1) - 1);
    const pageSize = parseInt(searchParams.get(key("size")), 10) || defaultPageSize;

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

            Object.entries(changes).forEach(([name, value]) => {
                if (value === null || value === "") next.delete(key(name));
                else next.set(key(name), value);
            });

            if (!keepPage) next.delete(key("page"));

            return next;

        }, { replace: true });

    }, [setSearchParams, key]);

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

            const rows = response.content || [];

            setData(rows);

            // Refresh the stored copies of selected rows that are on this page.
            setSelectedRowsById((prev) => {

                const fresh = rows.filter((row) => prev[row.id]);

                if (fresh.length === 0) return prev;

                const next = { ...prev };
                fresh.forEach((row) => { next[row.id] = row; });
                return next;

            });
            setTotalPages(response.totalPages || 0);
            setTotalElements(
                response.totalElements ?? (response.content ? response.content.length : 0)
            );

        } catch (err) {

            console.error(err);
            setError(err);
            setData([]);

        } finally {

            // The selection is NOT cleared here: paging, page size and sort
            // show the same set of records, so ticked rows on other pages
            // stay ticked. A search / filter change clears it (below).
            setLoading(false);

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

    // The same applies to individually ticked records: they may no longer
    // match (and could not be seen), so acting on them would surprise the
    // user - the selection is cleared and the user is told.
    if (selectionScope.fetchFn !== fetchFn
        || selectionScope.search !== urlSearch
        || selectionScope.filtersKey !== filtersKey) {

        const hadSelection = allMatching || selectedIds.length > 0;

        setSelectionScope({ fetchFn, search: urlSearch, filtersKey });
        setAllMatching(false);
        setExcludedIds([]);
        setSelectedIds([]);
        setSelectedRowsById({});
        setSelectionNotice(hadSelection
            ? "Your selection was cleared because the search or filters changed."
            : null);
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

    function rememberRows(rows, selected) {

        setSelectedRowsById((prev) => {

            const next = { ...prev };

            rows.forEach((row) => {
                if (selected) next[row.id] = row;
                else delete next[row.id];
            });

            return next;

        });

    }

    // In "all matching" mode a row's checkbox toggles its exclusion.
    // Otherwise it ticks / unticks that one record only - records ticked on
    // other pages are unaffected.
    function toggleSelect(id) {

        const toggle = (prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

        setSelectionNotice(null);

        if (allMatching) {
            setExcludedIds(toggle);
        } else {
            const nowSelected = !selectedIds.includes(id);
            setSelectedIds(toggle);
            rememberRows([data.find((r) => r.id === id) || { id }], nowSelected);
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

        setSelectionNotice(null);

        // Only this page's rows are added or removed; rows ticked on other
        // pages stay as they are.
        const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

        setSelectedIds((prev) => (allSelected
            ? prev.filter((id) => !pageIds.includes(id))
            : Array.from(new Set([...prev, ...pageIds]))));

        rememberRows(data, !allSelected);

    }

    function selectAllMatching() {

        if (totalElements === 0) {
            return;
        }

        setAllMatching(true);
        setExcludedIds([]);
        setSelectedIds([]);
        setSelectedRowsById({});
        setSelectionNotice(null);

    }

    function clearSelection() {
        setSelectedIds([]);
        setSelectedRowsById({});
        setAllMatching(false);
        setExcludedIds([]);
        setSelectionNotice(null);
    }

    // After a bulk action: drop the records it processed from the selection
    // and keep the ones it skipped (inaccessible / already gone / failed)
    // ticked, so the user sees exactly what is left.
    function removeFromSelection(ids) {

        const done = new Set((ids || []).map((id) => Number(id)));

        if (done.size === 0) return;

        setSelectedIds((prev) => prev.filter((id) => !done.has(Number(id))));
        setSelectedRowsById((prev) => {
            const next = { ...prev };
            done.forEach((id) => { delete next[id]; });
            return next;
        });

    }

    function dismissSelectionNotice() {
        setSelectionNotice(null);
    }

    // How many records the selection covers. In "all matching" mode every
    // excluded id was a matching row on some page, so this is exact for the
    // result set as last loaded.
    const selectedCount = allMatching
        ? Math.max(0, totalElements - excludedIds.length)
        : selectedIds.length;

    const pageIds = data.map((row) => row.id);
    const pageFullySelected = pageIds.length > 0 && pageIds.every((id) => isSelected(id));
    const pageSelectedCount = pageIds.filter((id) => isSelected(id)).length;

    // Selected rows (as last seen) in selection order; a row that was never
    // on screen in this session is not included.
    const selectedRows = selectedIds.map((id) => selectedRowsById[id]).filter(Boolean);

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
        selectedRows,
        pageSelectedCount,
        removeFromSelection,
        selectionNotice,
        dismissSelectionNotice,
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
