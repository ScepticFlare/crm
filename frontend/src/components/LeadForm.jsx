import React from "react";

export default function LeadForm({
    form,
    handleChange,
    handleSubmit,
    loading,
    submitText,
    onCancel
}) {

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
                        Interested Product
                    </label>

                    <input
                        type="text"
                        className="form-control"
                        name="interestedProduct"
                        value={form.interestedProduct}
                        onChange={handleChange}
                    />

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

            <hr className="my-4"/>

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
                        name="leadSource"
                        value={form.leadSource}
                        onChange={handleChange}
                    >
                        <option value="WEBSITE">Website</option>
                        <option value="INDIA_MART">India Mart</option>
                        <option value="PHONE_CALL">Phone Call</option>
                        <option value="EMAIL">Email</option>
                        <option value="REFERRAL">Referral</option>
                        <option value="WALK_IN">Walk In</option>
                        <option value="EXHIBITION">Exhibition</option>
                        <option value="FACEBOOK">Facebook</option>
                        <option value="LINKEDIN">LinkedIn</option>
                        <option value="OTHER">Other</option>
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
                        <option value="VALID">VALID</option>
                        <option value="INVALID">INVALID</option>
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

        </form>

    );

}