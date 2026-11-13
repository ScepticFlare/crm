// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";

vi.mock("../../services/leadService", () => ({
    getLeadById: vi.fn().mockResolvedValue({ id: 1, companyName: "Acme", hasNextAction: true }),
}));
vi.mock("../../services/activityTypeService", () => ({
    getAllActivityTypes: vi.fn().mockResolvedValue([{ id: 3, name: "Call" }]),
    getAllActivityTypesAdmin: vi.fn().mockResolvedValue([]),
    createActivityType: vi.fn(),
    deleteActivityType: vi.fn(),
    activateActivityType: vi.fn(),
    updateActivityType: vi.fn(),
}));
const stages = vi.hoisted(() => ({
    // Even if the API ever sent a non-main stage, the form must not offer it.
    getAllSalesStages: vi.fn(),
    getAllSalesStagesAdmin: vi.fn(),
    createSalesStage: vi.fn(),
    deleteSalesStage: vi.fn(),
    activateSalesStage: vi.fn(),
    updateSalesStage: vi.fn(),
}));
vi.mock("../../services/salesStageService", () => stages);
vi.mock("../ProductBatteryFields", () => ({ default: () => null }));

const opportunityService = vi.hoisted(() => ({
    getOpportunityById: vi.fn(),
    updateOpportunity: vi.fn(),
    deleteOpportunity: vi.fn(),
    getOpportunityDeleteImpact: vi.fn(),
    acknowledgePostponedReminder: vi.fn(),
    returnToInProgress: vi.fn(),
}));
vi.mock("../../services/opportunityService", () => opportunityService);
vi.mock("../../services/followupService", () => ({
    getFollowUpsByOpportunity: vi.fn().mockResolvedValue([]),
    getFollowUpsByLead: vi.fn().mockResolvedValue([]),
    deleteFollowUp: vi.fn(),
}));
vi.mock("../detail/LeadActivityHistory", () => ({ default: () => null }));
const dashboardService = vi.hoisted(() => ({ getDashboardStats: vi.fn() }));
vi.mock("../../services/dashboardService", () => dashboardService);
vi.mock("../OpportunityAlerts", () => ({ default: () => null }));

import OpportunityForm from "../OpportunityForm";
import OpportunityDetails from "../../pages/OpportunityDetails";
import Dashboard from "../../pages/Dashboard";
import EditOpportunity from "../../pages/EditOpportunity";
import { ALL_OPPORTUNITY_COLUMNS } from "../../pages/Opportunities";

const MAIN = [
    { id: 1, name: "IN PROGRESS", stageType: "IN_PROGRESS", workflowActive: true, mainStage: true },
    { id: 2, name: "POSTPONED", stageType: "POSTPONED", workflowActive: false, mainStage: true },
    { id: 3, name: "WON", stageType: "WON", workflowActive: false, mainStage: true },
    { id: 4, name: "LOST", stageType: "LOST", workflowActive: false, mainStage: true },
    { id: 5, name: "DROPPED", stageType: "LEGACY_DROPPED", workflowActive: false, mainStage: true },
];

const baseForm = {
    title: "Deal", productValue: "1", expectedClosingDate: "", salesStage: "", leadValidity: "VALID",
    products: [], batteries: [],
};

function renderForm(props) {
    return render(
        <OpportunityForm form={baseForm} handleChange={vi.fn()} handleSubmit={vi.fn()} loading={false}
            submitText="Save" onCancel={vi.fn()} leadId={1} hasNextAction {...props} />
    );
}

const stageSelect = () => document.querySelector('select[name="salesStage"]');
const optionLabels = () => Array.from(stageSelect().options).map((o) => o.textContent.trim());

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("role", "EMPLOYEE");
    stages.getAllSalesStages.mockResolvedValue([
        ...MAIN,
        { id: 6, name: "NEW", stageType: "NEW", workflowActive: true, mainStage: false },
        { id: 7, name: "Site Survey", stageType: null, workflowActive: true, mainStage: false },
    ]);
    stages.getAllSalesStagesAdmin.mockResolvedValue([...MAIN.map((s) => ({ ...s, isActive: true }))]);
});
afterEach(() => {
    cleanup();
    localStorage.clear();
});

describe("stage dropdown - exactly the five main stages", () => {

    it("conversion offers only In Progress, Postponed, Won, Lost and Dropped - never NEW or a custom stage", async () => {
        renderForm({ isConversion: true });
        await waitFor(() => expect(optionLabels()).toContain("DROPPED"));

        expect(optionLabels()).toEqual(["Select Sales Stage", "IN PROGRESS", "POSTPONED", "WON", "LOST", "DROPPED"]);
    });

    it("an opportunity still in an older stage shows it as no longer selectable, without the sub-status hint", async () => {
        renderForm({
            form: { ...baseForm, salesStage: "UNRESPONSIVE" },
            currentStage: { id: 9, name: "UNRESPONSIVE", stageType: "LEGACY_UNRESPONSIVE", workflowActive: false, mainStage: false },
        });
        await waitFor(() => expect(optionLabels()).toContain("DROPPED"));

        expect(optionLabels()).toContain("UNRESPONSIVE (no longer selectable)");
        expect(screen.queryByText(/are now sub-statuses of IN PROGRESS/)).toBeNull();
    });

    it("an opportunity still in the old Quotation Sent stage keeps the sub-status hint", async () => {
        renderForm({
            form: { ...baseForm, salesStage: "QUOTATION SENT" },
            currentStage: { id: 10, name: "QUOTATION SENT", stageType: "LEGACY_QUOTATION_SENT", workflowActive: true, mainStage: false },
        });

        expect(await screen.findByText(/are now sub-statuses of IN PROGRESS/)).toBeTruthy();
    });

    it("an Admin can manage (rename) the stages but is not offered to add one", async () => {
        localStorage.setItem("role", "ADMIN");
        renderForm({ isConversion: true });
        await waitFor(() => expect(optionLabels()).toContain("DROPPED"));

        expect(screen.queryByText("+ Add")).toBeNull();
        const manage = within(stageSelect().parentElement).getByText("Manage");
        fireEvent.click(manage);

        await waitFor(() => expect(stages.getAllSalesStagesAdmin).toHaveBeenCalled());
        expect(screen.queryByText(/Add New Sales Stage/)).toBeNull();
        expect(stages.createSalesStage).not.toHaveBeenCalled();
    });

    it("the manage dialog never offers to reactivate a retired stage or deactivate a main one", async () => {
        localStorage.setItem("role", "ADMIN");
        stages.getAllSalesStagesAdmin.mockResolvedValue([
            ...MAIN.map((s) => ({ ...s, isActive: true })),
            { id: 9, name: "UNRESPONSIVE", stageType: "LEGACY_UNRESPONSIVE", mainStage: false, isActive: false },
            { id: 11, name: "Old Custom", stageType: null, mainStage: false, isActive: false },
            // a leftover active non-main stage may still be deactivated
            { id: 12, name: "Site Survey", stageType: null, mainStage: false, isActive: true },
        ]);
        renderForm({ isConversion: true });
        await waitFor(() => expect(optionLabels()).toContain("DROPPED"));

        fireEvent.click(within(stageSelect().parentElement).getByText("Manage"));
        await screen.findByText("Old Custom");

        expect(screen.queryAllByText("Activate")).toHaveLength(0);
        expect(screen.getAllByText("Deactivate")).toHaveLength(1);
        expect(screen.getAllByText("Rename").length).toBeGreaterThan(0);
    });
});

describe("Previously New indicator", () => {

    const stageColumn = ALL_OPPORTUNITY_COLUMNS.find((c) => c.key === "stage");
    const flagColumn = ALL_OPPORTUNITY_COLUMNS.find((c) => c.key === "previouslyNew");

    it("appears under the stage badge in the list only for opportunities moved from NEW", () => {
        const { unmount } = render(<div>{stageColumn.render({ salesStage: { name: "IN PROGRESS" }, previouslyNew: true })}</div>);
        expect(screen.getByText("Previously New")).toBeTruthy();
        unmount();

        render(<div>{stageColumn.render({ salesStage: { name: "IN PROGRESS" }, previouslyNew: false })}</div>);
        expect(screen.queryByText("Previously New")).toBeNull();
    });

    it("is an optional list / export column", () => {
        expect(flagColumn.label).toBe("Previously New");
        expect(flagColumn.render({ previouslyNew: true })).toBe("Yes");
        expect(flagColumn.render({ previouslyNew: false })).toBe("-");
    });

    it("a stage retired into a main stage shows as 'Previously <old stage>' under the badge and as an export column", () => {
        const retiredColumn = ALL_OPPORTUNITY_COLUMNS.find((c) => c.key === "retiredStageName");
        const { unmount } = render(<div>{stageColumn.render({ salesStage: { name: "DROPPED" }, retiredStageName: "UNRESPONSIVE" })}</div>);
        expect(screen.getByText("Previously UNRESPONSIVE")).toBeTruthy();
        unmount();

        render(<div>{stageColumn.render({ salesStage: { name: "DROPPED" }, retiredStageName: null })}</div>);
        expect(screen.queryByText(/^Previously /)).toBeNull();

        expect(retiredColumn.label).toBe("Previous Stage (retired)");
        expect(retiredColumn.render({ retiredStageName: "Site Survey" })).toBe("Site Survey");
        expect(retiredColumn.render({ retiredStageName: null })).toBe("-");
    });

    function LocationProbe() {
        const location = useLocation();
        return <div data-testid="location">{location.pathname + location.search}</div>;
    }

    function renderDetails(opportunity) {
        opportunityService.getOpportunityById.mockResolvedValue(opportunity);
        return render(
            <MemoryRouter initialEntries={[`/opportunities/${opportunity.id}`]}>
                <LocationProbe />
                <Routes>
                    <Route path="/opportunities/:id" element={<OpportunityDetails />} />
                    <Route path="*" element={<div>elsewhere</div>} />
                </Routes>
            </MemoryRouter>
        );
    }

    const opp = {
        id: 7, title: "UPS deal", productValue: 100,
        salesStage: { id: 1, name: "IN PROGRESS", stageType: "IN_PROGRESS", workflowActive: true },
        lead: { id: 3, companyName: "Acme", assignedEmployee: { id: 1, name: "Asha" } },
        hasNextAction: true, noNextAction: false,
    };

    it("is shown on the opportunity's detail page, and Add Follow Up still opens for this opportunity", async () => {
        renderDetails({ ...opp, previouslyNew: true });

        expect(await screen.findByTestId("previously-new")).toHaveProperty("textContent", "Previously New");

        fireEvent.click(await screen.findByText("Add Follow Up"));
        expect(screen.getByTestId("location").textContent).toBe("/followups/add?opportunityId=7");
    });

    it("the detail page shows the retired stage an opportunity was moved out of", async () => {
        renderDetails({ ...opp, salesStage: { id: 4, name: "LOST", stageType: "LOST", workflowActive: false }, retiredStageName: "INVALID" });

        expect(await screen.findByTestId("previous-retired-stage")).toHaveProperty("textContent", "Previously INVALID");
    });

    it("is not shown for an opportunity that was always In Progress", async () => {
        renderDetails({ ...opp, previouslyNew: false });

        await screen.findByText("Add Follow Up");
        expect(screen.queryByTestId("previously-new")).toBeNull();
    });
});

describe("Dashboard pipeline", () => {

    function renderDashboard(stats) {
        dashboardService.getDashboardStats.mockResolvedValue({
            leads: 0, customers: 0, opportunities: 0, followUps: 0,
            recentLeads: [], upcomingFollowUps: [], inProgressBreakdown: {}, ...stats,
        });
        return render(<MemoryRouter><Dashboard /></MemoryRouter>);
    }

    it("shows the five main stages - no NEW bucket - and counts other stages separately", async () => {
        renderDashboard({
            pipeline: { IN_PROGRESS: 4, POSTPONED: 1, WON: 2, LOST: 3, DROPPED: 5 },
            otherStages: { UNRESPONSIVE: 2, INVALID: 0, CUSTOM: 1 },
        });

        expect(await screen.findByText("DROPPED")).toBeTruthy();
        for (const label of ["IN PROGRESS", "POSTPONED", "WON", "LOST"]) {
            expect(screen.getAllByText(label).length).toBeGreaterThan(0);
        }
        expect(screen.queryByText(/^NEW$/)).toBeNull();
        expect(screen.getByTestId("other-stages-note").textContent)
            .toBe("Not in a main stage: Unresponsive: 2 · Other (older custom stages): 1");
    });

    it("shows no note when every opportunity is in a main stage", async () => {
        renderDashboard({
            pipeline: { IN_PROGRESS: 1, POSTPONED: 0, WON: 0, LOST: 0, DROPPED: 0 },
            otherStages: { UNRESPONSIVE: 0, INVALID: 0, CUSTOM: 0 },
        });

        expect(await screen.findByText("DROPPED")).toBeTruthy();
        expect(screen.queryByTestId("other-stages-note")).toBeNull();
    });
});

describe("edit page - no NEW fallback", () => {

    it("an opportunity without a stage is not defaulted to NEW: the required stage stays blank", async () => {
        opportunityService.getOpportunityById.mockResolvedValue({
            id: 8, title: "No stage", productValue: 5, salesStage: null,
            lead: { id: 3, companyName: "Acme" }, hasNextAction: true,
        });

        render(
            <MemoryRouter initialEntries={["/opportunities/edit/8"]}>
                <Routes>
                    <Route path="/opportunities/edit/:id" element={<EditOpportunity />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => expect(document.querySelector('input[name="title"]')?.value).toBe("No stage"));
        await waitFor(() => expect(optionLabels()).toContain("DROPPED"));

        expect(stageSelect().value).toBe("");
        expect(stageSelect().required).toBe(true);
        expect(optionLabels()).not.toContain("NEW");
        expect(optionLabels().some((l) => l.startsWith("NEW"))).toBe(false);
    });
});
