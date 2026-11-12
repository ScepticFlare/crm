// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const followups = vi.hoisted(() => ({
    getFollowUpById: vi.fn(),
    deleteFollowUp: vi.fn(),
    getAllFollowUps: vi.fn(),
    bulkDeleteFollowUps: vi.fn(),
    exportFollowUps: vi.fn(),
    createFollowUp: vi.fn(),
    getFollowUpTargets: vi.fn(),
}));
vi.mock("../../services/followupService", () => followups);
vi.mock("../../services/employeeService", () => ({ getAllEmployees: vi.fn().mockResolvedValue([]) }));
vi.mock("../../services/leadService", () => ({ getLeadById: vi.fn() }));
vi.mock("../../services/opportunityService", () => ({
    getOpportunityById: vi.fn().mockResolvedValue({
        id: 41, title: "6kva online ups", salesStage: { name: "IN PROGRESS" },
        lead: { id: 8, companyName: "Harbour Logistics", contactPerson: "Ops head", assignedEmployee: { id: 2, name: "ravi" } },
    }),
}));
vi.mock("../../services/activityTypeService", () => ({
    getAllActivityTypes: vi.fn().mockResolvedValue([{ id: 3, name: "Call" }]),
    getAllActivityTypesAdmin: vi.fn(), createActivityType: vi.fn(), deleteActivityType: vi.fn(),
    activateActivityType: vi.fn(), updateActivityType: vi.fn(),
}));

import FollowUpDetails from "../FollowUpDetails";
import FollowUps from "../FollowUps";
import AddFollowUp from "../AddFollowUp";

// What the backend sends: an opportunity follow-up has lead: null and its
// company in `related` (from the opportunity's lead).
const opportunityFollowUp = {
    id: 11, status: "PENDING", scheduledDate: "2026-10-24T14:48:00", remarks: "Call about the quote",
    employee: { id: 3, name: "lakshmi narayana" }, activityType: { id: 3, name: "Call" },
    lead: null,
    opportunity: { id: 40, title: "6kva online ups" },
    related: {
        kind: "OPPORTUNITY", leadId: 7, companyName: "Metro Diagnostics", contactPerson: "Ms Iyer",
        leadViaOpportunity: true, opportunityId: 40, opportunityTitle: "6kva online ups",
        opportunityStage: "IN PROGRESS", ownerId: 3, ownerName: "lakshmi narayana",
        label: "Metro Diagnostics - 6kva online ups",
    },
};
const legacyFollowUp = {
    ...opportunityFollowUp, id: 12, opportunity: { id: 43, title: "Legacy 5kva" },
    related: {
        kind: "OPPORTUNITY", leadId: null, companyName: null, contactPerson: null, leadViaOpportunity: false,
        opportunityId: 43, opportunityTitle: "Legacy 5kva", opportunityStage: null, ownerId: null, ownerName: null,
        label: "Opportunity: Legacy 5kva",
    },
};
const sameNameOther = {
    ...opportunityFollowUp, id: 13, opportunity: { id: 41, title: "6kva online ups" },
    related: { ...opportunityFollowUp.related, leadId: 8, companyName: "Harbour Logistics", opportunityId: 41,
        label: "Harbour Logistics - 6kva online ups" },
};

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("role", "EMPLOYEE");
    localStorage.setItem("employeeId", "3");
    window.alert = vi.fn();
});

afterEach(() => {
    cleanup();
    localStorage.clear();
});

function renderAt(path, element, route) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes><Route path={route} element={element} /></Routes>
        </MemoryRouter>
    );
}

describe("follow-up details", () => {

    it("shows the company and lead of an opportunity follow-up instead of a dash", async () => {
        followups.getFollowUpById.mockResolvedValue(opportunityFollowUp);
        renderAt("/followups/11", <FollowUpDetails />, "/followups/:id");

        const company = await screen.findByTestId("related-company");
        expect(within(company).getByRole("link", { name: "Metro Diagnostics" }).getAttribute("href")).toBe("/leads/7");
        expect(company.textContent).toContain("Ms Iyer");
        expect(company.textContent).toContain("Opportunity follow-up");

        const opportunity = screen.getByTestId("related-opportunity");
        expect(within(opportunity).getByRole("link", { name: "6kva online ups" }).getAttribute("href")).toBe("/opportunities/40");
        expect(opportunity.textContent).toContain("#40");
        expect(opportunity.textContent).toContain("IN PROGRESS");
        expect(screen.getByText("Metro Diagnostics - 6kva online ups")).toBeTruthy();       // header subtitle
    });

    it("says so when a historical follow-up genuinely has no lead, and still shows its opportunity", async () => {
        followups.getFollowUpById.mockResolvedValue(legacyFollowUp);
        renderAt("/followups/12", <FollowUpDetails />, "/followups/:id");

        const company = await screen.findByTestId("related-company");
        expect(company.textContent).toContain("No linked lead");
        expect(within(company).queryByRole("link")).toBeNull();                 // nothing invented
        expect(screen.getByTestId("related-opportunity").textContent).toContain("Legacy 5kva");
    });
});

describe("follow-up list", () => {

    it("identifies every row, including two opportunities with the same name", async () => {
        followups.getAllFollowUps.mockResolvedValue({
            content: [opportunityFollowUp, sameNameOther, legacyFollowUp], totalElements: 3, totalPages: 1, number: 0, size: 50,
        });
        renderAt("/followups", <FollowUps />, "/followups");

        const metro = await screen.findByRole("link", { name: "Metro Diagnostics" });
        expect(metro.getAttribute("href")).toBe("/leads/7");
        expect(screen.getByRole("link", { name: "Harbour Logistics" }).getAttribute("href")).toBe("/leads/8");

        const sameName = screen.getAllByRole("link", { name: "6kva online ups" }).map((l) => l.getAttribute("href"));
        expect(sameName).toEqual(expect.arrayContaining(["/opportunities/40", "/opportunities/41"]));
        expect(screen.getByText("No linked lead")).toBeTruthy();
        expect(screen.getByText("Legacy 5kva")).toBeTruthy();
    });
});

describe("scheduling a follow-up", () => {

    const options = [
        { type: "OPPORTUNITY", opportunityId: 40, leadId: 7, companyName: "Green Valley School", opportunityTitle: "6kva online ups", stage: "IN PROGRESS", contactPerson: "Principal", assignedEmployeeId: 3, assignedEmployeeName: "lakshmi" },
        { type: "OPPORTUNITY", opportunityId: 41, leadId: 8, companyName: "Harbour Logistics", opportunityTitle: "6kva online ups", stage: "NEW", contactPerson: "Ops head", assignedEmployeeId: 3, assignedEmployeeName: "lakshmi" },
        { type: "LEAD", leadId: 9, opportunityId: null, companyName: "Sunrise Hospital", contactPerson: "Dr Rao", assignedEmployeeId: 3, assignedEmployeeName: "lakshmi" },
    ];

    it("offers same-named opportunities with their companies and links the one picked", async () => {
        followups.getFollowUpTargets.mockResolvedValue(options);
        followups.createFollowUp.mockResolvedValue({ id: 99 });
        renderAt("/followups/add", <AddFollowUp />, "/followups/add");

        const picker = await screen.findByLabelText("Related record");
        fireEvent.keyDown(picker, { key: "ArrowDown" });
        expect(await screen.findByText("Green Valley School - 6kva online ups")).toBeTruthy();
        expect(screen.getByText("Opportunity #41 · NEW · Contact: Ops head · Owner: lakshmi")).toBeTruthy();
        expect(screen.getByText("Leads (not yet converted)")).toBeTruthy();

        fireEvent.click(screen.getByText("Harbour Logistics - 6kva online ups"));

        fireEvent.change(await screen.findByLabelText("Scheduled date"), { target: { value: "04/05/2030" } });
        fireEvent.change(screen.getByLabelText(/Scheduled time/), { target: { value: "10:30" } });
        fireEvent.change(document.querySelector('textarea[name="remarks"]'), { target: { value: "Send the quote" } });
        fireEvent.submit(document.querySelector("form"));

        await waitFor(() => expect(followups.createFollowUp).toHaveBeenCalled());
        expect(followups.createFollowUp.mock.calls[0][0]).toMatchObject({ opportunityId: 41, leadId: null });
    });

    it("will not submit without a related record", async () => {
        followups.getFollowUpTargets.mockResolvedValue(options);
        renderAt("/followups/add", <AddFollowUp />, "/followups/add");

        await screen.findByLabelText("Related record");
        fireEvent.submit(document.querySelector("form"));

        expect(await screen.findByRole("alert")).toBeTruthy();
        expect(screen.getByRole("alert").textContent).toContain("Choose the lead or opportunity");
        expect(followups.createFollowUp).not.toHaveBeenCalled();
    });

    it("from an opportunity's page, shows that record and keeps it", async () => {
        followups.createFollowUp.mockResolvedValue({ id: 100 });
        renderAt("/followups/add?opportunityId=41", <AddFollowUp />, "/followups/add");

        const locked = await screen.findByTestId("locked-target");
        await waitFor(() => expect(locked.textContent).toContain("Harbour Logistics - 6kva online ups"));
        expect(screen.queryByLabelText("Related record")).toBeNull();

        fireEvent.submit(document.querySelector("form"));
        await waitFor(() => expect(followups.createFollowUp).toHaveBeenCalled());
        expect(followups.createFollowUp.mock.calls[0][0]).toMatchObject({ opportunityId: 41, leadId: null });
    });
});
