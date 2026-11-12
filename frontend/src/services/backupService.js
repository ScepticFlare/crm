import api from "./api";

import { downloadBlob } from "../utils/downloadFile";

// Database backups ("Take Backup"). ADMIN only - the backend enforces it on
// every one of these calls (403 for anyone else), the route guard is only UX.

export const listBackups = async () => {
    const response = await api.get("/admin/backups");
    return response.data;
};

export const getBackup = async (id) => {
    const response = await api.get(`/admin/backups/${id}`);
    return response.data;
};

// Starts a backup in the background: 202 with { id, status: "RUNNING" }.
// 409 while another backup is running, 503 when backups are not configured.
export const startBackup = async () => {
    const response = await api.post("/admin/backups");
    return response.data;
};

async function sha256Hex(blob) {

    const subtle = globalThis.crypto?.subtle;

    if (!subtle || typeof blob.arrayBuffer !== "function") {
        return null; // cannot check here (e.g. a non-HTTPS origin); size is still checked
    }

    const digest = await subtle.digest("SHA-256", await blob.arrayBuffer());
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export class BackupIntegrityError extends Error {}

// Fetches the file through the authenticated API (never a public link), checks
// it is complete - same size and SHA-256 as recorded when the backup was made -
// and only then saves it.
export const downloadBackup = async (backup) => {

    const response = await api.get(`/admin/backups/${backup.id}/download`, {
        responseType: "blob",
        timeout: 10 * 60 * 1000,
    });

    const blob = response.data;

    if (typeof backup.sizeBytes === "number" && blob.size !== backup.sizeBytes) {
        throw new BackupIntegrityError("The downloaded file is incomplete. Please try again.");
    }

    const actual = await sha256Hex(blob);

    if (actual && backup.sha256 && actual !== backup.sha256.toLowerCase()) {
        throw new BackupIntegrityError("The downloaded file does not match the backup's checksum. Please try again.");
    }

    downloadBlob(blob, backup.fileName || `crm-backup-${backup.id}.dump`);
};
