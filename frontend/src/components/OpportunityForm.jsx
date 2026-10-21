import { useEffect, useState } from "react";
import { getLeadById } from "../services/leadService";
import { getAllActivityTypes } from "../services/activityTypeService";
import {
    getAllSalesStages,
    getAllSalesStagesAdmin,
    createSalesStage,
    deleteSalesStage,
    activateSalesStage,
    updateSalesStage
} from "../services/salesStageService";
import DropdownAddManage from "./DropdownAddManage";
import {
    SUB_STATUS_OPTIONS,
    isLegacySubStage,
    typeOfStage
} from "./workflowConstants";

export default function OpportunityForm({
    form,
    handleChange,
    handleSubmit,
    loading,
    submitText,
    onCancel,
    leadId,
    isConversion = false,
    // The stage the opportunity is currently in (edit page) - used to
    // recognise it even if it has since been deactivated and is no longer
    // in the selectable list.
    currentStage = null,
    // The expected closing date the opportunity had when it was loaded (edit page).
    originalClosingDate = null,
    // Edit page: whether the opportunity already has a qualifying next action
    // (pending, future, described follow-up) - false asks for one here.
    hasNextAction = null
}) {

    const role = localStorage.getItem("role");

    const [lead, setLead] = useState(null);
    const [salesStages, setSalesStages] = useState([]);
    const [activityTypes, setActivityTypes] = useState([]);

    // The stage object for the chosen name; its stageType (not its name)
    // drives every stage-specific field below, so a renamed core stage
    // behaves exactly as before.
    const selectedStage =
        salesStages.find((s) => s.name === form.salesStage)
        || (currentStage && currentStage.name === form.salesStage ? currentStage : null);

    const selectedType = typeOfStage(selectedStage);

    // Required to convert a lead, and for any active opportunity.
    const closingDateRequired =
        isConversion || (selectedStage ? selectedStage.workflowActive !== false : false);

    // Whether the lead can be converted (VALID, and not already converted) is
    // decided by the backend, which sends the reason when it cannot - the
    // same rule the server enforces on the conversion request.
    const leadNotConvertible = isConversion && lead && !!lead.conversionBlockedReason;

    // An existing closing date of an active opportunity that is being
    // changed needs a reason (kept in the history).
    const closingDateChanged =
        !isConversion
        && !!originalClosingDate
        && !!form.expectedClosingDate
        && form.expectedClosingDate !== originalClosingDate
        && (selectedStage ? selectedStage.workflowActive !== false : false);

    // An ACTIVE opportunity must have a pending follow-up with a described
    // next action. When it has none yet (a new conversion from a lead without
    // one, or an older record being fixed), it is entered right here and
    // saved together with the opportunity.
    const stageIsActive = selectedStage ? selectedStage.workflowActive !== false : false;

    const needsNextActionInput = stageIsActive
        && (isConversion ? (!!lead && lead.hasNextAction === false) : hasNextAction === false);

    // Choosing a stage clears the fields that only make sense for another
    // stage, so nothing typed for LOST / POSTPONED / IN PROGRESS lingers.
    function handleStageChange(e) {

        handleChange(e);

        const next = salesStages.find((s) => s.name === e.target.value);
        const nextType = typeOfStage(next);

        if (nextType !== "IN_PROGRESS" && form.subStatus) {
            handleChange({ target: { name: "subStatus", value: "" } });
        }

        if (nextType !== "LOST" && form.lostReason) {
            handleChange({ target: { name: "lostReason", value: "" } });
        }

        if (nextType !== "POSTPONED" && form.postponedReviewDate) {
            handleChange({ target: { name: "postponedReviewDate", value: "" } });
        }

    }

    useEffect(() => {

        if (leadId) {
            loadLead();
        }

        loadSalesStages();

        getAllActivityTypes()
            .then(setActivityTypes)
            .catch((error) => console.error(error));

    }, [leadId]);

    async function loadLead() {

        try {

            const data = await getLeadById(leadId);

            setLead(data);

        } catch (error) {

            console.error(error);

            alert("Unable to load lead.");

        }

    }

    async function loadSalesStages() {

        try {

            const data = await getAllSalesStages();

            setSalesStages(data);

        } catch (error) {

            console.error(error);

            alert("Unable to load sales stages.");

        }

    }

    return (

        <>

            <form onSubmit={handleSubmit}>

                {leadNotConvertible && (
                    <div className="alert alert-danger">
                        {lead.conversionBlockedReason}
                    </div>
                )}

                <h5 className="mb-4">
                    Lead Information
                </h5>

                <div className="row">

                    <div className="col-md-6 mb-3">

                        <label className="form-label fw-bold">
                            Company
                        </label>

                        <input
                            className="form-control"
                            value={lead?.companyName || ""}
                            disabled
                        />

                    </div>

                    <div className="col-md-6 mb-3">

                        <label className="form-label fw-bold">
                            Contact Person
                        </label>

                        <input
                            className="form-control"
                            value={lead?.contactPerson || ""}
                            disabled
                        />

                    </div>

                    <div className="col-md-6 mb-3">

                        <label className="form-label fw-bold">
                            Phone
                        </label>

                        <input
                            className="form-control"
                            value={lead?.phone || ""}
                            disabled
                        />

                    </div>

                    <div className="col-md-6 mb-3">

                        <label className="form-label fw-bold">
                            Email
                        </label>

                        <input
                            className="form-control"
                            value={lead?.email || ""}
                            disabled
                        />

                    </div>

                    <div className="col-md-6 mb-3">

                        <label className="form-label fw-bold">
                            Products
                        </label>

                        <input
                            className="form-control"
                            value={
                                lead?.leadProducts?.length > 0
                                    ? lead.leadProducts
                                        .map(lp => `${lp.product?.name} (${lp.quantity})`)
                                        .join(", ")
                                    : ""
                            }
                            disabled
                        />

                    </div>

                    <div className="col-md-6 mb-3">

                        <label className="form-label fw-bold">
                            Industry
                        </label>

                        <input
                            className="form-control"
                            value={lead?.industry?.name || ""}
                            disabled
                        />

                    </div>

                </div>

                <hr className="my-4"/>

                <h5 className="mb-4">
                    Opportunity Information
                </h5>

                <div className="row">

                    <div className="col-md-6 mb-3">

                        <label className="form-label">
                            Opportunity Title *
                        </label>

                        <input
                            type="text"
                            className="form-control"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            required
                        />

                    </div>

                    <div className="col-md-6 mb-3">

                        <label className="form-label">
                            Product Value
                        </label>

                        <input
                            type="number"
                            className="form-control"
                            name="productValue"
                            value={form.productValue}
                            onChange={handleChange}
                        />

                    </div>

                    <div className="col-md-6 mb-3">

                        <label className="form-label">
                            Expected Closing Date{closingDateRequired ? " *" : ""}
                        </label>

                        <input
                            type="date"
                            className="form-control"
                            name="expectedClosingDate"
                            value={form.expectedClosingDate}
                            onChange={handleChange}
                            required={closingDateRequired}
                        />

                        {closingDateRequired && (
                            <div className="form-text">
                                Required - an estimate is fine. You can update it later.
                            </div>
                        )}

                    </div>

                    {closingDateChanged && (

                        <div className="col-md-6 mb-3">

                            <label className="form-label">
                                Reason for changing the closing date *
                            </label>

                            <input
                                className="form-control"
                                name="closingDateChangeReason"
                                value={form.closingDateChangeReason || ""}
                                onChange={handleChange}
                                placeholder="e.g. Customer's budget approval is delayed"
                                required
                            />

                            <div className="form-text">
                                Kept in this opportunity's history.
                            </div>

                        </div>

                    )}

                    <div className="col-md-3 mb-3">

                        <label className="form-label">
                            Sales Stage *
                        </label>

                        <DropdownAddManage
                            title="Sales Stage"
                            name="salesStage"
                            value={form.salesStage}
                            onChange={handleStageChange}
                            options={salesStages.filter((s) =>
                                !isLegacySubStage(s)
                                || s.name === form.salesStage
                            )}
                            required
                            isAdmin={role === "ADMIN"}
                            canAdd={role === "ADMIN"}
                            valueKey="name"
                            create={createSalesStage}
                            getAllIncludingInactive={getAllSalesStagesAdmin}
                            deactivate={deleteSalesStage}
                            activate={activateSalesStage}
                            rename={updateSalesStage}
                            onRefresh={loadSalesStages}
                            placeholder="Select Sales Stage"
                        />

                    </div>

                    <div className="col-md-3 mb-3">

                        <label className="form-label">
                            Validity *
                        </label>

                        <select
                            className="form-select"
                            name="leadValidity"
                            value={form.leadValidity}
                            onChange={handleChange}
                            required
                            disabled={isConversion}
                        >

                            <option value="VALID">
                                VALID
                            </option>

                            <option value="INVALID">
                                INVALID
                            </option>

                        </select>

                    </div>

                    {selectedType === "IN_PROGRESS" && (

                        <div className="col-md-6 mb-3">

                            <label className="form-label">
                                Sub-status (while In Progress)
                            </label>

                            <select
                                className="form-select"
                                name="subStatus"
                                value={form.subStatus || ""}
                                onChange={handleChange}
                            >

                                <option value="">None</option>

                                {SUB_STATUS_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}

                            </select>

                            <div className="form-text">
                                The opportunity stays IN PROGRESS - this only shows how far it has got.
                            </div>

                        </div>

                    )}

                    {isLegacySubStage(selectedStage) && (

                        <div className="col-12 mb-3">
                            <div className="alert alert-info mb-0">
                                This opportunity uses the older "{form.salesStage}" stage. "Quotation Sent" and
                                "Negotiation" are now sub-statuses of IN PROGRESS - you can move it by choosing
                                the IN PROGRESS stage and picking the sub-status.
                            </div>
                        </div>

                    )}

                    {selectedType === "LOST" && (

                        <div className="col-12 mb-3">

                            <label className="form-label">
                                Reason for losing this opportunity{form.legacyLostNoReason ? "" : " *"}
                            </label>

                            <textarea
                                className="form-control"
                                name="lostReason"
                                rows={3}
                                value={form.lostReason || ""}
                                onChange={handleChange}
                                placeholder="e.g. Customer chose a competitor on price"
                                required={!form.legacyLostNoReason}
                            />

                            {form.legacyLostNoReason && (
                                <div className="form-text">
                                    This older lost opportunity has no reason recorded - you may add one.
                                </div>
                            )}

                        </div>

                    )}

                    {selectedType === "POSTPONED" && (

                        <div className="col-md-6 mb-3">

                            <label className="form-label">
                                Review Date (optional)
                            </label>

                            <input
                                type="date"
                                className="form-control"
                                name="postponedReviewDate"
                                value={form.postponedReviewDate || ""}
                                onChange={handleChange}
                            />

                            <div className="form-text">
                                You will be reminded on this date. The stage does not change by itself.
                            </div>

                        </div>

                    )}

                    {selectedType === "POSTPONED" && (

                        <div className="col-md-6 mb-3">

                            <label className="form-label">
                                Reason for postponing (optional)
                            </label>

                            <input
                                className="form-control"
                                name="postponedReason"
                                value={form.postponedReason || ""}
                                onChange={handleChange}
                                placeholder="e.g. Customer froze capex until next quarter"
                            />

                        </div>

                    )}

                    {needsNextActionInput && (

                        <div className="col-12 mb-3">

                            <div className="alert alert-warning py-2">
                                <strong>A next action is required for an active opportunity.</strong>{" "}
                                {isConversion
                                    ? "This lead has no pending follow-up with a next action yet - enter it below (it is saved together with the opportunity), or schedule a follow-up for the lead first and come back."
                                    : "This opportunity has no pending, upcoming follow-up with a next action. Enter it below to fix that (it is saved together with your changes), or close/postpone the opportunity instead."}
                            </div>

                            <div className="row">

                                <div className="col-md-5 mb-3">
                                    <label className="form-label">Next action *</label>
                                    <input
                                        className="form-control"
                                        name="nextActionDescription"
                                        value={form.nextActionDescription || ""}
                                        onChange={handleChange}
                                        placeholder="e.g. Send the revised quotation"
                                        required
                                        minLength={3}
                                    />
                                </div>

                                <div className="col-md-3 mb-3">
                                    <label className="form-label">Activity type *</label>
                                    <select
                                        className="form-select"
                                        name="nextActionActivityTypeId"
                                        value={form.nextActionActivityTypeId || ""}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select</option>
                                        {activityTypes.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-4 mb-3">
                                    <label className="form-label">Follow-up date &amp; time *</label>
                                    <input
                                        type="datetime-local"
                                        className="form-control"
                                        name="nextFollowUpDate"
                                        value={form.nextFollowUpDate || ""}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                            </div>

                        </div>

                    )}

                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">

                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>

                    <button
                        className="btn btn-primary"
                        disabled={loading || leadNotConvertible}
                    >
                        {loading ? "Saving..." : submitText}
                    </button>

                </div>

            </form>

        </>

    );

}