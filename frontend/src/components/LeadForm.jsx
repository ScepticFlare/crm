import React, { useEffect, useState } from "react";

import {
    getAllProducts,
    createProduct
} from "../services/productService";

import {
    getAllIndustries,
    createIndustry
} from "../services/industryService";

import {
    getAllLeadSources,
    createLeadSource
} from "../services/leadSourceService";

import MasterDropdownModal from "./MasterDropdownModal";

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

    const [showProductModal, setShowProductModal] = useState(false);
    const [showIndustryModal, setShowIndustryModal] = useState(false);
    const [showLeadSourceModal, setShowLeadSourceModal] = useState(false);

    useEffect(() => {

        loadProducts();
        loadIndustries();
        loadLeadSources();

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

    async function handleProductCreated(product) {

        await loadProducts();

        handleChange({
            target: {
                name: "productId",
                value: product.id
            }
        });

    }

    async function handleIndustryCreated(industry) {

        await loadIndustries();

        handleChange({
            target: {
                name: "industryId",
                value: industry.id
            }
        });

    }

    async function handleLeadSourceCreated(source) {

        await loadLeadSources();

        handleChange({
            target: {
                name: "leadSourceId",
                value: source.id
            }
        });

    }

    function onProductChange(e) {

        if (e.target.value === "__ADD_NEW__") {

            setShowProductModal(true);
            return;

        }

        handleChange(e);

    }

    function onIndustryChange(e) {

        if (e.target.value === "__ADD_NEW__") {

            setShowIndustryModal(true);
            return;

        }

        handleChange(e);

    }

    function onLeadSourceChange(e) {

        if (e.target.value === "__ADD_NEW__") {

            setShowLeadSourceModal(true);
            return;

        }

        handleChange(e);

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
            Product
        </label>

        <select
            className="form-select"
            name="productId"
            value={form.productId}
            onChange={onProductChange}
        >

            <option value="">
                Select Product
            </option>

            {products.map(product => (

                <option
                    key={product.id}
                    value={product.id}
                >
                    {product.name}
                </option>

            ))}

            <option disabled>
                ─────────────────
            </option>

            <option value="__ADD_NEW__">
                ➕ Add New Product...
            </option>

        </select>

    </div>

    <div className="col-md-6 mb-3">

        <label className="form-label">
            Website
        </label>

        <input
            type="text"
            className="form-control"
            name="website"
            value={form.website}
            onChange={handleChange}
        />

    </div>

    <div className="col-md-6 mb-3">

        <label className="form-label">
            Industry
        </label>

        <select
            className="form-select"
            name="industryId"
            value={form.industryId}
            onChange={onIndustryChange}
        >

            <option value="">
                Select Industry
            </option>

            {industries.map(industry => (

                <option
                    key={industry.id}
                    value={industry.id}
                >
                    {industry.name}
                </option>

            ))}

            <option disabled>
                ─────────────────
            </option>

            <option value="__ADD_NEW__">
                ➕ Add New Industry...
            </option>

        </select>

    </div>

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
            Designation
        </label>

        <input
            type="text"
            className="form-control"
            name="designation"
            value={form.designation}
            onChange={handleChange}
        />

    </div>

    <div className="col-md-6 mb-3">

        <label className="form-label">
            Phone *
        </label>

        <input
            type="text"
            className="form-control"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
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
            Email *
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
            City
        </label>

        <input
            type="text"
            className="form-control"
            name="city"
            value={form.city}
            onChange={handleChange}
        />

    </div>

    <div className="col-md-6 mb-3">

        <label className="form-label">
            State
        </label>

        <input
            type="text"
            className="form-control"
            name="state"
            value={form.state}
            onChange={handleChange}
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
        />

    </div>

</div>

<hr className="my-4" />
<h5 className="mb-4">
    Lead Details
</h5>

<div className="row">

    <div className="col-md-4 mb-3">

        <label className="form-label">
            Lead Status
        </label>

        <select
            className="form-select"
            name="leadStatus"
            value={form.leadStatus}
            onChange={handleChange}
        >

            <option value="NEW">NEW</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="QUOTATION_SENT">QUOTATION SENT</option>
            <option value="NEGOTIATION">NEGOTIATION</option>
            <option value="WON">WON</option>
            <option value="LOST">LOST</option>

        </select>

    </div>

    <div className="col-md-4 mb-3">

        <label className="form-label">
            Lead Source
        </label>

        <select
            className="form-select"
            name="leadSourceId"
            value={form.leadSourceId}
            onChange={onLeadSourceChange}
        >

            <option value="">
                Select Lead Source
            </option>

            {leadSources.map(source => (

                <option
                    key={source.id}
                    value={source.id}
                >
                    {source.name}
                </option>

            ))}

            <option disabled>
                ─────────────────
            </option>

            <option value="__ADD_NEW__">
                ➕ Add New Lead Source...
            </option>

        </select>

    </div>

    <div className="col-md-4 mb-3">

        <label className="form-label">
            Lead Validity
        </label>

        <select
            className="form-select"
            name="leadValidity"
            value={form.leadValidity}
            onChange={handleChange}
        >

            <option value="VALID">
                VALID
            </option>

            <option value="INVALID">
                INVALID
            </option>

        </select>

    </div>

</div>

<hr className="my-4" />

<div className="mb-4">

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

<div className="d-flex justify-content-end gap-2">

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

<MasterDropdownModal
    show={showProductModal}
    onClose={() => setShowProductModal(false)}
    onCreated={handleProductCreated}
    title="Product"
    create={createProduct}
/>

<MasterDropdownModal
    show={showIndustryModal}
    onClose={() => setShowIndustryModal(false)}
    onCreated={handleIndustryCreated}
    title="Industry"
    create={createIndustry}
/>

<MasterDropdownModal
    show={showLeadSourceModal}
    onClose={() => setShowLeadSourceModal(false)}
    onCreated={handleLeadSourceCreated}
    title="Lead Source"
    create={createLeadSource}
/>
<MasterDropdownModal
    show={showLeadSourceModal}
    onClose={() => setShowLeadSourceModal(false)}
    onCreated={handleLeadSourceCreated}
    title="Lead Source"
    create={createLeadSource}
/>

</form>

    );

}