import React, { useEffect, useState } from "react";
import { getAllEmployees } from "../services/employeeService";
import {
    getAllProducts,
    getAllProductsAdmin,
    createProduct,
    deleteProduct,
    activateProduct
} from "../services/productService";

import {
    getAllIndustries,
    getAllIndustriesAdmin,
    createIndustry,
    deleteIndustry,
    activateIndustry
} from "../services/industryService";

import {
    getAllLeadSources,
    getAllLeadSourcesAdmin,
    createLeadSource,
    deleteLeadSource,
    activateLeadSource
} from "../services/leadSourceService";

import {
    getAllBatteries,
    getAllBatteriesAdmin,
    createBattery,
    deleteBattery,
    activateBattery
} from "../services/batteryService";

import DropdownAddManage from "./DropdownAddManage";
import MultiItemQuantitySelector from "./MultiItemQuantitySelector";

export default function LeadForm({

    form,
    handleChange,
    handleSubmit,
    loading,
    submitText,
    onCancel

}) {

    const [products, setProducts] = useState([]);
    const [industries, setIndustries] = useState([]);
    const [leadSources, setLeadSources] = useState([]);
    const [batteries, setBatteries] = useState([]);
    const role = localStorage.getItem("role");

    const [employees, setEmployees] = useState([]);

    // Whether this user can reassign the lead's Assigned Employee is
    // determined by whether the employee roster actually loads, not by a
    // hardcoded role check: the backend already scopes GET /api/employees
    // to ADMIN (everyone) / MANAGER (their own team) / EMPLOYEE (403), so
    // trying the fetch and reacting to success/failure automatically
    // matches the caller's real permissions and team.
    const [canAssignEmployee, setCanAssignEmployee] = useState(false);

    useEffect(() => {

    loadProducts();
    loadIndustries();
    loadLeadSources();
    loadBatteries();
    loadEmployees();

}, []);

    async function loadProducts() {

        try {

            const data = await getAllProducts();
            setProducts(data);

        } catch (err) {

            console.error(err);

        }

    }

    async function loadIndustries() {

        try {

            const data = await getAllIndustries();
            setIndustries(data);

        } catch (err) {

            console.error(err);

        }

    }

    async function loadLeadSources() {

        try {

            const data = await getAllLeadSources();
            setLeadSources(data);

        } catch (err) {

            console.error(err);

        }

    }

    async function loadBatteries() {

        try {

            const data = await getAllBatteries();
            setBatteries(data);

        } catch (err) {

            console.error(err);

        }

    }

    async function loadEmployees() {

    try {

        const data = await getAllEmployees();
        setEmployees(data);
        setCanAssignEmployee(true);

    } catch (err) {

        // A 403 here just means this user has no reassignment permission
        // (a plain Employee) - expected, not an error worth logging. Any
        // other failure (network, 5xx) is still surfaced.
        if (err.response?.status !== 403) {
            console.error(err);
        }

        setCanAssignEmployee(false);

    }

}

    return (

        <form onSubmit={handleSubmit}>
            <h5 className="mb-4">
    Company Information
</h5>

<div className="row">

    <div className="col-md-6 mb-3">

        <label className="form-label">
            Company Name *
        </label>

        <input
            type="text"
            className="form-control"
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            required
        />

    </div>

    <div className="col-md-6 mb-3">

        <label className="form-label">
            Industry *
        </label>

        <DropdownAddManage
            title="Industry"
            name="industryId"
            value={form.industryId}
            onChange={handleChange}
            options={industries}
            required
            isAdmin={role === "ADMIN"}
            create={createIndustry}
            getAllIncludingInactive={getAllIndustriesAdmin}
            deactivate={deleteIndustry}
            activate={activateIndustry}
            onRefresh={loadIndustries}
            currentLabel={form.industryName}
            placeholder="Select Industry"
        />

    </div>

</div>

<div className="mb-3">

    <label className="form-label">
        Products
    </label>

    <MultiItemQuantitySelector
        label="Product"
        items={form.products || []}
        onItemsChange={(items) =>
            handleChange({ target: { name: "products", value: items } })
        }
        options={products}
        isAdmin={role === "ADMIN"}
        create={createProduct}
        getAllIncludingInactive={getAllProductsAdmin}
        deactivate={deleteProduct}
        activate={activateProduct}
        onRefresh={loadProducts}
        placeholder="Select Product"
    />

</div>

<div className="mb-3">

    <label className="form-label">
        Battery
    </label>

    <MultiItemQuantitySelector
        label="Battery"
        items={form.batteries || []}
        onItemsChange={(items) =>
            handleChange({ target: { name: "batteries", value: items } })
        }
        options={batteries}
        isAdmin={role === "ADMIN"}
        create={createBattery}
        getAllIncludingInactive={getAllBatteriesAdmin}
        deactivate={deleteBattery}
        activate={activateBattery}
        onRefresh={loadBatteries}
        placeholder="Select Battery"
    />

</div>

<hr className="my-4" />

<h5 className="mb-4">
    Contact Information
</h5>

<div className="row">

    <div className="col-md-6 mb-3">

        <label className="form-label">
            Contact Person *
        </label>

        <input
            type="text"
            className="form-control"
            name="contactPerson"
            value={form.contactPerson}
            onChange={handleChange}
            required
        />

    </div>

    <div className="col-md-6 mb-3">

        <label className="form-label">
            Designation *
        </label>

        <input
            type="text"
            className="form-control"
            name="designation"
            value={form.designation}
            onChange={handleChange}
            required
        />

    </div>

    <div className="col-md-6 mb-3">

        <label className="form-label">
            Phone *
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
            title="Phone number must be exactly 10 digits"
        />

    </div>

    <div className="col-md-6 mb-3">

        <label className="form-label">
            Alternate Phone
        </label>

        <input
            type="text"
            className="form-control"
            name="alternatePhone"
            value={form.alternatePhone}
            onChange={handleChange}
        />

    </div>

    <div className="col-md-6 mb-3">

        <label className="form-label">
            Email
        </label>

        <input
            type="email"
            className="form-control"
            name="email"
            value={form.email}
            onChange={handleChange}
        />

    </div>

    <div className="col-md-6 mb-3">

        <label className="form-label">
            Secondary Email
        </label>

        <input
            type="email"
            className="form-control"
            name="secondaryEmail"
            value={form.secondaryEmail}
            onChange={handleChange}
        />

    </div>

    <div className="col-md-6 mb-3">

        <label className="form-label">
            City *
        </label>

        <input
            type="text"
            className="form-control"
            name="city"
            value={form.city}
            onChange={handleChange}
            required
        />

    </div>

    <div className="col-md-6 mb-3">

        <label className="form-label">
            State *
        </label>

        <input
            type="text"
            className="form-control"
            name="state"
            value={form.state}
            onChange={handleChange}
            required
        />

    </div>

    <div className="col-md-6 mb-3">

        <label className="form-label">
            Pincode
        </label>

        <input
            type="text"
            className="form-control"
            name="pincode"
            value={form.pincode}
            onChange={handleChange}
            maxLength={6}
            pattern="[0-9]{6}"
            title="Pincode must be exactly 6 digits"
        />

    </div>

</div>

<hr className="my-4" />

<h5 className="mb-4">
    Lead Details
</h5>

{canAssignEmployee && (

    <div className="mb-3">

        <label className="form-label">
            Assigned Employee *
        </label>

        <select
            className="form-select"
            name="assignedEmployeeId"
            value={form.assignedEmployeeId}
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

<div className="row">

    <div className="col-md-4 mb-3">

        <label className="form-label">
            Lead Status *
        </label>

        <select
            className="form-select"
            name="leadStatus"
            value={form.leadStatus}
            onChange={handleChange}
            required
        >

            <option value="NEW">NEW</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="QUOTATION_SENT">QUOTATION SENT</option>
            <option value="NEGOTIATION">NEGOTIATION</option>
            <option value="WON">WON</option>
            <option value="LOST">LOST</option>
            <option value="DROPPED">DROPPED</option>
            <option value="UNRESPONSIVE">UNRESPONSIVE</option>
            <option value="INVALID">INVALID</option>
            {/* INACTIVE is set automatically by the 6-month stale-lead job,
                never manually - this option only exists so editing an
                already-Inactive Lead displays/preserves its real status
                instead of showing a blank/mismatched selection. */}
            <option value="INACTIVE">INACTIVE</option>

        </select>

    </div>

    <div className="col-md-4 mb-3">

        <label className="form-label">
            Lead Source *
        </label>

        <DropdownAddManage
            title="Lead Source"
            name="leadSourceId"
            value={form.leadSourceId}
            onChange={handleChange}
            options={leadSources}
            required
            isAdmin={role === "ADMIN"}
            create={createLeadSource}
            getAllIncludingInactive={getAllLeadSourcesAdmin}
            deactivate={deleteLeadSource}
            activate={activateLeadSource}
            onRefresh={loadLeadSources}
            currentLabel={form.leadSourceName}
            placeholder="Select Lead Source"
        />

    </div>

</div>

<hr className="my-4" />

<div className="mb-3">

    <label className="form-label">
        Description
    </label>

    <textarea
        className="form-control"
        rows="5"
        name="description"
        value={form.description}
        onChange={handleChange}
    />

</div>

<hr className="my-4" />

<div className="mb-3">

    <label className="form-label fw-bold">
        Final Remarks
    </label>

    <textarea
        className="form-control"
        rows={3}
        name="finalRemarks"
        value={form.finalRemarks}
        onChange={handleChange}
        placeholder="Example: Closed, No Response, Casual Browser, Not Under Our Scope..."
    />

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
        type="submit"
        className="btn btn-primary"
        disabled={loading}
    >

        {loading ? "Saving..." : submitText}

    </button>

</div>


</form>

    );

}