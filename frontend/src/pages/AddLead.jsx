import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import LeadForm from "../components/LeadForm";
import { createLead } from "../services/leadService";

export default function AddLead() {

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const role = localStorage.getItem("role");
    const loggedInEmployeeId = localStorage.getItem("employeeId");

    // Only the Invalid page currently links here with a preset status;
    // every other entry point omits it and keeps defaulting to NEW.
    const presetStatus = searchParams.get("status");
    const defaultStatus = presetStatus === "INVALID" ? "INVALID" : "NEW";

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        companyName: "",
        contactPerson: "",
        designation: "",
        phone: "",
        alternatePhone: "",
        email: "",
        secondaryEmail: "",
        city: "",
        state: "",
        pincode: "",

        industryId: "",
        industryName: "",
        leadSourceId: "",
        leadSourceName: "",

        products: [],
        batteries: [],

        description: "",
        finalRemarks: "",

        leadStatus: defaultStatus,

        assignedEmployeeId:
            role === "ADMIN"
                ? ""
                : loggedInEmployeeId
    });

    const handleChange = (e) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value
        });

    };

    const handleSubmit = async (e) => {

        //console.log("HANDLE SUBMIT CALLED");

        e.preventDefault();

        try {

            setLoading(true);

            await createLead({
                ...form,
                assignedEmployeeId: Number(form.assignedEmployeeId),
                products: (form.products || [])
                    .filter(p => p.itemId)
                    .map(p => ({
                        productId: Number(p.itemId),
                        quantity: Number(p.quantity) || 1
                    })),
                batteries: (form.batteries || [])
                    .filter(b => b.itemId)
                    .map(b => ({
                        batteryId: Number(b.itemId),
                        quantity: Number(b.quantity) || 1
                    }))
            });

            alert("Lead Created Successfully");

            navigate(defaultStatus === "INVALID" ? "/invalid" : "/leads");

        } catch (err) {

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