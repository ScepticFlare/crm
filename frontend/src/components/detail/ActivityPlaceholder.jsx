// Reserved spot for the future Activity/History timeline on record-detail
// pages. Intentionally not implemented yet - see the UX/security cleanup
// pass scope. Keeping the placeholder consistent now means Activity/History
// can be dropped in later without another layout pass across four modules.
export default function ActivityPlaceholder() {

    return (

        <div className="card border-0 shadow-sm mt-4">

            <div className="card-body text-center py-5 text-muted">

                <i className="bi bi-clock-history fs-2 d-block mb-2"></i>

                <div className="fw-semibold">Activity & History</div>

                <small>Coming soon — a timeline of changes and interactions for this record.</small>

            </div>

        </div>

    );

}
