import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import OpportunityForm from "../components/OpportunityForm";

import {
    getOpportunityById,
    updateOpportunity
} from "../services/opportunityService";

export default function EditOpportunity() {

    const { id } = useParams();

    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        leadId: "",
        title: "",
        productValue: "",
        expectedClosingDate: "",
        salesStage: "NEW"
    });

    useEffect(() => {

        loadOpportunity();

    }, []);

    async function loadOpportunity() {

        try {

            const data = await getOpportunityById(id);

            setForm({
                leadId: data.lead?.id || "",
                title: data.title || "",
                productValue: data.productValue || "",
                expectedClosingDate: data.expectedClosingDate || "",
                salesStage: data.salesStage || "NEW"
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

            await updateOpportunity(id, {
                ...form,
                leadId: Number(form.leadId),
                productValue:
                    form.productValue === ""
                        ? null
                        : Number(form.productValue)
            });

            navigate("/opportunities");

        } catch (error) {

            console.error(error);

            alert("Failed to update opportunity.");

        } finally {

            setLoading(false);

        }

    }

    return (

        <>

            <PageHeader
                title="Edit Opportunity"
                subtitle="Update opportunity details"
            />

            <div className="card shadow-sm border-0">

                <div className="card-body">

                    <OpportunityForm
                        form={form}
                        handleChange={handleChange}
                        handleSubmit={handleSubmit}
                        loading={loading}
                        submitText="Update Opportunity"
                        onCancel={() => navigate("/opportunities")}
                    />

                </div>

            </div>

        </>

    );

}