import { describe, expect, it } from "vitest";

import { makeBuildInfo } from "../buildInfo.js";

describe("build id written into the bundle and /version.json", () => {

    const at = new Date("2026-11-12T10:00:00Z");

    it("uses Render's commit and branch when present", () => {
        const info = makeBuildInfo({ RENDER_GIT_COMMIT: "105532d0a1b2c3d4e5f60718293a4b5c6d7e8f90", RENDER_GIT_BRANCH: "feature/bulk-email" }, at);
        expect(info.commit).toBe("105532d0a1b2c3d4e5f60718293a4b5c6d7e8f90");
        expect(info.branch).toBe("feature/bulk-email");
        expect(info.buildId).toBe(`105532d0a1b2-${at.getTime().toString(36)}`);
        expect(info.builtAt).toBe("2026-11-12T10:00:00.000Z");
    });

    it("still identifies a local build without git information", () => {
        const info = makeBuildInfo({}, at);
        expect(info.buildId).toMatch(/^local-[0-9a-z]+$/);
        expect(info.commit).toBeNull();
        expect(info.branch).toBeNull();
    });

    it("is different for every build, even of the same commit", () => {
        const env = { RENDER_GIT_COMMIT: "abc123" };
        expect(makeBuildInfo(env, at).buildId).not.toBe(makeBuildInfo(env, new Date(at.getTime() + 1000)).buildId);
    });

    it("keeps only safe characters, so the id is always a plain token", () => {
        const info = makeBuildInfo({ RENDER_GIT_COMMIT: "abc<script>\"1", RENDER_GIT_BRANCH: "main; rm -rf" }, at);
        expect(info.buildId).toMatch(/^[A-Za-z0-9._-]+$/);
        expect(info.branch).toBe("mainrm-rf");
    });
});
