// actions: [{ key, label, icon, variant, onClick, disabled, title,
//             unavailableForAllMatching }]
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
}) {

    if (count === 0 && !allMatching) {
        return null;
    }

    const canOfferAllMatching =
        !allMatching && onSelectAllMatching && pageFullySelected && totalElements > pageRowCount;

    return (

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
                            {count} selected{pageFullySelected ? " on this page" : ""}
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

                        const blocked = allMatching && action.unavailableForAllMatching;

                        return (

                            <button
                                key={action.key}
                                type="button"
                                className={`btn btn-sm ${action.variant || "btn-outline-primary"}`}
                                onClick={action.onClick}
                                disabled={action.disabled || !!blocked || count === 0}
                                title={blocked ? action.unavailableForAllMatching : action.title}
                            >
                                {action.icon && <i className={`bi ${action.icon} me-1`}></i>}
                                {action.label}
                            </button>

                        );

                    })}

                </div>

            </div>

            {allMatching && (
                <div className="small text-muted mt-1">
                    Every record matching the current search and filters is selected, on all pages -
                    including ones not shown here. Changing the search or filters clears this selection.
                </div>
            )}

        </div>

    );

}
