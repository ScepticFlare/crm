// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import useServerList, { serializeFilters } from "../useServerList";
import api, { selectionParams } from "../../services/api";
import BulkActionBar from "../../components/list/BulkActionBar";
import FilterPanel from "../../components/list/FilterPanel";
import { lineItemErrors, toRequestItems, PRODUCT_REQUIRED_MESSAGE, BATTERY_REQUIRED_MESSAGE } from "../../utils/lineItems";
import { opportunityDetailErrors } from "../../utils/opportunityDetails";
import { exportCountNotice } from "../../utils/downloadFile";

afterEach(cleanup);

// 240 matching records, 3 of them on the loaded page.
const rows = [{ id: 1 }, { id: 2 }, { id: 3 }];
const page = { content: rows, totalPages: 80, totalElements: 240 };

function setup(response = page) {
    const fetchFn = vi.fn().mockResolvedValue(response);
    const wrapper = ({ children }) => <MemoryRouter initialEntries={["/opportunities"]}>{children}</MemoryRouter>;
    const hook = renderHook(() => useServerList({ fetchFn }), { wrapper });
    return { fetchFn, ...hook };
}

describe("selecting records across pages", () => {

    it("the header checkbox still selects only the current page", async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.data).toHaveLength(3));

        act(() => result.current.toggleSelectAll());

        expect(result.current.selectedCount).toBe(3);
        expect(result.current.pageFullySelected).toBe(true);
        expect(result.current.allMatching).toBe(false);
        expect(result.current.selection).toEqual([1, 2, 3]);
    });

    it("select all matching covers every matching record (more than 100), without loading them", async () => {
        const { result, fetchFn } = setup();
        await waitFor(() => expect(result.current.data).toHaveLength(3));
        const fetches = fetchFn.mock.calls.length;

        act(() => result.current.toggleSelectAll());
        act(() => result.current.selectAllMatching());

        expect(result.current.allMatching).toBe(true);
        expect(result.current.selectedCount).toBe(240);
        expect(result.current.selection).toEqual({ allMatching: true, excludedIds: [] });
        // nothing extra was fetched to build the selection
        expect(fetchFn.mock.calls.length).toBe(fetches);
    });

    it("lets individual records be unticked from an all-matching selection", async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.data).toHaveLength(3));

        act(() => result.current.selectAllMatching());
        act(() => result.current.toggleSelect(2));

        expect(result.current.isSelected(2)).toBe(false);
        expect(result.current.isSelected(1)).toBe(true);
        expect(result.current.selectedCount).toBe(239);
        expect(result.current.selection).toEqual({ allMatching: true, excludedIds: [2] });

        // ticking it again brings it back
        act(() => result.current.toggleSelect(2));
        expect(result.current.selectedCount).toBe(240);
    });

    it("changing the filters clears an all-matching selection, so stale records are never exported", async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.data).toHaveLength(3));

        act(() => result.current.selectAllMatching());
        act(() => result.current.toggleSelect(3));
        act(() => result.current.setFilters({ productId: ["5"] }));

        await waitFor(() => expect(result.current.filters).toEqual({ productId: ["5"] }));
        expect(result.current.allMatching).toBe(false);
        expect(result.current.excludedIds).toEqual([]);
        expect(result.current.selection).toBeNull();
    });

    it("moving to another page keeps an all-matching selection", async () => {
        const { result } = setup();
        await waitFor(() => expect(result.current.data).toHaveLength(3));

        act(() => result.current.selectAllMatching());
        act(() => result.current.setPage(1));

        await waitFor(() => expect(result.current.page).toBe(1));
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.allMatching).toBe(true);
        expect(result.current.selectedCount).toBe(240);
    });

    it("does nothing with zero results", async () => {
        const { result } = setup({ content: [], totalPages: 0, totalElements: 0 });
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => result.current.selectAllMatching());

        expect(result.current.allMatching).toBe(false);
        expect(result.current.selection).toBeNull();
    });
});

describe("export selection parameters", () => {

    it("sends picked ids, or exclusions for an all-matching selection, or nothing for all matching", () => {
        expect(selectionParams(null)).toEqual({});
        expect(selectionParams([])).toEqual({});
        expect(selectionParams([4, 9])).toEqual({ ids: "4,9" });
        expect(selectionParams({ allMatching: true, excludedIds: [] })).toEqual({});
        expect(selectionParams({ allMatching: true, excludedIds: [2, 3] })).toEqual({ excludeIds: "2,3" });
    });

    it("sends a multi-value filter as repeated keys the backend binds to a list", () => {
        const uri = api.getUri({ url: "/opportunities", params: { productId: ["1", "2"], salesStageId: ["7"] } });
        expect(uri).toContain("productId=1&productId=2");
        expect(uri).toContain("salesStageId=7");
        expect(uri).not.toContain("[]");
    });

    it("flags an export whose row count differs from the selection", () => {
        const blob = new Blob(["x"]);
        blob.rowCount = 238;
        expect(exportCountNotice(blob, 240, "opportunities")).toContain("238");
        blob.rowCount = 240;
        expect(exportCountNotice(blob, 240, "opportunities")).toBeNull();
        expect(exportCountNotice(new Blob(["x"]), 240, "opportunities")).toBeNull();
    });
});

describe("multi-value filters", () => {

    it("drops empty selections so they never reach the backend", () => {
        expect(serializeFilters({ productId: [], city: "" })).toBeNull();
        expect(JSON.parse(serializeFilters({ productId: ["1", "2"], salesStageId: [] })))
            .toEqual({ productId: ["1", "2"] });
    });

    it("FilterPanel applies several values of one filter together", async () => {
        const onChange = vi.fn();
        render(
            <FilterPanel
                filterDefs={[{
                    key: "productId", label: "Product", type: "multiselect",
                    options: [{ value: 1, label: "UPS" }, { value: 2, label: "Inverter" }, { value: 3, label: "Solar" }],
                }]}
                filters={{}}
                onChange={onChange}
                onClear={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText("Filters"));
        const input = document.getElementById("filter-productId");

        fireEvent.keyDown(input, { key: "ArrowDown" });
        fireEvent.click(await screen.findByText("UPS"));
        fireEvent.keyDown(input, { key: "ArrowDown" });
        fireEvent.click(await screen.findByText("Solar"));

        fireEvent.click(screen.getByText("Apply Filters"));

        expect(onChange).toHaveBeenCalledWith({ productId: ["1", "3"] });
    });

    it("FilterPanel counts a multi-select filter once, and an empty one not at all", () => {
        render(
            <FilterPanel
                filterDefs={[]}
                filters={{ productId: ["1", "2"], batteryId: [] }}
                onChange={vi.fn()}
                onClear={vi.fn()}
            />
        );
        expect(screen.getByText("Filters").querySelector(".badge").textContent).toBe("1");
    });
});

describe("BulkActionBar selection scope", () => {

    it("offers 'select all matching' once the whole page is ticked", () => {
        const onSelectAllMatching = vi.fn();
        render(
            <BulkActionBar
                count={3} actions={[]} onClear={vi.fn()}
                pageFullySelected pageRowCount={3} totalElements={240}
                onSelectAllMatching={onSelectAllMatching}
            />
        );

        expect(screen.getByTestId("selection-summary").textContent).toBe("3 selected on this page");
        fireEvent.click(screen.getByText("Select all 240 matching records"));
        expect(onSelectAllMatching).toHaveBeenCalled();
    });

    it("says clearly when all matching records are selected, and blocks actions that cannot handle it", () => {
        render(
            <BulkActionBar
                count={239} onClear={vi.fn()} allMatching excludedCount={1} totalElements={240}
                actions={[
                    { key: "export", label: "Export Selected", onClick: vi.fn() },
                    { key: "email", label: "Bulk Email", onClick: vi.fn(), unavailableForAllMatching: "Tick records instead." },
                ]}
            />
        );

        expect(screen.getByTestId("selection-summary").textContent)
            .toBe("All 239 matching record(s) selected (1 unticked)");
        expect(screen.getByText("Export Selected").closest("button").disabled).toBe(false);
        const email = screen.getByText("Bulk Email").closest("button");
        expect(email.disabled).toBe(true);
        expect(email.title).toBe("Tick records instead.");
    });
});

describe("Product / Battery validation", () => {

    const empty = [{ itemId: "", itemName: "", quantity: 1 }];
    const picked = [{ itemId: 4, itemName: "UPS", quantity: 2 }];

    it("a new lead needs a Product and a Battery", () => {
        expect(lineItemErrors({ products: empty, batteries: picked }, { productRequired: true, batteryRequired: true }))
            .toEqual({ products: PRODUCT_REQUIRED_MESSAGE });
        expect(lineItemErrors({ products: picked, batteries: [] }, { productRequired: true, batteryRequired: true }))
            .toEqual({ batteries: BATTERY_REQUIRED_MESSAGE });
        expect(lineItemErrors({ products: picked, batteries: picked }, { productRequired: true, batteryRequired: true }))
            .toEqual({});
    });

    it("an older lead without them can still be saved", () => {
        expect(lineItemErrors({ products: [], batteries: [] }, { productRequired: false, batteryRequired: false }))
            .toEqual({});
    });

    it("unfilled rows are not sent", () => {
        expect(toRequestItems([...empty, ...picked], "productId")).toEqual([{ productId: 4, quantity: 2 }]);
    });

    it("opportunity details: required once set, formats checked only when changed", () => {
        const original = {
            contactPerson: "Asha", contactPhone: "12345", contactEmail: "",
            products: picked, batteries: picked,
        };

        // unchanged legacy phone is accepted
        expect(opportunityDetailErrors({ ...original }, original)).toEqual({});

        expect(opportunityDetailErrors({ ...original, contactPerson: " " }, original).contactPerson)
            .toBe("Contact Person is required.");
        expect(opportunityDetailErrors({ ...original, contactPhone: "98765" }, original).contactPhone)
            .toBe("Contact Phone must contain exactly 10 digits.");
        expect(opportunityDetailErrors({ ...original, contactEmail: "not-an-email" }, original).contactEmail)
            .toBe("Please enter a valid Contact Email.");
        expect(opportunityDetailErrors({ ...original, batteries: [] }, original).batteries)
            .toBe(BATTERY_REQUIRED_MESSAGE);
        expect(opportunityDetailErrors({ ...original, contactPhone: "9876543210", contactEmail: "a@b.co" }, original))
            .toEqual({});
    });
});
