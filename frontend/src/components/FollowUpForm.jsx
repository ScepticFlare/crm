import { useEffect, useState } from "react";

import {
    getAllActivityTypes,
    getAllActivityTypesAdmin,
    createActivityType,
    deleteActivityType,
    activateActivityType,
    updateActivityType
} from "../services/activityTypeService";
import DropdownAddManage from "./DropdownAddManage";
import { formatDateTime } from "../utils/formatDate";
import BritishDateTimeInput from "./inputs/BritishDateTimeInput";

export default function FollowUpForm({
    form,
    setForm,
    employees,
    leads,
    opportunities,
    onSubmit,
    submitText,
    hideLead = false,
    hideOpportunity = false,
    // Edit page, while this follow-up is being marked Completed and its
    // opportunity still needs a next follow-up (it is active or Postponed):
    // { required: true } asks for the next one here (created together with
    // the completion); { required: false, existingDate } shows the upcoming
    // one that already exists, so nothing new is asked for. Null otherwise.
    completionPrompt = null,
}) {

    const [activityTypes, setActivityTypes] = useState([]);

    const role = localStorage.getItem("role");

    // A pending follow-up attached to an opportunity is that opportunity's
    // next action, so it must be described (the backend enforces this too).
    const nextActionRequired = !!form.opportunityId && form.status === "PENDING";

    useEffect(() => {
        loadActivityTypes();
    }, []);

    async function loadActivityTypes() {
        try {
            const data = await getAllActivityTypes();
            setActivityTypes(data);
        } catch (err) {
            console.error("Failed to load activity types", err);
        }
    }

    function handleChange(e) {
        const { name, value } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    }

    return (
        <>
            <div className="card shadow-sm border-0">

                <div className="card-body p-4">

                    <form onSubmit={onSubmit}>

                        <div className="row g-3">

                            {/* Lead */}

                            {!hideLead && (

                                <div className="col-md-6">

                                    <label className="form-label">
                                        Lead
                                    </label>

                                    <select
                                        className="form-select"
                                        name="leadId"
                                        value={form.leadId}
                                        onChange={handleChange}
                                    >

                                        <option value="">
                                            Select Lead
                                        </option>

                                        {leads.map(lead => (

                                            <option
                                                key={lead.id}
                                                value={lead.id}
                                            >
                                                {lead.companyName}
                                            </option>

                                        ))}

                                    </select>

                                </div>

                            )}

                            {/* Opportunity */}

                            {!hideOpportunity && (

                                <div className="col-md-6">

                                    <label className="form-label">
                                        Opportunity
                                    </label>

                                    <select
                                        className="form-select"
                                        name="opportunityId"
                                        value={form.opportunityId}
                                        onChange={handleChange}
                                    >

                                        <option value="">
                                            Select Opportunity
                                        </option>

                                        {opportunities.map(opp => (

                                            <option
                                                key={opp.id}
                                                value={opp.id}
                                            >
                                                {opp.title}
                                            </option>

                                        ))}

                                    </select>

                                </div>

                            )}

                            {/* Employee (ADMIN only) */}

                            {role === "ADMIN" && (

                                <div className="col-md-6">

                                    <label className="form-label">
                                        Assigned Employee *
                                    </label>

                                    <select
                                        className="form-select"
                                        name="employeeId"
                                        value={form.employeeId}
                                        onChange={handleChange}
                                        required
                                    >

                                        <option value="">
                                            Select Employee
                                        </option>

                                        {employees.map(emp => (

                                            <option
                                                key={emp.id}
                                                value={emp.id}
                                            >
                                                {emp.name}
                                            </option>

                                        ))}

                                    </select>

                                </div>

                            )}

                            {/* Activity Type */}

                            <div className="col-md-6">

                                <label className="form-label">
                                    Activity Type *
                                </label>

                                <DropdownAddManage
                                    title="Activity Type"
                                    name="activityTypeId"
                                    value={form.activityTypeId}
                                    onChange={handleChange}
                                    options={activityTypes}
                                    required
                                    // Managing activity types is ADMIN-only on
                                    // the server; others only pick active ones.
                                    isAdmin={role === "ADMIN"}
                                    canAdd={role === "ADMIN"}
                                    create={createActivityType}
                                    getAllIncludingInactive={getAllActivityTypesAdmin}
                                    deactivate={deleteActivityType}
                                    activate={activateActivityType}
                                    rename={updateActivityType}
                                    onRefresh={loadActivityTypes}
                                    currentLabel={form.activityTypeName}
                                    placeholder="Select Activity"
                                />

                            </div>

                            {/* Status */}

                            <div className="col-md-6">

                                <label className="form-label">
                                    Status
                                </label>

                                <select
                                    className="form-select"
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                >
                                    <option value="PENDING">Pending</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="MISSED">Missed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>

                            </div>

                            {/* Scheduled Date */}

                            <div className="col-md-6">

                                <label className="form-label">
                                    Scheduled Date *
                                </label>

                                <BritishDateTimeInput
                                    className="form-control"
                                    name="scheduledDate"
                                    aria-label="Scheduled date"
                                    timeLabel="Scheduled time (HH:MM, 24-hour)"
                                    value={form.scheduledDate}
                                    onChange={handleChange}
                                    required
                                   min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                                        .toISOString()
                                        .slice(0, 16)}
                                />

                            </div>

                            {/* Completed Date */}

                            <div className="col-md-6">

                                <label className="form-label">
                                    Completed Date
                                </label>

                                <BritishDateTimeInput
                                    className="form-control"
                                    name="completedDate"
                                    aria-label="Completed date"
                                    timeLabel="Completed time (HH:MM, 24-hour)"
                                    value={form.completedDate}
                                    onChange={handleChange}
                                />

                            </div>

                            {/* Remarks */}

                            <div className="col-12">

                                <label className="form-label">
                                    {nextActionRequired ? "Next action *" : "Remarks"}
                                </label>

                                <textarea
                                    className="form-control"
                                    rows="4"
                                    name="remarks"
                                    value={form.remarks}
                                    onChange={handleChange}
                                    required={nextActionRequired}
                                    minLength={nextActionRequired ? 3 : undefined}
                                    placeholder={nextActionRequired ? "Describe what will be done, e.g. Send the revised quotation" : undefined}
                                />

                                {nextActionRequired && (
                                    <div className="form-text">
                                        A pending follow-up on an opportunity is its next action, so it must say what the action is.
                                    </div>
                                )}

                            </div>

                            {completionPrompt && !completionPrompt.required && (
                                <div className="col-12">
                                    <div className="form-text">
                                        <i className="bi bi-calendar-check me-1"></i>
                                        The opportunity's next follow-up is already scheduled
                                        ({formatDateTime(completionPrompt.existingDate)}) - nothing else is needed.
                                    </div>
                                </div>
                            )}

                            {completionPrompt?.required && (

                                <div className="col-12">

                                    <div className="alert alert-warning py-2 mb-3">
                                        <strong>Schedule the next follow-up.</strong>{" "}
                                        This opportunity has no other upcoming follow-up, so completing this one needs
                                        the next follow-up date and next action. It is created together with the completion.
                                    </div>

                                    <div className="row g-3">

                                        <div className="col-md-5">
                                            <label className="form-label" htmlFor="next-action">Next action *</label>
                                            <input
                                                id="next-action"
                                                className="form-control"
                                                name="nextActionDescription"
                                                value={form.nextActionDescription || ""}
                                                onChange={handleChange}
                                                placeholder="e.g. Send the revised quotation"
                                                required
                                                minLength={3}
                                            />
                                        </div>

                                        <div className="col-md-3">
                                            <label className="form-label" htmlFor="next-activity-type">Activity type *</label>
                                            <select
                                                id="next-activity-type"
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

                                        <div className="col-md-4">
                                            <label className="form-label" htmlFor="next-follow-up-date">Next follow-up date &amp; time *</label>
                                            <BritishDateTimeInput
                                                id="next-follow-up-date"
                                                className="form-control"
                                                name="nextFollowUpDate"
                                                timeLabel="Next follow-up time (HH:MM, 24-hour)"
                                                value={form.nextFollowUpDate || ""}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                    </div>

                                </div>

                            )}

                        </div>

                        <div className="mt-4">

                            <button
                                className="btn btn-primary"
                                type="submit"
                            >
                                {submitText}
                            </button>

                        </div>

                    </form>

                </div>

            </div>

        </>
    );

}