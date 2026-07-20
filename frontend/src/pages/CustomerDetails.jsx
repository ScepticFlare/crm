import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import { getCustomerById } from "../services/customerService";

export default function CustomerDetails() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [customer, setCustomer] = useState(null);

    useEffect(() => {
        loadCustomer();
    }, []);

    async function loadCustomer() {
        try {

            const data = await getCustomerById(id);
            setCustomer(data);

        } catch (error) {

            console.error(error);
            alert("Unable to load customer.");

        }
    }

    if (!customer) {
        return (
            <div className="text-center mt-5">
                <div className="spinner-border text-primary"></div>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title={customer.companyName}
                subtitle="Customer Details"
            />

            <div className="card shadow-sm border-0">

                <div className="card-body">

                    <div className="row">

                        <div className="col-md-6 mb-3">
                            <strong>Company</strong>
                            <p>{customer.companyName}</p>
                        </div>

                        <div className="col-md-6 mb-3">
                            <strong>Contact Person</strong>
                            <p>{customer.contactPerson}</p>
                        </div>

                        <div className="col-md-6 mb-3">
                            <strong>Designation</strong>
                            <p>{customer.designation}</p>
                        </div>

                        <div className="col-md-6 mb-3">
                            <strong>Phone</strong>
                            <p>{customer.phone}</p>
                        </div>

                        <div className="col-md-6 mb-3">
                            <strong>Alternate Phone</strong>
                            <p>{customer.alternatePhone || "-"}</p>
                        </div>

                        <div className="col-md-6 mb-3">
                            <strong>Email</strong>
                            <p>{customer.email}</p>
                        </div>

                        <div className="col-md-6 mb-3">
                            <strong>Secondary Email</strong>
                            <p>{customer.secondaryEmail || "-"}</p>
                        </div>

                        <div className="col-md-6 mb-3">
                            <strong>Website</strong>
                            <p>{customer.website || "-"}</p>
                        </div>

                        <div className="col-md-4 mb-3">
                            <strong>City</strong>
                            <p>{customer.city}</p>
                        </div>

                        <div className="col-md-4 mb-3">
                            <strong>State</strong>
                            <p>{customer.state}</p>
                        </div>

                        <div className="col-md-4 mb-3">
                            <strong>Pincode</strong>
                            <p>{customer.pincode}</p>
                        </div>

                        <div className="col-md-6 mb-3">
                            <strong>Billing Address</strong>
                            <p>{customer.billingAddress}</p>
                        </div>

                        <div className="col-md-6 mb-3">
                            <strong>Shipping Address</strong>
                            <p>{customer.shippingAddress}</p>
                        </div>

                        <div className="col-md-6 mb-3">
                            <strong>GST Number</strong>
                            <p>{customer.gstNumber || "-"}</p>
                        </div>

                        <div className="col-md-6 mb-3">
                            <strong>Assigned Employee</strong>
                            <p>{customer.assignedEmployee?.name || "-"}</p>
                        </div>

                        <div className="col-md-6 mb-3">
                            <strong>Opportunity</strong>
                            <p>{customer.opportunity?.title || "-"}</p>
                        </div>

                        <div className="col-md-6 mb-3">
                            <strong>Customer Code</strong>
                            <p>{customer.customerCode || "-"}</p>
                        </div>

                        <div className="col-md-6 mb-3">
                            <strong>Created At</strong>
                            <p>
                                {customer.createdAt
                                    ? new Date(customer.createdAt).toLocaleString()
                                    : "-"}
                            </p>
                        </div>

                        <div className="col-md-6 mb-3">
                            <strong>Updated At</strong>
                            <p>
                                {customer.updatedAt
                                    ? new Date(customer.updatedAt).toLocaleString()
                                    : "-"}
                            </p>
                        </div>

                    </div>

                    <hr />

                    <div className="d-flex justify-content-end gap-2">

                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => navigate("/customers")}
                        >
                            Back
                        </button>

                        <button
                            className="btn btn-warning"
                            onClick={() => navigate(`/customers/edit/${customer.id}`)}
                        >
                            Edit Customer
                        </button>

                    </div>

                </div>

            </div>
        </>
    );
}