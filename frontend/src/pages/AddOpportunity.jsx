import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import OpportunityForm from "../components/OpportunityForm";

import { createOpportunity } from "../services/opportunityService";

export default function AddOpportunity() {

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const leadId = searchParams.get("leadId");

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        title: "",
        productValue: "",
        expectedClosingDate: "",
        salesStage: ""
    });

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

            const opportunity = await createOpportunity(
    Number(leadId),
    {

        title: form.title,

        productValue:
            form.productValue === ""
                ? null
                : Number(form.productValue),

        expectedClosingDate: form.expectedClosingDate,

        salesStage: form.salesStage

    }
);

            alert("Opportunity created successfully.");

            navigate(`/opportunities/${opportunity.id}`);

        } catch (error) {

            console.error(error);

            alert("Failed to create opportunity.");

        } finally {

            setLoading(false); 

        }

    }

    return (

        <>

            <PageHeader
                title="Convert Lead to Opportunity"
                subtitle="Complete opportunity details"
            />

            <div className="card shadow-sm border-0">

                <div className="card-body">

                    <OpportunityForm
                        form={form}
                        handleChange={handleChange}
                        handleSubmit={handleSubmit}
                        loading={loading}
                        submitText="Convert Lead"
                        onCancel={() => navigate("/leads")}
                        leadId={leadId}
                    />

                </div>

            </div>

        </>

    );

}