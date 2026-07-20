import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import DeleteModal from "../components/DeleteModal";

import {
    getAllFollowUps,
    deleteFollowUp
} from "../services/followUpService";

export default function FollowUps() {

    const navigate = useNavigate();

    const [followUps, setFollowUps] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedFollowUp, setSelectedFollowUp] = useState(null);

    useEffect(() => {
        loadFollowUps();
    }, []);

    async function loadFollowUps() {

        try {

            const data = await getAllFollowUps();

            setFollowUps(data);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    }

    function openDeleteModal(followUp) {

        setSelectedFollowUp(followUp);

        setShowDeleteModal(true);

    }

    function closeDeleteModal() {

        setSelectedFollowUp(null);

        setShowDeleteModal(false);

    }

    async function confirmDelete() {

        try {

            await deleteFollowUp(selectedFollowUp.id);

            closeDeleteModal();

            await loadFollowUps();

        } catch (error) {

            console.error(error);

            alert("Unable to delete follow up.");

        }

    }

    const filteredFollowUps = useMemo(() => {

        const text = search.toLowerCase();

        return followUps.filter((followUp) =>

            followUp.lead?.companyName?.toLowerCase().includes(text) ||

            followUp.opportunity?.title?.toLowerCase().includes(text) ||

            followUp.employee?.name?.toLowerCase().includes(text) ||

            followUp.activityType?.toLowerCase().includes(text) ||

            followUp.status?.toLowerCase().includes(text) ||

            followUp.remarks?.toLowerCase().includes(text)

        );

    }, [followUps, search]);

    function statusColor(status) {

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
                return "dark";

        }

    }

    const totalFollowUps = followUps.length;

    const pendingFollowUps =
        followUps.filter(f => f.status === "PENDING").length;

    const completedFollowUps =
        followUps.filter(f => f.status === "COMPLETED").length;

    const today = new Date().toISOString().split("T")[0];

    const todayFollowUps =
        followUps.filter(f =>
            f.scheduledDate?.startsWith(today)
        ).length;
            const columns = [

        {
            key: "lead",
            label: "Lead",

            render: (row) =>
                row.lead?.companyName || "-"
        },

        {
            key: "opportunity",
            label: "Opportunity",

            render: (row) =>
                row.opportunity?.title || "-"
        },

        {
            key: "employee",
            label: "Employee",

            render: (row) =>
                row.employee?.name || "-"
        },

        {
            key: "activity",
            label: "Activity",

            render: (row) =>
                row.activityType?.replaceAll("_", " ")
        },

        {
            key: "scheduledDate",
            label: "Scheduled",

            render: (row) =>
                row.scheduledDate
                    ? new Date(row.scheduledDate).toLocaleString()
                    : "-"
        },

        {
            key: "status",
            label: "Status",

            render: (row) => (

                <span
                    className={`badge bg-${statusColor(row.status)}`}
                >
                    {row.status}
                </span>

            )

        }

    ];

    return (

        <>

            <PageHeader
                title="Follow Ups"
                subtitle={`${filteredFollowUps.length} Follow Up(s) Found`}
                buttonText="Add Follow Up"
                onButtonClick={() => navigate("/followups/add")}
            />

            <div className="row mb-4">

                <div className="col-md-3">

                    <div className="card shadow-sm border-0">

                        <div className="card-body">

                            <small className="text-muted">
                                Total Follow Ups
                            </small>

                            <h3>{totalFollowUps}</h3>

                        </div>

                    </div>

                </div>

                <div className="col-md-3">

                    <div className="card shadow-sm border-0">

                        <div className="card-body">

                            <small className="text-muted">
                                Pending
                            </small>

                            <h3 className="text-warning">
                                {pendingFollowUps}
                            </h3>

                        </div>

                    </div>

                </div>

                <div className="col-md-3">

                    <div className="card shadow-sm border-0">

                        <div className="card-body">

                            <small className="text-muted">
                                Completed
                            </small>

                            <h3 className="text-success">
                                {completedFollowUps}
                            </h3>

                        </div>

                    </div>

                </div>

                <div className="col-md-3">

                    <div className="card shadow-sm border-0">

                        <div className="card-body">

                            <small className="text-muted">
                                Today's Follow Ups
                            </small>

                            <h3>{todayFollowUps}</h3>

                        </div>

                    </div>

                </div>

            </div>

            <div className="card shadow-sm border-0 mb-4">

                <div className="card-body">

                    <div className="input-group">

                        <span className="input-group-text bg-white">

                            <i className="bi bi-search"></i>

                        </span>

                        <input
                            className="form-control border-start-0"
                            placeholder="Search follow up..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                    </div>

                </div>

            </div>

            <DataTable
                columns={columns}
                data={filteredFollowUps}
                loading={loading}
                renderActions={(row) => (

                    <div className="btn-group">

                        <button
                            className="btn btn-sm btn-primary"
                            onClick={() => navigate(`/followups/${row.id}`)}
                        >
                            <i className="bi bi-eye"></i>
                        </button>

                        <button
                            className="btn btn-sm btn-warning"
                            onClick={() => navigate(`/followups/edit/${row.id}`)}
                        >
                            <i className="bi bi-pencil"></i>
                        </button>

                        <button
                            className="btn btn-sm btn-danger"
                            onClick={() => openDeleteModal(row)}
                        >
                            <i className="bi bi-trash"></i>
                        </button>

                    </div>

                )}
            />

            <DeleteModal
                show={showDeleteModal}
                title="Delete Follow Up"
                message={
                    selectedFollowUp
                        ? `Delete this follow up?`
                        : ""
                }
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
            />

        </>

    );

}