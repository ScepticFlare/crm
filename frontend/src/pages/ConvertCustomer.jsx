import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import CustomerForm from "../components/CustomerForm";

import {
    convertCustomer,
    getCustomerOpportunity
} from "../services/customerService";

export default function ConvertCustomer() {

    const { id } = useParams();

    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    const [opportunity, setOpportunity] = useState(null);

    const [form, setForm] = useState({

        billingAddress: "",
        shippingAddress: "",
        gstNumber: ""

    });

    useEffect(() => {

        loadOpportunity();

    }, []);

    async function loadOpportunity() {

        try {

            const data = await getCustomerOpportunity(id);

            setOpportunity(data);

        } catch (err) {

            console.error(err);
            alert("Failed to load opportunity.");

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

            const lead = opportunity.lead;

            await convertCustomer(id, {

                companyName: lead.companyName,
                contactPerson: lead.contactPerson,
                designation: lead.designation,
                phone: lead.phone,
                alternatePhone: lead.alternatePhone,
                email: lead.email,
                secondaryEmail: lead.secondaryEmail,
                website: lead.website,
                city: lead.city,
                state: lead.state,
                pincode: lead.pincode,

                billingAddress: form.billingAddress,
                shippingAddress: form.shippingAddress,
                gstNumber: form.gstNumber,

                assignedEmployeeId: lead.assignedEmployee.id,

                opportunityId: opportunity.id

            });

            alert("Customer created successfully.");

            navigate("/customers");

        } catch (err) {

            console.error(err);

            alert("Failed to convert opportunity.");

        } finally {

            setLoading(false);

        }

    }

    if (pageLoading) {

        return (

            <div className="text-center mt-5">

                <div className="spinner-border text-primary"></div>

            </div>

        );

    }

    if (!opportunity) {

        return (

            <div className="alert alert-danger">

                Opportunity not found.

            </div>

        );

    }
        return (

        <>

            <PageHeader
                title="Convert Opportunity to Customer"
                subtitle="Complete customer information"
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