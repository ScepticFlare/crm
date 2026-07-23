import { useEffect, useState } from "react";
import { getLeadById } from "../services/leadService";

export default function OpportunityForm({
    form,
    handleChange,
    handleSubmit,
    loading,
    submitText,
    onCancel,
    leadId
}) {

    const [lead, setLead] = useState(null);

    useEffect(() => {
        if (leadId) {
            loadLead();
        }
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

    return (

        <form onSubmit={handleSubmit}>

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
                    Product
                </label>

                <input
                className="form-control"
                value={lead?.product?.name || ""}
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
                        Expected Closing Date
                    </label>

                    <input
                        type="date"
                        className="form-control"
                        name="expectedClosingDate"
                        value={form.expectedClosingDate}
                        onChange={handleChange}
                    />

                </div>

                <div className="col-md-6 mb-3">

                    <label className="form-label">
                        Sales Stage *
                    </label>

                    <select
                        className="form-select"
                        name="salesStage"
                        value={form.salesStage}
                        onChange={handleChange}
                        required
                    >

                        <option value="NEW">NEW</option>
                        <option value="QUOTATION_SENT">QUOTATION SENT</option>
                        <option value="NEGOTIATION">NEGOTIATION</option>
                        <option value="POSTPONED">POSTPONED</option>
                        <option value="WON">WON</option>
                        <option value="LOST">LOST</option>

                    </select>

                </div>

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
                    disabled={loading}
                >
                    {loading ? "Saving..." : submitText}
                </button>

            </div>

        </form>

    );

}