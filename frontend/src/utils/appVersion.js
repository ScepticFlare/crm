// Which frontend build this tab is running, and which one is deployed now.
//
// A single-page app never re-downloads index.html while a tab stays open, so a
// tab opened (or restored by the browser) before a deployment keeps running
// the OLD code - e.g. without a newly added menu item - until a full reload.
// The build id below is compiled into this bundle (vite.config.js); the
// deployed one is read from /version.json, which every build publishes.
//
// Nothing here is sensitive. The only thing stored is a small note in
// sessionStorage (this tab only) about which deployed build the user already
// dismissed or refreshed for, so they are not asked again for the same one.

export const CURRENT_BUILD = import.meta.env.VITE_BUILD_ID || "dev";
export const CURRENT_COMMIT = import.meta.env.VITE_BUILD_COMMIT || "";

const NOTE_KEY = "crm.frontendUpdate";

// After a refresh for build X, if the page still runs the old build (a CDN
// edge can serve the previous index.html for a few minutes after a deploy),
// stay quiet for this long instead of asking again straight away.
export const RELOAD_GRACE_MS = 10 * 60 * 1000;

const BUILD_ID = /^[A-Za-z0-9._-]{1,80}$/;

// The deployed build id, or null when it can't be read (offline, dev server,
// an old deployment without version.json). Never throws.
export async function fetchDeployedBuild(fetchImpl = globalThis.fetch) {
    try {
        const base = import.meta.env.BASE_URL || "/";
        const res = await fetchImpl(`${base}version.json?t=${Date.now()}`, {
            cache: "no-store",
            credentials: "omit",
            headers: { Accept: "application/json" },
        });
        if (!res || !res.ok) {
            return null;
        }
        const data = await res.json();
        return typeof data?.buildId === "string" && BUILD_ID.test(data.buildId) ? data.buildId : null;
    } catch {
        return null;
    }
}

export function readNote(storage = globalThis.sessionStorage) {
    try {
        const note = JSON.parse(storage.getItem(NOTE_KEY));
        return note && typeof note === "object" ? note : {};
    } catch {
        return {};
    }
}

export function writeNote(note, storage = globalThis.sessionStorage) {
    try {
        storage.setItem(NOTE_KEY, JSON.stringify(note));
    } catch {
        // storage unavailable (private mode, quota): the notice just may repeat
    }
}

// Whether to tell the user about `deployed`.
export function shouldNotify(deployed, current, note = {}, now = Date.now()) {
    if (!deployed || !current || deployed === current) {
        return false;
    }
    if (note.dismissed === deployed) {
        return false;
    }
    if (note.reloadedFor === deployed && typeof note.at === "number" && now - note.at < RELOAD_GRACE_MS) {
        return false;
    }
    return true;
}
