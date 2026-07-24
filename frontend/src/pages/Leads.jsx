import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import DeleteModal from "../components/DeleteModal";

import {
    getAllLeads,
    deleteLead
} from "../services/leadService";

export default function Leads() {

    const navigate = useNavigate();

    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);  

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);

    useEffect(() => {
    loadLeads();
}, [page, pageSize, search]);

    async function loadLeads() {

    setLoading(true);

    try {

        const response = await getAllLeads(
            page,
            pageSize,
            search
        );
        console.log("API Response:", response);
        console.log("Content:", response.content);

        setLeads(response.content);

        setTotalPages(response.totalPages);

        setTotalElements(response.totalElements);

    } catch (error) {

        console.error(error);

    } finally {

        setLoading(false);

    }

}

    function openDeleteModal(lead) {

        setSelectedLead(lead);

        setShowDeleteModal(true);

    }

    function closeDeleteModal() {

        setShowDeleteModal(false);

        setSelectedLead(null);

    }

    async function confirmDelete() {

        try {

            await deleteLead(selectedLead.id);

            closeDeleteModal();

            await loadLeads();

        } catch (error) {

            console.error(error);

            alert("Unable to delete lead.");

        }

    }



    function statusColor(status) {

        switch (status) {

            case "NEW":
                return "primary";

            case "CONTACTED":
                return "info";

            case "QUOTATION_SENT":
                return "warning";

            case "NEGOTIATION":
                return "secondary";

            case "WON":
                return "success";

            case "LOST":
                return "danger";

            default:
                return "dark";

        }

    }

    const columns = [

        {
            key: "companyName",
            label: "Company"
        },

        {
            key: "contactPerson",
            label: "Contact"
        },

        {
            key: "phone",
            label: "Phone"
        },

        {
            key: "email",
            label: "Email"
        },

        {
            key: "city",
            label: "City"
        },

        {
            key: "leadStatus",
            label: "Status",

            render: (row) => (

                <span className={`badge bg-${statusColor(row.leadStatus)}`}>

                    {row.leadStatus.replaceAll("_", " ")}

                </span>

            )

        },

        {
            key: "leadSource",
            label: "Source",

            render: (row) => row.leadSource?.name || "-"
}

    ];

    return (

        <>

            <PageHeader
                title="Leads"
                subtitle={`${totalElements} Lead(s) Found`}
                buttonText="Add Lead"
                onButtonClick={() => navigate("/leads/add")}
            />

            <div className="card shadow-sm border-0 mb-4">

                <div className="card-body">

                    <div className="input-group">

                        <span className="input-group-text bg-white">

                            <i className="bi bi-search"></i>

                        </span>

                        <input
                            type="text"
                            className="form-control border-start-0"
                            placeholder="Search by company, contact or email..."
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
                data={leads}
                loading={loading}
                renderActions={(row) => (

                    <div className="btn-group">

                        <button
                            className="btn btn-sm btn-primary"
                            onClick={() => navigate(`/leads/${row.id}`)}
                        >
                            <i className="bi bi-eye"></i>
                        </button>

                        <button
                            className="btn btn-sm btn-warning"
                            onClick={() => navigate(`/leads/edit/${row.id}`)}
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

    <div className="d-flex align-items-center gap-2">

        <span>Show</span>

        <select
            className="form-select"
            style={{ width: "90px" }}
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

        <span>entries</span>

    </div>

    <div className="d-flex align-items-center gap-2">

        <button
            className="btn btn-outline-secondary"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
        >
            Previous
        </button>

        <span>

            Page {page + 1} of {Math.max(totalPages, 1)}

        </span>

        <button
            className="btn btn-outline-secondary"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
        >
            Next
        </button>

    </div>

</div>

            
            {!loading && leads.length === 0 && (
                <div className="alert alert-light border text-center mt-3">
                    <i className="bi bi-search me-2"></i>
                        No matching leads found.
                </div>
            )}


            <DeleteModal
                show={showDeleteModal}
                title="Delete Lead"
                message={
                    selectedLead
                        ? `Are you sure you want to delete "${selectedLead.companyName}"?`
                        : ""
                }
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
            />

        </>

    );

}