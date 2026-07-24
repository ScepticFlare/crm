import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import DeleteModal from "../components/DeleteModal";

import {
    getAllCustomers,
    deleteCustomer
} from "../services/customerService";

export default function Customers() {

    const navigate = useNavigate();

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");

    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    useEffect(() => {
        loadCustomers();
    }, [page, pageSize, search]);

    async function loadCustomers() {

        try {

            setLoading(true);

            const response = await getAllCustomers(
                page,
                pageSize,
                search
            );

            setCustomers(response.content);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    }

    function openDeleteModal(customer) {

        setSelectedCustomer(customer);

        setShowDeleteModal(true);

    }

    function closeDeleteModal() {

        setSelectedCustomer(null);

        setShowDeleteModal(false);

    }

    async function confirmDelete() {

        try {

            await deleteCustomer(selectedCustomer.id);

            closeDeleteModal();

            await loadCustomers();

        } catch (error) {

            console.error(error);

            alert("Unable to delete customer.");

        }

    }

    const columns = [

        {
            key: "company",
            label: "Company",
            render: row => row.companyName
        },

        {
            key: "contact",
            label: "Contact",
            render: row => row.contactPerson
        },

        {
            key: "phone",
            label: "Phone"
        },

        {
            key: "city",
            label: "City"
        },

        {
            key: "employee",
            label: "Employee",
            render: row => row.assignedEmployee?.name || "-"
        }

    ];

    const uniqueCities =
        new Set(customers.map(c => c.city)).size;

    const uniqueEmployees =
        new Set(customers.map(c => c.assignedEmployee?.id)).size;
            return (

        <>

            <PageHeader
                title="Customers"
                subtitle={`${totalElements} Customer(s) Found`}
            />

            <div className="row mb-4">

                <div className="col-md-3">

                    <div className="card shadow-sm border-0">

                        <div className="card-body">

                            <small className="text-muted">
                                Total Customers
                            </small>

                            <h3>{totalElements}</h3>

                        </div>

                    </div>

                </div>

                <div className="col-md-3">

                    <div className="card shadow-sm border-0">

                        <div className="card-body">

                            <small className="text-muted">
                                Cities
                            </small>

                            <h3>{uniqueCities}</h3>

                        </div>

                    </div>

                </div>

                <div className="col-md-3">

                    <div className="card shadow-sm border-0">

                        <div className="card-body">

                            <small className="text-muted">
                                Employees
                            </small>

                            <h3>{uniqueEmployees}</h3>

                        </div>

                    </div>

                </div>

                <div className="col-md-3">

                    <div className="card shadow-sm border-0">

                        <div className="card-body">

                            <small className="text-muted">
                                GST Registered
                            </small>

                            <h3>

                                {
                                    customers.filter(c => c.gstNumber).length
                                }

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
                            placeholder="Search by company, contact, phone, email, city, GST or employee..."
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
                data={customers}
                loading={loading}
                renderActions={(row) => (

                    <div className="btn-group">

                        <button
                            className="btn btn-sm btn-primary"
                            onClick={() => navigate(`/customers/${row.id}`)}
                        >
                            <i className="bi bi-eye"></i>
                        </button>

                        <button
                            className="btn btn-sm btn-warning"
                            onClick={() => navigate(`/customers/edit/${row.id}`)}
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

            {!loading && customers.length === 0 && (

                <div className="alert alert-light border text-center mt-3">

                    <i className="bi bi-search me-2"></i>

                    No matching customers found.

                </div>

            )}

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

            <DeleteModal
                show={showDeleteModal}
                title="Delete Customer"
                message={
                    selectedCustomer
                        ? `Delete "${selectedCustomer.companyName}"?`
                        : ""
                }
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
            />

        </>

    );

}