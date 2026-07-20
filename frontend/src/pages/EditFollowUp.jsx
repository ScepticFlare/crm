
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import FollowUpForm from "../components/FollowUpForm";

import {
    getFollowUpById,
    updateFollowUp
} from "../services/followUpService";

import { getAllEmployees } from "../services/employeeService";
import { getAllLeads } from "../services/leadService";
import { getAllOpportunities } from "../services/opportunityService";

export default function EditFollowUp() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [employees, setEmployees] = useState([]);
    const [leads, setLeads] = useState([]);
    const [opportunities, setOpportunities] = useState([]);

    const [loading, setLoading] = useState(true);

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
        loadPage();
    }, []);

    async function loadPage() {

        try {

            const [followUp, emp, lead, opp] = await Promise.all([
                getFollowUpById(id),
                getAllEmployees(),
                getAllLeads(),
                getAllOpportunities()
            ]);

            setEmployees(emp);
            setLeads(lead);
            setOpportunities(opp);

            setForm({
                leadId: followUp.lead?.id || "",
                opportunityId: followUp.opportunity?.id || "",
                employeeId: followUp.employee?.id || "",
                activityType: followUp.activityType || "",
                status: followUp.status || "PENDING",
                scheduledDate: followUp.scheduledDate
                    ? followUp.scheduledDate.substring(0,16)
                    : "",
                completedDate: followUp.completedDate
                    ? followUp.completedDate.substring(0,16)
                    : "",
                remarks: followUp.remarks || ""
            });

        } catch (err) {

            console.error(err);
            alert("Unable to load Follow Up.");

        } finally {

            setLoading(false);

        }
    }

    async function handleSubmit(e) {

        e.preventDefault();

        try {

            await updateFollowUp(id,{
                ...form,
                leadId: form.leadId || null,
                opportunityId: form.opportunityId || null,
                employeeId: Number(form.employeeId)
            });

            alert("Follow Up updated successfully.");

            navigate("/followups");

        } catch(err){

            console.error(err);
            alert("Unable to update Follow Up.");

        }

    }

    if(loading){

        return (
            <div className="text-center mt-5">
                <div className="spinner-border"></div>
            </div>
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
        />

    );

}