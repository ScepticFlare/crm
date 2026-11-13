// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import useServerList from "../useServerList";
import api, { requestExport } from "../../services/api";
import BulkActionBar from "../../components/list/BulkActionBar";

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

// Three pages of three records: page 1 = 1,2,3  page 2 = 4,5,6  page 3 = 7,8,9.
function pagedFetch(total = 9, size = 3) {
    return vi.fn(async ({ page }) => {
        const first = page * size + 1;
        const ids = Array.from({ length: size }, (_, i) => first + i).filter((id) => id <= total);
        return {
            content: ids.map((id) => ({ id, companyName: `Company ${id}` })),
            totalPages: Math.ceil(total / size),
            totalElements: total,
        };
    });
}

function setup({ fetchFn = pagedFetch(), url = "/leads", paramPrefix } = {}) {
    const wrapper = ({ children }) => <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>;
    const hook = renderHook(() => useServerList({ fetchFn, paramPrefix }), { wrapper });
    return { fetchFn, ...hook };
}

async function goTo(result, page) {
    act(() => result.current.setPage(page));
    await waitFor(() => expect(result.current.page).toBe(page));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(result.current.data[0]?.id).toBe(page * 3 + 1));
}

describe("record selection across pages", () => {

    it("keeps A, B (page 1), C, D (page 2) and E (page 3) selected and acts on exactly those", async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.data).toHaveLength(3));

        act(() => result.current.toggleSelect(1));
        act(() => result.current.toggleSelect(2));

        await goTo(result, 1);
        act(() => result.current.toggleSelect(4));
        act(() => result.current.toggleSelect(5));

        await goTo(result, 2);
        act(() => result.current.toggleSelect(7));

        await goTo(result, 0);
        expect(result.current.isSelected(1)).toBe(true);
        expect(result.current.isSelected(2)).toBe(true);
        expect(result.current.isSelected(3)).toBe(false);
        expect(result.current.pageSelectedCount).toBe(2);

        await goTo(result, 1);
        expect(result.current.isSelected(4)).toBe(true);
        expect(result.current.isSelected(5)).toBe(true);
        expect(result.current.isSelected(6)).toBe(false);

        expect(result.current.selectedCount).toBe(5);
        expect([...result.current.selection].sort((a, b) => a - b)).toEqual([1, 2, 4, 5, 7]);
        // the rows themselves, for actions that need more than ids
        expect(result.current.selectedRows.map((r) => r.id).sort((a, b) => a - b)).toEqual([1, 2, 4, 5, 7]);
        expect(result.current.selectedRows.find((r) => r.id === 7).companyName).toBe("Company 7");
        expect(result.current.selectionNotice).toBeNull();
    });

    it("unticking one record leaves the other pages' selections alone", async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.data).toHaveLength(3));

        act(() => result.current.toggleSelect(1));
        await goTo(result, 1);
        act(() => result.current.toggleSelect(4));
        act(() => result.current.toggleSelect(5));
        act(() => result.current.toggleSelect(4));

        expect(result.current.selection).toEqual([1, 5]);
        expect(result.current.selectedRows.map((r) => r.id)).toEqual([1, 5]);
    });

    it("the header checkbox selects / clears only the visible page, never the whole dataset", async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.data).toHaveLength(3));

        act(() => result.current.toggleSelect(1));
        await goTo(result, 1);

        act(() => result.current.toggleSelectAll());
        expect(result.current.allMatching).toBe(false);
        expect(result.current.selection).toEqual([1, 4, 5, 6]);
        expect(result.current.selectedCount).toBe(4);   // not 9

        act(() => result.current.toggleSelectAll());
        expect(result.current.selection).toEqual([1]);
    });

    it("select all matching stays a separate, explicit step", async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.data).toHaveLength(3));

        act(() => result.current.toggleSelect(1));
        await goTo(result, 1);
        act(() => result.current.toggleSelectAll());

        expect(result.current.allMatching).toBe(false);

        act(() => result.current.selectAllMatching());
        expect(result.current.allMatching).toBe(true);
        expect(result.current.selectedCount).toBe(9);
        expect(result.current.selection).toEqual({ allMatching: true, excludedIds: [] });

        act(() => result.current.clearSelection());
        expect(result.current.selection).toBeNull();
    });

    it("keeps the selection when the page size or the sort order changes", async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.data).toHaveLength(3));

        act(() => result.current.toggleSelect(2));
        await goTo(result, 1);
        act(() => result.current.toggleSelect(6));

        act(() => result.current.setPageSize(100));
        await waitFor(() => expect(result.current.pageSize).toBe(100));
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.selection).toEqual([2, 6]);

        act(() => result.current.toggleSort("company"));
        await waitFor(() => expect(result.current.sort?.field).toBe("company"));
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.selection).toEqual([2, 6]);
        expect(result.current.selectionNotice).toBeNull();
    });

    it("clears the selection, with a notice, when the search changes", async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.data).toHaveLength(3));

        act(() => result.current.toggleSelect(1));
        await goTo(result, 1);
        act(() => result.current.toggleSelect(4));

        act(() => result.current.setSearch("acme"));
        await waitFor(() => expect(result.current.selection).toBeNull(), { timeout: 2000 });

        expect(result.current.selectedCount).toBe(0);
        expect(result.current.selectedRows).toEqual([]);
        expect(result.current.selectionNotice).toMatch(/cleared because the search or filters changed/);

        act(() => result.current.dismissSelectionNotice());
        expect(result.current.selectionNotice).toBeNull();
    });

    it("clears the selection, with a notice, when the filters change", async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.data).toHaveLength(3));

        act(() => result.current.toggleSelect(3));
        act(() => result.current.setFilters({ productId: ["5"] }));

        await waitFor(() => expect(result.current.filters).toEqual({ productId: ["5"] }));
        expect(result.current.selection).toBeNull();
        expect(result.current.selectionNotice).toMatch(/cleared/);
    });

    it("a filter change with nothing selected shows no notice", async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.data).toHaveLength(3));

        act(() => result.current.setFilters({ productId: ["5"] }));
        await waitFor(() => expect(result.current.filters).toEqual({ productId: ["5"] }));
        expect(result.current.selectionNotice).toBeNull();
    });

    it("after a partly successful bulk action, only the skipped records stay selected", async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.data).toHaveLength(3));

        act(() => result.current.toggleSelect(1));
        act(() => result.current.toggleSelect(2));
        await goTo(result, 2);
        act(() => result.current.toggleSelect(8));

        // e.g. bulk delete: 1 and 8 deleted, 2 skipped (not authorized / gone)
        act(() => result.current.removeFromSelection([1, 8]));

        expect(result.current.selection).toEqual([2]);
        expect(result.current.selectedRows.map((r) => r.id)).toEqual([2]);
    });

    it("a selected record that disappears (deleted elsewhere) stays in the id set for the server to skip", async () => {
        let gone = false;
        const fetchFn = vi.fn(async ({ page }) => {
            const ids = page === 0 ? (gone ? [2, 3] : [1, 2, 3]) : [4, 5, 6];
            return { content: ids.map((id) => ({ id })), totalPages: 2, totalElements: gone ? 5 : 6 };
        });
        const { result } = setup({ fetchFn });
        await waitFor(() => expect(result.current.data).toHaveLength(3));

        act(() => result.current.toggleSelect(1));
        gone = true;
        act(() => { result.current.reload(); });
        await waitFor(() => expect(result.current.data.map((r) => r.id)).toEqual([2, 3]));

        // still submitted - the backend checks every id and reports it as skipped
        expect(result.current.selection).toEqual([1]);
        expect(result.current.pageSelectedCount).toBe(0);
    });
});

describe("two lists on one page (Dropped / Unresponsive / Invalid)", () => {

    it("page and search of one list never move the other", async () => {
        const leadsFetch = pagedFetch();
        const oppsFetch = pagedFetch();
        const wrapper = ({ children }) => <MemoryRouter initialEntries={["/dropped"]}>{children}</MemoryRouter>;

        const { result } = renderHook(() => ({
            leads: useServerList({ fetchFn: leadsFetch }),
            opps: useServerList({ fetchFn: oppsFetch, paramPrefix: "opp_" }),
        }), { wrapper });

        await waitFor(() => expect(result.current.leads.data).toHaveLength(3));
        await waitFor(() => expect(result.current.opps.data).toHaveLength(3));

        act(() => result.current.leads.toggleSelect(1));

        act(() => result.current.opps.setPage(2));
        await waitFor(() => expect(result.current.opps.page).toBe(2));
        await waitFor(() => expect(result.current.opps.data[0]?.id).toBe(7));

        expect(result.current.leads.page).toBe(0);
        expect(result.current.leads.data[0].id).toBe(1);
        expect(result.current.leads.selection).toEqual([1]);

        act(() => result.current.opps.setSearch("acme"));
        await waitFor(() => expect(oppsFetch.mock.calls.at(-1)[0].search).toBe("acme"), { timeout: 2000 });

        expect(result.current.leads.search).toBe("");
        expect(leadsFetch.mock.calls.every((c) => c[0].search === "")).toBe(true);
        // the leads selection is not cleared by the other list's search
        expect(result.current.leads.selection).toEqual([1]);
        expect(result.current.leads.selectionNotice).toBeNull();
    });
});

describe("BulkActionBar for a cross-page selection", () => {

    it("says how many selected records are on other pages", () => {
        render(<BulkActionBar count={5} pageSelectedCount={2} actions={[]} onClear={vi.fn()} />);
        expect(screen.getByTestId("selection-summary").textContent)
            .toBe("5 selected (2 on this page, 3 on other pages)");
    });

    it("blocks an action over its per-batch limit and explains why, instead of sending part of it", () => {
        const send = vi.fn();
        render(
            <BulkActionBar
                count={101} pageSelectedCount={50} onClear={vi.fn()}
                actions={[
                    { key: "bulkEmail", label: "Bulk Email", onClick: send, maxCount: 100 },
                    { key: "export", label: "Export Selected", onClick: vi.fn() },
                ]}
            />
        );

        const email = screen.getByText("Bulk Email").closest("button");
        expect(email.disabled).toBe(true);
        expect(screen.getByTestId("limit-bulkEmail").textContent).toMatch(/at most 100 records/);
        expect(screen.getByText("Export Selected").closest("button").disabled).toBe(false);
    });

    it("at the limit the action is available", () => {
        render(
            <BulkActionBar count={100} onClear={vi.fn()}
                actions={[{ key: "bulkEmail", label: "Bulk Email", onClick: vi.fn(), maxCount: 100 }]} />
        );
        expect(screen.getByText("Bulk Email").closest("button").disabled).toBe(false);
        expect(screen.queryByTestId("limit-bulkEmail")).toBeNull();
    });

    it("shows the cleared-selection notice even when nothing is selected", () => {
        const dismiss = vi.fn();
        render(<BulkActionBar count={0} actions={[]} onClear={vi.fn()}
            notice="Your selection was cleared because the search or filters changed." onDismissNotice={dismiss} />);

        expect(screen.getByTestId("selection-notice").textContent).toMatch(/selection was cleared/);
        fireEvent.click(screen.getByLabelText("Dismiss"));
        expect(dismiss).toHaveBeenCalled();
    });
});

describe("exporting a large selection", () => {

    it("sends the selected ids in a POST form body (not the URL), keeping filters in the query", async () => {
        const post = vi.spyOn(api, "post").mockResolvedValue({ data: new Blob(["x"]), headers: {} });
        const get = vi.spyOn(api, "get").mockResolvedValue({ data: new Blob(["x"]), headers: {} });

        const ids = Array.from({ length: 5000 }, (_, i) => i + 1);
        await requestExport("/leads/export", { sortBy: "company", status: "DROPPED" }, ids);

        expect(get).not.toHaveBeenCalled();
        const [url, body, config] = post.mock.calls[0];
        expect(url).toBe("/leads/export");
        expect(body).toBeInstanceOf(URLSearchParams);
        expect(body.get("ids").split(",")).toHaveLength(5000);
        expect(config.params).toEqual({ sortBy: "company", status: "DROPPED" });
        expect(config.params.ids).toBeUndefined();
        expect(config.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
        expect(config.responseType).toBe("blob");
    });

    it("sends the unticked ids of an all-matching selection the same way", async () => {
        const post = vi.spyOn(api, "post").mockResolvedValue({ data: new Blob(["x"]), headers: {} });

        await requestExport("/opportunities/export", {}, { allMatching: true, excludedIds: [4, 9] });

        expect(post.mock.calls[0][1].get("excludeIds")).toBe("4,9");
        expect(post.mock.calls[0][1].get("ids")).toBeNull();
    });

    it("an export of everything matching (no ids) stays a plain GET", async () => {
        const post = vi.spyOn(api, "post");
        const get = vi.spyOn(api, "get").mockResolvedValue({ data: new Blob(["x"]), headers: {} });

        await requestExport("/customers/export", { columns: "company" }, null);
        await requestExport("/customers/export", { columns: "company" }, { allMatching: true, excludedIds: [] });

        expect(post).not.toHaveBeenCalled();
        expect(get).toHaveBeenCalledTimes(2);
        expect(get.mock.calls[0][1]).toEqual({ params: { columns: "company" }, responseType: "blob" });
    });
});
