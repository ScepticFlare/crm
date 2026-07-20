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

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedOpportunity, setSelectedOpportunity] = useState(null);

    useEffect(() => {
        loadOpportunities();
    }, []);

    async function loadOpportunities() {

        try {

            const response = await getAllOpportunities();

            setOpportunities(response);

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

    const filteredOpportunities = useMemo(() => {

        const text = search.toLowerCase();

        return opportunities.filter((opportunity) =>

            opportunity.title?.toLowerCase().includes(text) ||

            opportunity.lead?.companyName?.toLowerCase().includes(text) ||

            opportunity.lead?.contactPerson?.toLowerCase().includes(text)

        );

    }, [opportunities, search]);

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
        .filter(o => o.salesStage === "WON")
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

            render: (row) => (

                <span
                    className={`badge bg-${stageColor(row.salesStage)}`}
                >

                    {row.salesStage.replaceAll("_", " ")}

                </span>

            )

        }

    ];

    return (

        <>

            <PageHeader
                title="Opportunities"
                subtitle={`${filteredOpportunities.length} Opportunity(s) Found`}
            />

            <div className="row mb-4">

                <div className="col-md-4">

                    <div className="card shadow-sm border-0">

                        <div className="card-body">

                            <small className="text-muted">

                                Total Opportunities

                            </small>

                            <h3>

                                {opportunities.length}

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
                            placeholder="Search opportunity..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                    </div>

                </div>

            </div>

            <DataTable
                columns={columns}
                data={filteredOpportunities}
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