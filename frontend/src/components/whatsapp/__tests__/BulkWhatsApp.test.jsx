// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const api = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn() }));

vi.mock("../../../services/api", () => ({ default: api }));
vi.mock("../../../utils/apiCache", () => ({ cachedFetch: (_k, f) => f() }));

import BulkWhatsAppModal from "../BulkWhatsAppModal";
import WhatsAppTemplateFormModal from "../WhatsAppTemplateFormModal";
import WhatsAppConsentPanel from "../WhatsAppConsentPanel";
import { chunkIds, describeFailure, sendBulkWhatsApp } from "../../../services/bulkWhatsAppService";
import {
    clearBulkWhatsAppRecovery,
    loadBulkWhatsAppRecovery,
    saveBulkWhatsAppRecovery,
} from "../../../services/bulkWhatsAppRecovery";

const NO_DELAY = { delayMs: 0 };

const TEMPLATES = [
    { id: 5, name: "Follow-up", body: "Hi {{contactPerson}}, about {{interestedProduct}} at {{companyName}}.", version: 2, isActive: true, issues: [] },
];

function rec(id, extra = {}) {
    return {
        id, companyName: `Company ${id}`, contactPerson: `Person ${id}`, phoneMasked: `+91 ******000${id}`,
        eligible: true, exclusionCode: null, exclusionMessage: null, warnings: [], renderedText: null, ...extra,
    };
}

function excl(id, code, message) {
    return rec(id, { eligible: false, exclusionCode: code, exclusionMessage: message });
}

/**
 * A stateful stand-in for the backend: server-issued batches that pin recipients,
 * recorded outcomes replayed (never resent), only FAILED re-attempted, and
 * GET /batches/{id} as the whole batch. outcomeFor(id, attempt) is the fake provider.
 */
function makeServer({ excluded = {}, unresolved = {}, outcomeFor = () => "ACCEPTED", ready = true, templates = TEMPLATES } = {}) {

    const batches = new Map();
    const calls = { create: [], send: [], preview: [] };
    let seq = 0;

    const view = (b) => b.ids.map((id) => {
        const row = b.log.get(id);
        return row
            ? { id, companyName: `Company ${id}`, phoneMasked: `+91 ******000${id}`, outcome: row.outcome, detail: row.detail || null,
                deliveryStatus: row.delivery || null }
            : { id, companyName: `Company ${id}`, phoneMasked: `+91 ******000${id}`, outcome: "NOT_ATTEMPTED", detail: "Not sent yet." };
    });

    api.get.mockImplementation(async (url) => {

        if (url === "/bulk-whatsapp/access") {
            return { data: { canSend: true, scope: "OWN", configured: true, sessionStatus: ready ? "WORKING" : "SCAN_QR_CODE",
                ready, message: ready ? null : "WhatsApp is not connected (session status: SCAN_QR_CODE).", chunkSize: 5, maxRecipients: 100 } };
        }

        if (url === "/whatsapp-templates") {
            return { data: templates };
        }

        const m = url.match(/^\/bulk-whatsapp\/batches\/(.+)$/);
        if (m && batches.has(m[1])) {
            const b = batches.get(m[1]);
            return { data: { batchId: m[1], results: view(b), batch: { recipientIds: b.ids, templateName: "Follow-up" } } };
        }

        throw Object.assign(new Error("not found"), { response: { status: 404, data: {} } });
    });

    api.post.mockImplementation(async (url, body) => {

        if (url === "/bulk-whatsapp/preview") {
            calls.preview.push(body);
            const recipients = body.ids.map((id) => {
                if (excluded[id]) return excl(id, excluded[id].code, excluded[id].message);
                if (body.templateId && unresolved[id]) return excl(id, "UNRESOLVED_VARIABLE", unresolved[id]);
                return rec(id, body.templateId
                    ? { renderedText: `Hi Person ${id}, about Genset ${id} at Company ${id}.` } : {});
            });
            const eligible = recipients.filter((r) => r.eligible).length;
            return { data: { target: body.target, requested: body.ids.length, eligibleCount: eligible,
                excludedCount: recipients.length - eligible, providerReady: ready, recipients } };
        }

        if (url === "/bulk-whatsapp/batches") {
            calls.create.push(body);
            const batchId = `batch-${++seq}-aaaa`;
            batches.set(batchId, { ids: [...body.ids], log: new Map(), attempts: new Map() });
            return { data: { batchId, templateName: "Follow-up", requested: body.ids.length, chunkSize: 5 } };
        }

        if (url === "/bulk-whatsapp/send") {
            calls.send.push(body);
            const b = batches.get(body.batchId);
            const results = body.ids.map((id) => {
                const prev = b.log.get(id);
                if (prev && prev.outcome !== "FAILED") {
                    return { id, outcome: prev.outcome, alreadyProcessed: true, companyName: `Company ${id}` };
                }
                const attempt = (b.attempts.get(id) || 0) + 1;
                b.attempts.set(id, attempt);
                const outcome = outcomeFor(id, attempt);
                b.log.set(id, { outcome, detail: outcome === "FAILED" ? "WhatsApp provider answered HTTP 400" : null });
                return { id, outcome, alreadyProcessed: false, companyName: `Company ${id}`, phoneMasked: `+91 ******000${id}` };
            });
            return { data: { batchId: body.batchId, results, paused: false } };
        }

        throw new Error(`unexpected POST ${url}`);
    });

    return { calls, batches };
}

beforeEach(() => {
    localStorage.setItem("employeeId", "42");
    sessionStorage.clear();
    vi.clearAllMocks();
});

afterEach(() => {
    cleanup();
    sessionStorage.clear();
});

async function goToReview(ids = [1, 2]) {
    render(<BulkWhatsAppModal show target="LEAD" ids={ids} onClose={vi.fn()} onSent={vi.fn()} />);
    await screen.findByText(/can be messaged/);
    fireEvent.click(screen.getByText(/^Continue/));
    fireEvent.change(await screen.findByLabelText("WhatsApp template"), { target: { value: "5" } });
    await screen.findAllByTestId("wa-message");
    fireEvent.click(screen.getByText(/^Review/));
    await screen.findByText(/Will receive a WhatsApp message/);
}

// ===================================================================== engine

describe("bulkWhatsAppService", () => {

    it("splits into chunks of at most 5, all against the SAME server batch", async () => {

        const { calls } = makeServer();
        await api.post("/bulk-whatsapp/batches", { ids: [1, 2, 3, 4, 5, 6, 7] });

        expect(chunkIds([1, 2, 3, 4, 5, 6, 7], 5)).toEqual([[1, 2, 3, 4, 5], [6, 7]]);

        const { results, error } = await sendBulkWhatsApp({ batchId: "batch-1-aaaa", ids: [1, 2, 3, 4, 5, 6, 7], chunkSize: 10 }, null, NO_DELAY);

        expect(error).toBeNull();
        expect(calls.send.map((c) => c.ids.length)).toEqual([5, 2]);   // never more than 5, even if asked
        expect(new Set(calls.send.map((c) => c.batchId))).toEqual(new Set(["batch-1-aaaa"]));
        expect(Object.keys(calls.send[0]).sort()).toEqual(["batchId", "ids"]);   // no text, no template
        expect(results.every((r) => r.outcome === "ACCEPTED")).toBe(true);
    });

    it("stops sending further chunks when the server reports the provider paused", async () => {

        api.post.mockImplementation(async (url, body) => ({
            data: { batchId: body.batchId, paused: true, pauseReason: "Sending paused: the WhatsApp provider stopped responding normally.",
                results: body.ids.map((id, i) => i === 0
                    ? { id, outcome: "UNKNOWN" }
                    : { id, outcome: "NOT_ATTEMPTED", exclusionCode: "PROVIDER_UNAVAILABLE" }) },
        }));

        const { results, error, paused } = await sendBulkWhatsApp({ batchId: "b-1", ids: [1, 2, 3, 4, 5, 6, 7] }, null, NO_DELAY);

        expect(api.post).toHaveBeenCalledTimes(1);
        expect(paused).toBe(true);
        expect(error).toMatch(/paused/);
        expect(results.find((r) => r.id === 1).outcome).toBe("UNKNOWN");
        expect(results.find((r) => r.id === 7).outcome).toBe("NOT_ATTEMPTED");
    });

    it("reconciles a lost response with the server instead of assuming nothing was sent", async () => {

        makeServer();
        await api.post("/bulk-whatsapp/batches", { ids: [1, 2] });
        const realPost = api.post.getMockImplementation();

        api.post.mockImplementation(async (url, body) => {
            if (url === "/bulk-whatsapp/send") {
                await realPost(url, body);   // the server DID process it...
                throw Object.assign(new Error("gateway"), { response: { status: 504, data: {} } });   // ...but the answer was lost
            }
            return realPost(url, body);
        });

        const { results, paused } = await sendBulkWhatsApp({ batchId: "batch-1-aaaa", ids: [1, 2] }, null, NO_DELAY);

        expect(paused).toBe(true);
        expect(results.map((r) => r.outcome)).toEqual(["ACCEPTED", "ACCEPTED"]);
    });

    it("marks recipients UNVERIFIED when the server cannot be asked either", async () => {

        api.post.mockRejectedValue(Object.assign(new Error("net"), {}));
        api.get.mockRejectedValue(Object.assign(new Error("net"), {}));

        const { results } = await sendBulkWhatsApp({ batchId: "b-x", ids: [1] }, null, NO_DELAY);

        expect(results[0].outcome).toBe("UNVERIFIED");
    });

    it("explains a disconnected provider honestly", () => {
        expect(describeFailure({ response: { status: 503, data: { message: "WhatsApp is not connected (session status: SCAN_QR_CODE)." } } }))
            .toMatch(/SCAN_QR_CODE/);
        expect(describeFailure({})).toMatch(/connection to the server was lost/);
    });
});

describe("bulkWhatsAppRecovery", () => {

    it("keeps only a pointer, scoped to the employee, separate from bulk email", () => {

        saveBulkWhatsAppRecovery("LEAD", { batchId: "batch-9", selectedIds: [1, 2], preExcluded: { 2: "NO_OPT_IN" } });

        const key = Object.keys(sessionStorage).find((k) => k.startsWith("crm.bulkWhatsApp.v1.42.LEAD"));
        expect(key).toBeTruthy();
        expect(Object.keys(sessionStorage).some((k) => k.startsWith("crm.bulkEmail"))).toBe(false);

        const raw = sessionStorage.getItem(key);
        expect(raw).not.toMatch(/Person|Company|\+91|Hi /);

        expect(loadBulkWhatsAppRecovery("LEAD").batchId).toBe("batch-9");
        expect(loadBulkWhatsAppRecovery("OPPORTUNITY")).toBeNull();

        localStorage.setItem("employeeId", "7");
        expect(loadBulkWhatsAppRecovery("LEAD")).toBeNull();

        localStorage.setItem("employeeId", "42");
        clearBulkWhatsAppRecovery("LEAD");
        expect(loadBulkWhatsAppRecovery("LEAD")).toBeNull();
    });
});

// ===================================================================== dialog

describe("BulkWhatsAppModal", () => {

    it("lists who can be messaged with masked numbers, and why the others cannot", async () => {

        makeServer({ excluded: {
            3: { code: "NO_OPT_IN", message: "No WhatsApp opt-in is recorded for this number." },
            4: { code: "OPTED_OUT", message: "This number has opted out of WhatsApp messages." },
            5: { code: "INVALID_PHONE", message: "The phone number on file is not a valid mobile number for WhatsApp." },
        } });

        render(<BulkWhatsAppModal show target="LEAD" ids={[1, 2, 3, 4, 5]} onClose={vi.fn()} />);

        await screen.findByText(/can be messaged/);

        expect(screen.getByText("+91 ******0001")).toBeTruthy();
        expect(screen.getByText("No WhatsApp opt-in is recorded for this number.")).toBeTruthy();
        expect(screen.getByText("This number has opted out of WhatsApp messages.")).toBeTruthy();
        expect(screen.getByText(/not a valid mobile number/)).toBeTruthy();
        expect(screen.getByText("Not included (3)")).toBeTruthy();
        expect(screen.getByText("Continue (2)")).toBeTruthy();
    });

    it("shows the template filled in by the server - no {{fields}} and nothing editable", async () => {

        const { calls } = makeServer({ unresolved: { 2: "Product is missing for this recipient" } });

        render(<BulkWhatsAppModal show target="LEAD" ids={[1, 2]} onClose={vi.fn()} />);
        await screen.findByText(/can be messaged/);
        fireEvent.click(screen.getByText("Continue (2)"));

        fireEvent.change(await screen.findByLabelText("WhatsApp template"), { target: { value: "5" } });

        const bubble = await screen.findByTestId("wa-message");
        expect(bubble.textContent).toBe("Hi Person 1, about Genset 1 at Company 1.");
        expect(document.body.textContent).not.toMatch(/\{\{/);
        expect(document.querySelector("textarea")).toBeNull();

        // the server rendered it, for exactly the kept recipients and the chosen template
        expect(calls.preview.at(-1)).toEqual({ target: "LEAD", ids: [1, 2], templateId: 5 });

        // a recipient missing a value is excluded with the reason
        expect(screen.getByText("Product is missing for this recipient")).toBeTruthy();
        expect(screen.getByText("Review (1)")).toBeTruthy();
    });

    it("nothing is created until the explicit confirmation is ticked", async () => {

        const { calls } = makeServer();
        await goToReview();

        const send = screen.getByText(/^Send 2 WhatsApp message/);
        expect(send.disabled).toBe(true);
        fireEvent.click(send);
        expect(calls.create).toHaveLength(0);

        fireEvent.click(screen.getByLabelText(/I confirm these people have opted in/));
        expect(screen.getByText(/^Send 2 WhatsApp message/).disabled).toBe(false);
    });

    it("a double click creates one batch and sends it once", async () => {

        const { calls } = makeServer();
        await goToReview();

        fireEvent.click(screen.getByLabelText(/I confirm/));
        const send = screen.getByText(/^Send 2 WhatsApp message/);
        fireEvent.click(send);
        fireEvent.click(send);

        await screen.findByText(/Accepted by WhatsApp provider: 2/);

        expect(calls.create).toHaveLength(1);
        expect(calls.create[0]).toEqual({ target: "LEAD", ids: [1, 2], templateId: 5 });
        expect(calls.send.flatMap((c) => c.ids)).toEqual([1, 2]);
    });

    it("shows partial failure honestly and retries only what definitely did not go out", async () => {

        const { calls } = makeServer({ outcomeFor: (id, attempt) =>
            id === 2 && attempt === 1 ? "FAILED" : id === 3 ? "UNKNOWN" : "ACCEPTED" });

        await goToReview([1, 2, 3]);
        fireEvent.click(screen.getByLabelText(/I confirm/));
        fireEvent.click(screen.getByText(/^Send 3 WhatsApp message/));

        await screen.findByText(/Failed - not sent: 1/);
        expect(screen.getByText(/Unknown - may have been sent: 1/)).toBeTruthy();
        expect(screen.getByText(/not that it was delivered/)).toBeTruthy();

        fireEvent.click(screen.getByText("Send remaining / retry failed (1)"));

        await screen.findByText(/Accepted by WhatsApp provider: 2/);
        expect(calls.send.at(-1).ids).toEqual([2]);   // never the UNKNOWN one
    });

    it("cannot send while WhatsApp is disconnected", async () => {

        const { calls } = makeServer({ ready: false });
        await goToReview();

        expect(screen.getByText(/SCAN_QR_CODE/)).toBeTruthy();
        fireEvent.click(screen.getByLabelText(/I confirm/));
        expect(screen.getByText(/^Send 2 WhatsApp message/).disabled).toBe(true);
        expect(calls.create).toHaveLength(0);
    });

    it("resumes an unfinished batch from the server after a refresh, with delivery status", async () => {

        const { batches } = makeServer();
        await api.post("/bulk-whatsapp/batches", { ids: [1, 2] });
        batches.get("batch-1-aaaa").log.set(1, { outcome: "ACCEPTED", delivery: "READ" });

        saveBulkWhatsAppRecovery("LEAD", { batchId: "batch-1-aaaa", selectedIds: [1, 2, 3], preExcluded: { 3: "OPTED_OUT" } });

        render(<BulkWhatsAppModal show target="LEAD" ids={[]} resumeOnly onClose={vi.fn()} />);

        await screen.findByText("Read");
        const table = screen.getByRole("table");
        expect(within(table).getByText("Company 1")).toBeTruthy();
        expect(within(table).getByText("This number has opted out of WhatsApp messages.")).toBeTruthy();
        expect(screen.getByText("Send remaining / retry failed (1)")).toBeTruthy();   // record 2 not sent yet
    });
});

// ===================================================================== admin & consent

describe("WhatsAppTemplateFormModal", () => {

    it("shows the server's sample preview and blocks saving while there are problems", async () => {

        api.post.mockImplementation(async (url, body) => ({
            data: body.body.includes("{{nickname}}")
                ? { renderedText: body.body, issues: ["Unsupported field \"nickname\""], sample: true, fields: [] }
                : { renderedText: "Hi Rahul Sharma", issues: [], sample: true, fields: [{ key: "contactPerson", label: "Contact person", value: "Rahul Sharma" }] },
        }));

        const onSave = vi.fn();
        render(<WhatsAppTemplateFormModal show template={null} onClose={vi.fn()} onSave={onSave} />);

        fireEvent.change(screen.getByLabelText("Template name"), { target: { value: "Greeting" } });
        fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Hi {{nickname}}" } });

        await screen.findByText("Unsupported field \"nickname\"", {}, { timeout: 2000 });
        expect(screen.getByText("Save template").disabled).toBe(true);

        fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Hi {{contactPerson}}" } });

        await waitFor(() => expect(screen.getByTestId("wat-preview").textContent).toBe("Hi Rahul Sharma"), { timeout: 2000 });
        fireEvent.click(screen.getByText("Save template"));

        expect(onSave).toHaveBeenCalledWith({ name: "Greeting", description: null, body: "Hi {{contactPerson}}" });
    });
});

describe("WhatsAppConsentPanel", () => {

    it("shows that no consent is recorded and records a documented opt-in", async () => {

        api.get.mockResolvedValue({ data: { phoneMasked: "+91 ******1111", validPhone: true, status: null,
            canRecordOptIn: true, canRecordOptOut: true } });
        api.post.mockResolvedValue({ data: { phoneMasked: "+91 ******1111", validPhone: true, status: "OPTED_IN",
            source: "PHONE_CALL", consentedAt: "2026-11-03T00:00:00", canRecordOptIn: true, canRecordOptOut: true } });

        render(<WhatsAppConsentPanel leadId={9} />);

        expect((await screen.findByTestId("wa-consent-status")).textContent).toBe("No consent recorded");

        fireEvent.click(screen.getByText("Record opt-in"));
        fireEvent.change(screen.getByLabelText("Source"), { target: { value: "Phone call" } });
        fireEvent.change(screen.getByLabelText("Evidence"), { target: { value: "Call 3 Nov" } });
        // typed the British way (3 Nov); the API still gets ISO
        fireEvent.change(screen.getByLabelText("Date consent was given"), { target: { value: "03/11/2026" } });
        fireEvent.click(screen.getByText("Save opt-in"));

        await waitFor(() => expect(screen.getByTestId("wa-consent-status").textContent).toBe("Opted in"));
        expect(api.post).toHaveBeenCalledWith("/leads/9/whatsapp-consent",
            { status: "OPTED_IN", source: "Phone call", evidence: "Call 3 Nov", consentedAt: "2026-11-03" });
    });

    it("a non-admin cannot re-opt-in a number that opted out", async () => {

        api.get.mockResolvedValue({ data: { phoneMasked: "+91 ******1111", validPhone: true, status: "OPTED_OUT",
            source: "INBOUND_STOP", consentedAt: "2026-11-01T00:00:00", canRecordOptIn: false, canRecordOptOut: true } });

        render(<WhatsAppConsentPanel leadId={9} />);

        await screen.findByText("Opted out");
        expect(screen.queryByText("Record opt-in")).toBeNull();
        expect(screen.getByText(/Only an administrator can record a new opt-in/)).toBeTruthy();
    });
});
