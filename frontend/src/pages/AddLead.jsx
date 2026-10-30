import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import LeadForm from "../components/LeadForm";
import { createLead } from "../services/leadService";
import { lineItemErrors, toRequestItems } from "../utils/lineItems";

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

        // One empty row each, so the two required pickers are visible
        // straight away (unfilled rows are dropped on save).
        products: [{ itemId: "", itemName: "", quantity: 1 }],
        batteries: [{ itemId: "", itemName: "", quantity: 1 }],

        description: "",
        finalRemarks: "",

        leadStatus: defaultStatus,
        invalidReason: "",
        contactDeadline: "",

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

    // Product and Battery are mandatory for a new lead. Messages appear once
    // the user tries to save, and update live as they fix the fields.
    const [triedToSave, setTriedToSave] = useState(false);
    const itemErrors = triedToSave
        ? lineItemErrors(form, { productRequired: true, batteryRequired: true })
        : {};

    const handleSubmit = async (e) => {

        //console.log("HANDLE SUBMIT CALLED");

        e.preventDefault();

        setTriedToSave(true);

        if (Object.keys(lineItemErrors(form, { productRequired: true, batteryRequired: true })).length > 0) {
            return;
        }

        try {

            setLoading(true);

            await createLead({
                ...form,
                assignedEmployeeId: Number(form.assignedEmployeeId),
                products: toRequestItems(form.products, "productId"),
                batteries: toRequestItems(form.batteries, "batteryId")
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
                        productRequired
                        batteryRequired
                        lineItemErrors={itemErrors}
                    />

                </div>

            </div>

        </>

    );

}