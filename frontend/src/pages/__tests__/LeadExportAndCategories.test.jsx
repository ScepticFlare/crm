// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";

const emptyPage = { content: [], totalPages: 1, totalElements: 0 };

const leadService = vi.hoisted(() => ({
    getAllLeads: vi.fn(),
    bulkDeleteLeads: vi.fn(),
    exportLeads: vi.fn(),
    deleteLead: vi.fn(),
    getLeadDeleteImpact: vi.fn(),
    getLeadsByCategory: vi.fn(),
    getLeadCategoryCounts: vi.fn(),
}));

const download = vi.hoisted(() => ({ downloadBlob: vi.fn() }));

vi.mock("../../services/leadService", () => leadService);
vi.mock("../../services/industryService", () => ({ getAllIndustries: vi.fn().mockResolvedValue([]) }));
vi.mock("../../services/leadSourceService", () => ({ getAllLeadSources: vi.fn().mockResolvedValue([]) }));
vi.mock("../../services/productService", () => ({ getAllProducts: vi.fn().mockResolvedValue([]) }));
vi.mock("../../services/batteryService", () => ({ getAllBatteries: vi.fn().mockResolvedValue([]) }));
vi.mock("../../services/employeeService", () => ({ getAllEmployees: vi.fn().mockResolvedValue([]) }));
vi.mock("../../utils/downloadFile", async (importActual) => ({
    ...(await importActual()),
    downloadBlob: download.downloadBlob,
}));

import Leads from "../Leads";
import LeadCategories from "../LeadCategories";
import { LEAD_CATEGORY_TABS } from "../../utils/leadCategories";

function setRole(role) {
    localStorage.setItem("role", role);
}

function LocationProbe() {
    const location = useLocation();
    return <div data-testid="search">{location.search}</div>;
}

function renderAt(url, element) {
    return render(
        <MemoryRouter initialEntries={[url]}>
            <LocationProbe />
            <Routes>
                <Route path="*" element={element} />
            </Routes>
        </MemoryRouter>
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    leadService.getAllLeads.mockResolvedValue(emptyPage);
    leadService.getLeadsByCategory.mockImplementation(() => vi.fn().mockResolvedValue(emptyPage));
    leadService.getLeadCategoryCounts.mockResolvedValue({
        NEW: 4, VALID_UNCONVERTED: 3, INVALID: 2, CONVERTED: 1, TOTAL: 10,
    });
    leadService.exportLeads.mockResolvedValue(new Blob(["x"]));
    window.alert = vi.fn();
});

afterEach(() => {
    cleanup();
    localStorage.clear();
});

describe("export affordance", () => {

    it("Leads page shows Export to every role - no special role is needed", async () => {
        for (const [i, role] of ["ADMIN", "MANAGER", "EMPLOYEE"].entries()) {
            setRole(role);
            const { unmount } = renderAt("/leads", <Leads />);
            await waitFor(() => expect(leadService.getAllLeads).toHaveBeenCalledTimes(i + 1));
            expect(screen.getByText("Export all matching")).toBeTruthy();
            expect(screen.getByText(/Export selected/)).toBeTruthy();
            unmount();
        }
    });
});

describe("Leads page export", () => {

    it("an employee exports the active list as .xlsx by default (no category override)", async () => {
        setRole("EMPLOYEE");
        renderAt("/leads", <Leads />);
        await waitFor(() => expect(leadService.getAllLeads).toHaveBeenCalled());

        fireEvent.click(screen.getByText("Export all matching"));

        await waitFor(() => expect(download.downloadBlob).toHaveBeenCalled());
        expect(leadService.exportLeads.mock.calls[0][0].category).toBeUndefined();
        expect(download.downloadBlob.mock.calls[0][1]).toBe("leads.xlsx");
    });

    it("shows a clear permission message when the backend answers 403", async () => {
        setRole("EMPLOYEE");
        leadService.exportLeads.mockRejectedValue({ response: { status: 403 } });
        renderAt("/leads", <Leads />);
        await waitFor(() => expect(leadService.getAllLeads).toHaveBeenCalled());

        fireEvent.click(screen.getByText("Export all matching"));

        await waitFor(() => expect(window.alert).toHaveBeenCalledWith(
            "You do not have permission to export leads."));
        expect(download.downloadBlob).not.toHaveBeenCalled();
    });

    it("a status page passes its own category and forced filter to the export", async () => {
        setRole("ADMIN");
        const fetchLeads = vi.fn().mockResolvedValue(emptyPage);
        renderAt("/invalid", (
            <Leads fetchLeads={fetchLeads} exportCategory="ALL" exportParams={{ status: "INVALID" }} />
        ));
        await waitFor(() => expect(fetchLeads).toHaveBeenCalled());

        fireEvent.click(screen.getByText("Export all matching"));

        await waitFor(() => expect(leadService.exportLeads).toHaveBeenCalled());
        const args = leadService.exportLeads.mock.calls[0][0];
        expect(args.category).toBe("ALL");
        expect(args.filters.status).toBe("INVALID");
    });
});

describe("Lead Categories page", () => {

    it("offers exactly the four categories plus All, matching the backend names", () => {
        expect(LEAD_CATEGORY_TABS.map((t) => t.value)).toEqual(
            ["ALL", "NEW", "VALID_UNCONVERTED", "INVALID", "CONVERTED"]);
    });

    it("shows the per-category counts, which add up to the total", async () => {
        setRole("EMPLOYEE");
        renderAt("/lead-categories", <LeadCategories />);

        await waitFor(() => expect(screen.getByText("10")).toBeTruthy());
        expect(screen.getByText("4")).toBeTruthy();
        expect(screen.getByText("3")).toBeTruthy();
        expect(screen.getByText("2")).toBeTruthy();
        expect(screen.getByText("1")).toBeTruthy();
        expect(4 + 3 + 2 + 1).toBe(10);
    });

    it("selecting a category loads that category and exports it", async () => {
        setRole("EMPLOYEE");
        const invalidFetch = vi.fn().mockResolvedValue(emptyPage);
        leadService.getLeadsByCategory.mockImplementation((category) =>
            category === "INVALID" ? invalidFetch : vi.fn().mockResolvedValue(emptyPage));

        renderAt("/lead-categories", <LeadCategories />);
        await waitFor(() => expect(screen.getByText("10")).toBeTruthy());

        fireEvent.click(screen.getByText("Invalid").closest("button"));

        await waitFor(() => expect(invalidFetch).toHaveBeenCalled());
        expect(screen.getByTestId("search").textContent).toBe("?category=INVALID");

        fireEvent.click(screen.getByText("Export all matching"));

        await waitFor(() => expect(leadService.exportLeads).toHaveBeenCalled());
        expect(leadService.exportLeads.mock.calls[0][0].category).toBe("INVALID");
    });

    it("an unknown category in the URL falls back to All", async () => {
        setRole("ADMIN");
        renderAt("/lead-categories?category=BOGUS", <LeadCategories />);
        await waitFor(() => expect(leadService.getLeadsByCategory).toHaveBeenCalledWith("ALL"));
    });

    it("tells the user when the counts cannot be loaded because access is denied", async () => {
        setRole("EMPLOYEE");
        leadService.getLeadCategoryCounts.mockRejectedValue({ response: { status: 403 } });
        renderAt("/lead-categories", <LeadCategories />);
        await waitFor(() => expect(screen.getByText("You do not have permission to view lead reports.")).toBeTruthy());
    });
});

describe("normal Leads page", () => {

    async function openFilters() {
        await waitFor(() => expect(leadService.getAllLeads).toHaveBeenCalled());
        fireEvent.click(screen.getByText("Filters"));
        await screen.findByText("Lead Status");
    }

    function optionsOf(labelText) {
        const label = screen.getByText(labelText);
        const select = label.parentElement.querySelector("select");
        return Array.from(select.options).map((o) => o.textContent);
    }

    it("offers only New and Valid (not yet converted) as status filters, and no validity filter", async () => {
        setRole("ADMIN");
        renderAt("/leads", <Leads />);
        await openFilters();

        expect(optionsOf("Lead Status")).toEqual(["All", "New", "Valid (not yet converted)"]);
        // leads that still carry an older status can be isolated by it
        expect(optionsOf("Original (older) status")).toContain("WON");
        expect(screen.queryByText("Lead Validity")).toBeNull();
        expect(screen.getByText("Add Lead")).toBeTruthy();
    });

    it("an Invalid page keeps the full status filter (it lists other categories)", async () => {
        setRole("ADMIN");
        const fetchLeads = vi.fn().mockResolvedValue(emptyPage);
        renderAt("/invalid", <Leads fetchLeads={fetchLeads} />);
        await waitFor(() => expect(fetchLeads).toHaveBeenCalled());
        fireEvent.click(screen.getByText("Filters"));
        await screen.findByText("Lead Status");

        expect(optionsOf("Lead Status")).toEqual(["All", "New", "Valid", "Invalid"]);
        expect(screen.getByText("Lead Validity")).toBeTruthy();
    });
});
