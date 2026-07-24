import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import DeleteModal from "../components/DeleteModal";

import {
    getAllOpportunities,
    deleteOpportunity
} from "../services/opportunityService";

export default function Opportunities() {

    const navigate = useNavigate();

    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedOpportunity, setSelectedOpportunity] = useState(null);

    useEffect(() => {
    loadOpportunities();
}, [page, pageSize, search]);

    async function loadOpportunities() {

    try {

        setLoading(true);

        const response = await getAllOpportunities(
            page,
            pageSize,
            search
        );

        setOpportunities(response.content);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);

    } catch (error) {

        console.error(error);

    } finally {

        setLoading(false);

    }

}

    function openDeleteModal(opportunity) {

        setSelectedOpportunity(opportunity);

        setShowDeleteModal(true);

    }

    function closeDeleteModal() {

        setSelectedOpportunity(null);

        setShowDeleteModal(false);

    }

    async function confirmDelete() {

        try {

            await deleteOpportunity(selectedOpportunity.id);

            closeDeleteModal();

            await loadOpportunities();

        } catch (error) {

            console.error(error);

            alert("Unable to delete opportunity.");

        }

    }


    function stageColor(stage) {

        switch (stage) {

            case "NEW":
                return "primary";

            case "QUOTATION_SENT":
                return "warning";

            case "NEGOTIATION":
                return "info";

            case "POSTPONED":
                return "secondary";

            case "WON":
                return "success";

            case "LOST":
                return "danger";

            default:
                return "dark";

        }

    }

    const totalValue = opportunities.reduce(
        (sum, opportunity) => sum + (opportunity.productValue || 0),
        0
    );

    const wonValue = opportunities
    .filter(o => (o.salesStage?.name || "") === "WON")
    .reduce((sum, o) => sum + (o.productValue || 0), 0);

    const columns = [

        {
            key: "company",
            label: "Lead",

            render: (row) => row.lead?.companyName
        },

        {
            key: "title",
            label: "Opportunity"
        },

        {
            key: "value",
            label: "Value",

            render: (row) =>

                `₹${Number(row.productValue || 0).toLocaleString("en-IN")}`

        },

        {
            key: "date",
            label: "Closing Date",

            render: (row) =>

                row.expectedClosingDate

        },

        {
            key: "stage",
            label: "Stage",

            render: (row) => {

            const stage = row.salesStage?.name || "Not Set";

            return (
            <span className={`badge bg-${stageColor(stage)}`}>
                {stage}
            </span>
        );

    }

}

    ];

    return (

        <>

            <PageHeader
                title="Opportunities"
                subtitle={`${totalElements} Opportunity(s) Found`}
            />

            <div className="row mb-4">

                <div className="col-md-4">

                    <div className="card shadow-sm border-0">

                        <div className="card-body">

                            <small className="text-muted">

                                Total Opportunities

                            </small>

                            <h3>

                                {totalElements}

                            </h3>

                        </div>

                    </div>

                </div>

                <div className="col-md-4">

                    <div className="card shadow-sm border-0">

                        <div className="card-body">

                            <small className="text-muted">

                                Pipeline Value

                            </small>

                            <h3>

                                ₹{totalValue.toLocaleString("en-IN")}

                            </h3>

                        </div>

                    </div>

                </div>

                <div className="col-md-4">

                    <div className="card shadow-sm border-0">

                        <div className="card-body">

                            <small className="text-muted">

                                Won Deals

                            </small>

                            <h3 className="text-success">

                                ₹{wonValue.toLocaleString("en-IN")}

                            </h3>

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
                            placeholder="Search by company, contact, phone, email, stage or employee..."
                            value={search}
                            onChange={(e) => {

                                setSearch(e.target.value);

                                setPage(0);

}}
                        />

                    </div>

                </div>

            </div>

            <DataTable
                columns={columns}
                data={opportunities}
                loading={loading}
                renderActions={(row) => (

                    <div className="btn-group">

                        <button
                            className="btn btn-sm btn-primary"
                            onClick={() => navigate(`/opportunities/${row.id}`)}
                        >
                            <i className="bi bi-eye"></i>
                        </button>

                        <button
                            className="btn btn-sm btn-warning"
                            onClick={() => navigate(`/opportunities/edit/${row.id}`)}
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

            <div className="d-flex justify-content-between align-items-center mt-3">

    <div>

        <select
            className="form-select"
            style={{ width: "100px" }}
            value={pageSize}
            onChange={(e) => {

                setPageSize(Number(e.target.value));
                setPage(0);

            }}
        >

            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>

        </select>

    </div>

    <div>

        <button
            className="btn btn-outline-primary me-2"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
        >
            Previous
        </button>

        <span className="mx-2">

            Page {page + 1} of {totalPages || 1}

        </span>

        <button
            className="btn btn-outline-primary"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage(page + 1)}
        >
            Next
        </button>

    </div>

</div>
            {!loading && opportunities.length === 0 && (
    <div className="alert alert-light border text-center mt-3">
        <i className="bi bi-search me-2"></i>
        No matching opportunities found.
    </div>
)}

            <DeleteModal
                show={showDeleteModal}
                title="Delete Opportunity"
                message={
                    selectedOpportunity
                        ? `Delete "${selectedOpportunity.title}"?`
                        : ""
                }
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
            />

        </>

    );

}