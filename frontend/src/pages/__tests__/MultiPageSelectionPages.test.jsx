// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// Leads page with three pages of three leads: 1-3, 4-6, 7-9.
const leadService = vi.hoisted(() => ({
    getAllLeads: vi.fn(),
    bulkDeleteLeads: vi.fn(),
    exportLeads: vi.fn(),
    deleteLead: vi.fn(),
    getLeadDeleteImpact: vi.fn(),
}));

const followupService = vi.hoisted(() => ({
    getAllFollowUps: vi.fn(),
    bulkDeleteFollowUps: vi.fn(),
    exportFollowUps: vi.fn(),
}));

vi.mock("../../services/leadService", () => leadService);
vi.mock("../../services/followupService", () => followupService);
vi.mock("../../services/industryService", () => ({ getAllIndustries: vi.fn().mockResolvedValue([]) }));
vi.mock("../../services/leadSourceService", () => ({ getAllLeadSources: vi.fn().mockResolvedValue([]) }));
vi.mock("../../services/productService", () => ({ getAllProducts: vi.fn().mockResolvedValue([]) }));
vi.mock("../../services/batteryService", () => ({ getAllBatteries: vi.fn().mockResolvedValue([]) }));
vi.mock("../../services/employeeService", () => ({ getAllEmployees: vi.fn().mockResolvedValue([]) }));
vi.mock("../../services/activityTypeService", () => ({ getAllActivityTypes: vi.fn().mockResolvedValue([]) }));
vi.mock("../../services/bulkEmailService", async (importActual) => ({
    ...(await importActual()),
    getEmailAccess: vi.fn().mockResolvedValue({ canSend: true, scope: "ALL" }),
}));
vi.mock("../../services/bulkWhatsAppService", async (importActual) => ({
    ...(await importActual()),
    getWhatsAppAccessCached: vi.fn().mockResolvedValue({ canSend: false }),
}));
// Keep in Touch: show exactly which leads the dialog was given.
vi.mock("../../components/email/BulkKeepInTouchModal", () => ({
    default: ({ show, leads }) => (show
        ? <div data-testid="keep-in-touch">{leads.map((l) => `${l.id}:${l.companyName}`).join(",")}</div>
        : null),
}));

import Leads from "../Leads";
import FollowUps from "../FollowUps";

function leadPage({ page }) {
    const ids = [1, 2, 3].map((n) => page * 3 + n);
    return Promise.resolve({
        content: ids.map((id) => ({ id, companyName: `Company ${id}`, email: `c${id}@x.test` })),
        totalPages: 3,
        totalElements: 9,
    });
}

function renderAt(url, element) {
    return render(
        <MemoryRouter initialEntries={[url]}>
            <Routes>
                <Route path="*" element={element} />
            </Routes>
        </MemoryRouter>
    );
}

async function tick(id) {
    fireEvent.click(await screen.findByLabelText(`Select row ${id}`));
}

async function showPage(firstId) {
    await screen.findByLabelText(`Select row ${firstId}`);
}

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("role", "ADMIN");
    leadService.getAllLeads.mockImplementation(leadPage);
    leadService.exportLeads.mockResolvedValue(new Blob(["x"]));
    window.alert = vi.fn();
    window.confirm = vi.fn(() => true);
});

afterEach(() => {
    cleanup();
    localStorage.clear();
});

describe("Leads page - selection across pages", () => {

    async function selectAcrossPages() {
        renderAt("/leads", <Leads />);
        await showPage(1);

        await tick(1);
        await tick(2);
        fireEvent.click(screen.getByText("Next"));
        await showPage(4);
        await tick(4);
        await tick(5);
        fireEvent.click(screen.getByText("Next"));
        await showPage(7);
        await tick(7);
    }

    it("returning to earlier pages shows the ticks made there", async () => {
        await selectAcrossPages();

        fireEvent.click(screen.getByText("Previous"));
        await showPage(4);
        expect(screen.getByLabelText("Select row 4").checked).toBe(true);
        expect(screen.getByLabelText("Select row 5").checked).toBe(true);
        expect(screen.getByLabelText("Select row 6").checked).toBe(false);

        fireEvent.click(screen.getByText("Previous"));
        await showPage(1);
        expect(screen.getByLabelText("Select row 1").checked).toBe(true);
        expect(screen.getByLabelText("Select row 2").checked).toBe(true);
        expect(screen.getByLabelText("Select row 3").checked).toBe(false);

        expect(screen.getByTestId("selection-summary").textContent)
            .toBe("5 selected (2 on this page, 3 on other pages)");
    });

    it("bulk delete sends exactly the five ticked ids and keeps the skipped ones selected", async () => {
        leadService.bulkDeleteLeads.mockResolvedValue({ succeededIds: [1, 2, 4], skippedIds: [5, 7] });

        await selectAcrossPages();

        fireEvent.click(screen.getByText("Delete"));

        await waitFor(() => expect(leadService.bulkDeleteLeads).toHaveBeenCalled());
        expect([...leadService.bulkDeleteLeads.mock.calls[0][0]].sort((a, b) => a - b)).toEqual([1, 2, 4, 5, 7]);
        expect(window.confirm.mock.calls[0][0]).toMatch(/Delete 5 selected lead/);

        await waitFor(() => expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/Skipped 2.*still selected/)));
        await waitFor(() => expect(screen.getByTestId("selection-summary").textContent).toMatch(/^2 selected/));
    });

    it("Export Selected exports the ticked records from every page", async () => {
        await selectAcrossPages();

        fireEvent.click(screen.getByText(/Export selected/));

        await waitFor(() => expect(leadService.exportLeads).toHaveBeenCalled());
        expect([...leadService.exportLeads.mock.calls[0][0].selection].sort((a, b) => a - b)).toEqual([1, 2, 4, 5, 7]);
    });

    it("Keep in Touch is given every ticked lead, not just the ones on screen", async () => {
        await selectAcrossPages();

        fireEvent.click(screen.getByText("Send Keep in Touch"));

        const shown = (await screen.findByTestId("keep-in-touch")).textContent.split(",").sort();
        expect(shown).toEqual(["1:Company 1", "2:Company 2", "4:Company 4", "5:Company 5", "7:Company 7"].sort());
    });

    it("a new search clears the selection and says so", async () => {
        await selectAcrossPages();

        fireEvent.change(screen.getByPlaceholderText(/Search by company/), { target: { value: "acme" } });

        expect(await screen.findByTestId("selection-notice", {}, { timeout: 2000 }))
            .toHaveProperty("textContent", expect.stringMatching(/selection was cleared/));
        expect(screen.queryByTestId("selection-summary")).toBeNull();
    });
});

describe("Follow Ups page", () => {

    beforeEach(() => {
        followupService.getAllFollowUps.mockResolvedValue({ content: [], totalPages: 0, totalElements: 0 });
    });

    it("no longer offers Add Follow Up, but keeps its list, search and export", async () => {
        renderAt("/followups", <FollowUps />);
        await waitFor(() => expect(followupService.getAllFollowUps).toHaveBeenCalled());

        expect(screen.getByText("Follow Ups")).toBeTruthy();
        expect(screen.queryByText("Add Follow Up")).toBeNull();
        expect(screen.queryByRole("button", { name: /add follow/i })).toBeNull();
        expect(screen.getAllByText(/Export/).length).toBeGreaterThan(0);
    });
});
