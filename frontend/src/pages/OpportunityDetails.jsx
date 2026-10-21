import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DetailField from "../components/DetailField";
import SectionCard from "../components/ui/SectionCard";
import FollowUpSection from "../components/FollowUpSection";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import DetailHeader from "../components/detail/DetailHeader";
import LeadActivityHistory from "../components/detail/LeadActivityHistory";
import DeleteModal from "../components/DeleteModal";

import {
    getOpportunityById,
    deleteOpportunity,
    getOpportunityDeleteImpact,
    acknowledgePostponedReminder,
    returnToInProgress
} from "../services/opportunityService";
import { subStatusLabel, nextActionPayload } from "../components/workflowConstants";
import { getAllActivityTypes } from "../services/activityTypeService";
import { describeDeleteImpact } from "../utils/deleteImpact";
import { formatDate, formatDateTime } from "../utils/formatDate";

export default function OpportunityDetails() {

    const { id } = useParams();
    const navigate = useNavigate();

    // Backend is the source of truth (OPPORTUNITY_DELETE is ADMIN-only -
    // see OpportunityService.deleteOpportunity) - this only controls
    // whether the Delete menu item is offered at all.
    const isAdmin = localStorage.getItem("role") === "ADMIN";

    const [opportunity, setOpportunity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteImpact, setDeleteImpact] = useState(null);

    // Postponed-reminder actions (see the reminder banner below).
    const [reminderBusy, setReminderBusy] = useState(false);
    const [showResume, setShowResume] = useState(false);
    const [resumeDate, setResumeDate] = useState("");
    const [resumeAction, setResumeAction] = useState({
        nextActionDescription: "", nextActionActivityTypeId: "", nextFollowUpDate: ""
    });
    const [activityTypes, setActivityTypes] = useState([]);

    useEffect(() => {
        loadOpportunity();
    }, []);

    // "OK" - dismisses the reminder only; the stage stays POSTPONED.
    async function handleAcknowledge() {

        setReminderBusy(true);

        try {

            setOpportunity(await acknowledgePostponedReminder(id));

        } catch (err) {

            console.error(err);
            alert(err.response?.data?.message || "Unable to acknowledge the reminder.");

        } finally {

            setReminderBusy(false);

        }

    }

    // Separate, explicit action - the only thing here that changes the stage.
    async function handleReturnToInProgress() {

        if (!resumeDate) {
            alert("Please enter an expected closing date (an estimate is fine).");
            return;
        }

        setReminderBusy(true);

        try {

            setOpportunity(await returnToInProgress(id, resumeDate, nextActionPayload(resumeAction)));
            setShowResume(false);

        } catch (err) {

            console.error(err);
            alert(err.response?.data?.message || "Unable to return the opportunity to In Progress.");

        } finally {

            setReminderBusy(false);

        }

    }

    async function loadOpportunity() {

        try {

            const data = await getOpportunityById(id);
            setOpportunity(data);

        } catch (err) {

            console.error(err);
            alert("Failed to load opportunity.");

        } finally {

            setLoading(false);

        }

    }

    async function openDeleteModal() {

        try {

            const impact = await getOpportunityDeleteImpact(opportunity.id);
            setDeleteImpact(impact);

        } catch (err) {

            console.error(err);
            setDeleteImpact(null);

        }

        setShowDeleteModal(true);

    }

    async function confirmDelete() {

        try {

            await deleteOpportunity(opportunity.id);
            navigate("/opportunities");

        } catch (err) {

            console.error(err);
            alert(err.response?.data?.message || "Unable to delete opportunity.");
            setShowDeleteModal(false);

        }

    }

    function formatCurrency(value) {

        if (!value) return "-";

        return Number(value).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        });

    }

    if (loading) {

        return (

            <LoadingState className="text-center mt-5" />

        );

    }

    if (!opportunity) {

        return (

            <div className="alert alert-danger">

                Opportunity not found.

            </div>

        );

    }

    const lead = opportunity.lead;
    const employee = lead?.assignedEmployee;
    // Stage behaviour comes from the stage TYPE, so renaming a stage never
    // changes it.
    const stageType = opportunity.salesStage?.stageType;
    const isWon = stageType === "WON";
    const stageName = opportunity.salesStage?.name || "";
    const isLost = stageType === "LOST";
    const isPostponed = stageType === "POSTPONED";
    const subStatus = subStatusLabel(opportunity.effectiveSubStatus);
    const hasStatusDetails =
        subStatus || isLost || opportunity.lostReason || isPostponed || opportunity.postponedReviewDate;

    return (

        <>

            <DetailHeader
                backTo="/opportunities"
                title={opportunity.title}
                subtitle={lead?.companyName}
                status={opportunity.salesStage?.name || "Not Set"}
                meta={`Opportunity #${opportunity.id}`}
                primaryAction={{
                    label: "Convert to Customer",
                    icon: "bi-arrow-repeat",
                    disabled: !isWon,
                    title: !isWon ? "Only WON opportunities can be converted to customers." : "",
                    onClick: () => navigate(`/customers/convert/${opportunity.id}`),
                }}
                onEdit={() => navigate(`/opportunities/edit/${opportunity.id}`)}
                menuItems={isAdmin ? [
                    {
                        label: "Delete Opportunity",
                        icon: "bi-trash",
                        danger: true,
                        onClick: openDeleteModal,
                    },
                ] : []}
            />

            {isPostponed && (

                <div className="alert alert-info">

                    {opportunity.postponedReminderDue ? (

                        <>
                            <div className="fw-semibold">
                                Review date reached ({formatDate(opportunity.postponedReviewDate)}) - this opportunity is postponed.
                            </div>

                            <div className="mb-2">
                                "OK" only dismisses this reminder - the opportunity stays POSTPONED. Use
                                "Return to In Progress" if you want to resume working on it.
                            </div>
                        </>

                    ) : (

                        <div className="mb-2">
                            <span className="fw-semibold">This opportunity is postponed.</span>{" "}
                            {opportunity.postponedReviewDate
                                ? `Review date: ${formatDate(opportunity.postponedReviewDate)}. `
                                : "No review date set. "}
                            It stays POSTPONED until you choose to resume it.
                        </div>

                    )}

                    {!showResume ? (

                        <div className="d-flex flex-wrap gap-2">

                            {opportunity.postponedReminderDue && (
                                <button
                                    className="btn btn-sm btn-primary"
                                    disabled={reminderBusy}
                                    onClick={handleAcknowledge}
                                >
                                    OK
                                </button>
                            )}

                            <button
                                className="btn btn-sm btn-outline-primary"
                                disabled={reminderBusy}
                                onClick={() => {
                                    setResumeDate(opportunity.expectedClosingDate || "");
                                    setShowResume(true);

                                    if (opportunity.hasNextAction === false && activityTypes.length === 0) {
                                        getAllActivityTypes().then(setActivityTypes).catch(console.error);
                                    }
                                }}
                            >
                                Return to In Progress
                            </button>

                        </div>

                    ) : (

                        <div className="d-flex flex-wrap align-items-end gap-2">

                            <div>
                                <label className="form-label mb-1 small">
                                    Expected closing date *
                                </label>
                                <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={resumeDate}
                                    onChange={(e) => setResumeDate(e.target.value)}
                                />
                            </div>

                            {opportunity.hasNextAction === false && (
                                <>
                                    <div>
                                        <label className="form-label mb-1 small">Next action *</label>
                                        <input
                                            className="form-control form-control-sm"
                                            value={resumeAction.nextActionDescription}
                                            placeholder="e.g. Re-open the discussion"
                                            onChange={(e) => setResumeAction((a) => ({ ...a, nextActionDescription: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label mb-1 small">Activity type *</label>
                                        <select
                                            className="form-select form-select-sm"
                                            value={resumeAction.nextActionActivityTypeId}
                                            onChange={(e) => setResumeAction((a) => ({ ...a, nextActionActivityTypeId: e.target.value }))}
                                        >
                                            <option value="">Select</option>
                                            {activityTypes.map((t) => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label mb-1 small">Follow-up date &amp; time *</label>
                                        <input
                                            type="datetime-local"
                                            className="form-control form-control-sm"
                                            value={resumeAction.nextFollowUpDate}
                                            onChange={(e) => setResumeAction((a) => ({ ...a, nextFollowUpDate: e.target.value }))}
                                        />
                                    </div>
                                </>
                            )}

                            <button
                                className="btn btn-sm btn-primary"
                                disabled={reminderBusy}
                                onClick={handleReturnToInProgress}
                            >
                                {reminderBusy ? "Saving..." : "Confirm - move to In Progress"}
                            </button>

                            <button
                                className="btn btn-sm btn-outline-secondary"
                                disabled={reminderBusy}
                                onClick={() => setShowResume(false)}
                            >
                                Cancel
                            </button>

                        </div>

                    )}

                </div>

            )}

            {opportunity.closingDateExpired && (

                <div className="alert alert-warning">

                    <div className="fw-semibold">
                        The expected closing date ({formatDate(opportunity.expectedClosingDate)}) has passed.
                    </div>

                    <div className="mb-2">
                        This opportunity is still {stageName} - nothing has been changed automatically. Please:
                    </div>

                    <ol className="mb-2">
                        <li>Review the current status with the customer.</li>
                        <li>Update the expected closing date if the opportunity is still active.</li>
                        <li>Schedule a follow-up if a next action is needed.</li>
                        <li>Update the stage to WON, LOST or POSTPONED if that reflects the actual outcome.</li>
                    </ol>

                    <div className="d-flex flex-wrap gap-2">

                        <button
                            className="btn btn-sm btn-warning"
                            onClick={() => navigate(`/opportunities/edit/${opportunity.id}`)}
                        >
                            Update date / stage
                        </button>

                        <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => navigate(`/followups/add?opportunityId=${opportunity.id}`)}
                        >
                            Schedule follow-up
                        </button>

                    </div>

                </div>

            )}

            {opportunity.noNextAction && (

                <div className="alert alert-warning d-flex flex-wrap justify-content-between align-items-center gap-2">

                    <div>
                        <span className="fw-semibold">Next action missing.</span>{" "}
                        An active opportunity needs a pending follow-up with a next action and a future date.
                        Schedule one (describe the next action), or use Edit to enter it while saving. Until
                        then the opportunity cannot be saved as active, but you can still view it, close it
                        (Won / Lost) or postpone it.
                    </div>

                    <div className="d-flex gap-2">

                        <button
                            className="btn btn-sm btn-primary"
                            onClick={() => navigate(`/followups/add?opportunityId=${opportunity.id}`)}
                        >
                            Schedule follow-up
                        </button>

                        <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => navigate(`/opportunities/edit/${opportunity.id}`)}
                        >
                            Edit opportunity
                        </button>

                    </div>

                </div>

            )}

            <div className="row g-3 mb-3">

                <div className="col-md-3">
                    <div className="card shadow-sm text-center h-100">
                        <div className="card-body">
                            <small className="text-muted">Opportunity Value</small>
                            <h5 className="mt-2">{formatCurrency(opportunity.productValue)}</h5>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card shadow-sm text-center h-100">
                        <div className="card-body">
                            <small className="text-muted">Sales Stage</small>
                            <h5 className="mt-2">
                                <StatusBadge status={opportunity.salesStage?.name || "Not Set"} />
                            </h5>
                            {subStatus && (
                                <div className="small text-muted">Sub-status: {subStatus}</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card shadow-sm text-center h-100">
                        <div className="card-body">
                            <small className="text-muted">Expected Close</small>
                            <h5 className="mt-2">{formatDate(opportunity.expectedClosingDate)}</h5>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card shadow-sm text-center h-100">
                        <div className="card-body">
                            <small className="text-muted">Assigned Employee</small>
                            <h5 className="mt-2">{employee?.name || "-"}</h5>
                        </div>
                    </div>
                </div>

            </div>

            <div className="row g-3">

                <div className="col-lg-8">

                    <SectionCard title="Lead Information">

                        <div className="row">

                            <div className="col-md-6">
                                <DetailField label="Company" value={lead?.companyName} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Contact Person" value={lead?.contactPerson} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Designation" value={lead?.designation} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Phone" value={lead?.phone} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Alternate Phone" value={lead?.alternatePhone} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Email" value={lead?.email} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Secondary Email" value={lead?.secondaryEmail} />
                            </div>

                            <div className="col-md-6">
                                <DetailField
                                    label="Products"
                                    value={lead?.leadProducts?.length > 0
                                        ? lead.leadProducts
                                            .map(lp => `${lp.product?.name} (${lp.quantity})`)
                                            .join(", ")
                                        : ""}
                                />
                            </div>

                            <div className="col-md-6">
                                <DetailField
                                    label="Battery"
                                    value={lead?.leadBatteries?.length > 0
                                        ? lead.leadBatteries
                                            .map(lb => `${lb.battery?.name} (${lb.quantity})`)
                                            .join(", ")
                                        : ""}
                                />
                            </div>

                            <div className="col-md-4">
                                <DetailField label="City" value={lead?.city} />
                            </div>

                            <div className="col-md-4">
                                <DetailField label="State" value={lead?.state} />
                            </div>

                            <div className="col-md-4">
                                <DetailField label="Pincode" value={lead?.pincode} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Lead Source" value={lead?.leadSource?.name} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Lead Status" status={lead?.leadStatus} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Validity" status={opportunity?.leadValidity} />
                            </div>

                        </div>

                        <div className="mt-4">

                            <label className="fw-semibold mb-2 d-block">Description</label>

                            <div className="border rounded p-3 bg-light">
                                {lead?.description || "No description available."}
                            </div>

                        </div>

                    </SectionCard>

                    <LeadActivityHistory
                        entityId={opportunity.id}
                        module="OPPORTUNITY"
                        entityLabel="opportunity"
                    />

                </div>

                <div className="col-lg-4">

                    {hasStatusDetails && (

                        <SectionCard title="Status Details">

                            {subStatus && (
                                <DetailField label="Sub-status" value={subStatus} />
                            )}

                            {(isLost || opportunity.lostReason) && (
                                <DetailField
                                    label="Lost Reason"
                                    value={opportunity.lostReason || "Not recorded"}
                                />
                            )}

                            {(isPostponed || opportunity.postponedReviewDate) && (
                                <DetailField
                                    label="Postponed Review Date"
                                    value={opportunity.postponedReviewDate
                                        ? formatDate(opportunity.postponedReviewDate)
                                        : "Not set"}
                                />
                            )}

                            {(isPostponed || opportunity.postponedReason) && (
                                <DetailField
                                    label="Postponed Reason"
                                    value={opportunity.postponedReason || "Not recorded"}
                                />
                            )}

                        </SectionCard>

                    )}

                    <SectionCard title="Assigned Employee">

                        <DetailField label="Name" value={employee?.name} />
                        <DetailField label="Email" value={employee?.email} />
                        <DetailField label="Phone" value={employee?.phone} />
                        <DetailField label="Status" status={employee?.isActive ? "Active" : "Inactive"} />

                    </SectionCard>

                    <SectionCard title="Record Info">

                        <DetailField label="Created" value={formatDateTime(opportunity.createdAt)} />
                        <DetailField label="Last Updated" value={formatDateTime(opportunity.updatedAt)} />

                    </SectionCard>

                </div>

            </div>

            <FollowUpSection
                opportunityId={opportunity.id}
            />

            <DeleteModal
                show={showDeleteModal}
                title="Delete Opportunity"
                message={`Are you sure you want to delete "${opportunity.title}"?`}
                {...describeDeleteImpact(deleteImpact, "Opportunity")}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
            />

        </>

    );
}
