import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import DetailField from "../components/DetailField";

import {
    getCustomerById,
    deleteCustomer
} from "../services/customerService";

export default function CustomerDetails() {

    const { id } = useParams();

    const navigate = useNavigate();

    const [customer, setCustomer] = useState(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCustomer();
    }, []);

    async function loadCustomer() {

        try {

            const data = await getCustomerById(id);

            setCustomer(data);

        } catch (err) {

            console.error(err);

            alert("Failed to load customer.");

        } finally {

            setLoading(false);

        }

    }

    async function handleDelete() {

        if (!window.confirm("Delete this customer?"))
            return;

        try {

            await deleteCustomer(id);

            alert("Customer deleted successfully.");

            navigate("/customers");

        } catch (err) {

            console.error(err);

            alert("Unable to delete customer.");

        }

    }

    function formatCurrency(value) {

        if (!value) return "-";

        return Number(value).toLocaleString("en-IN", {

            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0

        });

    }

    function formatDate(date) {

        if (!date) return "-";

        return new Date(date).toLocaleDateString("en-IN", {

            day: "2-digit",
            month: "short",
            year: "numeric"

        });

    }

    function stageColor(stage) {

        switch (stage) {

            case "NEW":
                return "secondary";

            case "QUOTATION_SENT":
                return "info";

            case "NEGOTIATION":
                return "warning";

            case "POSTPONED":
                return "dark";

            case "WON":
                return "success";

            case "LOST":
                return "danger";

            default:
                return "primary";

        }

    }

    if (loading) {

        return (

            <div className="text-center mt-5">

                <div className="spinner-border text-primary"></div>

            </div>

        );

    }

    if (!customer) {

        return (

            <div className="alert alert-danger">

                Customer not found.

            </div>

        );

    }

    const employee = customer.assignedEmployee;

    const opportunity = customer.opportunity;
        return (

        <div className="container-fluid">

            <PageHeader
                title="Customer Details"
                subtitle="View complete customer information"
            />

            <div className="card border-0 shadow-sm mb-4">

                <div className="card-body">

                    <div className="row align-items-center">

                        <div className="col-lg-8">

                            <h2 className="fw-bold mb-1">

                                {customer.companyName}

                            </h2>

                            <h5 className="text-muted mb-3">

                                {customer.contactPerson}

                            </h5>

                            <span className="badge bg-success px-3 py-2">

                                Customer

                            </span>

                            <span className="ms-3 text-muted">

                                {customer.customerCode || `Customer #${customer.id}`}

                            </span>

                        </div>

                        <div className="col-lg-4 text-lg-end mt-4 mt-lg-0">

                            <button
                                className="btn btn-warning me-2"
                                onClick={() =>
                                    navigate(`/customers/edit/${customer.id}`)
                                }
                            >
                                Edit
                            </button>

                            <button
                                className="btn btn-danger me-2"
                                onClick={handleDelete}
                            >
                                Delete
                            </button>

                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => navigate("/customers")}
                            >
                                Back
                            </button>

                        </div>

                    </div>

                </div>

            </div>

            <div className="row g-3 mb-4">

                <div className="col-md-3">

                    <div className="card shadow-sm text-center h-100">

                        <div className="card-body">

                            <small className="text-muted">

                                Customer Since

                            </small>

                            <h5 className="mt-2">

                                {formatDate(customer.createdAt)}

                            </h5>

                        </div>

                    </div>

                </div>

                <div className="col-md-3">

                    <div className="card shadow-sm text-center h-100">

                        <div className="card-body">

                            <small className="text-muted">

                                GST Number

                            </small>

                            <h5 className="mt-2">

                                {customer.gstNumber || "-"}

                            </h5>

                        </div>

                    </div>

                </div>

                <div className="col-md-3">

                    <div className="card shadow-sm text-center h-100">

                        <div className="card-body">

                            <small className="text-muted">

                                Opportunity Value

                            </small>

                            <h5 className="mt-2">

                                {formatCurrency(opportunity?.productValue)}

                            </h5>

                        </div>

                    </div>

                </div>

                <div className="col-md-3">

                    <div className="card shadow-sm text-center h-100">

                        <div className="card-body">

                            <small className="text-muted">

                                Assigned Employee

                            </small>

                            <h5 className="mt-2">

                                {employee?.name || "-"}

                            </h5>

                        </div>

                    </div>

                </div>

            </div>
                        <div className="row">

                <div className="col-lg-8">

                    <div className="card shadow-sm border-0 mb-4">

                        <div className="card-body">

                            <h5 className="fw-semibold mb-4">

                                Company Information

                            </h5>

                            <DetailField
                                label="Company Name"
                                value={customer.companyName}
                            />

                            <DetailField
                                label="Contact Person"
                                value={customer.contactPerson}
                            />

                            <DetailField
                                label="Designation"
                                value={customer.designation}
                            />

                            <DetailField
                                label="Phone"
                                value={customer.phone}
                            />

                            <DetailField
                                label="Alternate Phone"
                                value={customer.alternatePhone}
                            />

                            <DetailField
                                label="Email"
                                value={customer.email}
                            />

                            <DetailField
                                label="Secondary Email"
                                value={customer.secondaryEmail}
                            />

                            <DetailField
                                label="Website"
                                value={customer.website}
                            />

                        </div>

                    </div>

                    <div className="card shadow-sm border-0">

                        <div className="card-body">

                            <h5 className="fw-semibold mb-4">

                                Address Information

                            </h5>

                            <DetailField
                                label="City"
                                value={customer.city}
                            />

                            <DetailField
                                label="State"
                                value={customer.state}
                            />

                            <DetailField
                                label="Pincode"
                                value={customer.pincode}
                            />

                            <div className="mt-4">

                                <label className="fw-semibold mb-2">

                                    Billing Address

                                </label>

                                <div className="border rounded p-3 bg-light">

                                    {customer.billingAddress || "-"}

                                </div>

                            </div>

                            <div className="mt-4">

                                <label className="fw-semibold mb-2">

                                    Shipping Address

                                </label>

                                <div className="border rounded p-3 bg-light">

                                    {customer.shippingAddress || "-"}

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

                <div className="col-lg-4">

                    <div className="card shadow-sm border-0 mb-4">

                        <div className="card-body">

                            <h5 className="fw-semibold mb-4">

                                Opportunity Information

                            </h5>

                            <DetailField
                                label="Title"
                                value={opportunity?.title}
                            />

                            <DetailField
                                label="Sales Stage"
                                badge={opportunity?.salesStage}
                                badgeColor={
                                    stageColor(opportunity?.salesStage)
                                }
                            />

                            <DetailField
                                label="Product Value"
                                value={formatCurrency(opportunity?.productValue)}
                            />

                            <DetailField
                                label="Expected Closing Date"
                                value={formatDate(opportunity?.expectedClosingDate)}
                            />

                        </div>

                    </div>
                                        <div className="card shadow-sm border-0">

                        <div className="card-body">

                            <h5 className="fw-semibold mb-4">

                                Assigned Employee

                            </h5>

                            <DetailField
                                label="Name"
                                value={employee?.name}
                            />

                            <DetailField
                                label="Email"
                                value={employee?.email}
                            />

                            <DetailField
                                label="Phone"
                                value={employee?.phone}
                            />

                            <DetailField
                                label="Status"
                                badge={
                                    employee?.isActive
                                        ? "Active"
                                        : "Inactive"
                                }
                                badgeColor={
                                    employee?.isActive
                                        ? "success"
                                        : "danger"
                                }
                            />

                        </div>

                    </div>

                </div>

            </div>

        </div>

    );

}