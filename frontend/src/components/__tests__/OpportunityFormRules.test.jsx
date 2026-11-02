// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

vi.mock("../../services/leadService", () => ({
    getLeadById: vi.fn().mockResolvedValue({ id: 1, companyName: "Acme", hasNextAction: false }),
}));
const activityTypes = vi.hoisted(() => ({
    // the ACTIVE list - all an employee can pick from
    getAllActivityTypes: vi.fn(),
    getAllActivityTypesAdmin: vi.fn(),
    createActivityType: vi.fn(),
    deleteActivityType: vi.fn(),
    activateActivityType: vi.fn(),
    updateActivityType: vi.fn(),
}));
vi.mock("../../services/activityTypeService", () => activityTypes);
vi.mock("../../services/salesStageService", () => ({
    getAllSalesStages: vi.fn().mockResolvedValue([
        { id: 1, name: "IN PROGRESS", stageType: "IN_PROGRESS", workflowActive: true },
        { id: 2, name: "POSTPONED", stageType: "POSTPONED", workflowActive: false },
        { id: 3, name: "LOST", stageType: "LOST", workflowActive: false },
        { id: 4, name: "WON", stageType: "WON", workflowActive: false },
        { id: 5, name: "DROPPED", stageType: "LEGACY_DROPPED", workflowActive: false },
    ]),
    getAllSalesStagesAdmin: vi.fn(),
    createSalesStage: vi.fn(),
    deleteSalesStage: vi.fn(),
    activateSalesStage: vi.fn(),
    updateSalesStage: vi.fn(),
}));
// The edit form's product / battery pickers are not under test here.
vi.mock("../ProductBatteryFields", () => ({ default: () => null }));

import OpportunityForm from "../OpportunityForm";

const baseForm = {
    title: "Deal", productValue: "", expectedClosingDate: "", salesStage: "POSTPONED", leadValidity: "VALID",
    products: [], batteries: [],
};

function renderForm(props) {
    return render(
        <OpportunityForm form={baseForm} handleChange={vi.fn()} handleSubmit={vi.fn()} loading={false}
            submitText="Save" onCancel={vi.fn()} leadId={1} {...props} />
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("role", "EMPLOYEE");
    activityTypes.getAllActivityTypes.mockResolvedValue([{ id: 3, name: "Call" }, { id: 4, name: "Site visit" }]);
    activityTypes.getAllActivityTypesAdmin.mockResolvedValue([
        { id: 3, name: "Call", isActive: true },
        { id: 4, name: "Site visit", isActive: true },
        { id: 5, name: "Telex", isActive: false },
    ]);
});
afterEach(cleanup);

describe("opportunity form - mandatory value and next follow-up", () => {

    it("requires the opportunity value", async () => {
        renderForm({ hasNextAction: true });

        const value = document.querySelector('input[name="productValue"]');
        expect(value.required).toBe(true);
        expect(value.min).toBe("0");
    });

    it.each(["IN PROGRESS", "POSTPONED"])("asks for a next follow-up for an %s opportunity that has none", async (stage) => {
        renderForm({ hasNextAction: false, form: { ...baseForm, salesStage: stage } });

        expect(await screen.findByText(/next follow-up date is required for every active or Postponed opportunity/)).toBeTruthy();
        expect(document.querySelector('input[name="nextFollowUpDate"]').required).toBe(true);
    });

    it.each(["WON", "LOST", "DROPPED"])("does not ask for a next follow-up when the opportunity is %s", async (stage) => {
        renderForm({ hasNextAction: false, form: { ...baseForm, salesStage: stage } });

        await screen.findByRole("option", { name: stage });   // stages loaded, so the stage type is known
        expect(screen.queryByText(/next follow-up date is required/)).toBeNull();
        expect(document.querySelector('input[name="nextFollowUpDate"]')).toBeNull();
    });

    it("reuses an existing follow-up: shows its date and asks for nothing new", async () => {
        renderForm({ hasNextAction: true, nextFollowUpDate: "2026-05-04T10:30:00" });

        expect(await screen.findByText(/Next follow-up: 04\/05\/2026 10:30/)).toBeTruthy();
        expect(document.querySelector('input[name="nextFollowUpDate"]')).toBeNull();
    });

    it("asks during conversion to an active or Postponed stage when the lead has no follow-up to carry over", async () => {
        renderForm({ isConversion: true, form: { ...baseForm, salesStage: "POSTPONED" } });

        expect(await screen.findByText(/next follow-up date is required for every active or Postponed opportunity/)).toBeTruthy();
    });

    it("does not ask during conversion straight to Lost", async () => {
        renderForm({ isConversion: true, form: { ...baseForm, salesStage: "LOST" } });

        await screen.findByRole("option", { name: "LOST" });
        expect(screen.queryByText(/next follow-up date is required/)).toBeNull();
    });
});

describe("convert to opportunity - admin-managed activity type", () => {

    const activitySelect = () => document.querySelector('select[name="nextActionActivityTypeId"]');

    async function loaded() {
        await waitFor(() => expect(within(activitySelect()).queryByText("Site visit")).toBeTruthy());
    }

    it("offers employees only the active types configured by admins, with no way to manage them", async () => {
        renderForm({ isConversion: true });
        await loaded();

        const names = Array.from(activitySelect().options).map((o) => o.textContent);
        expect(names).toEqual(["Select", "Call", "Site visit"]);
        expect(activitySelect().required).toBe(true);
        expect(within(activitySelect().parentElement).queryByText("+ Add")).toBeNull();
        expect(activityTypes.getAllActivityTypesAdmin).not.toHaveBeenCalled();
    });

    it("lets an admin add a type from the form; it is then selected", async () => {
        localStorage.setItem("role", "ADMIN");
        const handleChange = vi.fn();
        activityTypes.createActivityType.mockResolvedValue({ id: 9, name: "Video call", isActive: true });

        renderForm({ isConversion: true, handleChange });
        await loaded();

        fireEvent.click(within(activitySelect().parentElement).getByText("+ Add"));
        expect(await screen.findByText("Manage Activity Type")).toBeTruthy();
        await waitFor(() => expect(activityTypes.getAllActivityTypesAdmin).toHaveBeenCalled());

        activityTypes.getAllActivityTypes.mockResolvedValue([
            { id: 3, name: "Call" }, { id: 4, name: "Site visit" }, { id: 9, name: "Video call" },
        ]);
        fireEvent.change(screen.getByPlaceholderText(/Activity Type/i), { target: { value: "Video call" } });
        fireEvent.click(screen.getByRole("button", { name: /^Add$/ }));

        await waitFor(() => expect(activityTypes.createActivityType).toHaveBeenCalledWith({ name: "Video call" }));
        await waitFor(() => expect(handleChange).toHaveBeenCalledWith(
            { target: { name: "nextActionActivityTypeId", value: 9 } }));
        await waitFor(() => expect(within(activitySelect()).queryByText("Video call")).toBeTruthy());
    });

    it("lets an admin see inactive types in the manage dialog, without offering them for selection", async () => {
        localStorage.setItem("role", "ADMIN");
        renderForm({ isConversion: true });
        await loaded();

        fireEvent.click(within(activitySelect().parentElement).getByText("+ Add"));
        expect(await screen.findByText("Telex")).toBeTruthy();
        expect(within(activitySelect()).queryByText("Telex")).toBeNull();
    });
});
