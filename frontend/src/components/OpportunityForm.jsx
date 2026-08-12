import { useEffect, useState } from "react";
import { getLeadById } from "../services/leadService";
import {
    getAllSalesStages,
    getAllSalesStagesAdmin,
    createSalesStage,
    deleteSalesStage,
    activateSalesStage
} from "../services/salesStageService";
import DropdownAddManage from "./DropdownAddManage";

export default function OpportunityForm({
    form,
    handleChange,
    handleSubmit,
    loading,
    submitText,
    onCancel,
    leadId
}) {

    const role = localStorage.getItem("role");

    const [lead, setLead] = useState(null);
    const [salesStages, setSalesStages] = useState([]);

    useEffect(() => {

        if (leadId) {
            loadLead();
        }

        loadSalesStages();

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

                    <div className="col-md-3 mb-3">

                        <label className="form-label">
                            Sales Stage *
                        </label>

                        <DropdownAddManage
                            title="Sales Stage"
                            name="salesStage"
                            value={form.salesStage}
                            onChange={handleChange}
                            options={salesStages}
                            required
                            isAdmin={role === "ADMIN"}
                            valueKey="name"
                            create={createSalesStage}
                            getAllIncludingInactive={getAllSalesStagesAdmin}
                            deactivate={deleteSalesStage}
                            activate={activateSalesStage}
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

        </>

    );

}