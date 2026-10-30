import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useListReturn from "../hooks/useListReturn";
import PageHeader from "../components/PageHeader";
import LeadForm from "../components/LeadForm";
import LoadingState from "../components/ui/LoadingState";
import { getLeadById, updateLead } from "../services/leadService";
import { lineItemErrors, toRequestItems } from "../utils/lineItems";

export default function EditLead() {

    const { id } = useParams();
    const navigate = useNavigate();
    const { returnTo } = useListReturn("/leads");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [itemsRequired, setItemsRequired] = useState({ product: false, battery: false });
    const [triedToSave, setTriedToSave] = useState(false);

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
        legacyStatus: "",
        invalidReason: "",
        legacyInvalidNoReason: false,
        contactDeadline: "",

        assignedEmployeeId: 2
    });

    useEffect(() => {
        loadLead();
    }, []);

    const loadLead = async () => {

        try {

            const data = await getLeadById(id);

            // Required only when the lead already has one - an older lead
            // saved without a Product / Battery stays editable without
            // inventing a value (the backend applies the same rule).
            setItemsRequired({
                product: (data.leadProducts || []).length > 0,
                battery: (data.leadBatteries || []).length > 0,
            });

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

                // A lead saved with one of the older statuses keeps it as it is
                // (shown by LeadForm as "older status - kept as is").
                leadStatus: data.leadStatus || "NEW",
                legacyStatus: data.legacyStatus || "",
                invalidReason: data.invalidReason || "",
                legacyInvalidNoReason: data.leadStatus === "INVALID" && !data.invalidReason,
                contactDeadline: data.contactDeadline || "",

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

    const itemRules = { productRequired: itemsRequired.product, batteryRequired: itemsRequired.battery };
    const itemErrors = triedToSave ? lineItemErrors(form, itemRules) : {};

    const handleSubmit = async (e) => {

        e.preventDefault();

        setTriedToSave(true);

        if (Object.keys(lineItemErrors(form, itemRules)).length > 0) {
            return;
        }

        try {

            setSaving(true);

            await updateLead(id, {
                ...form,
                products: toRequestItems(form.products, "productId"),
                batteries: toRequestItems(form.batteries, "batteryId")
            });

            alert("Lead Updated Successfully");

            navigate(returnTo);

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
                        onCancel={() => navigate(returnTo)}
                        leadId={id}
                        productRequired={itemsRequired.product}
                        batteryRequired={itemsRequired.battery}
                        lineItemErrors={itemErrors}
                    />

                </div>

            </div>

        </>

    );

}