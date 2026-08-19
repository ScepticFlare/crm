import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import FollowUpSection from "../components/FollowUpSection";
import DetailField from "../components/DetailField";
import SectionCard from "../components/ui/SectionCard";
import LoadingState from "../components/ui/LoadingState";
import DetailHeader from "../components/detail/DetailHeader";
import ActivityPlaceholder from "../components/detail/ActivityPlaceholder";
import DeleteModal from "../components/DeleteModal";

import { getLeadById, deleteLead, getLeadDeleteImpact } from "../services/leadService";
import { describeDeleteImpact } from "../utils/deleteImpact";

export default function LeadDetails() {

    const { id } = useParams();
    const navigate = useNavigate();

    // Backend is the source of truth (LEAD_DELETE is ADMIN-only - see
    // LeadService.deleteLead) - this only controls whether the Delete menu
    // item is offered at all.
    const isAdmin = localStorage.getItem("role") === "ADMIN";

    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteImpact, setDeleteImpact] = useState(null);

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

    // Fetches the delete-impact preview before opening the confirmation
    // modal, so the dialog always reflects real dependent-record counts
    // (see utils/deleteImpact.js) rather than a generic message. Falls back
    // to a plain confirmation if the preview call itself fails - the delete
    // is still safe either way since the backend re-derives and cascades
    // the same dependents regardless of what the preview showed.
    async function openDeleteModal() {

        try {

            const impact = await getLeadDeleteImpact(lead.id);
            setDeleteImpact(impact);

        } catch (error) {

            console.error(error);
            setDeleteImpact(null);

        }

        setShowDeleteModal(true);

    }

    async function confirmDelete() {

        try {

            await deleteLead(lead.id);
            navigate("/leads");

        } catch (error) {

            console.error(error);
            alert(error.response?.data?.message || "Unable to delete lead.");
            setShowDeleteModal(false);

        }

    }

    function formatDateTime(value) {

        if (!value) return "-";

        return new Date(value).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

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

            <DetailHeader
                backTo="/leads"
                title={lead.companyName}
                subtitle={lead.contactPerson}
                status={lead.leadStatus}
                meta={`Lead #${lead.id}`}
                primaryAction={{
                    label: "Convert to Opportunity",
                    icon: "bi-arrow-repeat",
                    onClick: () => navigate(`/opportunities/add?leadId=${lead.id}`),
                }}
                onEdit={() => navigate(`/leads/edit/${lead.id}`)}
                menuItems={isAdmin ? [
                    {
                        label: "Delete Lead",
                        icon: "bi-trash",
                        danger: true,
                        onClick: openDeleteModal,
                    },
                ] : []}
            />

            <div className="row g-3">

                <div className="col-lg-8">

                    <SectionCard title="Company Information">

                        <div className="row">

                            <div className="col-md-6">
                                <DetailField label="Industry" value={lead.industry?.name} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Interested Product" value={lead.interestedProduct} />
                            </div>

                            <div className="col-md-6">
                                <DetailField
                                    label="Products"
                                    value={lead.leadProducts?.length > 0
                                        ? lead.leadProducts
                                            .map(lp => `${lp.product?.name} (${lp.quantity})`)
                                            .join(", ")
                                        : ""}
                                />
                            </div>

                            <div className="col-md-6">
                                <DetailField
                                    label="Battery"
                                    value={lead.leadBatteries?.length > 0
                                        ? lead.leadBatteries
                                            .map(lb => `${lb.battery?.name} (${lb.quantity})`)
                                            .join(", ")
                                        : ""}
                                />
                            </div>

                        </div>

                    </SectionCard>

                    <SectionCard title="Contact Information">

                        <div className="row">

                            <div className="col-md-6">
                                <DetailField label="Contact Person" value={lead.contactPerson} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Designation" value={lead.designation} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Phone" value={lead.phone} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Alternate Phone" value={lead.alternatePhone} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Email" value={lead.email} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Secondary Email" value={lead.secondaryEmail} />
                            </div>

                        </div>

                    </SectionCard>

                    <SectionCard title="Address">

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

                    </SectionCard>

                    <SectionCard title="Description & Remarks">

                        <label className="fw-semibold mb-2 d-block">Description</label>

                        <div className="border rounded p-3 bg-light mb-4">
                            {lead.description || "No description available."}
                        </div>

                        <label className="fw-semibold mb-2 d-block">Final Remarks</label>

                        <div className="border rounded p-3 bg-light">
                            {lead.finalRemarks || "No final remarks available."}
                        </div>

                    </SectionCard>

                    <ActivityPlaceholder />

                </div>

                <div className="col-lg-4">

                    <SectionCard title="Lead Information">

                        <DetailField label="Status" status={lead.leadStatus} />
                        <DetailField label="Validity" status={lead.leadValidity} />
                        <DetailField label="Source" value={lead.leadSource?.name} />

                    </SectionCard>

                    <SectionCard title="Assigned Employee">

                        <DetailField label="Name" value={lead.assignedEmployee?.name} />
                        <DetailField label="Email" value={lead.assignedEmployee?.email} />
                        <DetailField label="Phone" value={lead.assignedEmployee?.phone} />

                    </SectionCard>

                    <SectionCard title="Record Info">

                        <DetailField label="Created" value={formatDateTime(lead.createdAt)} />
                        <DetailField label="Last Updated" value={formatDateTime(lead.updatedAt)} />

                    </SectionCard>

                </div>

            </div>

            <FollowUpSection
                leadId={lead.id}
            />

            <DeleteModal
                show={showDeleteModal}
                title="Delete Lead"
                message={`Are you sure you want to delete "${lead.companyName}"?`}
                {...describeDeleteImpact(deleteImpact, "Lead")}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
            />

        </>

    );

}
