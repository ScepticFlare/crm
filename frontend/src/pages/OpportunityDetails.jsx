import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DetailField from "../components/DetailField";
import SectionCard from "../components/ui/SectionCard";
import FollowUpSection from "../components/FollowUpSection";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import DetailHeader from "../components/detail/DetailHeader";
import ActivityPlaceholder from "../components/detail/ActivityPlaceholder";
import DeleteModal from "../components/DeleteModal";

import { getOpportunityById, deleteOpportunity, getOpportunityDeleteImpact } from "../services/opportunityService";
import { describeDeleteImpact } from "../utils/deleteImpact";

export default function OpportunityDetails() {

    const { id } = useParams();
    const navigate = useNavigate();

    // Backend is the source of truth (OPPORTUNITY_DELETE is ADMIN-only -
    // see OpportunityService.deleteOpportunity) - this only controls
    // whether the Delete menu item is offered at all.
    const isAdmin = localStorage.getItem("role") === "ADMIN";

    const [opportunity, setOpportunity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteImpact, setDeleteImpact] = useState(null);

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

    async function openDeleteModal() {

        try {

            const impact = await getOpportunityDeleteImpact(opportunity.id);
            setDeleteImpact(impact);

        } catch (err) {

            console.error(err);
            setDeleteImpact(null);

        }

        setShowDeleteModal(true);

    }

    async function confirmDelete() {

        try {

            await deleteOpportunity(opportunity.id);
            navigate("/opportunities");

        } catch (err) {

            console.error(err);
            alert(err.response?.data?.message || "Unable to delete opportunity.");
            setShowDeleteModal(false);

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

    if (!opportunity) {

        return (

            <div className="alert alert-danger">

                Opportunity not found.

            </div>

        );

    }

    const lead = opportunity.lead;
    const employee = lead?.assignedEmployee;
    const isWon = opportunity.salesStage?.name === "WON";

    return (

        <>

            <DetailHeader
                backTo="/opportunities"
                title={opportunity.title}
                subtitle={lead?.companyName}
                status={opportunity.salesStage?.name || "Not Set"}
                meta={`Opportunity #${opportunity.id}`}
                primaryAction={{
                    label: "Convert to Customer",
                    icon: "bi-arrow-repeat",
                    disabled: !isWon,
                    title: !isWon ? "Only WON opportunities can be converted to customers." : "",
                    onClick: () => navigate(`/customers/convert/${opportunity.id}`),
                }}
                onEdit={() => navigate(`/opportunities/edit/${opportunity.id}`)}
                menuItems={isAdmin ? [
                    {
                        label: "Delete Opportunity",
                        icon: "bi-trash",
                        danger: true,
                        onClick: openDeleteModal,
                    },
                ] : []}
            />

            <div className="row g-3 mb-3">

                <div className="col-md-3">
                    <div className="card shadow-sm text-center h-100">
                        <div className="card-body">
                            <small className="text-muted">Opportunity Value</small>
                            <h5 className="mt-2">{formatCurrency(opportunity.productValue)}</h5>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card shadow-sm text-center h-100">
                        <div className="card-body">
                            <small className="text-muted">Sales Stage</small>
                            <h5 className="mt-2">
                                <StatusBadge status={opportunity.salesStage?.name || "Not Set"} />
                            </h5>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card shadow-sm text-center h-100">
                        <div className="card-body">
                            <small className="text-muted">Expected Close</small>
                            <h5 className="mt-2">{formatDate(opportunity.expectedClosingDate)}</h5>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card shadow-sm text-center h-100">
                        <div className="card-body">
                            <small className="text-muted">Assigned Employee</small>
                            <h5 className="mt-2">{employee?.name || "-"}</h5>
                        </div>
                    </div>
                </div>

            </div>

            <div className="row g-3">

                <div className="col-lg-8">

                    <SectionCard title="Lead Information">

                        <div className="row">

                            <div className="col-md-6">
                                <DetailField label="Company" value={lead?.companyName} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Contact Person" value={lead?.contactPerson} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Designation" value={lead?.designation} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Phone" value={lead?.phone} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Alternate Phone" value={lead?.alternatePhone} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Email" value={lead?.email} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Secondary Email" value={lead?.secondaryEmail} />
                            </div>

                            <div className="col-md-6">
                                <DetailField
                                    label="Products"
                                    value={lead?.leadProducts?.length > 0
                                        ? lead.leadProducts
                                            .map(lp => `${lp.product?.name} (${lp.quantity})`)
                                            .join(", ")
                                        : ""}
                                />
                            </div>

                            <div className="col-md-6">
                                <DetailField
                                    label="Battery"
                                    value={lead?.leadBatteries?.length > 0
                                        ? lead.leadBatteries
                                            .map(lb => `${lb.battery?.name} (${lb.quantity})`)
                                            .join(", ")
                                        : ""}
                                />
                            </div>

                            <div className="col-md-4">
                                <DetailField label="City" value={lead?.city} />
                            </div>

                            <div className="col-md-4">
                                <DetailField label="State" value={lead?.state} />
                            </div>

                            <div className="col-md-4">
                                <DetailField label="Pincode" value={lead?.pincode} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Lead Source" value={lead?.leadSource?.name} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Lead Status" status={lead?.leadStatus} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Validity" status={opportunity?.leadValidity} />
                            </div>

                        </div>

                        <div className="mt-4">

                            <label className="fw-semibold mb-2 d-block">Description</label>

                            <div className="border rounded p-3 bg-light">
                                {lead?.description || "No description available."}
                            </div>

                        </div>

                    </SectionCard>

                    <ActivityPlaceholder />

                </div>

                <div className="col-lg-4">

                    <SectionCard title="Assigned Employee">

                        <DetailField label="Name" value={employee?.name} />
                        <DetailField label="Email" value={employee?.email} />
                        <DetailField label="Phone" value={employee?.phone} />
                        <DetailField label="Status" status={employee?.isActive ? "Active" : "Inactive"} />

                    </SectionCard>

                    <SectionCard title="Record Info">

                        <DetailField label="Created" value={formatDateTime(opportunity.createdAt)} />
                        <DetailField label="Last Updated" value={formatDateTime(opportunity.updatedAt)} />

                    </SectionCard>

                </div>

            </div>

            <FollowUpSection
                opportunityId={opportunity.id}
            />

            <DeleteModal
                show={showDeleteModal}
                title="Delete Opportunity"
                message={`Are you sure you want to delete "${opportunity.title}"?`}
                {...describeDeleteImpact(deleteImpact, "Opportunity")}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
            />

        </>

    );
}
