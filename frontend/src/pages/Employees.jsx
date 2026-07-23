import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../components/DataTable";
import PageHeader from "../components/PageHeader";
import {
    getAllEmployees,
    deleteEmployee,
} from "../services/employeeService";

export default function Employees() {

    const navigate = useNavigate();
    const loggedInEmployeeId = Number(
    localStorage.getItem("employeeId")
);

    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadEmployees = async () => {

        try {

            const data = await getAllEmployees();
            setEmployees(data);

        } catch (err) {

            console.error(err);
            alert(err.response?.data?.message || "Unable to load employees.");

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        loadEmployees();

    }, []);

    const handleDelete = async (id) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this employee?"
        );

        if (!confirmDelete) return;

        try {

            await deleteEmployee(id);

            alert("Employee deleted successfully.");

            loadEmployees();

        } catch (err) {

            alert(err.response?.data?.message || "Unable to delete employee.");

        }

    };

    const columns = [

        {
            key: "name",
            label: "Name",
        },

        {
            key: "email",
            label: "Email",
        },

        {
            key: "phone",
            label: "Phone",
        },

        {
            key: "role",
            label: "Role",
        },

    ];

    return (

        <>

            <PageHeader
                title="Employees"
                subtitle="Manage employees"
                buttonText="Add Employee"
                onButtonClick={() => navigate("/employees/add")}
            />

            <DataTable
                columns={columns}
                data={employees}
                loading={loading}
                renderActions={(employee) => (

                    <div className="d-flex justify-content-center gap-2">

                        <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() =>
                                navigate(`/employees/edit/${employee.id}`)
                            }
                        >
                            <i className="bi bi-pencil"></i>
                        </button>

                        {employee.id !== loggedInEmployeeId && (

                        <button
                            className="btn btn-sm btn-outline-danger"
                             onClick={() => handleDelete(employee.id)}
                         >
                            <i className="bi bi-trash"></i>
                        </button>

)}

                    </div>

                )}
            />

        </>

    );

}