import { useEffect, useState } from "react";

import { getActivity } from "../../services/activityService";
import LoadingState from "../ui/LoadingState";
import EmptyState from "../ui/EmptyState";
import { formatDateTime } from "../../utils/formatDate";

// Human-readable labels for the ActivityAction values that can actually
// appear under ActivityModule.LEAD (see backend enums.ActivityAction /
// service.LeadService) - falls back to the raw action value for anything
// unmapped rather than hiding it.
const ACTION_LABELS = {
    CREATE: "Created",
    VIEW: "Viewed",
    UPDATE: "Updated",
    DELETE: "Deleted",
    IMPORT: "Imported",
    EXPORT: "Exported",
    CONVERT: "Converted to Opportunity",
    EMAIL_SENT: "Email Sent",
    REMARKS_UPDATED: "Remarks Updated",
};

// Field-level history entries (Opportunity workflow changes) carry the
// field name plus its old/new value - see backend ActivityLogService.
// logFieldChange. Older entries have no fieldName and render from
// description exactly as before.
const FIELD_LABELS = {
    title: "Title",
    productValue: "Value",
    leadValidity: "Validity",
    salesStage: "Stage",
    subStatus: "Sub-status",
    expectedClosingDate: "Expected closing date",
    lostReason: "Lost reason",
    postponedReviewDate: "Postponed review date",
    postponedReminderAcknowledgedFor: "Postponed reminder acknowledged for review date",
    postponedReason: "Postponed reason",
    closingDateChangeReason: "Closing date change reason",
    leadStatus: "Lead status",
    invalidReason: "Invalid reason",
    assignedEmployee: "Assigned to",
    contactDeadline: "Contact by",
};

function displayValue(value, fieldName) {
    return value === null || value === undefined || value === ""
        ? "(none)"
        : (fieldName === "subStatus" || fieldName === "leadStatus" ? String(value).replaceAll("_", " ") : String(value));
}

// Fixed at 10 - this is a compact, embedded section on the Lead Details
// page, not a full list page, so there's no page-size picker like
// ListPagination.jsx offers elsewhere.
const PAGE_SIZE = 10;

// History/audit section for a single Lead - reuses the existing generic
// Activity Log API (GET /api/activity, see services/activityService.js)
// filtered to this Lead's module+entityId, rather than introducing a
// separate remarks-history model. Same embedded-section pattern as
// FollowUpSection.jsx (own fetch, own loading/empty state) below it on
// LeadDetails.
//
// "Important Activity" (default) excludes VIEW entries so repeatedly
// opening the lead doesn't bury real business history - VIEW is still
// recorded on every open (LeadService.getLeadById) and remains fully
// visible under "All Activity". Nothing is ever deleted or skipped at
// write time, only hidden from this one default read.
export default function LeadActivityHistory({ leadId, entityId, module = "LEAD", entityLabel = "lead" }) {

    // `leadId` is the original prop (Lead Details page); `entityId` lets the
    // Opportunity Details page reuse this same component with module="OPPORTUNITY".
    const targetId = entityId ?? leadId;

    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const [viewMode, setViewMode] = useState("important");
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const loadHistory = async () => {

        try {

            const response = await getActivity({
                filters: {
                    module,
                    entityId: targetId,
                    ...(viewMode === "important" ? { excludeAction: "VIEW" } : {}),
                },
                sort: { field: "createdDate", dir: "desc" },
                page,
                size: PAGE_SIZE,
            });

            setEntries(response.content || []);
            setTotalPages(response.totalPages || 0);
            setTotalElements(
                response.totalElements ?? (response.content ? response.content.length : 0)
            );

        } catch (err) {

            console.error(err);
            setError(true);

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadHistory();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetId, module, viewMode, page]);

    function handleViewModeChange(nextMode) {
        setViewMode(nextMode);
        setPage(0);
    }

    return (

        <div className="card shadow-sm border-0 mt-4">

            <div className="card-header bg-white d-flex justify-content-between align-items-center">

                <h5 className="mb-0 fw-semibold">Activity & History</h5>

                <select
                    className="form-select form-select-sm"
                    style={{ width: "180px" }}
                    value={viewMode}
                    onChange={(e) => handleViewModeChange(e.target.value)}
                >
                    <option value="important">Important Activity</option>
                    <option value="all">All Activity</option>
                </select>

            </div>

            <div className="card-body">

                {loading && (

                    <LoadingState className="text-center py-4" />

                )}

                {!loading && error && (

                    <EmptyState
                        icon="bi-exclamation-triangle"
                        title="Unable to Load History"
                        message={`Something went wrong while fetching this ${entityLabel}'s activity.`}
                        className="text-center text-muted py-4"
                    />

                )}

                {!loading && !error && entries.length === 0 && (

                    <EmptyState
                        icon="bi-clock-history"
                        title="No Activity Yet"
                        message={viewMode === "important"
                            ? "No important activity yet - switch to All Activity to see everything, including views."
                            : `Changes and interactions for this ${entityLabel} will appear here.`}
                        className="text-center text-muted py-4"
                    />

                )}

                {!loading && !error && entries.length > 0 && (

                    <>

                        <div className="table-responsive">

                            <table className="table table-hover align-middle">

                                <thead className="table-light">

                                    <tr>

                                        <th>Time</th>

                                        <th>Action</th>

                                        <th>Performed By</th>

                                        <th>Details</th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {entries.map((entry) => (

                                        <tr key={entry.id}>

                                            <td className="text-nowrap">
                                                {formatDateTime(entry.createdAt)}
                                            </td>

                                            <td>
                                                {ACTION_LABELS[entry.action] || entry.action}
                                            </td>

                                            <td>
                                                {entry.employeeName || "Unknown"}
                                            </td>

                                            <td>

                                                <div className="text-break" style={{ whiteSpace: "pre-wrap" }}>
                                                    {entry.fieldName ? (
                                                        <>
                                                            <span className="fw-semibold">
                                                                {FIELD_LABELS[entry.fieldName] || entry.fieldName}
                                                            </span>
                                                            {": "}
                                                            <span className="text-muted">{displayValue(entry.oldValue, entry.fieldName)}</span>
                                                            {" → "}
                                                            <span>{displayValue(entry.newValue, entry.fieldName)}</span>
                                                        </>
                                                    ) : (
                                                        entry.description || "-"
                                                    )}
                                                </div>

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                        <div className="d-flex justify-content-between align-items-center mt-2">

                            <span className="text-muted small">{totalElements} total</span>

                            <div className="d-flex align-items-center gap-2">

                                <button
                                    className="btn btn-outline-secondary btn-sm"
                                    disabled={page === 0}
                                    onClick={() => setPage(page - 1)}
                                >
                                    Previous
                                </button>

                                <span className="small">
                                    Page {page + 1} of {Math.max(totalPages, 1)}
                                </span>

                                <button
                                    className="btn btn-outline-secondary btn-sm"
                                    disabled={page + 1 >= totalPages}
                                    onClick={() => setPage(page + 1)}
                                >
                                    Next
                                </button>

                            </div>

                        </div>

                    </>

                )}

            </div>

        </div>

    );

}
