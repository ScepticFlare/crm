import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import CustomerForm from "../components/CustomerForm";

import {
    getCustomerById,
    updateCustomer
} from "../services/customerService";

export default function EditCustomer() {

    const { id } = useParams();

    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        companyName: "",
        contactPerson: "",
        designation: "",
        phone: "",
        alternatePhone: "",
        email: "",
        secondaryEmail: "",
        website: "",
        city: "",
        state: "",
        pincode: "",
        billingAddress: "",
        shippingAddress: "",
        gstNumber: "",
        assignedEmployeeId: "",
        opportunityId: ""
    });

    useEffect(() => {
        loadCustomer();
    }, []);

    async function loadCustomer() {

        try {

            const data = await getCustomerById(id);

            setForm({
                companyName: data.companyName || "",
                contactPerson: data.contactPerson || "",
                designation: data.designation || "",
                phone: data.phone || "",
                alternatePhone: data.alternatePhone || "",
                email: data.email || "",
                secondaryEmail: data.secondaryEmail || "",
                website: data.website || "",
                city: data.city || "",
                state: data.state || "",
                pincode: data.pincode || "",
                billingAddress: data.billingAddress || "",
                shippingAddress: data.shippingAddress || "",
                gstNumber: data.gstNumber || "",
                assignedEmployeeId: data.assignedEmployee?.id || "",
                opportunityId: data.opportunity?.id || ""
            });

        } catch (error) {

            console.error(error);

        }

    }

    function handleChange(e) {

        setForm({
            ...form,
            [e.target.name]: e.target.value
        });

    }

    async function handleSubmit(e) {

        e.preventDefault();

        setLoading(true);

        try {

            await updateCustomer(id, {
                ...form,
                assignedEmployeeId: Number(form.assignedEmployeeId),
                opportunityId: Number(form.opportunityId)
            });

            navigate("/customers");

        } catch (error) {

            console.error(error);
            alert("Failed to update customer.");

        } finally {

            setLoading(false);

        }

    }

    return (
        <>
            <PageHeader
                title="Edit Customer"
                subtitle="Update customer details"
            />

            <div className="card shadow-sm border-0">
                <div className="card-body">

                    <CustomerForm
                        form={form}
                        handleChange={handleChange}
                        handleSubmit={handleSubmit}
                        loading={loading}
                        submitText="Update Customer"
                        onCancel={() => navigate("/customers")}
                    />

                </div>
            </div>
        </>
    );

}