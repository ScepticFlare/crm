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
                        value={opportunity?.expectedClosingDate || ""}
                        readOnly
                    />
                </div>

                <div className="col-md-6 mb-3">
                    <label className="form-label">Sales Stage</label>
                    <input
                        className="form-control"
                        value={opportunity?.salesStage || ""}
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

                <div className="col-md-6 mb-3"></div>

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
                    className="btn btn-success"
                    disabled={loading}
                >
                    {loading ? "Converting..." : submitText}
                </button>

            </div>

        </form>

    );

}