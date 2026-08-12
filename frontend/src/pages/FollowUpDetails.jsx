
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getFollowUpById } from "../services/followupService";
import DetailField from "../components/DetailField";
import LoadingState from "../components/ui/LoadingState";

export default function FollowUpDetails() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [followUp, setFollowUp] = useState(null);
    const [loading, setLoading] = useState(true);

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

        <div className="container">

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>

                    <h2 className="fw-bold mb-1">
                        Follow Up Details
                    </h2>

                    <p className="text-muted">
                        Complete Follow Up information
                    </p>

                </div>

                <div>

                    <button
                        className="btn btn-warning me-2"
                        onClick={() => navigate(`/followups/edit/${followUp.id}`)}
                    >
                        <i className="bi bi-pencil me-2"></i>
                        Edit
                    </button>

                    <button
                        className="btn btn-secondary"
                        onClick={() => navigate("/followups")}
                    >
                        Back
                    </button>

                </div>

            </div>

            <div className="card shadow-sm border-0">

                <div className="card-body">

                    <div className="row g-4">

                        <div className="col-md-6">
                            <DetailField label="Lead" value={followUp.lead?.companyName} />
                        </div>

                        <div className="col-md-6">
                            <DetailField label="Opportunity" value={followUp.opportunity?.title} />
                        </div>

                        <div className="col-md-6">
                            <DetailField label="Assigned Employee" value={followUp.employee?.name} />
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
                                    ? new Date(followUp.scheduledDate).toLocaleString()
                                    : ""}
                            />
                        </div>

                        <div className="col-md-6">
                            <DetailField
                                label="Completed Date"
                                value={followUp.completedDate
                                    ? new Date(followUp.completedDate).toLocaleString()
                                    : ""}
                            />
                        </div>

                        <div className="col-12">
                            <label className="text-muted small mb-1">Remarks</label>

                            <div className="border rounded p-3 bg-light">
                                {followUp.remarks || "No remarks available."}
                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}