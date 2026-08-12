import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import LeadForm from "../components/LeadForm";
import { createLead } from "../services/leadService";

export default function AddLead() {

    const navigate = useNavigate();

    const role = localStorage.getItem("role");
    const loggedInEmployeeId = localStorage.getItem("employeeId");

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

        leadStatus: "NEW",

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

            navigate("/leads");

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