
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getFollowUpById } from "../services/followUpService";

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

    function badgeColor(status) {

        switch (status) {

            case "COMPLETED":
                return "success";

            case "PENDING":
                return "warning";

            case "MISSED":
                return "danger";

            case "CANCELLED":
                return "secondary";

            default:
                return "primary";
        }

    }

    if (loading) {

        return (
            <div className="text-center mt-5">
                <div className="spinner-border"></div>
            </div>
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
                            <strong>Lead</strong>
                            <div>{followUp.lead?.companyName || "-"}</div>
                        </div>

                        <div className="col-md-6">
                            <strong>Opportunity</strong>
                            <div>{followUp.opportunity?.title || "-"}</div>
                        </div>

                        <div className="col-md-6">
                            <strong>Assigned Employee</strong>
                            <div>{followUp.employee?.name || "-"}</div>
                        </div>

                        <div className="col-md-6">
                            <strong>Activity Type</strong>
                            <div>{followUp.activityType?.name || "-"}</div>
                        </div>

                        <div className="col-md-6">
                            <strong>Status</strong>
                            <div>
                                <span className={`badge bg-${badgeColor(followUp.status)}`}>
                                    {followUp.status?.replaceAll("_", " ")}
                                </span>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <strong>Scheduled Date</strong>
                            <div>
                                {followUp.scheduledDate
                                    ? new Date(followUp.scheduledDate).toLocaleString()
                                    : "-"}
                            </div>
                        </div>

                        <div className="col-md-6">
                            <strong>Completed Date</strong>
                            <div>
                                {followUp.completedDate
                                    ? new Date(followUp.completedDate).toLocaleString()
                                    : "-"}
                            </div>
                        </div>

                        <div className="col-12">
                            <strong>Remarks</strong>

                            <div className="border rounded p-3 bg-light mt-2">
                                {followUp.remarks || "No remarks available."}
                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}