import { describe, it, expect, vi, beforeEach } from "vitest";

const api = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }));

vi.mock("../../../services/api", () => ({ default: api }));

import { retryAfterSeconds, sendBulkEmail } from "../../../services/bulkEmailService";

const FAST = { delayMs: 0, retryAfterUnitMs: 0 };

const throttled = (seconds) => ({
    response: { status: 429, headers: { "retry-after": String(seconds) }, data: { message: "Your mailbox is sending too fast." } },
});

beforeEach(() => vi.clearAllMocks());

describe("bulk email pacing (429 + Retry-After)", () => {

    it("waits and re-sends the SAME chunk, then carries on", async () => {

        const ids = Array.from({ length: 12 }, (_, i) => i + 1);
        const sent = [];
        let first = true;

        api.post.mockImplementation(async (url, payload) => {
            sent.push(payload.ids);
            if (first) {
                first = false;
                throw throttled(20);
            }
            return { data: { results: payload.ids.map((id) => ({ id, outcome: "ACCEPTED" })) } };
        });

        const { results, error, paused } = await sendBulkEmail({ batchId: "b-1", ids }, undefined, FAST);

        expect(paused).toBe(false);
        expect(error).toBeNull();
        expect(results.every((r) => r.outcome === "ACCEPTED")).toBe(true);
        // chunk 1 twice (the retry is answered from the server's record), then chunk 2
        expect(sent.map((c) => c.length)).toEqual([10, 10, 2]);
        expect(sent[0]).toEqual(sent[1]);
    });

    it("pauses with the server's message when the wait is long (e.g. a daily limit) or keeps recurring", async () => {

        api.post.mockRejectedValue({ response: { status: 429, headers: {}, data: { message: "Your mailbox has reached the CRM's daily limit." } } });
        api.get.mockResolvedValue({ data: { results: [{ id: 1, outcome: "NOT_ATTEMPTED" }] } });

        const daily = await sendBulkEmail({ batchId: "b-2", ids: [1] }, undefined, FAST);
        expect(daily.paused).toBe(true);
        expect(daily.error).toContain("daily limit");
        expect(api.post).toHaveBeenCalledTimes(1);

        api.post.mockReset();
        api.post.mockRejectedValue(throttled(5));

        const recurring = await sendBulkEmail({ batchId: "b-3", ids: [1] }, undefined, { ...FAST, throttleWaits: 3 });
        expect(recurring.paused).toBe(true);
        expect(api.post).toHaveBeenCalledTimes(4);   // first try + 3 waits, never an endless loop
    });

    it("only a 429 with a short Retry-After is waited out", () => {
        expect(retryAfterSeconds(throttled(30))).toBe(30);
        expect(retryAfterSeconds(throttled(600))).toBeNull();
        expect(retryAfterSeconds({ response: { status: 409, headers: { "retry-after": "5" } } })).toBeNull();
        expect(retryAfterSeconds({ response: { status: 429, headers: {} } })).toBeNull();
        expect(retryAfterSeconds(undefined)).toBeNull();
    });
});
