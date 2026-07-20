import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import CustomerForm from "../components/CustomerForm";

import { getOpportunityById } from "../services/opportunityService";
import { createCustomer } from "../services/customerService";

export default function AddCustomer() {

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const opportunityId = searchParams.get("opportunityId");

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    const [opportunity, setOpportunity] = useState(null);

    const [form, setForm] = useState({
        gstNumber: "",
        billingAddress: "",
        shippingAddress: "",
        opportunityId: opportunityId
    });

    useEffect(() => {
        loadOpportunity();
    }, []);

    async function loadOpportunity() {

        try {

            const data = await getOpportunityById(opportunityId);
            setOpportunity(data);

        } catch (error) {

            console.error(error);
            alert("Unable to load opportunity.");
            navigate("/opportunities");

        } finally {

            setPageLoading(false);

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

            await createCustomer(form);

            alert("Customer created successfully!");

            navigate("/customers");

        } catch (error) {

            console.error(error);

            alert(
                error?.response?.data?.message ||
                "Failed to convert customer."
            );

        } finally {

            setLoading(false);

        }

    }

    if (pageLoading) {

        return (
            <div className="text-center mt-5">
                <div className="spinner-border text-primary" />
            </div>
        );

    }

    return (
        <>
            <PageHeader
                title="Convert Opportunity"
                subtitle="Create Customer from Opportunity"
            />

            <div className="card shadow-sm border-0">

                <div className="card-body">

                    <CustomerForm
                        opportunity={opportunity}
                        form={form}
                        handleChange={handleChange}
                        handleSubmit={handleSubmit}
                        loading={loading}
                        submitText="Convert to Customer"
                        onCancel={() => navigate("/opportunities")}
                    />

                </div>

            </div>
        </>
    );

}