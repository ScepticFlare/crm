// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const api = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn() }));

vi.mock("../../../services/api", () => ({ default: api, toListParams: (x) => x }));

import BulkEmailModal from "../BulkEmailModal";
import BulkEmailResumeBanner from "../BulkEmailResumeBanner";
import EmailTemplateFormModal from "../EmailTemplateFormModal";
import {
    BULK_EMAIL_CHUNK_SIZE,
    chunkIds,
    describeFailure,
    sendBulkEmail,
} from "../../../services/bulkEmailService";
import {
    clearBulkEmailRecovery,
    loadBulkEmailRecovery,
    saveBulkEmailRecovery,
} from "../../../services/bulkEmailRecovery";

const TEMPLATES = [
    { id: 1, name: "Default Keep in Touch", type: "KEEP_IN_TOUCH", isDefault: true, subject: "Hello {{contactPerson}}", body: "Dear {{contactPerson}}, from {{companyName}}" },
    { id: 7, name: "AMC Offer", type: "AMC", isDefault: true, subject: "Your AMC", body: "Dear {{contactPerson}}, [[ADMIN: fill in]]" },
];

const NO_DELAY = { delayMs: 0 };

function recipient(id, extra = {}) {
    return {
        id, companyName: `Company ${id}`, contactPerson: `Person ${id}`, email: `p${id}@x.test`,
        eligible: true, exclusionCode: null, exclusionMessage: null, warnings: [],
        renderedSubject: null, renderedBody: null, ...extra,
    };
}

function excludedRecipient(id, code, message) {
    return recipient(id, { eligible: false, email: null, exclusionCode: code, exclusionMessage: message });
}

/**
 * A stateful stand-in for the backend with the documented semantics: the server
 * issues batch ids and pins their recipients and message, a chunk can only be a
 * subset of those recipients, recorded outcomes are replayed (never resent), only
 * a confirmed FAILED can be attempted again, and GET /batches/{id} is the whole
 * batch. `outcomeFor(id, attempt)` decides what the fake provider answers.
 */
function makeServer({ step1Excluded = {}, outcomeFor = () => "ACCEPTED", templates = TEMPLATES } = {}) {

    const batches = new Map();
    const calls = { create: [], send: [], preview: [] };
    let seq = 0;

    const view = (b) => b.ids.map((id) => {
        const row = b.log.get(id);
        return row
            ? { id, companyName: `Company ${id}`, email: `p${id}@x.test`, outcome: row.outcome, detail: row.detail || null, alreadyProcessed: false }
            : { id, companyName: `Company ${id}`, email: `p${id}@x.test`, outcome: "NOT_ATTEMPTED", detail: "Not sent yet.", alreadyProcessed: false };
    });

    api.get.mockImplementation(async (url) => {

        if (url === "/email-templates") {
            return { data: templates };
        }

        if (url.startsWith("/bulk-email/batches/")) {

            const b = batches.get(url.split("/").pop());

            if (!b) {
                return Promise.reject({ response: { status: 404, data: { message: "Bulk email batch not found" } } });
            }

            return { data: { batchId: b.batchId, results: view(b), batch: { batchId: b.batchId, createdAt: "2026-10-27T10:00:00", recipientIds: b.ids, subject: b.subject, body: b.body } } };
        }

        throw new Error(`unexpected GET ${url}`);
    });

    api.post.mockImplementation(async (url, payload) => {

        if (url === "/bulk-email/preview") {

            calls.preview.push(payload);

            return {
                data: {
                    target: payload.target, requested: payload.ids.length,
                    recipients: payload.ids.map((id) => {
                        if (step1Excluded[id] && !payload.subject) {
                            return excludedRecipient(id, step1Excluded[id].code, step1Excluded[id].message);
                        }
                        return recipient(id, payload.subject
                            ? { renderedSubject: `Subject for ${id}`, renderedBody: `Body for Person ${id}` }
                            : {});
                    }),
                },
            };
        }

        if (url === "/bulk-email/batches") {

            calls.create.push(payload);

            const batchId = `00000000-0000-0000-0000-${String(++seq).padStart(12, "0")}`;
            batches.set(batchId, { batchId, ids: payload.ids, subject: payload.subject, body: payload.body, log: new Map(), attempts: {} });

            return { data: { batchId, requested: payload.ids.length, chunkSize: 10, maxRecipients: 100 } };
        }

        if (url === "/bulk-email/send") {

            calls.send.push(payload);

            const b = batches.get(payload.batchId);

            if (!b) {
                return Promise.reject({ response: { status: 404, data: { message: "Bulk email batch not found" } } });
            }

            if (!payload.ids.every((id) => b.ids.includes(id))) {
                return Promise.reject({ response: { status: 400, data: { message: "The request contains records that are not part of this batch." } } });
            }

            const results = payload.ids.map((id) => {

                const prior = b.log.get(id);

                if (prior && prior.outcome !== "FAILED") {
                    return { id, companyName: `Company ${id}`, email: `p${id}@x.test`, outcome: prior.outcome, detail: prior.detail || null, alreadyProcessed: true };
                }

                b.attempts[id] = (b.attempts[id] || 0) + 1;

                const outcome = outcomeFor(id, b.attempts[id]);
                const detail = outcome === "FAILED" ? "HTTP 400: invalid" : null;

                b.log.set(id, { outcome, detail });

                return { id, companyName: `Company ${id}`, email: `p${id}@x.test`, outcome, detail, alreadyProcessed: false };
            });

            return { data: { batchId: b.batchId, results } };
        }

        throw new Error(`unexpected POST ${url}`);
    });

    return { batches, calls };
}

async function chooseTemplateAndReview() {

    fireEvent.click(await screen.findByText(/^Continue/));
    await screen.findByText("Template");

    const select = await screen.findByRole("combobox");
    await waitFor(() => expect(within(select).getByText(/Keep in Touch/)).toBeTruthy());
    fireEvent.change(select, { target: { value: "1" } });

    fireEvent.click(screen.getByText("Review"));

    await screen.findByText(/individual email/);
}

async function openToReview() {
    await screen.findByText(/will receive an email/);
    await chooseTemplateAndReview();
}

function badgeCount(label) {
    const el = screen.queryAllByText(new RegExp(`^\\d+ ${label}`, "i"), { selector: "span.badge" })[0];
    return el ? Number(el.textContent.match(/^\d+/)[0]) : 0;
}

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("employeeId", "42");
});

afterEach(cleanup);

// ------------------------------------------------------------------ service

describe("bulkEmailService", () => {

    it("splits a batch into chunks no larger than the server limit", () => {
        const ids = Array.from({ length: 25 }, (_, i) => i + 1);
        expect(chunkIds(ids).map((c) => c.length)).toEqual([10, 10, 5]);
        expect(BULK_EMAIL_CHUNK_SIZE).toBe(10);
    });

    it("sends every chunk against the SAME server batch, carrying only the batch id and the chunk", async () => {
        const server = makeServer();
        const progress = vi.fn();
        const ids = Array.from({ length: 25 }, (_, i) => i + 1);

        const { results, error, paused } = await sendBulkEmail({ batchId: "00000000-0000-0000-0000-000000000001", ids }, progress, NO_DELAY);

        // (no batch exists in this server for that id, so create one first)
        expect(results).toHaveLength(25);
        expect(error).not.toBeNull();       // 404: the id above was never created
        expect(paused).toBe(true);

        // now the proper way
        server.calls.send.length = 0;
        const created = (await api.post("/bulk-email/batches", { target: "LEAD", ids, subject: "S", body: "B" })).data;

        const ok = await sendBulkEmail({ batchId: created.batchId, ids }, progress, NO_DELAY);

        expect(ok.error).toBeNull();
        expect(ok.results.every((r) => r.outcome === "ACCEPTED")).toBe(true);
        expect(server.calls.send).toHaveLength(3);
        expect(new Set(server.calls.send.map((p) => p.batchId))).toEqual(new Set([created.batchId]));
        // a chunk can neither carry a message nor widen the recipients
        expect(server.calls.send.every((p) => Object.keys(p).sort().join() === "batchId,ids")).toBe(true);
    });

    it("a server refusal keeps earlier chunks, confirms the rest with the server and pauses", async () => {

        const server = makeServer();
        const ids = Array.from({ length: 25 }, (_, i) => i + 1);
        const { batchId } = (await api.post("/bulk-email/batches", { target: "LEAD", ids, subject: "S", body: "B" })).data;

        const real = api.post.getMockImplementation();
        let sends = 0;

        api.post.mockImplementation(async (url, payload) => {
            if (url === "/bulk-email/send" && ++sends === 2) {
                throw { response: { status: 403, data: { message: "Not allowed" } } };
            }
            return real(url, payload);
        });

        const { results, error, paused } = await sendBulkEmail({ batchId, ids }, undefined, NO_DELAY);

        expect(paused).toBe(true);
        expect(error).toContain("Not allowed");
        expect(results.filter((r) => r.outcome === "ACCEPTED")).toHaveLength(10);            // chunk 1 preserved
        expect(results.filter((r) => r.outcome === "NOT_ATTEMPTED")).toHaveLength(15);       // chunk 2 + the unsent chunk 3
        expect(server.calls.send).toHaveLength(1);                                           // chunk 3 was never requested
    });

    it("a 504 after the server DID process the chunk is reconciled, not shown as 'not attempted'", async () => {

        makeServer();
        const ids = Array.from({ length: 30 }, (_, i) => i + 1);
        const { batchId } = (await api.post("/bulk-email/batches", { target: "LEAD", ids, subject: "S", body: "B" })).data;

        const real = api.post.getMockImplementation();
        let sends = 0;
        let requested = 0;

        api.post.mockImplementation(async (url, payload) => {
            if (url === "/bulk-email/send") {
                requested += 1;
                if (++sends === 2) {
                    await real(url, payload);                                           // the server accepted chunk 2 ...
                    throw { response: { status: 504, data: "<html>Gateway Timeout</html>" } };   // ... but the proxy timed out
                }
            }
            return real(url, payload);
        });

        const { results, error, paused } = await sendBulkEmail({ batchId, ids }, undefined, NO_DELAY);

        expect(paused).toBe(true);
        expect(requested).toBe(2);                                                       // chunk 3 was NOT sent blindly
        expect(results.slice(0, 20).every((r) => r.outcome === "ACCEPTED")).toBe(true);
        expect(results.slice(10, 20).every((r) => r.confirmed)).toBe(true);              // chunk 2: the server's own record
        expect(results.slice(20).every((r) => r.outcome === "NOT_ATTEMPTED")).toBe(true);
        expect(error).toMatch(/did not confirm this step \(HTTP 504\)/);
        expect(error).not.toMatch(/rejected/);
        expect(error).toMatch(/checked with the server/);
    });

    it("a 502 where the server never processed the chunk is confirmed NOT_ATTEMPTED and can be resumed", async () => {

        const server = makeServer();
        const ids = [1, 2, 3];
        const { batchId } = (await api.post("/bulk-email/batches", { target: "LEAD", ids, subject: "S", body: "B" })).data;

        const real = api.post.getMockImplementation();
        api.post.mockImplementationOnce(async () => { throw { response: { status: 502, data: "Bad gateway" } }; });

        const first = await sendBulkEmail({ batchId, ids }, undefined, NO_DELAY);

        expect(first.results.map((r) => r.outcome)).toEqual(["NOT_ATTEMPTED", "NOT_ATTEMPTED", "NOT_ATTEMPTED"]);
        expect(first.results.every((r) => r.confirmed)).toBe(true);

        api.post.mockImplementation(real);

        const resumed = await sendBulkEmail({ batchId, ids }, undefined, NO_DELAY);
        expect(resumed.results.every((r) => r.outcome === "ACCEPTED")).toBe(true);
        expect(server.calls.send).toHaveLength(1);
    });

    it("when the server cannot be asked either, nothing is assumed: the chunk is UNVERIFIED and sending stops", async () => {

        makeServer();
        const ids = Array.from({ length: 25 }, (_, i) => i + 1);
        const { batchId } = (await api.post("/bulk-email/batches", { target: "LEAD", ids, subject: "S", body: "B" })).data;

        api.post.mockImplementation(async () => { throw new Error("network down"); });
        api.get.mockImplementation(async () => { throw new Error("network down"); });

        const { results, error } = await sendBulkEmail({ batchId, ids }, undefined, NO_DELAY);

        expect(results.slice(0, 10).every((r) => r.outcome === "UNVERIFIED")).toBe(true);
        expect(results.slice(10).every((r) => r.outcome === "NOT_ATTEMPTED")).toBe(true);
        expect(error).toMatch(/connection to the server was lost/);
        expect(error).toMatch(/Check status/);
        expect(api.post.mock.calls.filter(([url]) => url === "/bulk-email/send")).toHaveLength(1);
    });

    it("waits (bounded) for records still in progress on the server before reporting them", async () => {

        makeServer();
        const ids = [1, 2];
        const { batchId } = (await api.post("/bulk-email/batches", { target: "LEAD", ids, subject: "S", body: "B" })).data;

        const real = api.get.getMockImplementation();
        let polls = 0;

        api.post.mockImplementationOnce(async () => { throw { response: { status: 504, data: "timeout" } }; });
        api.get.mockImplementation(async (url) => {
            if (url.startsWith("/bulk-email/batches/")) {
                polls += 1;
                return { data: { results: [
                    { id: 1, outcome: polls < 3 ? "IN_PROGRESS" : "ACCEPTED" },
                    { id: 2, outcome: polls < 3 ? "IN_PROGRESS" : "ACCEPTED" },
                ] } };
            }
            return real(url);
        });

        const { results } = await sendBulkEmail({ batchId, ids }, undefined, NO_DELAY);

        expect(polls).toBeGreaterThanOrEqual(3);
        expect(results.map((r) => r.outcome)).toEqual(["ACCEPTED", "ACCEPTED"]);
    });

    it("explains each kind of failure honestly", () => {
        expect(describeFailure({})).toMatch(/connection to the server was lost/);
        expect(describeFailure({ response: { status: 504 } })).toMatch(/may have processed it/);
        expect(describeFailure({ response: { status: 401 } })).toMatch(/session has expired/);
        expect(describeFailure({ response: { status: 403, data: {} } })).toMatch(/permission/);
        expect(describeFailure({ response: { status: 400, data: { message: "Bad ids" } } })).toBe("Bad ids");
    });
});

describe("bulkEmailRecovery", () => {

    it("keeps only a pointer: ids and codes - never the message, names or addresses", () => {

        saveBulkEmailRecovery("LEAD", { batchId: "abc-12345678", selectedIds: [1, 2, 3], preExcluded: { 3: "NO_EMAIL" }, removedIds: [2] });

        const raw = sessionStorage.getItem("crm.bulkEmail.v1.42.LEAD");
        expect(raw).not.toBeNull();
        expect(Object.keys(JSON.parse(raw)).sort()).toEqual(
            ["batchId", "createdAt", "employeeId", "preExcluded", "removedIds", "selectedIds", "target"]);

        expect(loadBulkEmailRecovery("LEAD").batchId).toBe("abc-12345678");
        expect(loadBulkEmailRecovery("OPPORTUNITY")).toBeNull();
    });

    it("is scoped to the signed-in employee, expires and survives corrupt data", () => {

        saveBulkEmailRecovery("LEAD", { batchId: "abc-12345678", selectedIds: [1] });

        localStorage.setItem("employeeId", "99");                           // somebody else signs in on this tab
        expect(loadBulkEmailRecovery("LEAD")).toBeNull();

        localStorage.setItem("employeeId", "42");
        expect(loadBulkEmailRecovery("LEAD")).not.toBeNull();

        saveBulkEmailRecovery("LEAD", { batchId: "old-12345678", selectedIds: [1], createdAt: Date.now() - 2 * 24 * 3600 * 1000 });
        expect(loadBulkEmailRecovery("LEAD")).toBeNull();

        sessionStorage.setItem("crm.bulkEmail.v1.42.LEAD", "{not json");
        expect(loadBulkEmailRecovery("LEAD")).toBeNull();

        saveBulkEmailRecovery("LEAD", { batchId: "abc-12345678", selectedIds: [1] });
        clearBulkEmailRecovery("LEAD");
        expect(loadBulkEmailRecovery("LEAD")).toBeNull();

        localStorage.removeItem("employeeId");                              // nobody signed in: nothing is stored
        saveBulkEmailRecovery("LEAD", { batchId: "abc-12345678", selectedIds: [1] });
        expect(sessionStorage.length).toBe(0);
    });
});

// -------------------------------------------------------------------- modal

describe("BulkEmailModal", () => {

    it("lists eligible recipients and the excluded ones with reasons, and shows the final count", async () => {
        makeServer({ step1Excluded: {
            3: { code: "NO_EMAIL", message: "No email address on file." },
            4: { code: "NOT_AVAILABLE", message: "This record was not found or you do not have access to it." },
        } });
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
        makeServer();
        render(<BulkEmailModal show target="LEAD" ids={[1, 2]} onClose={vi.fn()} />);

        await screen.findByText(/will receive an email/);

        fireEvent.click(screen.getAllByText("Remove from batch")[0]);
        expect(screen.getByText("Continue (1)")).toBeTruthy();

        fireEvent.click(screen.getAllByText("Remove from batch")[0]);
        expect(screen.getByText("Continue (0)").disabled).toBe(true);

        fireEvent.click(screen.getAllByText("Add back")[0]);
        expect(screen.getByText("Continue (1)").disabled).toBe(false);

        expect(api.put).not.toHaveBeenCalled();
        expect(api.delete).not.toHaveBeenCalled();
    });

    it("a batch with no eligible recipients cannot continue", async () => {
        makeServer({ step1Excluded: { 3: { code: "NO_EMAIL", message: "No email address on file." } } });

        render(<BulkEmailModal show target="LEAD" ids={[3]} onClose={vi.fn()} />);

        await screen.findByText(/will receive an email/);
        expect(screen.getByText("Continue (0)").disabled).toBe(true);
    });

    it("refuses an oversized selection without calling the server", async () => {
        makeServer();
        render(<BulkEmailModal show target="LEAD" ids={Array.from({ length: 101 }, (_, i) => i + 1)} onClose={vi.fn()} />);

        expect(await screen.findByText(/At most 100 leads/)).toBeTruthy();
        expect(api.post).not.toHaveBeenCalled();
    });

    it("shows a clear permission message when the server answers 403", async () => {
        makeServer();
        api.post.mockRejectedValue({ response: { status: 403 } });

        render(<BulkEmailModal show target="LEAD" ids={[1]} onClose={vi.fn()} />);

        expect(await screen.findByText("You don't have permission to send emails.")).toBeTruthy();
    });

    it("picking a template fills the batch's own copy; editing it never calls a template endpoint", async () => {
        makeServer();
        render(<BulkEmailModal show target="LEAD" ids={[1, 2]} onClose={vi.fn()} />);

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

    it("the review step previews each recipient's own personalised message and nothing is created yet", async () => {
        const server = makeServer();
        render(<BulkEmailModal show target="LEAD" ids={[1, 2]} onClose={vi.fn()} />);

        await openToReview();

        expect(screen.getByText("Send 2 emails")).toBeTruthy();
        expect(screen.getByText("Body for Person 1")).toBeTruthy();
        expect(screen.getByText(/not a guarantee/)).toBeTruthy();
        expect(screen.getByText(/recipients and the message are fixed/)).toBeTruthy();

        const reviewCall = server.calls.preview.filter((p) => p.subject).pop();
        expect(reviewCall.ids).toEqual([1, 2]);
        expect(reviewCall.subject).toBe("Hello {{contactPerson}}");   // raw - each recipient is rendered server-side

        fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "2" } });
        expect(screen.getByText("Body for Person 2")).toBeTruthy();

        expect(server.calls.create).toHaveLength(0);
        expect(server.calls.send).toHaveLength(0);
    });

    it("Send creates the batch on the server first, then sends it by id - and retries only what failed", async () => {

        const server = makeServer({ outcomeFor: (id, attempt) => (id === 2 && attempt === 1 ? "FAILED" : "ACCEPTED") });

        render(<BulkEmailModal show target="LEAD" ids={[1, 2]} onClose={vi.fn()} />);
        await openToReview();

        fireEvent.click(screen.getByText("Send 2 emails"));

        await screen.findByText("Failed - not sent", { selector: "span.badge.bg-danger" });
        expect(screen.getByText("HTTP 400: invalid")).toBeTruthy();

        // the batch pins the recipients, the message and the template
        expect(server.calls.create).toEqual([{
            target: "LEAD", ids: [1, 2], subject: "Hello {{contactPerson}}",
            body: "Dear {{contactPerson}}, from {{companyName}}", templateId: 1,
        }]);

        const batchId = [...server.batches.keys()][0];
        expect(server.calls.send).toEqual([{ batchId, ids: [1, 2] }]);             // no message, no template, no target

        fireEvent.click(await screen.findByText(/Retry 1 that did not go out/));

        await waitFor(() => expect(server.calls.send).toHaveLength(2));
        expect(server.calls.send[1]).toEqual({ batchId, ids: [2] });
        expect(server.calls.create).toHaveLength(1);                              // the SAME batch

        await screen.findByText("Close");
        await waitFor(() => expect(badgeCount("failed - not sent")).toBe(0));
        expect(badgeCount("accepted by provider")).toBe(2);
    });

    it("once the batch exists, the results step offers no way to change recipients or the message", async () => {

        makeServer();
        render(<BulkEmailModal show target="LEAD" ids={[1, 2]} onClose={vi.fn()} />);
        await openToReview();

        fireEvent.click(screen.getByText("Send 2 emails"));
        await screen.findByText("Close");

        expect(screen.queryAllByRole("textbox")).toHaveLength(0);
        expect(screen.queryByText("Back")).toBeNull();
        expect(screen.queryByText("Remove from batch")).toBeNull();
        expect(screen.queryByText("Review")).toBeNull();
    });

    it("a double click on Send creates one batch and sends it once", async () => {

        let release;
        const gate = new Promise((resolve) => { release = resolve; });

        const server = makeServer();
        const real = api.post.getMockImplementation();

        api.post.mockImplementation(async (url, payload) => {
            if (url === "/bulk-email/send") {
                await gate;
            }
            return real(url, payload);
        });

        render(<BulkEmailModal show target="LEAD" ids={[1, 2]} onClose={vi.fn()} />);
        await openToReview();

        const send = screen.getByText("Send 2 emails");
        fireEvent.click(send);
        fireEvent.click(send);

        await screen.findByText(/Working\.\.\./);
        release();
        await screen.findByText("Close");

        expect(server.calls.create).toHaveLength(1);
        expect(server.calls.send).toHaveLength(1);
    });

    it("if the batch cannot be created nothing is sent and the review stays open", async () => {

        const server = makeServer();
        const real = api.post.getMockImplementation();

        api.post.mockImplementation(async (url, payload) => {
            if (url === "/bulk-email/batches") {
                throw { response: { status: 400, data: { message: "That email template is no longer active." } } };
            }
            return real(url, payload);
        });

        render(<BulkEmailModal show target="LEAD" ids={[1, 2]} onClose={vi.fn()} />);
        await openToReview();

        fireEvent.click(screen.getByText("Send 2 emails"));

        expect(await screen.findByText("That email template is no longer active.")).toBeTruthy();
        expect(screen.getByText("Send 2 emails")).toBeTruthy();
        expect(server.calls.send).toHaveLength(0);
        expect(sessionStorage.length).toBe(0);
    });

    it("reports unknown outcomes honestly and offers no retry for them", async () => {

        makeServer({ outcomeFor: () => "UNKNOWN" });

        render(<BulkEmailModal show target="OPPORTUNITY" ids={[1, 2]} onClose={vi.fn()} />);

        await screen.findByText(/will receive an email/);
        expect(screen.getByText(/originating lead's address/)).toBeTruthy();
        await chooseTemplateAndReview();
        fireEvent.click(screen.getByText("Send 2 emails"));

        await screen.findAllByText("Unknown - may have been sent", { selector: "span.badge" });
        expect(screen.getByText(/never retried automatically/)).toBeTruthy();
        expect(screen.queryByText(/Retry \d+ that did not go out/)).toBeNull();
    });

    it("the final table accounts for EVERY selected record: sent, failed, unknown, excluded and removed", async () => {

        const step1Excluded = {
            5: { code: "NO_EMAIL", message: "No email address on file." },
            6: { code: "SUPPRESSED", message: "This email address is on the do-not-email list." },
        };

        makeServer({
            step1Excluded,
            outcomeFor: (id) => ({ 1: "ACCEPTED", 2: "FAILED", 3: "UNKNOWN" }[id] || "ACCEPTED"),
        });

        render(<BulkEmailModal show target="LEAD" ids={[1, 2, 3, 4, 5, 6]} onClose={vi.fn()} />);

        await screen.findByText(/will receive an email/);
        fireEvent.click(screen.getAllByText("Remove from batch")[3]);          // the user takes record 4 out
        await chooseTemplateAndReview();
        fireEvent.click(screen.getByText("Send 3 emails"));

        await screen.findByText("Close");
        await waitFor(() => expect(screen.getByTestId("results-total").textContent).toBe("Total 6 of 6"));

        expect(screen.getByTestId("results-summary").textContent).toMatch(/6 selected.*3 eligible.*3 not included/);

        expect(badgeCount("accepted by provider")).toBe(1);
        expect(badgeCount("failed - not sent")).toBe(1);
        expect(badgeCount("unknown - may have been sent")).toBe(1);
        expect(badgeCount("not included")).toBe(2);
        expect(badgeCount("removed by you")).toBe(1);

        expect(screen.getByText("Company 5")).toBeTruthy();                       // present although never emailed
        expect(screen.getByText("No email address on file.")).toBeTruthy();
        expect(screen.getByText("This email address is on the do-not-email list.")).toBeTruthy();
        expect(screen.getByText("Taken out of this batch by you.")).toBeTruthy();
    });

    it("a 100-record batch is sent in chunks of 10 and every record is accounted for", async () => {

        const ALL = Array.from({ length: 100 }, (_, i) => i + 1);
        const noEmail = [1, 2, 3, 4, 5];
        const dupes = [6, 7, 8, 9];
        const gone = [10, 11];
        const failed = [20, 21, 22, 23, 24, 25];
        const unknown = [40, 41, 42];

        const step1Excluded = {};
        noEmail.forEach((id) => { step1Excluded[id] = { code: "NO_EMAIL", message: "No email address on file." }; });
        dupes.forEach((id) => { step1Excluded[id] = { code: "DUPLICATE_EMAIL", message: "Same email address as Company 50." }; });
        gone.forEach((id) => { step1Excluded[id] = { code: "NOT_AVAILABLE", message: "This record was not found or you do not have access to it." }; });

        const server = makeServer({
            step1Excluded,
            outcomeFor: (id, attempt) => {
                if (failed.includes(id) && attempt === 1) return "FAILED";
                if (unknown.includes(id)) return "UNKNOWN";
                return "ACCEPTED";
            },
        });

        render(<BulkEmailModal show target="LEAD" ids={ALL} onClose={vi.fn()} />);
        await screen.findByText(/will receive an email/);
        await chooseTemplateAndReview();

        const eligibleIds = ALL.filter((id) => !step1Excluded[id]);
        expect(eligibleIds).toHaveLength(89);

        fireEvent.click(screen.getByText("Send 89 emails"));
        await screen.findByText("Close", {}, { timeout: 10000 });

        expect(server.calls.send.map((s) => s.ids.length)).toEqual([10, 10, 10, 10, 10, 10, 10, 10, 9]);
        expect(new Set(server.calls.send.map((s) => s.batchId)).size).toBe(1);
        expect(server.calls.create).toHaveLength(1);

        await waitFor(() => expect(screen.getByTestId("results-total").textContent).toBe("Total 100 of 100"));

        expect(badgeCount("accepted by provider")).toBe(89 - failed.length - unknown.length);
        expect(badgeCount("failed - not sent")).toBe(failed.length);
        expect(badgeCount("unknown - may have been sent")).toBe(unknown.length);
        expect(badgeCount("not included")).toBe(11);

        // retry: only the confirmed failures, same batch; UNKNOWN is left alone
        fireEvent.click(await screen.findByText(`Retry ${failed.length} that did not go out`));
        await waitFor(() => expect(server.calls.send).toHaveLength(10));

        expect(server.calls.send[9].ids).toEqual(failed);

        await waitFor(() => expect(badgeCount("failed - not sent")).toBe(0));
        expect(badgeCount("unknown - may have been sent")).toBe(unknown.length);
        expect(screen.getByTestId("results-total").textContent).toBe("Total 100 of 100");
    }, 30000);
});

// ---------------------------------------------------------------- recovery

describe("recovering an unfinished batch", () => {

    async function startAndInterrupt(ids, { interruptAfter = 1 } = {}) {

        const server = makeServer();
        const real = api.post.getMockImplementation();
        let sends = 0;

        // after `interruptAfter` chunks the page goes away: that request never answers
        api.post.mockImplementation((url, payload) => {
            if (url === "/bulk-email/send" && ++sends > interruptAfter) {
                return new Promise(() => {});
            }
            return real(url, payload);
        });

        const first = render(<BulkEmailModal show target="LEAD" ids={ids} onClose={vi.fn()} />);
        await screen.findByText(/will receive an email/);
        await chooseTemplateAndReview();
        fireEvent.click(screen.getByText(new RegExp(`Send ${ids.length} emails`)));

        await waitFor(() => expect(sends).toBe(interruptAfter + 1));

        first.unmount();                              // refresh / tab closed

        api.post.mockImplementation(real);

        return server;
    }

    it("remembers only a pointer to the batch, never the message or the addresses", async () => {

        const ids = Array.from({ length: 30 }, (_, i) => i + 1);
        await startAndInterrupt(ids);

        const raw = sessionStorage.getItem("crm.bulkEmail.v1.42.LEAD");
        expect(raw).not.toBeNull();

        expect(raw).not.toMatch(/Dear/);                  // no message text
        expect(raw).not.toMatch(/Hello/);
        expect(raw).not.toMatch(/@x\.test/);              // no addresses
        expect(raw).not.toMatch(/Company/);               // no names
        expect(JSON.parse(raw).selectedIds).toEqual(ids);
    });

    it("offers to resume after a refresh, shows the server's record, and sends only what was never attempted - on the SAME batch", async () => {

        const ids = Array.from({ length: 30 }, (_, i) => i + 1);
        const server = await startAndInterrupt(ids);

        const batchId = [...server.batches.keys()][0];

        // chunk 1 reached the server before the page went away
        expect(server.batches.get(batchId).log.size).toBe(10);

        render(<BulkEmailModal show target="LEAD" ids={ids} onClose={vi.fn()} />);

        expect(await screen.findByText(/started earlier/)).toBeTruthy();
        expect(screen.getByText(/cannot be changed/)).toBeTruthy();
        await waitFor(() => expect(screen.getByText("Continue this batch").disabled).toBe(false));

        fireEvent.click(screen.getByText("Continue this batch"));

        await waitFor(() => expect(screen.getByTestId("results-total").textContent).toBe("Total 30 of 30"));
        expect(badgeCount("accepted by provider")).toBe(10);
        expect(badgeCount("not sent yet")).toBe(20);

        const createdBefore = server.calls.create.length;

        fireEvent.click(screen.getByText(/Retry 20 that did not go out/));

        await screen.findByText("Close");
        await waitFor(() => expect(badgeCount("accepted by provider")).toBe(30));

        expect(server.calls.create).toHaveLength(createdBefore);                       // no new batch
        expect(server.calls.send.slice(-2).every((s) => s.batchId === batchId)).toBe(true);
        expect(server.calls.send.flatMap((s) => s.ids).filter((id) => id <= 10).length).toBeLessThanOrEqual(10 + 0);
    });

    it("nothing is resent for records the server already handled", async () => {

        const ids = Array.from({ length: 20 }, (_, i) => i + 1);
        const server = await startAndInterrupt(ids);

        const batchId = [...server.batches.keys()][0];
        const attemptsBefore = { ...server.batches.get(batchId).attempts };

        render(<BulkEmailModal show target="LEAD" ids={ids} onClose={vi.fn()} />);
        await screen.findByText(/started earlier/);
        await waitFor(() => expect(screen.getByText("Continue this batch").disabled).toBe(false));
        fireEvent.click(screen.getByText("Continue this batch"));
        fireEvent.click(await screen.findByText(/Retry 10 that did not go out/));
        await screen.findByText("Close");

        const attempts = server.batches.get(batchId).attempts;
        ids.forEach((id) => expect(attempts[id]).toBe(1));                              // each record attempted exactly once
        expect(Object.keys(attemptsBefore)).toHaveLength(10);
    });

    it("can be reopened with no selection at all, through the banner", async () => {

        const ids = Array.from({ length: 20 }, (_, i) => i + 1);
        const server = await startAndInterrupt(ids);

        const onResume = vi.fn();

        render(<BulkEmailResumeBanner target="LEAD" onResume={onResume} />);
        expect(screen.getByText(/unfinished bulk email batch/)).toBeTruthy();
        fireEvent.click(screen.getByText("Review / resume"));
        expect(onResume).toHaveBeenCalled();

        render(<BulkEmailModal show target="LEAD" ids={[]} resumeOnly onClose={vi.fn()} />);
        fireEvent.click(await screen.findByText("Continue this batch"));

        await waitFor(() => expect(screen.getByTestId("results-total").textContent).toBe("Total 20 of 20"));
        expect(server.calls.create).toHaveLength(1);
    });

    it("lets the user discard it and start a new batch for the current selection", async () => {

        const ids = Array.from({ length: 20 }, (_, i) => i + 1);
        const server = await startAndInterrupt(ids);

        render(<BulkEmailModal show target="LEAD" ids={[1, 2]} onClose={vi.fn()} />);
        await screen.findByText(/started earlier/);
        await waitFor(() => expect(screen.getByText(/Discard it and start a new batch/).disabled).toBe(false));

        fireEvent.click(screen.getByText(/Discard it and start a new batch/));

        expect(await screen.findByText(/will receive an email/)).toBeTruthy();
        expect(loadBulkEmailRecovery("LEAD")).toBeNull();
        expect(server.calls.create).toHaveLength(1);                         // nothing new was created by discarding
    });

    it("forgets a batch the server no longer knows and carries on normally", async () => {

        makeServer();
        saveBulkEmailRecovery("LEAD", { batchId: "00000000-0000-0000-0000-999999999999", selectedIds: [1, 2] });

        render(<BulkEmailModal show target="LEAD" ids={[1, 2]} onClose={vi.fn()} />);

        expect(await screen.findByText(/no longer available/)).toBeTruthy();
        expect(await screen.findByText(/will receive an email/)).toBeTruthy();
        expect(loadBulkEmailRecovery("LEAD")).toBeNull();
    });

    it("a finished batch is forgotten when the results are closed; an unfinished one is kept", async () => {

        makeServer();
        const onClose = vi.fn();

        const done = render(<BulkEmailModal show target="LEAD" ids={[1, 2]} onClose={onClose} />);
        await openToReview();
        fireEvent.click(screen.getByText("Send 2 emails"));
        fireEvent.click(await screen.findByText("Close"));

        expect(onClose).toHaveBeenCalled();
        expect(loadBulkEmailRecovery("LEAD")).toBeNull();
        done.unmount();

        // unfinished: a failure remains
        makeServer({ outcomeFor: () => "FAILED" });
        render(<BulkEmailModal show target="LEAD" ids={[1, 2]} onClose={vi.fn()} />);
        await openToReview();
        fireEvent.click(screen.getByText("Send 2 emails"));
        fireEvent.click(await screen.findByText("Close"));

        expect(loadBulkEmailRecovery("LEAD")).not.toBeNull();
    });

    it("shows nothing to resume when opened through a stale banner", async () => {

        makeServer();
        render(<BulkEmailModal show target="LEAD" ids={[]} resumeOnly onClose={vi.fn()} />);

        expect(await screen.findByText(/no unfinished bulk email batch/)).toBeTruthy();
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
