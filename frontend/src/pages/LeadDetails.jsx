import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FollowUpSection from "../components/FollowUpSection";
import PageHeader from "../components/PageHeader";
import { getLeadById } from "../services/leadService";

export default function LeadDetails() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLead();
    }, []);

    async function loadLead() {

        try {

            const response = await getLeadById(id);

            setLead(response);

        } catch (error) {

            console.error(error);

            alert("Unable to load lead.");

        } finally {

            setLoading(false);

        }

    }

    if (loading) {

        return (

            <div className="text-center mt-5">

                <div className="spinner-border text-primary"></div>

            </div>

        );

    }

    if (!lead) {

        return (

            <div className="alert alert-danger">

                Lead not found.

            </div>

        );

    }

    return (

        <>

            <PageHeader
                title={lead.companyName}
                subtitle="Lead Details"
            />

            <div className="card shadow-sm border-0">

                <div className="card-body">

                    <h5 className="mb-4">
                        Company Information
                    </h5>

                    <div className="row">

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">Product</label>

                            <div>{lead.product?.name || "-"}</div>

                        </div>

                        <div className="col-md-4 mb-3">

                        <label className="fw-bold">
                                     Industry
                        </label>

                        <div>
                            {lead.industry?.name || "-"}
                         </div>

                        </div>

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">Website</label>

                            <div>{lead.website || "-"}</div>

                        </div>

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">Interested Product</label>

                            <div>{lead.interestedProduct || "-"}</div>

                        </div>

                    </div>

                    <hr />

                    <h5 className="mb-4">
                        Contact Information
                    </h5>

                    <div className="row">

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">Contact Person</label>

                            <div>{lead.contactPerson || "-"}</div>

                        </div>

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">Designation</label>

                            <div>{lead.designation || "-"}</div>

                        </div>

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">Phone</label>

                            <div>{lead.phone || "-"}</div>

                        </div>

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">Alternate Phone</label>

                            <div>{lead.alternatePhone || "-"}</div>

                        </div>

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">Email</label>

                            <div>{lead.email || "-"}</div>

                        </div>

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">Secondary Email</label>

                            <div>{lead.secondaryEmail || "-"}</div>

                        </div>

                    </div>

                    <hr />

                    <h5 className="mb-4">
                        Address
                    </h5>

                    <div className="row">

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">City</label>

                            <div>{lead.city || "-"}</div>

                        </div>

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">State</label>

                            <div>{lead.state || "-"}</div>

                        </div>

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">Pincode</label>

                            <div>{lead.pincode || "-"}</div>

                        </div>

                    </div>

                    <hr />

                    <h5 className="mb-4">
                        Lead Information
                    </h5>

                    <div className="row">

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">Status</label>

                            <div>

                                <span className={`badge bg-${
                                    lead.leadStatus === "NEW"
                                        ? "primary"
                                        : lead.leadStatus === "CONTACTED"
                                        ? "info"
                                        : lead.leadStatus === "QUOTATION_SENT"
                                        ? "warning"
                                        : lead.leadStatus === "NEGOTIATION"
                                        ? "secondary"
                                        : lead.leadStatus === "WON"
                                        ? "success"
                                        : "danger"
                                }`}>

                        {lead.leadStatus.replaceAll("_", " ")}

                                </span>

                            </div>

                        </div>

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">Source</label>

                            <div>{lead.leadSource?.name || "-"}</div>

                        </div>

                        <div className="col-md-4 mb-3">

                            <label className="fw-bold">Validity</label>

                            <div>{lead.leadValidity || "-"}</div>

                        </div>

                    </div>

                    <hr />

                    <h5 className="mb-3">
                        Description
                    </h5>

                    <div className="border rounded p-3 bg-light mb-4">

                        {lead.description || "No description available."}

                    </div>

                    <div className="d-flex gap-2">

                        <button
                            className="btn btn-secondary"
                            onClick={() => navigate("/leads")}
                        >
                            <i className="bi bi-arrow-left me-2"></i>
                            Back
                        </button>

                        <button
                            className="btn btn-warning"
                            onClick={() => navigate(`/leads/edit/${lead.id}`)}
                        >
                            <i className="bi bi-pencil-square me-2"></i>
                            Edit Lead
                        </button>

                        <button
                            className="btn btn-success"
                            onClick={() => navigate(`/opportunities/add?leadId=${lead.id}`)}
                        >
                            <i className="bi bi-arrow-repeat me-2"></i>
                            Convert to Opportunity
                        </button>

                    </div>

                </div>

            </div>

            <FollowUpSection
                leadId={lead.id}
            />

        </>

    );

}