import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getFollowUpsByLead,
    getFollowUpsByOpportunity,
    deleteFollowUp
} from "../services/followUpService";

export default function FollowUpSection({
    leadId,
    opportunityId
}) {

    const navigate = useNavigate();

    const [followUps, setFollowUps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        loadFollowUps();

    }, [leadId, opportunityId]);

    async function loadFollowUps() {

        try {

            let data = [];

            if (leadId) {

                data = await getFollowUpsByLead(leadId);

            } else if (opportunityId) {

                data = await getFollowUpsByOpportunity(
                    opportunityId
                );

            }

            setFollowUps(data);

        } catch (error) {

            console.error(error);

            alert("Unable to load follow ups.");

        } finally {

            setLoading(false);

        }

    }

    async function handleDelete(id) {

        if (
            !window.confirm(
                "Delete this follow up?"
            )
        ) {
            return;
        }

        try {

            await deleteFollowUp(id);

            loadFollowUps();

        } catch (error) {

            console.error(error);

            alert("Unable to delete follow up.");

        }

    }

    function badgeColor(status) {

        switch (status) {

            case "PENDING":
                return "warning";

            case "COMPLETED":
                return "success";

            case "MISSED":
                return "danger";

            case "CANCELLED":
                return "secondary";

            default:
                return "primary";

        }

    }

    function formatDate(date) {

        if (!date) return "-";

        return new Date(date).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    }

    if (loading) {

        return (

            <div className="card shadow-sm border-0 mt-4">

                <div className="card-body text-center">

                    <div className="spinner-border text-primary"></div>

                </div>

            </div>

        );

    }
        return (

        <div className="card shadow-sm border-0 mt-4">

            <div className="card-header bg-white d-flex justify-content-between align-items-center">

                <h5 className="mb-0 fw-semibold">

                    Follow Ups

                </h5>

                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {

                        if (leadId) {

                            navigate(
                                `/followups/add?leadId=${leadId}`
                            );

                        } else {

                            navigate(
                                `/followups/add?opportunityId=${opportunityId}`
                            );

                        }

                    }}
                >

                    <i className="bi bi-plus-circle me-2"></i>

                    Add Follow Up

                </button>

            </div>

            <div className="card-body">

                {

                    followUps.length === 0 ?

                        (

                            <div className="text-center text-muted py-4">

                                <i
                                    className="bi bi-calendar-x"
                                    style={{
                                        fontSize: "3rem"
                                    }}
                                ></i>

                                <h6 className="mt-3">

                                    No Follow Ups Found

                                </h6>

                                <p className="mb-0">

                                    Create your first follow up.

                                </p>

                            </div>

                        )

                        :

                        (

                            <div className="table-responsive">

                                <table className="table table-hover align-middle">

                                    <thead className="table-light">

                                        <tr>

                                            <th>Date</th>

                                            <th>Activity</th>

                                            <th>Status</th>

                                            <th>Employee</th>

                                            <th>Remarks</th>

                                            <th width="180">

                                                Actions

                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {

                                            followUps.map(followUp => (

                                                <tr key={followUp.id}>

                                                    <td>

                                                        {formatDate(
                                                            followUp.scheduledDate
                                                        )}

                                                    </td>

                                                    <td>

                                                        {followUp.activityType?.name || "-"}

                                                    </td>

                                                    <td>

                                                        <span
                                                            className={`badge bg-${badgeColor(
                                                                followUp.status
                                                            )}`}
                                                        >

                                                            {followUp.status}

                                                        </span>

                                                    </td>

                                                    <td>

                                                        {followUp.employee?.name || "-"}

                                                    </td>

                                                    <td>

                                                        {followUp.remarks || "-"}

                                                    </td>

                                                    <td>

                                                        <div className="btn-group">

                                                            <button
                                                                className="btn btn-outline-primary btn-sm"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/followups/${followUp.id}`
                                                                    )
                                                                }
                                                            >

                                                                <i className="bi bi-eye"></i>

                                                            </button>

                                                            <button
                                                                className="btn btn-outline-warning btn-sm"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/followups/edit/${followUp.id}`
                                                                    )
                                                                }
                                                            >

                                                                <i className="bi bi-pencil"></i>

                                                            </button>

                                                            <button
                                                                className="btn btn-outline-danger btn-sm"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        followUp.id
                                                                    )
                                                                }
                                                            >

                                                                <i className="bi bi-trash"></i>

                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>

                                            ))

                                        }

                                    </tbody>

                                </table>

                            </div>

                        )

                }

            </div>

        </div>

    );

}