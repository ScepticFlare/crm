import { useEffect, useState } from "react";

import { getAllActivityTypes } from "../services/activityTypeService";
import ActivityTypeModal from "./ActivityTypeModal";

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
}) {

    const [activityTypes, setActivityTypes] = useState([]);
    const [showActivityModal, setShowActivityModal] = useState(false);

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

        if (name === "activityTypeId" && value === "__NEW__") {
            setShowActivityModal(true);
            return;
        }

        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    }

    async function handleActivityCreated(activity) {

        await loadActivityTypes();

        setForm(prev => ({
            ...prev,
            activityTypeId: activity.id.toString()
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

                            {/* Employee */}

                            <div className="col-md-6">
                                <label className="form-label">
                                    Assigned Employee
                                </label>

                                <select
                                    className="form-select"
                                    name="employeeId"
                                    value={form.employeeId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Employee</option>

                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Activity Type */}

                            <div className="col-md-6">

                                <label className="form-label">
                                    Activity Type
                                </label>

                                <select
                                    className="form-select"
                                    name="activityTypeId"
                                    value={form.activityTypeId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">
                                        Select Activity
                                    </option>

                                    {activityTypes.map(activity => (

                                        <option
                                            key={activity.id}
                                            value={activity.id}
                                        >
                                            {activity.name}
                                        </option>

                                    ))}

                                    <option value="__NEW__">
                                        ➕ Add New Activity...
                                    </option>

                                </select>

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
                                    Scheduled Date
                                </label>

                                <input
                                    type="datetime-local"
                                    className="form-control"
                                    name="scheduledDate"
                                    value={form.scheduledDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Completed Date */}

                            <div className="col-md-6">
                                <label className="form-label">
                                    Completed Date
                                </label>

                                <input
                                    type="datetime-local"
                                    className="form-control"
                                    name="completedDate"
                                    value={form.completedDate}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Remarks */}

                            <div className="col-12">
                                <label className="form-label">
                                    Remarks
                                </label>

                                <textarea
                                    className="form-control"
                                    rows="4"
                                    name="remarks"
                                    value={form.remarks}
                                    onChange={handleChange}
                                />
                            </div>

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

            <ActivityTypeModal
                show={showActivityModal}
                onClose={() => setShowActivityModal(false)}
                onCreated={handleActivityCreated}
            />
        </>
    );
}