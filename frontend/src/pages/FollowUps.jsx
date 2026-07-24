import { useEffect, useState } from "react";
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

    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedFollowUp, setSelectedFollowUp] = useState(null);

    useEffect(() => {
        loadFollowUps();
    }, [page, pageSize, search]);

    async function loadFollowUps() {

        try {

            setLoading(true);

            const response = await getAllFollowUps(
                page,
                pageSize,
                search
            );

            setFollowUps(response.content);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);

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

    const totalFollowUps = totalElements;

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
            render: row => row.lead?.companyName || "-"
        },

        {
            key: "opportunity",
            label: "Opportunity",
            render: row => row.opportunity?.title || "-"
        },

        {
            key: "employee",
            label: "Employee",
            render: row => row.employee?.name || "-"
        },

        {
            key: "activity",
            label: "Activity",
            render: row => row.activityType?.name || "-"
        },

        {
            key: "scheduledDate",
            label: "Scheduled",
            render: row =>
                row.scheduledDate
                    ? new Date(row.scheduledDate).toLocaleString()
                    : "-"
        },

        {
            key: "status",
            label: "Status",
            render: row => (

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
            subtitle={`${totalElements} Follow Up(s) Found`}
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

                <div className="row g-3">

                    <div className="col-md-9">

                        <div className="input-group">

                            <span className="input-group-text bg-white">
                                <i className="bi bi-search"></i>
                            </span>

                            <input
                                className="form-control border-start-0"
                                placeholder="Search by lead, contact, opportunity, employee, activity, status or remarks..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(0);
                                }}
                            />

                        </div>

                    </div>

                    <div className="col-md-3">

                        <select
                            className="form-select"
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setPage(0);
                            }}
                        >

                            <option value={25}>25 / page</option>
                            <option value={50}>50 / page</option>
                            <option value={100}>100 / page</option>

                        </select>

                    </div>

                </div>

            </div>

        </div>

        <DataTable
            columns={columns}
            data={followUps}
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

        {!loading && followUps.length === 0 && (

            <div className="alert alert-light border text-center mt-3">

                <i className="bi bi-search me-2"></i>

                No matching follow ups found.

            </div>

        )}

        <div className="d-flex justify-content-between align-items-center mt-4">

            <button
                className="btn btn-outline-primary"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
            >
                Previous
            </button>

            <span>

                Page <strong>{totalPages === 0 ? 0 : page + 1}</strong> of{" "}
                <strong>{totalPages}</strong>

            </span>

            <button
                className="btn btn-outline-primary"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage(page + 1)}
            >
                Next
            </button>

        </div>

        <DeleteModal
            show={showDeleteModal}
            title="Delete Follow Up"
            message={
                selectedFollowUp
                    ? "Delete this follow up?"
                    : ""
            }
            onClose={closeDeleteModal}
            onConfirm={confirmDelete}
        />

    </>

);
}