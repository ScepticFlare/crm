import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import LeadForm from "../components/LeadForm";
import LoadingState from "../components/ui/LoadingState";
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
                city: data.city || "",
                state: data.state || "",
                pincode: data.pincode || "",

                industryId: data.industry?.id || "",
                industryName: data.industry?.name || "",
                leadSourceId: data.leadSource?.id || "",
                leadSourceName: data.leadSource?.name || "",

                products: (data.leadProducts || []).map(lp => ({
                    itemId: lp.product?.id || "",
                    itemName: lp.product?.name || "",
                    quantity: lp.quantity || 1
                })),

                batteries: (data.leadBatteries || []).map(lb => ({
                    itemId: lb.battery?.id || "",
                    itemName: lb.battery?.name || "",
                    quantity: lb.quantity || 1
                })),

                description: data.description || "",
                finalRemarks: data.finalRemarks || "",

                leadStatus: data.leadStatus || "NEW",

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

            await updateLead(id, {
                ...form,
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

            <LoadingState className="text-center mt-5" />

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