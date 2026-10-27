// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const api = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn() }));

vi.mock("../../../services/api", () => ({ default: api, toListParams: (x) => x }));

import BulkEmailModal from "../BulkEmailModal";
import EmailTemplateFormModal from "../EmailTemplateFormModal";
import {
    BULK_EMAIL_CHUNK_SIZE,
    chunkIds,
    sendBulkEmail,
} from "../../../services/bulkEmailService";

const TEMPLATES = [
    { id: 1, name: "Default Keep in Touch", type: "KEEP_IN_TOUCH", isDefault: true, subject: "Hello {{contactPerson}}", body: "Dear {{contactPerson}}, from {{companyName}}" },
    { id: 7, name: "AMC Offer", type: "AMC", isDefault: true, subject: "Your AMC", body: "Dear {{contactPerson}}, [[ADMIN: fill in]]" },
];

function recipient(id, extra = {}) {
    return {
        id, companyName: `Company ${id}`, contactPerson: `Person ${id}`, email: `p${id}@x.test`,
        eligible: true, exclusionCode: null, exclusionMessage: null, warnings: [],
        renderedSubject: null, renderedBody: null, ...extra,
    };
}

const SELECTION_PREVIEW = {
    target: "LEAD", requested: 4, eligibleCount: 2, excludedCount: 2,
    recipients: [
        recipient(1),
        recipient(2),
        recipient(3, { eligible: false, email: null, exclusionCode: "NO_EMAIL", exclusionMessage: "No email address on file." }),
        recipient(4, { eligible: false, companyName: null, email: null, exclusionCode: "NOT_AVAILABLE", exclusionMessage: "This record was not found or you do not have access to it." }),
    ],
};

function mockHttp({ preview = SELECTION_PREVIEW, send } = {}) {

    api.get.mockImplementation(async (url) => {
        if (url === "/email-templates") return { data: TEMPLATES };
        throw new Error(`unexpected GET ${url}`);
    });

    api.post.mockImplementation(async (url, payload) => {

        if (url === "/bulk-email/preview") {
            // review step: render per recipient
            if (payload.subject) {
                return {
                    data: {
                        target: payload.target, requested: payload.ids.length,
                        recipients: payload.ids.map((id) => recipient(id, {
                            renderedSubject: `Subject for ${id}`, renderedBody: `Body for Person ${id}`,
                        })),
                    },
                };
            }
            return { data: preview };
        }

        if (url === "/bulk-email/send") {
            return send ? send(payload) : {
                data: {
                    batchId: payload.batchId,
                    results: payload.ids.map((id) => ({ id, companyName: `Company ${id}`, email: `p${id}@x.test`, outcome: "ACCEPTED", detail: null, alreadyProcessed: false })),
                },
            };
        }

        throw new Error(`unexpected POST ${url}`);
    });
}

async function openToReview() {

    await screen.findByText(/will receive an email/);
    fireEvent.click(screen.getByText(/^Continue/));

    await screen.findByText("Template");

    const select = await screen.findByRole("combobox");
    await waitFor(() => expect(within(select).getByText(/Keep in Touch/)).toBeTruthy());
    fireEvent.change(select, { target: { value: "1" } });

    fireEvent.click(screen.getByText("Review"));

    await screen.findByText(/individual email/);
}

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(cleanup);

describe("bulkEmailService", () => {

    it("splits a batch into chunks no larger than the server limit", () => {
        const ids = Array.from({ length: 25 }, (_, i) => i + 1);
        const chunks = chunkIds(ids);
        expect(chunks.map((c) => c.length)).toEqual([10, 10, 5]);
        expect(BULK_EMAIL_CHUNK_SIZE).toBe(10);
    });

    it("sends every chunk with the SAME batch id and reports progress", async () => {
        mockHttp();
        const progress = vi.fn();
        const ids = Array.from({ length: 25 }, (_, i) => i + 1);

        const { results, error } = await sendBulkEmail(
            { target: "LEAD", ids, subject: "S", body: "B", batchId: "batch-1234" }, progress);

        expect(error).toBeNull();
        expect(results).toHaveLength(25);
        const sends = api.post.mock.calls.filter(([url]) => url === "/bulk-email/send");
        expect(sends).toHaveLength(3);
        expect(new Set(sends.map(([, p]) => p.batchId))).toEqual(new Set(["batch-1234"]));
        expect(progress).toHaveBeenCalledTimes(3);
    });

    it("stops and reports when the server rejects a chunk, leaving the rest unattempted", async () => {
        let calls = 0;
        mockHttp({
            send: (payload) => {
                calls += 1;
                if (calls === 2) {
                    return Promise.reject({ response: { status: 403, data: { message: "Not allowed" } } });
                }
                return {
                    data: { results: payload.ids.map((id) => ({ id, outcome: "ACCEPTED" })) },
                };
            },
        });

        const ids = Array.from({ length: 25 }, (_, i) => i + 1);
        const { results, error } = await sendBulkEmail({ target: "LEAD", ids, subject: "S", body: "B", batchId: "batch-1234" });

        expect(error).toBe("Not allowed");
        expect(results.filter((r) => r.outcome === "ACCEPTED")).toHaveLength(10);
        expect(results.filter((r) => r.outcome === "NOT_ATTEMPTED")).toHaveLength(15);
    });

    it("reconciles from the batch log when a chunk gets no response, and never assumes either way", async () => {
        mockHttp({ send: () => Promise.reject(new Error("timeout")) });
        api.get.mockImplementation(async (url) => {
            if (url.startsWith("/bulk-email/batches/")) {
                return { data: { results: [{ id: 1, outcome: "ACCEPTED" }, { id: 2, outcome: "UNKNOWN" }] } };
            }
            return { data: TEMPLATES };
        });

        const { results, error } = await sendBulkEmail(
            { target: "LEAD", ids: [1, 2, 3], subject: "S", body: "B", batchId: "batch-1234" });

        expect(error).toMatch(/No response/);
        expect(results.map((r) => r.outcome)).toEqual(["ACCEPTED", "UNKNOWN", "NO_RESPONSE"]);
        // it stopped: only one send attempt was made
        expect(api.post.mock.calls.filter(([url]) => url === "/bulk-email/send")).toHaveLength(1);
    });
});

describe("BulkEmailModal", () => {

    it("lists eligible recipients and the excluded ones with reasons, and shows the final count", async () => {
        mockHttp();
        render(<BulkEmailModal show target="LEAD" ids={[1, 2, 3, 4]} onClose={vi.fn()} />);

        await screen.findByText(/will receive an email/);

        expect(screen.getByText("Company 1")).toBeTruthy();
        expect(screen.getByText("Company 2")).toBeTruthy();
        expect(screen.getByText("No email address on file.")).toBeTruthy();
        expect(screen.getByText("This record was not found or you do not have access to it.")).toBeTruthy();
        expect(screen.getByText("Not included (2)")).toBeTruthy();
        expect(screen.getByText("Continue (2)")).toBeTruthy();
        expect(screen.getByText(/not changed/)).toBeTruthy();   // removal only affects this batch
    });

    it("removing a recipient affects only this batch and updates the count; none left disables Continue", async () => {
        mockHttp();
        render(<BulkEmailModal show target="LEAD" ids={[1, 2, 3, 4]} onClose={vi.fn()} />);

        await screen.findByText(/will receive an email/);

        const removeButtons = screen.getAllByText("Remove from batch");
        fireEvent.click(removeButtons[0]);
        expect(screen.getByText("Continue (1)")).toBeTruthy();

        fireEvent.click(screen.getAllByText("Remove from batch")[0]);
        expect(screen.getByText("Continue (0)").disabled).toBe(true);

        fireEvent.click(screen.getAllByText("Add back")[0]);
        expect(screen.getByText("Continue (1)").disabled).toBe(false);

        // nothing was written back to any record
        expect(api.put).not.toHaveBeenCalled();
        expect(api.delete).not.toHaveBeenCalled();
    });

    it("a batch with no eligible recipients cannot continue", async () => {
        mockHttp({
            preview: {
                requested: 1, eligibleCount: 0, excludedCount: 1,
                recipients: [recipient(3, { eligible: false, email: null, exclusionCode: "NO_EMAIL", exclusionMessage: "No email address on file." })],
            },
        });

        render(<BulkEmailModal show target="LEAD" ids={[3]} onClose={vi.fn()} />);

        await screen.findByText(/will receive an email/);
        expect(screen.getByText("Continue (0)").disabled).toBe(true);
    });

    it("refuses an oversized selection without calling the server", async () => {
        mockHttp();
        render(<BulkEmailModal show target="LEAD" ids={Array.from({ length: 101 }, (_, i) => i + 1)} onClose={vi.fn()} />);

        expect(await screen.findByText(/At most 100 leads/)).toBeTruthy();
        expect(api.post).not.toHaveBeenCalled();
    });

    it("shows a clear permission message when the server answers 403", async () => {
        mockHttp();
        api.post.mockRejectedValue({ response: { status: 403 } });

        render(<BulkEmailModal show target="LEAD" ids={[1]} onClose={vi.fn()} />);

        expect(await screen.findByText("You don't have permission to send emails.")).toBeTruthy();
    });

    it("picking a template fills the batch's own copy; editing it never calls a template endpoint", async () => {
        mockHttp();
        render(<BulkEmailModal show target="LEAD" ids={[1, 2, 3, 4]} onClose={vi.fn()} />);

        await screen.findByText(/will receive an email/);
        fireEvent.click(screen.getByText(/^Continue/));
        await screen.findByText("Template");

        const select = await screen.findByRole("combobox");
        await waitFor(() => expect(within(select).getByText(/AMC Offer/)).toBeTruthy());
        fireEvent.change(select, { target: { value: "7" } });

        const subject = screen.getAllByRole("textbox")[0];
        const body = screen.getAllByRole("textbox")[1];
        expect(subject.value).toBe("Your AMC");
        expect(body.value).toContain("[[ADMIN: fill in]]");

        fireEvent.change(body, { target: { value: "My own wording for {{companyName}}" } });
        expect(body.value).toBe("My own wording for {{companyName}}");

        expect(api.put).not.toHaveBeenCalled();
        expect(api.post.mock.calls.every(([url]) => url.startsWith("/bulk-email/"))).toBe(true);
    });

    it("the review step previews each recipient's own personalised message", async () => {
        mockHttp();
        render(<BulkEmailModal show target="LEAD" ids={[1, 2, 3, 4]} onClose={vi.fn()} />);

        await openToReview();

        expect(screen.getByText("Send 2 emails")).toBeTruthy();
        expect(screen.getByText("Body for Person 1")).toBeTruthy();
        expect(screen.getByText(/not a guarantee/)).toBeTruthy();

        const reviewCall = api.post.mock.calls.filter(([url]) => url === "/bulk-email/preview").pop()[1];
        expect(reviewCall.ids).toEqual([1, 2]);                       // only the eligible recipients
        expect(reviewCall.subject).toBe("Hello {{contactPerson}}");   // sent raw - each recipient is rendered server-side

        // choosing another recipient shows THEIR message
        fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "2" } });
        expect(screen.getByText("Body for Person 2")).toBeTruthy();
    });

    it("sends only the kept recipients, shows per-recipient outcomes and retries only what failed", async () => {

        const outcomes = { 1: "ACCEPTED", 2: "FAILED" };
        let retrySeen = null;

        mockHttp({
            send: (payload) => {
                if (payload.ids.length === 1 && payload.ids[0] === 2 && outcomes[2] === "RETRIED") {
                    retrySeen = payload;
                }
                return {
                    data: {
                        batchId: payload.batchId,
                        results: payload.ids.map((id) => ({
                            id, companyName: `Company ${id}`, email: `p${id}@x.test`,
                            outcome: outcomes[id] === "RETRIED" ? "ACCEPTED" : outcomes[id],
                            detail: outcomes[id] === "FAILED" ? "HTTP 400: invalid" : null,
                            alreadyProcessed: false,
                        })),
                    },
                };
            },
        });

        render(<BulkEmailModal show target="LEAD" ids={[1, 2, 3, 4]} onClose={vi.fn()} />);

        await screen.findByText(/will receive an email/);
        fireEvent.click(screen.getByText(/^Continue/));
        await screen.findByText("Template");

        const select = await screen.findByRole("combobox");
        await waitFor(() => expect(within(select).getByText(/Keep in Touch/)).toBeTruthy());
        fireEvent.change(select, { target: { value: "1" } });
        fireEvent.click(screen.getByText("Review"));

        await screen.findByText(/individual email/);
        fireEvent.click(screen.getByText("Send 2 emails"));

        await screen.findByText("Accepted by provider", { selector: "span.badge.bg-success" });
        expect(screen.getByText("Failed - not sent", { selector: "span.badge.bg-danger" })).toBeTruthy();
        expect(screen.getByText("HTTP 400: invalid")).toBeTruthy();

        const firstSend = api.post.mock.calls.find(([url]) => url === "/bulk-email/send")[1];
        expect(firstSend.ids).toEqual([1, 2]);
        expect(firstSend.target).toBe("LEAD");
        expect(firstSend.templateId).toBe(1);

        // retry: only the failed recipient, same batch id
        outcomes[2] = "RETRIED";
        fireEvent.click(await screen.findByText(/Retry 1 that did not go out/));

        await waitFor(() => expect(retrySeen).not.toBeNull());
        expect(retrySeen.ids).toEqual([2]);
        expect(retrySeen.batchId).toBe(firstSend.batchId);
    });

    it("a double click on Send sends the batch once", async () => {

        let sendCalls = 0;
        let release;
        const gate = new Promise((resolve) => { release = resolve; });

        mockHttp({
            send: async (payload) => {
                sendCalls += 1;
                await gate;
                return { data: { results: payload.ids.map((id) => ({ id, outcome: "ACCEPTED" })) } };
            },
        });

        render(<BulkEmailModal show target="LEAD" ids={[1, 2]} onClose={vi.fn()} />);

        await screen.findByText(/will receive an email/);
        fireEvent.click(screen.getByText(/^Continue/));
        await screen.findByText("Template");
        const select = await screen.findByRole("combobox");
        await waitFor(() => expect(within(select).getByText(/Keep in Touch/)).toBeTruthy());
        fireEvent.change(select, { target: { value: "1" } });
        fireEvent.click(screen.getByText("Review"));
        await screen.findByText(/individual email/);

        const send = screen.getByText("Send 2 emails");
        fireEvent.click(send);
        fireEvent.click(send);

        await screen.findByText(/Sending\.\.\./);
        release();
        await screen.findByText("Close");

        expect(sendCalls).toBe(1);
    });

    it("reports unknown outcomes honestly and offers no retry for them", async () => {

        mockHttp({
            send: (payload) => ({
                data: { results: payload.ids.map((id) => ({ id, companyName: `Company ${id}`, email: `p${id}@x.test`, outcome: "UNKNOWN", detail: "read timeout" })) },
            }),
        });

        render(<BulkEmailModal show target="OPPORTUNITY" ids={[1, 2]} onClose={vi.fn()} />);

        await screen.findByText(/will receive an email/);
        expect(screen.getByText(/originating lead's address/)).toBeTruthy();
        fireEvent.click(screen.getByText(/^Continue/));
        await screen.findByText("Template");
        const select = await screen.findByRole("combobox");
        await waitFor(() => expect(within(select).getByText(/Keep in Touch/)).toBeTruthy());
        fireEvent.change(select, { target: { value: "1" } });
        fireEvent.click(screen.getByText("Review"));
        await screen.findByText(/individual email/);
        fireEvent.click(screen.getByText("Send 2 emails"));

        await screen.findAllByText("Unknown - may have been sent", { selector: "span.badge" });
        expect(screen.getByText(/never retried automatically/)).toBeTruthy();
        expect(screen.queryByText(/Retry \d+ that did not go out/)).toBeNull();
    });
});

describe("AMC template type", () => {

    it("is offered in the admin template form like any other type", () => {
        render(<EmailTemplateFormModal show editing={null} saving={false} onSave={vi.fn()} onClose={vi.fn()} />);

        const options = screen.getAllByRole("option").map((o) => o.textContent);
        expect(options).toContain("AMC (Annual Maintenance Contract)");
        expect(options).toContain("Product Brochure");
        expect(options).toContain("Keep in Touch");
    });
});
