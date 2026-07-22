import { useEffect, useMemo, useState } from "react";
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

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);

    useEffect(() => {
        loadLeads();
    }, []);

    async function loadLeads() {

        try {

            const response = await getAllLeads();

            setLeads(response);

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

    const filteredLeads = useMemo(() => {

        return leads.filter((lead) => {

            const text = search.toLowerCase();

            return (

                lead.companyName?.toLowerCase().includes(text) ||

                lead.contactPerson?.toLowerCase().includes(text) ||

                lead.email?.toLowerCase().includes(text)

            );

        });

    }, [leads, search]);

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
                subtitle={`${filteredLeads.length} Lead(s) Found`}
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
                            onChange={(e) => setSearch(e.target.value)}
                        />

                    </div>

                </div>

            </div>

            <DataTable
                columns={columns}
                data={filteredLeads}
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