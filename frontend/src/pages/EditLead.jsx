import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import LeadForm from "../components/LeadForm";
import { getLeadById, updateLead } from "../services/leadService";

export default function EditLead() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        companyName: "",
        contactPerson: "",
        designation: "",
        phone: "",
        alternatePhone: "",
        email: "",
        secondaryEmail: "",
        website: "",
        city: "",
        state: "",
        pincode: "",

        productId: "",
        industryId: "",
        leadSourceId: "",

        description: "",
        finalRemarks: "",

        leadStatus: "NEW",
        leadValidity: "VALID",

        assignedEmployeeId: 2
    });

    useEffect(() => {
        loadLead();
    }, []);

    const loadLead = async () => {

        try {

            const data = await getLeadById(id);

            setForm({

                companyName: data.companyName || "",
                contactPerson: data.contactPerson || "",
                designation: data.designation || "",
                phone: data.phone || "",
                alternatePhone: data.alternatePhone || "",
                email: data.email || "",
                secondaryEmail: data.secondaryEmail || "",
                website: data.website || "",
                city: data.city || "",
                state: data.state || "",
                pincode: data.pincode || "",

                productId: data.product?.id || "",
                industryId: data.industry?.id || "",
                leadSourceId: data.leadSource?.id || "",

                description: data.description || "",
                finalRemarks: data.finalRemarks || "",

                leadStatus: data.leadStatus || "NEW",
                leadValidity: data.leadValidity || "VALID",

                assignedEmployeeId:
                    data.assignedEmployee?.id ||
                    data.assignedEmployeeId ||
                    2

            });

        } catch (err) {

            console.log(err);
            alert("Unable to load lead.");

        } finally {

            setLoading(false);

        }

    };

    const handleChange = (e) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            setSaving(true);

            await updateLead(id, form);

            alert("Lead Updated Successfully");

            navigate("/leads");

        } catch (err) {

            console.log(err);

            alert(
                err.response?.data?.message ||
                "Unable to update lead."
            );

        } finally {

            setSaving(false);

        }

    };

    if (loading) {

        return (

            <div className="text-center mt-5">

                <div className="spinner-border text-primary"></div>

            </div>

        );

    }

    return (

        <>

            <PageHeader
                title="Edit Lead"
                subtitle="Update lead information"
            />

            <div className="card shadow-sm border-0">

                <div className="card-body">

                    <LeadForm
                        form={form}
                        handleChange={handleChange}
                        handleSubmit={handleSubmit}
                        loading={saving}
                        submitText="Update Lead"
                        onCancel={() => navigate("/leads")}
                    />

                </div>

            </div>

        </>

    );

}