// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

import UpdateNotice from "../UpdateNotice";
import { RELOAD_GRACE_MS, fetchDeployedBuild, readNote, shouldNotify, writeNote } from "../../utils/appVersion";

const INTERVAL = 60_000;

// Lets pending promises (the mocked fetch) settle.
const flush = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

function setup({ current = "build-A", deployed = "build-A", enabled = true } = {}) {
    let live = deployed;
    const fetchBuild = vi.fn(async () => live);
    const reload = vi.fn();
    render(<UpdateNotice enabled={enabled} current={current} intervalMs={INTERVAL} fetchBuild={fetchBuild} reload={reload} />);
    return { fetchBuild, reload, deploy: (id) => { live = id; } };
}

const notice = () => screen.queryByText("A new version of the CRM is available.");

beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
});

afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    sessionStorage.clear();
});

describe("new frontend version notice", () => {

    it("stays hidden while the deployed build is the one this tab runs", async () => {
        const { fetchBuild } = setup();
        await flush();
        for (let i = 0; i < 3; i++) {
            await act(async () => { vi.advanceTimersByTime(INTERVAL); });
            await flush();
        }
        expect(fetchBuild).toHaveBeenCalledTimes(4);              // on open + every interval
        expect(notice()).toBeNull();
    });

    it("appears once a newer build is deployed, and never reloads by itself", async () => {
        const { deploy, reload } = setup();
        await flush();
        expect(notice()).toBeNull();

        deploy("build-B");
        await act(async () => { vi.advanceTimersByTime(INTERVAL); });
        await flush();
        expect(notice()).not.toBeNull();
        expect(screen.getAllByRole("status")).toHaveLength(1);

        // more checks for the same build: still one notice, still no reload
        await act(async () => { vi.advanceTimersByTime(INTERVAL * 5); });
        await flush();
        expect(screen.getAllByRole("status")).toHaveLength(1);
        expect(reload).not.toHaveBeenCalled();
    });

    it("refreshes only when the user asks, and remembers it so a stale edge copy cannot loop", async () => {
        const { reload } = setup({ deployed: "build-B" });
        await flush();
        fireEvent.click(screen.getByText("Refresh now"));
        expect(reload).toHaveBeenCalledTimes(1);
        expect(readNote()).toMatchObject({ reloadedFor: "build-B" });

        // after the reload the CDN still served the old page: no immediate re-prompt
        cleanup();
        const second = setup({ current: "build-A", deployed: "build-B" });
        await flush();
        expect(notice()).toBeNull();
        expect(second.reload).not.toHaveBeenCalled();
    });

    it("dismissing hides that build only; a later deployment is reported again", async () => {
        const { deploy } = setup({ deployed: "build-B" });
        await flush();
        fireEvent.click(screen.getByLabelText("Dismiss"));
        expect(notice()).toBeNull();

        await act(async () => { vi.advanceTimersByTime(INTERVAL * 2); });
        await flush();
        expect(notice()).toBeNull();

        deploy("build-C");
        await act(async () => { vi.advanceTimersByTime(INTERVAL); });
        await flush();
        expect(notice()).not.toBeNull();
    });

    it("does nothing at all when disabled (development builds)", async () => {
        const { fetchBuild } = setup({ enabled: false, deployed: "build-B" });
        await act(async () => { vi.advanceTimersByTime(INTERVAL * 3); });
        await flush();
        expect(fetchBuild).not.toHaveBeenCalled();
        expect(notice()).toBeNull();
    });

    it("skips checks while the tab is hidden and checks again when it becomes visible", async () => {
        const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
        const { fetchBuild } = setup({ deployed: "build-B" });
        await act(async () => { vi.advanceTimersByTime(INTERVAL * 2); });
        await flush();
        expect(fetchBuild).not.toHaveBeenCalled();

        visibility.mockReturnValue("visible");
        await act(async () => { document.dispatchEvent(new Event("visibilitychange")); });
        await flush();
        expect(fetchBuild).toHaveBeenCalledTimes(1);
        expect(notice()).not.toBeNull();
    });

    it("ignores a failed check quietly", async () => {
        const fetchBuild = vi.fn(async () => null);
        render(<UpdateNotice enabled current="build-A" intervalMs={INTERVAL} fetchBuild={fetchBuild} reload={vi.fn()} />);
        await flush();
        expect(notice()).toBeNull();
    });
});

describe("version rules", () => {

    it("notifies only for a different, not dismissed, not just-refreshed build", () => {
        const now = 1_000_000;
        expect(shouldNotify("B", "A", {}, now)).toBe(true);
        expect(shouldNotify("A", "A", {}, now)).toBe(false);
        expect(shouldNotify(null, "A", {}, now)).toBe(false);
        expect(shouldNotify("B", "A", { dismissed: "B" }, now)).toBe(false);
        expect(shouldNotify("C", "A", { dismissed: "B" }, now)).toBe(true);
        expect(shouldNotify("B", "A", { reloadedFor: "B", at: now - 1000 }, now)).toBe(false);
        expect(shouldNotify("B", "A", { reloadedFor: "B", at: now - RELOAD_GRACE_MS - 1 }, now)).toBe(true);
        // the refresh guard is per build: a genuinely newer build is reported at once
        expect(shouldNotify("C", "A", { reloadedFor: "B", at: now - 1000 }, now)).toBe(true);
        expect(shouldNotify("C", "B", { reloadedFor: "B", at: now - 1000 }, now)).toBe(true);
    });

    it("reads /version.json without caching or credentials, and rejects anything odd", async () => {
        vi.useRealTimers();
        const ok = vi.fn(async () => ({ ok: true, json: async () => ({ buildId: "abc-123" }) }));
        expect(await fetchDeployedBuild(ok)).toBe("abc-123");
        const [url, options] = ok.mock.calls[0];
        expect(url).toMatch(/^\/version\.json\?t=\d+$/);
        expect(options).toMatchObject({ cache: "no-store", credentials: "omit" });
        expect(options.headers.Authorization).toBeUndefined();

        expect(await fetchDeployedBuild(async () => ({ ok: false }))).toBeNull();
        expect(await fetchDeployedBuild(async () => ({ ok: true, json: async () => ({ buildId: "<x>" }) }))).toBeNull();
        expect(await fetchDeployedBuild(async () => ({ ok: true, json: async () => { throw new Error("html"); } }))).toBeNull();
        expect(await fetchDeployedBuild(async () => { throw new Error("offline"); })).toBeNull();
    });

    it("keeps its note in this tab's sessionStorage only, and survives broken storage", () => {
        writeNote({ dismissed: "B" });
        expect(JSON.parse(sessionStorage.getItem("crm.frontendUpdate"))).toEqual({ dismissed: "B" });
        expect(localStorage.getItem("crm.frontendUpdate")).toBeNull();
        const broken = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("denied"); } };
        expect(readNote(broken)).toEqual({});
        expect(() => writeNote({ a: 1 }, broken)).not.toThrow();
    });
});
