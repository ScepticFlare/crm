// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
const download = vi.hoisted(() => ({ downloadBlob: vi.fn() }));

vi.mock("../api", () => ({ default: api }));
vi.mock("../../utils/downloadFile", () => download);

import { BackupIntegrityError, downloadBackup, startBackup } from "../backupService";

const BYTES = new TextEncoder().encode("PGDMP archive");

async function sha256(bytes) {
    const d = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

beforeEach(() => vi.clearAllMocks());

describe("backupService", () => {

    it("starts a backup with a POST to the admin endpoint", async () => {
        api.post.mockResolvedValue({ data: { id: 1, status: "RUNNING" } });

        expect(await startBackup()).toEqual({ id: 1, status: "RUNNING" });
        expect(api.post).toHaveBeenCalledWith("/admin/backups");
    });

    it("downloads through the authenticated API and saves only a complete, matching file", async () => {
        api.get.mockResolvedValue({ data: new Blob([BYTES]) });
        const backup = { id: 4, sizeBytes: BYTES.length, sha256: await sha256(BYTES), fileName: "crm-backup-4.dump" };

        await downloadBackup(backup);

        expect(api.get).toHaveBeenCalledWith("/admin/backups/4/download", expect.objectContaining({ responseType: "blob" }));
        expect(download.downloadBlob).toHaveBeenCalledWith(expect.any(Blob), "crm-backup-4.dump");
    });

    it("refuses a truncated download", async () => {
        api.get.mockResolvedValue({ data: new Blob([BYTES.slice(0, 5)]) });

        await expect(downloadBackup({ id: 4, sizeBytes: BYTES.length, sha256: "x" }))
            .rejects.toBeInstanceOf(BackupIntegrityError);
        expect(download.downloadBlob).not.toHaveBeenCalled();
    });

    it("refuses a download whose checksum does not match", async () => {
        api.get.mockResolvedValue({ data: new Blob([BYTES]) });

        await expect(downloadBackup({ id: 4, sizeBytes: BYTES.length, sha256: "0".repeat(64) }))
            .rejects.toThrow(/checksum/);
        expect(download.downloadBlob).not.toHaveBeenCalled();
    });
});
