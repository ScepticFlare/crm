import { useCallback, useEffect, useState } from "react";

import { CURRENT_BUILD, fetchDeployedBuild, readNote, shouldNotify, writeNote } from "../utils/appVersion";

// Polls /version.json (no-store) every few minutes and whenever the tab becomes
// visible again; reports a newer deployed build. It NEVER reloads by itself -
// the user decides when (after saving their work), so nothing unsaved is lost
// and there is no reload loop. Off in development (no version.json there).
export const CHECK_INTERVAL_MS = 5 * 60 * 1000;

export default function useFrontendUpdate({
    enabled = import.meta.env.PROD,
    current = CURRENT_BUILD,
    intervalMs = CHECK_INTERVAL_MS,
    fetchBuild = fetchDeployedBuild,
    reload = () => window.location.reload(),
} = {}) {

    const [deployed, setDeployed] = useState(null);

    useEffect(() => {

        if (!enabled) {
            return undefined;
        }

        let active = true;
        let inFlight = false;

        async function check() {
            if (!active || inFlight || document.visibilityState === "hidden") {
                return;
            }
            inFlight = true;
            try {
                const build = await fetchBuild();
                if (active && shouldNotify(build, current, readNote(), Date.now())) {
                    setDeployed(build);     // same id again -> no re-render, no repeated notice
                }
            } finally {
                inFlight = false;
            }
        }

        const onVisible = () => {
            if (document.visibilityState === "visible") {
                check();
            }
        };

        check();
        const timer = setInterval(check, intervalMs);
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            active = false;
            clearInterval(timer);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [enabled, current, intervalMs, fetchBuild]);

    const refresh = useCallback(() => {
        writeNote({ ...readNote(), reloadedFor: deployed, at: Date.now() });
        reload();
    }, [deployed, reload]);

    // Hides the notice for THIS deployed build only; a later one is reported again.
    const dismiss = useCallback(() => {
        writeNote({ ...readNote(), dismissed: deployed });
        setDeployed(null);
    }, [deployed]);

    return { available: deployed !== null, deployed, refresh, dismiss };
}
