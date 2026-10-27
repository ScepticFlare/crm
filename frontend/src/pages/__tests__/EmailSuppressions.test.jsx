// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const service = vi.hoisted(() => ({
    listEmailSuppressions: vi.fn(),
    addEmailSuppression: vi.fn(),
    removeEmailSuppression: vi.fn(),
    listEmailSuppressionAudit: vi.fn(),
}));

vi.mock("../../services/emailSuppressionService", () => service);

import EmailSuppressions from "../EmailSuppressions";

const ENTRY = {
    id: 3, email: "stop@acme.test", reason: "OPT_OUT", source: "ADMIN_CONSOLE", note: "asked to stop",
    createdByName: "Admin One", createdAt: "2026-10-27T10:00:00",
};

beforeEach(() => {
    vi.clearAllMocks();
    service.listEmailSuppressions.mockResolvedValue({ items: [ENTRY], total: 1, page: 0, size: 25 });
    service.listEmailSuppressionAudit.mockResolvedValue({
        items: [{ id: 1, email: "stop@acme.test", action: "ADDED", note: "asked to stop", performedByName: "Admin One", performedAt: "2026-10-27T10:00:00" }],
        total: 1, page: 0, size: 10,
    });
});

afterEach(cleanup);

describe("Do-not-email list (admin)", () => {

    it("lists the addresses and the recent history, and says it is not a compliance guarantee", async () => {
        render(<EmailSuppressions />);

        expect((await screen.findAllByText("stop@acme.test", { selector: "td" })).length).toBe(2);
        expect(screen.getByText("Opted out", { selector: "td" })).toBeTruthy();
        expect(screen.getByText("Recent changes")).toBeTruthy();
        expect(screen.getByText(/does not by itself make a mailing lawful/)).toBeTruthy();
    });

    it("adds an address with a reason", async () => {
        service.addEmailSuppression.mockResolvedValue({ ...ENTRY, id: 4, email: "new@acme.test" });

        render(<EmailSuppressions />);
        await screen.findAllByText("stop@acme.test", { selector: "td" });

        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "New@Acme.test" } });
        fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "COMPLAINT" } });
        fireEvent.click(screen.getByText("Add to list"));

        await waitFor(() => expect(service.addEmailSuppression).toHaveBeenCalledWith(
            { email: "New@Acme.test", reason: "COMPLAINT", note: "" }));

        expect(await screen.findByText(/new@acme.test will no longer be emailed/)).toBeTruthy();
    });

    it("a removal needs a written justification before it can be confirmed", async () => {
        service.removeEmailSuppression.mockResolvedValue();

        render(<EmailSuppressions />);
        await screen.findAllByText("stop@acme.test", { selector: "td" });

        fireEvent.click(screen.getByText("Remove..."));

        const confirm = screen.getByText("Remove", { selector: "button.btn-danger" });
        expect(confirm.disabled).toBe(true);

        fireEvent.change(screen.getByLabelText("Reason for removal"), { target: { value: "ok" } });
        expect(confirm.disabled).toBe(true);

        fireEvent.change(screen.getByLabelText("Reason for removal"), { target: { value: "Customer re-subscribed, ticket 4711" } });
        expect(confirm.disabled).toBe(false);

        fireEvent.click(confirm);

        await waitFor(() => expect(service.removeEmailSuppression).toHaveBeenCalledWith(3, "Customer re-subscribed, ticket 4711"));
        expect(await screen.findByText(/removal and your explanation are in the history/)).toBeTruthy();
    });

    it("shows a clear message when the server refuses (not an admin)", async () => {
        service.listEmailSuppressions.mockRejectedValue({ response: { status: 403 } });

        render(<EmailSuppressions />);

        expect(await screen.findByText("Only an administrator can manage the do-not-email list.")).toBeTruthy();
    });
});
