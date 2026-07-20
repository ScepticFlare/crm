import { useEffect, useMemo, useState } from "react";
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

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    useEffect(() => {
        loadCustomers();
    }, []);

    async function loadCustomers() {

        try {

            const data = await getAllCustomers();

            setCustomers(data);

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

    const filteredCustomers = useMemo(() => {

        const text = search.toLowerCase();

        return customers.filter(customer =>

            customer.companyName?.toLowerCase().includes(text) ||

            customer.contactPerson?.toLowerCase().includes(text) ||

            customer.phone?.includes(text) ||

            customer.city?.toLowerCase().includes(text)

        );

    }, [customers, search]);

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
                subtitle={`${filteredCustomers.length} Customer(s) Found`}
            />

            <div className="row mb-4">

                <div className="col-md-3">

                    <div className="card shadow-sm border-0">

                        <div className="card-body">

                            <small className="text-muted">
                                Total Customers
                            </small>

                            <h3>{customers.length}</h3>

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
                            placeholder="Search customer..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                    </div>

                </div>

            </div>

            <DataTable
                columns={columns}
                data={filteredCustomers}
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