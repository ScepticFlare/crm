// actions: [{ key, label, icon, variant, onClick, disabled, title,
//             unavailableForAllMatching, maxCount, overLimitMessage }]
//
// maxCount: the most records the action takes in one go (e.g. 100 for Bulk
// Email / WhatsApp). With more selected it is disabled and the reason is
// shown under the bar - the selection is never silently cut down.
//
// Selection scope is always spelled out, so nobody exports "everything" when
// they meant one page (or the reverse):
//  - only rows picked on screen: "N selected";
//  - the whole page is ticked and more records match: an explicit
//    "Select all T matching records" link;
//  - all matching records selected (list.allMatching): "All T matching
//    records selected" (minus any rows unticked since), with a way back.
// An action that cannot run on an "all matching" selection (it needs the
// actual rows in the browser, or has its own size limit) sets
// unavailableForAllMatching to the reason, and is disabled with that reason
// as its tooltip while that selection is active.
function limitMessage(action) {
    return action.overLimitMessage
        || `${action.label} handles at most ${action.maxCount} records at a time - untick some to use it.`;
}

export default function BulkActionBar({
    count,
    actions,
    onClear,
    allMatching = false,
    excludedCount = 0,
    pageFullySelected = false,
    pageRowCount = 0,
    totalElements = 0,
    onSelectAllMatching = null,
    // How many of the selected records are on the page shown (ticked records
    // on other pages stay selected).
    pageSelectedCount = null,
    // e.g. "Your selection was cleared because the search or filters
    // changed." (list.selectionNotice), with its dismiss handler.
    notice = null,
    onDismissNotice = null,
}) {

    const noticeBanner = notice && (
        <div className="alert alert-info py-2 d-flex justify-content-between align-items-center mb-3"
             role="status" data-testid="selection-notice">
            <span className="small">{notice}</span>
            {onDismissNotice && (
                <button type="button" className="btn-close btn-sm" aria-label="Dismiss" onClick={onDismissNotice}></button>
            )}
        </div>
    );

    if (count === 0 && !allMatching) {
        return noticeBanner || null;
    }

    const acrossPages = !allMatching && pageSelectedCount !== null && pageSelectedCount < count;

    const canOfferAllMatching =
        !allMatching && onSelectAllMatching && pageFullySelected && totalElements > pageRowCount;

    return (

        <>
        {noticeBanner}
        <div className="bulk-action-bar mb-3">

            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">

                <div className="d-flex align-items-center gap-2 flex-wrap">

                    {allMatching ? (
                        <strong data-testid="selection-summary">
                            All {count} matching record(s) selected
                            {excludedCount > 0 ? ` (${excludedCount} unticked)` : ""}
                        </strong>
                    ) : (
                        <strong data-testid="selection-summary">
                            {count} selected
                            {acrossPages
                                ? ` (${pageSelectedCount} on this page, ${count - pageSelectedCount} on other pages)`
                                : pageFullySelected ? " on this page" : ""}
                        </strong>
                    )}

                    {canOfferAllMatching && (
                        <button
                            type="button"
                            className="btn btn-sm btn-link p-0"
                            onClick={onSelectAllMatching}
                        >
                            Select all {totalElements} matching records
                        </button>
                    )}

                    <button type="button" className="btn btn-sm btn-link p-0" onClick={onClear}>
                        Clear selection
                    </button>

                </div>

                <div className="d-flex gap-2 flex-wrap">

                    {actions.map((action) => {

                        const overLimit = !allMatching && action.maxCount != null && count > action.maxCount;
                        const blocked = (allMatching && action.unavailableForAllMatching)
                            || (overLimit && limitMessage(action));

                        return (

                            <button
                                key={action.key}
                                type="button"
                                className={`btn btn-sm ${action.variant || "btn-outline-primary"}`}
                                onClick={action.onClick}
                                disabled={action.disabled || !!blocked || count === 0}
                                title={blocked || action.title}
                            >
                                {action.icon && <i className={`bi ${action.icon} me-1`}></i>}
                                {action.label}
                            </button>

                        );

                    })}

                </div>

            </div>

            {!allMatching && actions.filter((a) => a.maxCount != null && count > a.maxCount).map((a) => (
                <div key={a.key} className="small text-warning-emphasis mt-1" data-testid={`limit-${a.key}`}>
                    {limitMessage(a)}
                </div>
            ))}

            {allMatching && (
                <div className="small text-muted mt-1">
                    Every record matching the current search and filters is selected, on all pages -
                    including ones not shown here. Changing the search or filters clears this selection.
                </div>
            )}

        </div>
        </>

    );

}
