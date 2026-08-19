import { useCallback, useEffect, useMemo, useState } from "react";

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

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState(initialSort);

    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(defaultPageSize);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const [selectedIds, setSelectedIds] = useState([]);

    // Debounce the search box so every keystroke doesn't fire a request.
    useEffect(() => {

        const timer = setTimeout(() => setDebouncedSearch(search), 350);

        return () => clearTimeout(timer);

    }, [search]);

    const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

    // Any change to search/filters/sort/page size invalidates the current
    // page - jump back to page 0 rather than showing an out-of-range page
    // against the new, narrower result set.
    useEffect(() => {

        setPage(0);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, filtersKey, sort?.field, sort?.dir, pageSize]);

    const load = useCallback(async () => {

        setLoading(true);
        setError(null);

        try {

            const response = await fetchFn({
                page,
                size: pageSize,
                search: debouncedSearch,
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
    }, [fetchFn, page, pageSize, debouncedSearch, filtersKey, sort?.field, sort?.dir]);

    useEffect(() => {

        load();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load]);

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
