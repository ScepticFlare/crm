import { useEffect, useState } from "react";
import { getAllEmployees } from "../services/employeeService";
import { formatDate } from "../utils/formatDate";

export default function CustomerForm({
    opportunity,
    form,
    handleChange,
    handleSubmit,
    loading,
    submitText,
    onCancel
}) {

    const lead = opportunity?.lead;

    const [employees, setEmployees] = useState([]);

    // Same permission-driven pattern as LeadForm's Assigned Employee
    // control: try the real roster fetch (scoped by the backend to
    // ADMIN=everyone / MANAGER=own team / EMPLOYEE=403) and let success or
    // failure decide whether the control is shown, rather than checking a
    // hardcoded role string.
    const [canAssignEmployee, setCanAssignEmployee] = useState(false);

    useEffect(() => {

        loadEmployees();

    }, []);

    async function loadEmployees() {

        try {

            const data = await getAllEmployees();
            setEmployees(data);
            setCanAssignEmployee(true);

        } catch (err) {

            if (err.response?.status !== 403) {
                console.error(err);
            }

            setCanAssignEmployee(false);

        }

    }

    // Only the edit flow (EditCustomer) tracks assignedEmployeeId in its
    // form state - the conversion flow (ConvertCustomer) sets it directly
    // from the Lead's owner on submit and never exposes it as a field, so
    // the control has nothing meaningful to bind to there.
    const showAssignedEmployee = canAssignEmployee && form.assignedEmployeeId !== undefined;

    return (

        <form onSubmit={handleSubmit}>

            {/* Lead Information */}

            <h5 className="mb-4">Lead Information</h5>

            <div className="row">

                <div className="col-md-6 mb-3">
                    <label className="form-label">Company Name</label>
                    <input
                        className="form-control"
                        value={lead?.companyName || ""}
                        readOnly
                    />
                </div>

                <div className="col-md-6 mb-3">
                    <label className="form-label">Contact Person</label>
                    <input
                        className="form-control"
                        value={lead?.contactPerson || ""}
                        readOnly
                    />
                </div>

                <div className="col-md-6 mb-3">
                    <label className="form-label">Designation</label>
                    <input
                        className="form-control"
                        value={lead?.designation || ""}
                        readOnly
                    />
                </div>

                <div className="col-md-6 mb-3">
                    <label className="form-label">Phone</label>
                    <input
                        className="form-control"
                        value={lead?.phone || ""}
                        readOnly
                    />
                </div>

                <div className="col-md-6 mb-3">
                    <label className="form-label">Email</label>
                    <input
                        className="form-control"
                        value={lead?.email || ""}
                        readOnly
                    />
                </div>

                <div className="col-md-6 mb-3">
                    <label className="form-label">Website</label>
                    <input
                        className="form-control"
                        value={lead?.website || ""}
                        readOnly
                    />
                </div>

                <div className="col-md-4 mb-3">
                    <label className="form-label">City</label>
                    <input
                        className="form-control"
                        value={lead?.city || ""}
                        readOnly
                    />
                </div>

                <div className="col-md-4 mb-3">
                    <label className="form-label">State</label>
                    <input
                        className="form-control"
                        value={lead?.state || ""}
                        readOnly
                    />
                </div>

                <div className="col-md-4 mb-3">
                    <label className="form-label">Pincode</label>
                    <input
                        className="form-control"
                        value={lead?.pincode || ""}
                        readOnly
                    />
                </div>

            </div>

            <hr className="my-4"/>

            {/* Opportunity Information */}

            <h5 className="mb-4">Opportunity Information</h5>

            <div className="row">

                <div className="col-md-6 mb-3">
                    <label className="form-label">Opportunity Title</label>
                    <input
                        className="form-control"
                        value={opportunity?.title || ""}
                        readOnly
                    />
                </div>

                <div className="col-md-6 mb-3">
                    <label className="form-label">Product Value</label>
                    <input
                        className="form-control"
                        value={opportunity?.productValue || ""}
                        readOnly
                    />
                </div>

                <div className="col-md-6 mb-3">
                    <label className="form-label">Expected Closing Date</label>
                    <input
                        className="form-control"
                        value={opportunity?.expectedClosingDate ? formatDate(opportunity.expectedClosingDate) : ""}
                        readOnly
                    />
                </div>

                <div className="col-md-6 mb-3">
                    <label className="form-label">Sales Stage</label>
                    <input
                        className="form-control"
                        value={opportunity?.salesStage?.name || ""}
                        readOnly
                    />
                </div>

            </div>

            <hr className="my-4"/>

            {/* Customer Information */}

            <h5 className="mb-4">Customer Information</h5>

            <div className="row">

                <div className="col-md-6 mb-3">

                    <label className="form-label">
                        GST Number
                    </label>

                    <input
                        className="form-control"
                        name="gstNumber"
                        value={form.gstNumber}
                        onChange={handleChange}
                    />

                </div>

                <div className="col-md-6 mb-3">

                    {showAssignedEmployee && (

                        <>

                            <label className="form-label">
                                Assigned Employee
                            </label>

                            <select
                                className="form-select"
                                name="assignedEmployeeId"
                                value={form.assignedEmployeeId}
                                onChange={handleChange}
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

                        </>

                    )}

                </div>

                <div className="col-md-6 mb-3">

                    <label className="form-label">
                        Billing Address *
                    </label>

                    <textarea
                        className="form-control"
                        rows="4"
                        name="billingAddress"
                        value={form.billingAddress}
                        onChange={handleChange}
                        required
                    />

                </div>

                <div className="col-md-6 mb-3">

                    <label className="form-label">
                        Shipping Address *
                    </label>

                    <textarea
                        className="form-control"
                        rows="4"
                        name="shippingAddress"
                        value={form.shippingAddress}
                        onChange={handleChange}
                        required
                    />

                </div>

            </div>

            <hr className="my-4"/>

            <div className="d-flex justify-content-end gap-2 mt-4">

                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={onCancel}
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                >
                    {loading ? "Converting..." : submitText}
                </button>

            </div>

        </form>

    );

}