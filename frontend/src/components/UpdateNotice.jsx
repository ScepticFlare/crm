import useFrontendUpdate from "../hooks/useFrontendUpdate";

// Small, non-blocking notice shown when a newer CRM build has been deployed
// than the one this tab is running. Refreshing is always the user's choice.
export default function UpdateNotice(props) {

    const { available, refresh, dismiss } = useFrontendUpdate(props);

    if (!available) {
        return null;
    }

    return (
        <div
            role="status"
            aria-live="polite"
            className="alert alert-info shadow d-flex align-items-start gap-2 mb-0"
            style={{ position: "fixed", right: 16, bottom: 16, zIndex: 1080, maxWidth: 420 }}
        >
            <i className="bi bi-arrow-clockwise mt-1"></i>
            <div className="flex-grow-1 small">
                <strong>A new version of the CRM is available.</strong>
                <div>Save anything you are working on, then refresh to get the latest features.</div>
                <button type="button" className="btn btn-sm btn-primary mt-2" onClick={refresh}>
                    Refresh now
                </button>
            </div>
            <button type="button" className="btn-close" aria-label="Dismiss" onClick={dismiss}></button>
        </div>
    );
}
