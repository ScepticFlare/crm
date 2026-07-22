import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import LeadForm from "../components/LeadForm";
import { createLead } from "../services/leadService";

export default function AddLead() {

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

        productId: "",
        industryId: "",
        leadSourceId: "",

        description: "",

        leadStatus: "NEW",
        leadValidity: "VALID",

        assignedEmployeeId: 2
    });

    const handleChange = (e) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            setLoading(true);

            await createLead(form);

            alert("Lead Created Successfully");

            navigate("/leads");

        } catch (err) {

            console.log(err);

            alert(err.response?.data?.message || "Unable to create lead");

        } finally {

            setLoading(false);

        }

    };

    return (

        <>

            <PageHeader
                title="Add New Lead"
                subtitle="Create a new lead for your sales pipeline"
            />

            <div className="card shadow-sm border-0">

                <div className="card-body">

                    <LeadForm
                        form={form}
                        handleChange={handleChange}
                        handleSubmit={handleSubmit}
                        loading={loading}
                        submitText="Save Lead"
                        onCancel={() => navigate("/leads")}
                    />

                </div>

            </div>

        </>

    );

}