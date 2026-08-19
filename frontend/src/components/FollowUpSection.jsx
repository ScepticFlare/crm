import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getFollowUpsByLead,
    getFollowUpsByOpportunity,
    deleteFollowUp
} from "../services/followupService";
import StatusBadge from "./ui/StatusBadge";
import LoadingState from "./ui/LoadingState";
import EmptyState from "./ui/EmptyState";

export default function FollowUpSection({
    leadId,
    opportunityId
}) {

    const navigate = useNavigate();

    // Backend is the source of truth (FOLLOWUP_DELETE is ADMIN-only - see
    // FollowUpService.deleteFollowUp) - this only controls whether the
    // delete button is offered at all.
    const isAdmin = localStorage.getItem("role") === "ADMIN";

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

                <LoadingState className="card-body text-center" />

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

                            <EmptyState
                                icon="bi-calendar-x"
                                title="No Follow Ups Found"
                                message="Create your first follow up."
                                className="text-center text-muted py-4"
                            />

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

                                                        <StatusBadge status={followUp.status} />

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
                                                                className="btn btn-sm btn-primary"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/followups/${followUp.id}`
                                                                    )
                                                                }
                                                            >

                                                                <i className="bi bi-eye"></i>

                                                            </button>

                                                            <button
                                                                className="btn btn-sm btn-warning"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/followups/edit/${followUp.id}`
                                                                    )
                                                                }
                                                            >

                                                                <i className="bi bi-pencil"></i>

                                                            </button>

                                                            {isAdmin && (
                                                                <button
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            followUp.id
                                                                        )
                                                                    }
                                                                >

                                                                    <i className="bi bi-trash"></i>

                                                                </button>
                                                            )}

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