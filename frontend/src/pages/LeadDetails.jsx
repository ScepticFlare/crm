import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FollowUpSection from "../components/FollowUpSection";
import PageHeader from "../components/PageHeader";
import DetailField from "../components/DetailField";
import LoadingState from "../components/ui/LoadingState";
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

            <LoadingState className="text-center mt-5" />

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

                        <div className="col-md-4">
                            <DetailField
                                label="Products"
                                value={lead.leadProducts?.length > 0
                                    ? lead.leadProducts
                                        .map(lp => `${lp.product?.name} (${lp.quantity})`)
                                        .join(", ")
                                    : ""}
                            />
                        </div>

                        <div className="col-md-4">
                            <DetailField
                                label="Industry"
                                value={lead.industry?.name}
                            />
                        </div>

                        <div className="col-md-4">
                            <DetailField
                                label="Battery"
                                value={lead.leadBatteries?.length > 0
                                    ? lead.leadBatteries
                                        .map(lb => `${lb.battery?.name} (${lb.quantity})`)
                                        .join(", ")
                                    : ""}
                            />
                        </div>

                        <div className="col-md-4">
                            <DetailField
                                label="Interested Product"
                                value={lead.interestedProduct}
                            />
                        </div>

                    </div>

                    <hr className="my-4" />

                    <h5 className="mb-4">
                        Contact Information
                    </h5>

                    <div className="row">

                        <div className="col-md-4">
                            <DetailField label="Contact Person" value={lead.contactPerson} />
                        </div>

                        <div className="col-md-4">
                            <DetailField label="Designation" value={lead.designation} />
                        </div>

                        <div className="col-md-4">
                            <DetailField label="Phone" value={lead.phone} />
                        </div>

                        <div className="col-md-4">
                            <DetailField label="Alternate Phone" value={lead.alternatePhone} />
                        </div>

                        <div className="col-md-4">
                            <DetailField label="Email" value={lead.email} />
                        </div>

                        <div className="col-md-4">
                            <DetailField label="Secondary Email" value={lead.secondaryEmail} />
                        </div>

                    </div>

                    <hr className="my-4" />

                    <h5 className="mb-4">
                        Address
                    </h5>

                    <div className="row">

                        <div className="col-md-4">
                            <DetailField label="City" value={lead.city} />
                        </div>

                        <div className="col-md-4">
                            <DetailField label="State" value={lead.state} />
                        </div>

                        <div className="col-md-4">
                            <DetailField label="Pincode" value={lead.pincode} />
                        </div>

                    </div>

                    <hr className="my-4" />

                    <h5 className="mb-4">
                        Lead Information
                    </h5>

                    <div className="row">

                        <div className="col-md-3">
                            <DetailField label="Status" status={lead.leadStatus} />
                        </div>

                        <div className="col-md-3">
                            <DetailField label="Assigned Employee" value={lead.assignedEmployee?.name} />
                        </div>

                        <div className="col-md-3">
                            <DetailField label="Source" value={lead.leadSource?.name} />
                        </div>

                    </div>

                    <hr className="my-4" />

                    <h5 className="mb-3">
                        Description
                    </h5>

                    <div className="border rounded p-3 bg-light mb-4">

                        {lead.description || "No description available."}

                    </div>

                    <h5 className="mt-4 mb-3">
                        Final Remarks
                    </h5>

                    <div className="border rounded p-3 bg-light">

                        {lead.finalRemarks || "No final remarks available."}

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