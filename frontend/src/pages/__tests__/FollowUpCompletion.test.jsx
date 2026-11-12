// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const followups = vi.hoisted(() => ({
    getFollowUpById: vi.fn(),
    updateFollowUp: vi.fn(),
    getFollowUpsByOpportunity: vi.fn(),
}));

vi.mock("../../services/followupService", () => followups);
vi.mock("../../services/leadService", () => ({ getAllLeads: vi.fn().mockResolvedValue({ content: [] }) }));
vi.mock("../../services/opportunityService", () => ({
    getAllOpportunities: vi.fn().mockResolvedValue({ content: [{ id: 9, title: "Genset deal" }] }),
}));
vi.mock("../../services/employeeService", () => ({ getAllEmployees: vi.fn().mockResolvedValue([]) }));
vi.mock("../../services/activityTypeService", () => ({
    getAllActivityTypes: vi.fn().mockResolvedValue([{ id: 3, name: "Call" }]),
    getAllActivityTypesAdmin: vi.fn(),
    createActivityType: vi.fn(),
    deleteActivityType: vi.fn(),
    activateActivityType: vi.fn(),
    updateActivityType: vi.fn(),
}));

import EditFollowUp from "../EditFollowUp";

const future = new Date(Date.now() + 86_400_000).toISOString().slice(0, 19);

function followUpOn(stageType) {
    return {
        id: 5, status: "PENDING", scheduledDate: future, remarks: "Send the quotation",
        employee: { id: 2 }, activityType: { id: 3, name: "Call" },
        opportunity: { id: 9, title: "Genset deal", salesStage: { name: stageType, stageType } },
    };
}

function renderPage() {
    return render(
        <MemoryRouter initialEntries={["/followups/edit/5"]}>
            <Routes>
                <Route path="/followups/edit/:id" element={<EditFollowUp />} />
            </Routes>
        </MemoryRouter>
    );
}

async function markCompleted() {
    const status = await screen.findByDisplayValue("Pending");
    fireEvent.change(status, { target: { value: "COMPLETED" } });
}

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("role", "EMPLOYEE");
    window.alert = vi.fn();
    followups.updateFollowUp.mockResolvedValue({});
});
afterEach(cleanup);

describe("completing a follow-up", () => {

    it("asks for the next follow-up when the opportunity has no other one, and sends it with the completion", async () => {
        followups.getFollowUpById.mockResolvedValue(followUpOn("IN_PROGRESS"));
        followups.getFollowUpsByOpportunity.mockResolvedValue([followUpOn("IN_PROGRESS")]);

        renderPage();
        await markCompleted();

        expect(await screen.findByText(/Schedule the next follow-up/)).toBeTruthy();

        fireEvent.change(screen.getByLabelText("Next action *"), { target: { value: "Negotiate price" } });
        fireEvent.change(screen.getByLabelText("Activity type *"), { target: { value: "3" } });
        // typed the British way - 04/05/2030 is 4 May - and sent to the API as ISO
        fireEvent.change(screen.getByLabelText(/Next follow-up date/), { target: { value: "04/05/2030" } });
        fireEvent.change(screen.getByLabelText(/Next follow-up time/), { target: { value: "10:30" } });
        fireEvent.click(screen.getByText("Update Follow Up"));

        await waitFor(() => expect(followups.updateFollowUp).toHaveBeenCalled());
        expect(followups.updateFollowUp.mock.calls[0][1]).toMatchObject({
            status: "COMPLETED",
            nextActionDescription: "Negotiate price",
            nextActionActivityTypeId: 3,
            nextFollowUpDate: "2030-05-04T10:30:00",
        });
    });

    it("asks for the next follow-up for a Postponed opportunity too", async () => {
        followups.getFollowUpById.mockResolvedValue(followUpOn("POSTPONED"));
        followups.getFollowUpsByOpportunity.mockResolvedValue([followUpOn("POSTPONED")]);

        renderPage();
        await markCompleted();

        expect(await screen.findByText(/Schedule the next follow-up/)).toBeTruthy();
        expect(screen.getByLabelText("Next action *").required).toBe(true);
    });

    it("asks for nothing when another upcoming follow-up already exists", async () => {
        followups.getFollowUpById.mockResolvedValue(followUpOn("POSTPONED"));
        followups.getFollowUpsByOpportunity.mockResolvedValue([
            followUpOn("POSTPONED"),
            { id: 6, status: "PENDING", scheduledDate: "2030-05-04T09:00:00", remarks: "Check back next quarter" },
        ]);

        renderPage();
        await markCompleted();

        expect(await screen.findByText(/already scheduled \(04\/05\/2030 09:00\)/)).toBeTruthy();
        expect(screen.queryByLabelText("Next action *")).toBeNull();
    });

    it.each(["WON", "LOST", "LEGACY_DROPPED"])("does not force another follow-up for a %s opportunity", async (stageType) => {
        followups.getFollowUpById.mockResolvedValue(followUpOn(stageType));

        renderPage();
        await markCompleted();

        fireEvent.click(screen.getByText("Update Follow Up"));
        await waitFor(() => expect(followups.updateFollowUp).toHaveBeenCalled());

        expect(screen.queryByText(/Schedule the next follow-up/)).toBeNull();
        expect(followups.updateFollowUp.mock.calls[0][1].nextFollowUpDate).toBeUndefined();
        expect(followups.getFollowUpsByOpportunity).not.toHaveBeenCalled();
    });
});
