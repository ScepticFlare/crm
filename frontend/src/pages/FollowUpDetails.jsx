import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getFollowUpById, deleteFollowUp } from "../services/followupService";
import DetailField from "../components/DetailField";
import SectionCard from "../components/ui/SectionCard";
import LoadingState from "../components/ui/LoadingState";
import DetailHeader from "../components/detail/DetailHeader";
import ActivityPlaceholder from "../components/detail/ActivityPlaceholder";
import DeleteModal from "../components/DeleteModal";
import { formatDateTime } from "../utils/formatDate";

export default function FollowUpDetails() {

    const { id } = useParams();
    const navigate = useNavigate();

    // Backend is the source of truth (FOLLOWUP_DELETE is ADMIN-only - see
    // FollowUpService.deleteFollowUp) - this only controls whether the
    // Delete menu item is offered at all.
    const isAdmin = localStorage.getItem("role") === "ADMIN";

    const [followUp, setFollowUp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        loadFollowUp();
    }, []);

    async function loadFollowUp() {

        try {

            const data = await getFollowUpById(id);
            setFollowUp(data);

        } catch (err) {

            console.error(err);
            alert("Unable to load Follow Up.");

        } finally {

            setLoading(false);

        }

    }

    async function confirmDelete() {

        try {

            await deleteFollowUp(followUp.id);
            navigate("/followups");

        } catch (err) {

            console.error(err);
            alert("Unable to delete follow up.");
            setShowDeleteModal(false);

        }

    }

    if (loading) {

        return (
            <LoadingState className="text-center mt-5" />
        );

    }

    if (!followUp) {

        return (
            <div className="alert alert-danger">
                Follow Up not found.
            </div>
        );

    }

    return (

        <>

            <DetailHeader
                backTo="/followups"
                title={followUp.activityType?.name || "Follow Up"}
                subtitle={followUp.lead?.companyName || followUp.opportunity?.title}
                status={followUp.status}
                meta={`Follow Up #${followUp.id}`}
                onEdit={() => navigate(`/followups/edit/${followUp.id}`)}
                menuItems={isAdmin ? [
                    {
                        label: "Delete Follow Up",
                        icon: "bi-trash",
                        danger: true,
                        onClick: () => setShowDeleteModal(true),
                    },
                ] : []}
            />

            <div className="row g-3">

                <div className="col-lg-8">

                    <SectionCard title="Follow Up Information">

                        <div className="row">

                            <div className="col-md-6">
                                <DetailField label="Lead" value={followUp.lead?.companyName} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Opportunity" value={followUp.opportunity?.title} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Activity Type" value={followUp.activityType?.name} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Status" status={followUp.status} />
                            </div>

                            <div className="col-md-6">
                                <DetailField
                                    label="Scheduled Date"
                                    value={followUp.scheduledDate
                                        ? formatDateTime(followUp.scheduledDate)
                                        : ""}
                                />
                            </div>

                            <div className="col-md-6">
                                <DetailField
                                    label="Completed Date"
                                    value={followUp.completedDate
                                        ? formatDateTime(followUp.completedDate)
                                        : ""}
                                />
                            </div>

                        </div>

                        <div className="mt-4">
                            <label className="fw-semibold mb-2 d-block">Remarks</label>
                            <div className="border rounded p-3 bg-light">
                                {followUp.remarks || "No remarks available."}
                            </div>
                        </div>

                    </SectionCard>

                    <ActivityPlaceholder />

                </div>

                <div className="col-lg-4">

                    <SectionCard title="Assigned Employee">

                        <DetailField label="Name" value={followUp.employee?.name} />
                        <DetailField label="Email" value={followUp.employee?.email} />
                        <DetailField label="Phone" value={followUp.employee?.phone} />

                    </SectionCard>

                    <SectionCard title="Record Info">

                        <DetailField label="Created" value={formatDateTime(followUp.createdAt)} />
                        <DetailField label="Last Updated" value={formatDateTime(followUp.updatedAt)} />

                    </SectionCard>

                </div>

            </div>

            <DeleteModal
                show={showDeleteModal}
                title="Delete Follow Up"
                message="Are you sure you want to delete this follow up?"
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
            />

        </>

    );

}
