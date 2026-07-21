import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import DetailField from "../components/DetailField";
import FollowUpSection from "../components/FollowUpSection";
import { getOpportunityById } from "../services/opportunityService";

export default function OpportunityDetails() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [opportunity, setOpportunity] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOpportunity();
    }, []);

    async function loadOpportunity() {

        try {

            const data = await getOpportunityById(id);
            setOpportunity(data);

        } catch (err) {

            console.error(err);
            alert("Failed to load opportunity.");

        } finally {

            setLoading(false);

        }

    }

    function stageColor(stage) {

        switch (stage) {

            case "NEW":
                return "secondary";

            case "QUOTATION_SENT":
                return "info";

            case "NEGOTIATION":
                return "warning";

            case "POSTPONED":
                return "dark";

            case "WON":
                return "success";

            case "LOST":
                return "danger";

            default:
                return "primary";

        }

    }

    function formatCurrency(value) {

        if (!value) return "-";

        return Number(value).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        });

    }

    function formatDate(date) {

        if (!date) return "-";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

    }

    if (loading) {

        return (

            <div className="text-center mt-5">

                <div className="spinner-border text-primary"></div>

            </div>

        );

    }

    if (!opportunity) {

        return (

            <div className="alert alert-danger">

                Opportunity not found.

            </div>

        );

    }

    const lead = opportunity.lead;
    const employee = lead?.assignedEmployee;

    return (

        <div className="container-fluid">

            <PageHeader
                title="Opportunity Details"
                subtitle="View complete opportunity information"
            />

            <div className="card border-0 shadow-sm mb-4">

                <div className="card-body">

                    <div className="row align-items-center">

                        <div className="col-lg-8">

                            <h2 className="fw-bold mb-1">

                                {opportunity.title}

                            </h2>

                            <h5 className="text-muted mb-3">

                                {lead?.companyName}

                            </h5>

                            <span className={`badge bg-${stageColor(opportunity.salesStage)} px-3 py-2`}>

                                {opportunity.salesStage?.replaceAll("_", " ")}

                            </span>

                            <span className="ms-3 text-muted">

                                Opportunity #{opportunity.id}

                            </span>

                        </div>

                        <div className="col-lg-4 text-lg-end mt-4 mt-lg-0">

                            <button
                                className="btn btn-warning me-2"
                                onClick={() =>
                                    navigate(`/opportunities/edit/${opportunity.id}`)
                                }
                            >

                                Edit

                            </button>
<button
    className="btn btn-success me-2"
    disabled={opportunity.salesStage !== "WON"}
    title={
        opportunity.salesStage !== "WON"
            ? "Only WON opportunities can be converted to customers."
            : ""
    }
    onClick={() =>
        navigate(`/customers/convert/${opportunity.id}`)
    }
>
    Convert to Customer
</button>

                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => navigate("/opportunities")}
                            >

                                Back

                            </button>

                        </div>

                    </div>

                </div>

            </div>

            <div className="row g-3">

                <div className="col-md-3">

                    <div className="card shadow-sm text-center h-100">

                        <div className="card-body">

                            <small className="text-muted">

                                Opportunity Value

                            </small>

                            <h5 className="mt-2">

                                {formatCurrency(opportunity.productValue)}

                            </h5>

                        </div>

                    </div>

                </div>

                <div className="col-md-3">

                    <div className="card shadow-sm text-center h-100">

                        <div className="card-body">

                            <small className="text-muted">

                                Sales Stage

                            </small>

                            <h5 className="mt-2">

                                <span className={`badge bg-${stageColor(opportunity.salesStage)}`}>

                                    {opportunity.salesStage}

                                </span>

                            </h5>

                        </div>

                    </div>

                </div>

                <div className="col-md-3">

                    <div className="card shadow-sm text-center h-100">

                        <div className="card-body">

                            <small className="text-muted">

                                Expected Close

                            </small>

                            <h5 className="mt-2">

                                {formatDate(opportunity.expectedClosingDate)}

                            </h5>

                        </div>

                    </div>

                </div>

                <div className="col-md-3">

                    <div className="card shadow-sm text-center h-100">

                        <div className="card-body">

                            <small className="text-muted">

                                Assigned Employee

                            </small>

                            <h5 className="mt-2">

                                {employee?.name || "-"}

                            </h5>

                        </div>

                    </div>

                </div>

            </div>

            <div className="row mt-4">
                <div className="col-lg-8">

    <div className="card shadow-sm border-0">

        <div className="card-body">

            <h5 className="fw-semibold mb-4">

                Lead Information

            </h5>

            <DetailField
                label="Company"
                value={lead?.companyName}
            />

            <DetailField
                label="Contact Person"
                value={lead?.contactPerson}
            />

            <DetailField
                label="Designation"
                value={lead?.designation}
            />

            <DetailField
                label="Phone"
                value={lead?.phone}
            />

            <DetailField
                label="Alternate Phone"
                value={lead?.alternatePhone}
            />

            <DetailField
                label="Email"
                value={lead?.email}
            />

            <DetailField
                label="Secondary Email"
                value={lead?.secondaryEmail}
            />

            <DetailField
                label="Website"
                value={lead?.website}
            />

            <DetailField
                label="City"
                value={lead?.city}
            />

            <DetailField
                label="State"
                value={lead?.state}
            />

            <DetailField
                label="Pincode"
                value={lead?.pincode}
            />

            <DetailField
                label="Interested Product"
                value={lead?.interestedProduct}
            />

            <DetailField
                label="Lead Source"
                value={lead?.leadSource?.name || lead?.leadSource}
            />

            <DetailField
                label="Lead Status"
                badge={lead?.leadStatus}
                badgeColor="primary"
            />

            <DetailField
                label="Lead Validity"
                badge={lead?.leadValidity}
                badgeColor={
                    lead?.leadValidity === "VALID"
                        ? "success"
                        : "danger"
                }
            />

            <div className="mt-4">

                <label className="fw-semibold mb-2">

                    Description

                </label>

                <div className="border rounded p-3 bg-light">

                    {lead?.description || "No description available."}

                </div>

            </div>

        </div>

    </div>

</div>

<div className="col-lg-4">

    <div className="card shadow-sm border-0">

        <div className="card-body">

            <h5 className="fw-semibold mb-4">

                Assigned Employee

            </h5>

            <DetailField
                label="Name"
                value={employee?.name}
            />

            <DetailField
                label="Email"
                value={employee?.email}
            />

            <DetailField
                label="Phone"
                value={employee?.phone}
            />

            <DetailField
                label="Status"
                badge={
                    employee?.isActive
                        ? "Active"
                        : "Inactive"
                }
                badgeColor={
                    employee?.isActive
                        ? "success"
                        : "danger"
                }
            />

        </div>

    </div>

</div>

</div>
<FollowUpSection
    opportunityId={opportunity.id}
/>

</div>

);
}