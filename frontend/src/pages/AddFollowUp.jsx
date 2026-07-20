
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import FollowUpForm from "../components/FollowUpForm";

import { createFollowUp } from "../services/followUpService";
import { getAllEmployees } from "../services/employeeService";
import { getAllLeads } from "../services/leadService";
import { getAllOpportunities } from "../services/opportunityService";

export default function AddFollowUp() {

    const navigate = useNavigate();

    const [employees, setEmployees] = useState([]);
    const [leads, setLeads] = useState([]);
    const [opportunities, setOpportunities] = useState([]);

    const [form, setForm] = useState({
        leadId: "",
        opportunityId: "",
        employeeId: "",
        activityType: "",
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
                leadId: form.leadId || null,
                opportunityId: form.opportunityId || null,
                employeeId: Number(form.employeeId)
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
        />
    );
}