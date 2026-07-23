import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EmployeeForm from "../components/EmployeeForm";
import PageHeader from "../components/PageHeader";
import {
    getEmployeeById,
    updateEmployee,
} from "../services/employeeService";

export default function EditEmployee() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {

        loadEmployee();

    }, []);

    const loadEmployee = async () => {

        try {

            const data = await getEmployeeById(id);
            setEmployee(data);

        } catch (err) {

            alert(
                err.response?.data?.message ||
                "Unable to load employee."
            );

            navigate("/employees");

        } finally {

            setLoading(false);

        }

    };

    const handleSubmit = async (form) => {

    try {

        setSaving(true);

        const payload = { ...form };

        if (!payload.password.trim()) {
            delete payload.password;
        }

        await updateEmployee(id, payload);

        alert("Employee updated successfully.");

        navigate("/employees");

    } catch (err) {

        alert(
            err.response?.data?.message ||
            "Unable to update employee."
        );

    } finally {

        setSaving(false);

    }

};

    if (loading) {
        return (
            <div className="text-center py-5">
                <div
                    className="spinner-border text-primary"
                    role="status"
                >
                    <span className="visually-hidden">
                        Loading...
                    </span>
                </div>
            </div>
        );
    }

    return (

        <>

            <PageHeader
                title="Edit Employee"
                subtitle="Update employee information"
            />

            <EmployeeForm
                initialData={employee}
                onSubmit={handleSubmit}
                loading={saving}
            />

        </>

    );

}