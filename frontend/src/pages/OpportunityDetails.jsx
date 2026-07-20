import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../components/PageHeader";
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

        } catch (error) {

            console.error(error);

            alert("Failed to load opportunity.");

        } finally {

            setLoading(false);

        }

    }

    if (loading) {

        return (

            <div className="text-center mt-5">

                <div className="spinner-border"></div>

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

    return (

        <>

            <PageHeader
                title="Opportunity Details"
                subtitle={opportunity.title}
            />

            <div className="card shadow-sm border-0">

                <div className="card-body">

                    <h5 className="mb-4">
                        Lead Information
                    </h5>

                    <div className="row">

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">Company</label>

                            <div>{opportunity.lead?.companyName || "-"}</div>

                        </div>

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">Contact Person</label>

                            <div>{opportunity.lead?.contactPerson || "-"}</div>

                        </div>

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">Phone</label>

                            <div>{opportunity.lead?.phone || "-"}</div>

                        </div>

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">Email</label>

                            <div>{opportunity.lead?.email || "-"}</div>

                        </div>

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">Website</label>

                            <div>{opportunity.lead?.website || "-"}</div>

                        </div>

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">Interested Product</label>

                            <div>{opportunity.lead?.interestedProduct || "-"}</div>

                        </div>

                    </div>

                    <hr />

                    <h5 className="mb-4">
                        Opportunity Information
                    </h5>

                    <div className="row">

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">Title</label>

                            <div>{opportunity.title}</div>

                        </div>

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">Product Value</label>

                            <div>

                                ₹{Number(opportunity.productValue || 0).toLocaleString("en-IN")}

                            </div>

                        </div>

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">Sales Stage</label>

                            <div>

                                <span
                                    className={`badge ${
                                        opportunity.salesStage === "WON"
                                            ? "bg-success"
                                            : opportunity.salesStage === "LOST"
                                            ? "bg-danger"
                                            : "bg-primary"
                                    }`}
                                >
                                    {opportunity.salesStage.replaceAll("_", " ")}
                                </span>

                            </div>

                        </div>

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">Expected Closing Date</label>

                            <div>{opportunity.expectedClosingDate || "-"}</div>

                        </div>

                    </div>

                    <hr />

                    <div className="d-flex gap-2">

                        <button
                            className="btn btn-secondary"
                            onClick={() => navigate("/opportunities")}
                        >
                            <i className="bi bi-arrow-left me-2"></i>
                            Back
                        </button>

                        <button
                            className="btn btn-warning"
                            onClick={() =>
                                navigate(`/opportunities/edit/${opportunity.id}`)
                            }
                        >
                            <i className="bi bi-pencil-square me-2"></i>
                            Edit Opportunity
                        </button>

                        {opportunity.salesStage === "WON" && (

                            <button
                                className="btn btn-success"
                                onClick={() =>
                                    navigate(
                                        `/customers/add?opportunityId=${opportunity.id}`
                                    )
                                }
                            >
                                <i className="bi bi-arrow-repeat me-2"></i>
                                Convert to Customer
                            </button>

                        )}

                    </div>

                </div>

            </div>

        </>

    );

}