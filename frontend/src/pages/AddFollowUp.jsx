import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import FollowUpForm from "../components/FollowUpForm";

import { createFollowUp } from "../services/followUpService";
import { getAllEmployees } from "../services/employeeService";
import { getAllLeads } from "../services/leadService";
import { getAllOpportunities } from "../services/opportunityService";

export default function AddFollowUp() {

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const leadIdFromUrl = searchParams.get("leadId");
    const opportunityIdFromUrl = searchParams.get("opportunityId");

    const [employees, setEmployees] = useState([]);
    const [leads, setLeads] = useState([]);
    const [opportunities, setOpportunities] = useState([]);

    const [form, setForm] = useState({
        leadId: leadIdFromUrl || "",
        opportunityId: opportunityIdFromUrl || "",
        employeeId: "",
        activityTypeId: "",
        status: "PENDING",
        scheduledDate: "",
        completedDate: "",
        remarks: ""
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {

        try {

            const [emp, lead, opp] = await Promise.all([
                getAllEmployees(),
                getAllLeads(),
                getAllOpportunities()
            ]);

            setEmployees(emp);
            setLeads(lead);
            setOpportunities(opp);

            // Auto assign employee if opened from Lead Details
            if (leadIdFromUrl) {

                const selectedLead = lead.find(
                    l => l.id === Number(leadIdFromUrl)
                );

                if (selectedLead) {

                    setForm(prev => ({
                        ...prev,
                        employeeId:
                            selectedLead.assignedEmployee?.id || ""
                    }));

                }

            }

            // Auto assign employee if opened from Opportunity Details
            if (opportunityIdFromUrl) {

                const selectedOpportunity = opp.find(
                    o => o.id === Number(opportunityIdFromUrl)
                );

                if (
                    selectedOpportunity &&
                    selectedOpportunity.lead
                ) {

                    setForm(prev => ({
                        ...prev,
                        employeeId:
                            selectedOpportunity
                                .lead
                                .assignedEmployee
                                ?.id || ""
                    }));

                }

            }

        } catch (err) {

            console.error(err);
            alert("Unable to load form data.");

        }

    }

    async function handleSubmit(e) {

        e.preventDefault();

        try {

            await createFollowUp({
                ...form,
                leadId: form.leadId
                    ? Number(form.leadId)
                    : null,
                opportunityId: form.opportunityId
                    ? Number(form.opportunityId)
                    : null,
                employeeId: Number(form.employeeId),
                activityTypeId: Number(form.activityTypeId)
            });

            alert("Follow Up created successfully.");

            navigate("/followups");

        } catch (err) {

            console.error(err);

            alert("Unable to create Follow Up.");

        }

    }

    return (

        <FollowUpForm
            employees={employees}
            leads={leads}
            opportunities={opportunities}
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            submitText="Create Follow Up"
            hideLead={!!leadIdFromUrl}
            hideOpportunity={!!opportunityIdFromUrl}
        />

    );

}