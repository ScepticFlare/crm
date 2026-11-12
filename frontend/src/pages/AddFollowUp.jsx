import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import FollowUpForm from "../components/FollowUpForm";

import { createFollowUp } from "../services/followupService";
import { getAllEmployees } from "../services/employeeService";
import { getLeadById } from "../services/leadService";
import { getOpportunityById } from "../services/opportunityService";

// The picker item for a record opened from its own page.
function leadTarget(lead) {
    return {
        type: "LEAD", leadId: lead.id, opportunityId: null,
        companyName: lead.companyName, contactPerson: lead.contactPerson,
        assignedEmployeeId: lead.assignedEmployee?.id ?? null, assignedEmployeeName: lead.assignedEmployee?.name || null,
    };
}

function opportunityTarget(opp) {
    return {
        type: "OPPORTUNITY", leadId: opp.lead?.id ?? null, opportunityId: opp.id,
        companyName: opp.lead?.companyName || null, contactPerson: opp.contactPerson || opp.lead?.contactPerson || null,
        opportunityTitle: opp.title, stage: opp.salesStage?.name || null,
        assignedEmployeeId: opp.lead?.assignedEmployee?.id ?? null,
        assignedEmployeeName: opp.lead?.assignedEmployee?.name || null,
    };
}

export default function AddFollowUp() {

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const leadIdFromUrl = searchParams.get("leadId");
    const opportunityIdFromUrl = searchParams.get("opportunityId");

    const role = localStorage.getItem("role");
    const loggedInEmployeeId = localStorage.getItem("employeeId");

    const [employees, setEmployees] = useState([]);
    const [target, setTarget] = useState(null);
    const [lockedTarget, setLockedTarget] = useState(null);

    const [form, setForm] = useState({
        leadId: leadIdFromUrl || "",
        opportunityId: opportunityIdFromUrl || "",
        employeeId:
            role === "ADMIN"
                ? ""
                : loggedInEmployeeId || "",
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

            if (role === "ADMIN") {
                setEmployees(await getAllEmployees());
            }

            // Opened from an Opportunity's or a Lead's page: that record is
            // fixed (shown read-only), and an admin defaults to its owner.
            let preset = null;

            if (opportunityIdFromUrl) {
                preset = opportunityTarget(await getOpportunityById(opportunityIdFromUrl));
            } else if (leadIdFromUrl) {
                preset = leadTarget(await getLeadById(leadIdFromUrl));
            }

            if (preset) {
                setLockedTarget(preset);
                setForm(prev => ({
                    ...prev,
                    employeeId: role === "ADMIN" ? preset.assignedEmployeeId || "" : loggedInEmployeeId
                }));
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
            alert(err?.response?.data?.message || "Unable to create Follow Up.");

        }

    }

    return (

        <FollowUpForm
            employees={employees}
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            submitText="Create Follow Up"
            target={target}
            onTargetChange={setTarget}
            lockedTarget={lockedTarget}
        />

    );

}
