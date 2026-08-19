import { useEffect, useState } from "react";
import { getAllEmployees } from "../services/employeeService";

export default function EmployeeForm({
    initialData,
    onSubmit,
    loading,
}) {

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "EMPLOYEE",
        managerId: "",
        isActive: true,
    });

    const [employees, setEmployees] = useState([]);

    useEffect(() => {

        loadEmployees();

    }, []);

    async function loadEmployees() {

        try {

            const data = await getAllEmployees();
            setEmployees(data);

        } catch (err) {

            console.error(err);

        }

    }

    useEffect(() => {

        if (initialData) {

            setForm({
                name: initialData.name || "",
                email: initialData.email || "",
                phone: initialData.phone || "",
                password: "",
                role: initialData.role || "EMPLOYEE",
                managerId: initialData.managerId || "",
                isActive: initialData.isActive !== false,
            });

        }

    }, [initialData]);

    // Only employees who currently hold the Manager role are valid manager
    // assignments (enforced server-side in EmployeeService.resolveManager -
    // this is a UX convenience, not the source of truth). A manager also
    // can't be assigned to themselves, and can't be one of their own direct
    // reports (the hierarchy is one level deep - see
    // AccessControlService.teamMemberIds on the backend).
    const managerOptions = employees.filter((emp) => {

        if (emp.role !== "MANAGER") {
            return false;
        }

        if (!initialData) {
            return true;
        }

        return emp.id !== initialData.id && emp.managerId !== initialData.id;

    });

    // Direct reports of the employee being edited, as currently recorded -
    // used both to block a Manager -> non-Manager role change in this form
    // (the backend rejects it regardless; this just explains why upfront)
    // and to size the warning message.
    const currentDirectReports = initialData
        ? employees.filter((emp) => emp.managerId === initialData.id)
        : [];

    const roleChangeLocked = initialData?.role === "MANAGER" && currentDirectReports.length > 0;

    // The employee's currently-assigned manager may no longer be a valid
    // target (e.g. that manager was demoted after this relationship was
    // created) - a real data-integrity issue the backend flags via
    // hierarchyValid rather than silently correcting. Keep it visible in
    // the dropdown (clearly marked) instead of letting the select silently
    // show a blank value, which would look like the assignment vanished.
    const currentManagerStillValid =
        !initialData?.managerId ||
        managerOptions.some((emp) => emp.id === initialData.managerId);

    const handleChange = (e) => {

        const { name, value, type, checked } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
            // ADMIN and MANAGER can never have a manager (enforced server-side
            // in EmployeeService.resolveManager) - clear any previously
            // selected managerId as soon as the role is switched away from
            // EMPLOYEE, so a stale value can't be silently resubmitted if the
            // user flips the role back and forth before saving.
            ...(name === "role" && value !== "EMPLOYEE" ? { managerId: "" } : {}),
        }));

    };

    const handleSubmit = (e) => {

        e.preventDefault();

        onSubmit({
            ...form,
            managerId: form.managerId ? Number(form.managerId) : null,
            isActive: initialData ? form.isActive : undefined,
        });

    };

    return (

        <form onSubmit={handleSubmit}>

            <div className="card shadow-sm border-0">

                <div className="card-body">

                    {initialData?.hierarchyValid === false && (
                        <div className="alert alert-warning" role="alert">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            This employee's current manager assignment is invalid
                            {initialData.managerName ? ` (${initialData.managerName} is no longer a Manager)` : ""} -
                            please select a valid manager below, or clear the field, then save to fix it.
                        </div>
                    )}

                    <div className="row g-3">

                        <div className="col-md-6">

                            <label className="form-label">
                                Name
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                            />

                        </div>

                        <div className="col-md-6">

                            <label className="form-label">
                                Email
                            </label>

                            <input
                                type="email"
                                className="form-control"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />

                        </div>

                        <div className="col-md-6">

                            <label className="form-label">
                                Phone
                            </label>

                            <input
                                type="tel"
                                className="form-control"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                required
                                maxLength={10}
                                pattern="[0-9]{10}"
                                title="Phone number must be exactly 10 digits."
                            />

                        </div>

                        <div className="col-md-6">

                            <label className="form-label">
                                Role
                            </label>

                            <select
                                className="form-select"
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                            >
                                <option value="EMPLOYEE" disabled={roleChangeLocked}>
                                    Employee
                                </option>

                                <option value="MANAGER">
                                    Manager
                                </option>

                                <option value="ADMIN" disabled={roleChangeLocked}>
                                    Administrator
                                </option>

                            </select>

                            {roleChangeLocked && (
                                <div className="form-text text-warning">
                                    This employee has {currentDirectReports.length} direct
                                    report{currentDirectReports.length === 1 ? "" : "s"} reporting to them.
                                    Reassign {currentDirectReports.length === 1 ? "that report" : "those reports"} to
                                    another manager before changing this role.
                                </div>
                            )}

                        </div>

                        {form.role === "EMPLOYEE" && (

                        <div className="col-md-6">

                            <label className="form-label">
                                Manager
                            </label>

                            <select
                                className="form-select"
                                name="managerId"
                                value={form.managerId}
                                onChange={handleChange}
                            >
                                <option value="">
                                    No Manager
                                </option>

                                {!currentManagerStillValid && initialData?.managerId && (
                                    <option value={initialData.managerId} disabled>
                                        {initialData.managerName || `Employee #${initialData.managerId}`} (current - no longer a Manager)
                                    </option>
                                )}

                                {managerOptions.map((emp) => (

                                    <option
                                        key={emp.id}
                                        value={emp.id}
                                    >
                                        {emp.name}
                                    </option>

                                ))}

                            </select>

                            {managerOptions.length === 0 && (
                                <div className="form-text">
                                    No employees currently hold the Manager role.
                                </div>
                            )}

                        </div>

                        )}

                        <div className="col-12">

                            <label className="form-label">
                                Password
                            </label>

                            <input
                                type="password"
                                className="form-control"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder={
                                    initialData
                                        ? "Leave blank to keep current password"
                                        : "Enter password"
                                }
                                required={!initialData}
                            />

                        </div>

                        {initialData && (

                        <div className="col-12">

                            <div className="form-check form-switch">

                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="isActive"
                                    name="isActive"
                                    checked={form.isActive}
                                    onChange={handleChange}
                                />

                                <label className="form-check-label" htmlFor="isActive">
                                    Active
                                </label>

                            </div>

                            <div className="form-text">
                                Inactive employees remain in the system but are flagged as no longer active.
                            </div>

                        </div>

                        )}

                    </div>

                </div>

            </div>

            <div className="mt-4 d-flex justify-content-end">

                <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Saving..." : "Save Employee"}
                </button>

            </div>

        </form>

    );

}