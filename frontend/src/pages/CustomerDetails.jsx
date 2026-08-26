import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DetailField from "../components/DetailField";
import SectionCard from "../components/ui/SectionCard";
import LoadingState from "../components/ui/LoadingState";
import DetailHeader from "../components/detail/DetailHeader";
import ActivityPlaceholder from "../components/detail/ActivityPlaceholder";
import DeleteModal from "../components/DeleteModal";

import {
    getCustomerById,
    deleteCustomer,
    getCustomerDeleteImpact
} from "../services/customerService";
import { describeDeleteImpact } from "../utils/deleteImpact";
import { formatDate, formatDateTime } from "../utils/formatDate";

export default function CustomerDetails() {

    const { id } = useParams();
    const navigate = useNavigate();

    // Backend is the source of truth (CUSTOMER_DELETE is ADMIN-only - see
    // CustomerService.deleteCustomer) - this only controls whether the
    // Delete menu item is offered at all.
    const isAdmin = localStorage.getItem("role") === "ADMIN";

    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteImpact, setDeleteImpact] = useState(null);

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

    async function openDeleteModal() {

        try {

            const impact = await getCustomerDeleteImpact(customer.id);
            setDeleteImpact(impact);

        } catch (err) {

            console.error(err);
            setDeleteImpact(null);

        }

        setShowDeleteModal(true);

    }

    async function confirmDelete() {

        try {

            await deleteCustomer(customer.id);
            navigate("/customers");

        } catch (err) {

            console.error(err);
            alert("Unable to delete customer.");
            setShowDeleteModal(false);

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

    if (loading) {

        return (

            <LoadingState className="text-center mt-5" />

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

        <>

            <DetailHeader
                backTo="/customers"
                title={customer.companyName}
                subtitle={customer.contactPerson}
                status="WON"
                meta={customer.customerCode || `Customer #${customer.id}`}
                onEdit={() => navigate(`/customers/edit/${customer.id}`)}
                menuItems={isAdmin ? [
                    {
                        label: "Delete Customer",
                        icon: "bi-trash",
                        danger: true,
                        onClick: openDeleteModal,
                    },
                ] : []}
            />

            <div className="row g-3 mb-3">

                <div className="col-md-3">
                    <div className="card shadow-sm text-center h-100">
                        <div className="card-body">
                            <small className="text-muted">Customer Since</small>
                            <h5 className="mt-2">{formatDate(customer.createdAt)}</h5>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card shadow-sm text-center h-100">
                        <div className="card-body">
                            <small className="text-muted">GST Number</small>
                            <h5 className="mt-2">{customer.gstNumber || "-"}</h5>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card shadow-sm text-center h-100">
                        <div className="card-body">
                            <small className="text-muted">Opportunity Value</small>
                            <h5 className="mt-2">{formatCurrency(opportunity?.productValue)}</h5>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card shadow-sm text-center h-100">
                        <div className="card-body">
                            <small className="text-muted">Assigned Employee</small>
                            <h5 className="mt-2">{employee?.name || "-"}</h5>
                        </div>
                    </div>
                </div>

            </div>

            <div className="row g-3">

                <div className="col-lg-8">

                    <SectionCard title="Company Information">

                        <div className="row">

                            <div className="col-md-6">
                                <DetailField label="Company Name" value={customer.companyName} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Contact Person" value={customer.contactPerson} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Designation" value={customer.designation} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Phone" value={customer.phone} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Alternate Phone" value={customer.alternatePhone} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Email" value={customer.email} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Secondary Email" value={customer.secondaryEmail} />
                            </div>

                            <div className="col-md-6">
                                <DetailField label="Website" value={customer.website} />
                            </div>

                        </div>

                    </SectionCard>

                    <SectionCard title="Address Information">

                        <div className="row">

                            <div className="col-md-4">
                                <DetailField label="City" value={customer.city} />
                            </div>

                            <div className="col-md-4">
                                <DetailField label="State" value={customer.state} />
                            </div>

                            <div className="col-md-4">
                                <DetailField label="Pincode" value={customer.pincode} />
                            </div>

                        </div>

                        <div className="mt-3">
                            <label className="fw-semibold mb-2 d-block">Billing Address</label>
                            <div className="border rounded p-3 bg-light">
                                {customer.billingAddress || "-"}
                            </div>
                        </div>

                        <div className="mt-3">
                            <label className="fw-semibold mb-2 d-block">Shipping Address</label>
                            <div className="border rounded p-3 bg-light">
                                {customer.shippingAddress || "-"}
                            </div>
                        </div>

                    </SectionCard>

                    <ActivityPlaceholder />

                </div>

                <div className="col-lg-4">

                    <SectionCard title="Opportunity Information">

                        <DetailField label="Title" value={opportunity?.title} />
                        <DetailField label="Sales Stage" status={opportunity?.salesStage?.name || "-"} />
                        <DetailField label="Product Value" value={formatCurrency(opportunity?.productValue)} />
                        <DetailField label="Expected Closing Date" value={formatDate(opportunity?.expectedClosingDate)} />

                    </SectionCard>

                    <SectionCard title="Assigned Employee">

                        <DetailField label="Name" value={employee?.name} />
                        <DetailField label="Email" value={employee?.email} />
                        <DetailField label="Phone" value={employee?.phone} />
                        <DetailField label="Status" status={employee?.isActive ? "Active" : "Inactive"} />

                    </SectionCard>

                    <SectionCard title="Record Info">

                        <DetailField label="Created" value={formatDateTime(customer.createdAt)} />
                        <DetailField label="Last Updated" value={formatDateTime(customer.updatedAt)} />

                    </SectionCard>

                </div>

            </div>

            <DeleteModal
                show={showDeleteModal}
                title="Delete Customer"
                message={`Are you sure you want to delete "${customer.companyName}"?`}
                {...describeDeleteImpact(deleteImpact, "Customer")}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
            />

        </>

    );

}
