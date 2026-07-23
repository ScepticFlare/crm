import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeForm from "../components/EmployeeForm";
import PageHeader from "../components/PageHeader";
import { createEmployee } from "../services/employeeService";

export default function AddEmployee() {

    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (form) => {

        try {

            setLoading(true);

            await createEmployee(form);

            alert("Employee created successfully.");

            navigate("/employees");

        } catch (err) {

            alert(
                err.response?.data?.message ||
                "Unable to create employee."
            );

        } finally {

            setLoading(false);

        }

    };

    return (

        <>

            <PageHeader
                title="Add Employee"
                subtitle="Create a new employee account"
            />

            <EmployeeForm
                initialData={null}
                onSubmit={handleSubmit}
                loading={loading}
            />

        </>

    );

}