
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useListReturn from "../hooks/useListReturn";

import FollowUpForm from "../components/FollowUpForm";
import LoadingState from "../components/ui/LoadingState";

import {
    getFollowUpById,
    updateFollowUp
} from "../services/followupService";

import { getAllEmployees } from "../services/employeeService";
import { getAllLeads } from "../services/leadService";
import { getAllOpportunities } from "../services/opportunityService";
import { getFollowUpsByOpportunity } from "../services/followupService";
import { nextActionPayload, requiresNextFollowUp } from "../components/workflowConstants";

// A follow-up that counts as an opportunity's next one: pending, scheduled
// now or later, with a described next action (the backend's FollowUpRules).
function qualifies(f) {
    return f.status === "PENDING"
        && !!f.scheduledDate && new Date(f.scheduledDate) >= new Date()
        && (f.remarks || "").trim().length >= 3;
}

export default function EditFollowUp() {

    const { id } = useParams();
    const navigate = useNavigate();
    const { returnTo } = useListReturn("/followups");

    const [employees, setEmployees] = useState([]);
    const [leads, setLeads] = useState([]);
    const [opportunities, setOpportunities] = useState([]);

    const [loading, setLoading] = useState(true);

    // As loaded: the status before this edit and the opportunity (if any)
    // with its other upcoming follow-up - they decide whether completing this
    // one must schedule the next.
    const [original, setOriginal] = useState(null);

   const [form, setForm] = useState({
    leadId: "",
    opportunityId: "",
    employeeId: "",
    activityType: "",
    customActivityType: "",
    status: "PENDING",
    scheduledDate: "",
    completedDate: "",
    remarks: ""
});

    useEffect(() => {
        loadPage();
    }, []);

    async function loadPage() {

    try {

        const role = localStorage.getItem("role");

        const [
            followUp,
            leadResponse,
            oppResponse
        ] = await Promise.all([
            getFollowUpById(id),
            getAllLeads({ page: 0, size: 1000, search: "" }),
            getAllOpportunities({ page: 0, size: 1000, search: "" })
        ]);

        // Only an active or Postponed opportunity needs a next follow-up (Won,
        // Lost and Dropped do not). A lead's follow-up whose lead became an
        // opportunity is checked by the backend, which says so.
        const opportunity = followUp.opportunity || null;
        const needsNext = !!opportunity && requiresNextFollowUp(opportunity.salesStage);
        let otherNext = null;

        if (needsNext) {
            const siblings = await getFollowUpsByOpportunity(opportunity.id).catch(() => []);
            otherNext = siblings
                .filter((f) => f.id !== followUp.id && qualifies(f))
                .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))[0] || null;
        }

        setOriginal({
            status: followUp.status,
            opportunityId: opportunity?.id || null,
            needsNext,
            otherNextDate: otherNext?.scheduledDate || null,
        });

        setLeads(leadResponse.content || []);
        setOpportunities(oppResponse.content || []);

        if (role === "ADMIN") {

            const emp = await getAllEmployees();
            setEmployees(emp);

        }

        setForm({
            leadId: followUp.lead?.id || "",
            opportunityId: followUp.opportunity?.id || "",
            employeeId: followUp.employee?.id || "",
            activityTypeId: followUp.activityType?.id || "",
            activityTypeName: followUp.activityType?.name || "",
            status: followUp.status || "PENDING",
            scheduledDate: followUp.scheduledDate
                ? followUp.scheduledDate.substring(0, 16)
                : "",
            completedDate: followUp.completedDate
                ? followUp.completedDate.substring(0, 16)
                : "",
            remarks: followUp.remarks || "",
            nextActionDescription: "",
            nextActionActivityTypeId: "",
            nextFollowUpDate: ""
        });

    } catch (err) {

        console.error(err);
        alert("Unable to load Follow Up.");

    } finally {

        setLoading(false);

    }

}

    // Being marked Completed now, still on the opportunity it was loaded with.
    const completing = !!original
        && original.status !== "COMPLETED"
        && form.status === "COMPLETED"
        && original.needsNext
        && String(form.opportunityId || "") === String(original.opportunityId);

    const completionPrompt = completing
        ? (original.otherNextDate
            ? { required: false, existingDate: original.otherNextDate }
            : { required: true })
        : null;

    async function handleSubmit(e) {

        e.preventDefault();

        // The next follow-up is sent only when it is being asked for.
        const { nextActionDescription, nextActionActivityTypeId, nextFollowUpDate, ...fields } = form;

        try {

            await updateFollowUp(id,{
                ...fields,
                leadId: form.leadId || null,
                opportunityId: form.opportunityId || null,
                employeeId: Number(form.employeeId),
                ...(completionPrompt?.required
                    ? nextActionPayload({ nextActionDescription, nextActionActivityTypeId, nextFollowUpDate })
                    : {})
            });

            alert("Follow Up updated successfully.");

            navigate(returnTo);

        } catch(err){

            console.error(err);
            alert(err.response?.data?.message || "Unable to update Follow Up.");

        }

    }

    if(loading){

        return (
            <LoadingState className="text-center mt-5" />
        );

    }

    return (

        <FollowUpForm
            employees={employees}
            leads={leads}
            opportunities={opportunities}
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            submitText="Update Follow Up"
            completionPrompt={completionPrompt}
        />

    );

}