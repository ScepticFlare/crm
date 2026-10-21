import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import OpportunityForm from "../components/OpportunityForm";

import {
    getOpportunityById,
    updateOpportunity
} from "../services/opportunityService";
import { workflowPayload, nextActionPayload } from "../components/workflowConstants";

export default function EditOpportunity() {

    const { id } = useParams();

    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [currentStage, setCurrentStage] = useState(null);
    const [originalClosingDate, setOriginalClosingDate] = useState(null);
    const [hasNextAction, setHasNextAction] = useState(null);

    const [form, setForm] = useState({
        leadId: "",
        title: "",
        productValue: "",
        expectedClosingDate: "",
        salesStage: "NEW",
        leadValidity: "VALID",
        subStatus: "",
        lostReason: "",
        postponedReviewDate: "",
        postponedReason: "",
        closingDateChangeReason: "",
        nextActionDescription: "",
        nextActionActivityTypeId: "",
        nextFollowUpDate: "",
        legacyLostNoReason: false
    });

    useEffect(() => {

        loadOpportunity();

    }, []);

    async function loadOpportunity() {

        try {

            const data = await getOpportunityById(id);
            console.log("Opportunity API Response:", data);
            console.log("Sales Stage:", data.salesStage);
            console.log("Sales Stage Name:", data.salesStage?.name);

            setCurrentStage(data.salesStage || null);
            setOriginalClosingDate(data.expectedClosingDate || null);
            setHasNextAction(data.hasNextAction ?? null);

            setForm({
                leadId: data.lead?.id || "",
                title: data.title || "",
                productValue: data.productValue || "",
                expectedClosingDate: data.expectedClosingDate || "",
                salesStage: data.salesStage?.name || "NEW",
                leadValidity: data.leadValidity || "VALID",
                subStatus: data.subStatus || "",
                lostReason: data.lostReason || "",
                postponedReviewDate: data.postponedReviewDate || "",
                postponedReason: data.postponedReason || "",
                closingDateChangeReason: "",
                nextActionDescription: "",
                nextActionActivityTypeId: "",
                nextFollowUpDate: "",
                // An older LOST opportunity saved before reasons existed:
                // editing it must not force an invented reason.
                legacyLostNoReason:
                    data.salesStage?.stageType === "LOST" && !data.lostReason
            });

        } catch (error) {

            console.error(error);

        }

    }

    // Functional update so several fields can be changed in one event
    // (choosing a stage clears the fields that belong to another stage).
    function handleChange(e) {

        const { name, value } = e.target;

        setForm((current) => ({
            ...current,
            [name]: value
        }));

    }

    async function handleSubmit(e) {

        e.preventDefault();

        setLoading(true);

        try {

            const saved = await updateOpportunity(id, {
                leadId: Number(form.leadId),
                title: form.title,
                productValue:
                    form.productValue === ""
                        ? null
                        : Number(form.productValue),
                expectedClosingDate: form.expectedClosingDate || null,
                salesStage: form.salesStage,
                leadValidity: form.leadValidity,
                ...workflowPayload(form),
                ...nextActionPayload(form)
            });

            // Decided by the stage type the server returns, so it still works
            // if the WON stage has been renamed.
            if (saved?.salesStage?.stageType === "WON") {

                // Hand the employee straight to the customer completion
                // form instead of requiring a separate manual click.
                navigate(`/customers/convert/${id}`);

            } else {

                navigate("/opportunities");

            }

        } catch (error) {

            console.error(error);

            alert(
                error.response?.data?.message ||
                "Failed to update opportunity."
            );

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
                        leadId={form.leadId}
                        currentStage={currentStage}
                        originalClosingDate={originalClosingDate}
                        hasNextAction={hasNextAction}
                    />

                </div>

            </div>

        </>

    );

}