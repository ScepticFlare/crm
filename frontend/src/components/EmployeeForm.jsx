import { useEffect, useState } from "react";

export default function EmployeeForm({
    initialData,
    onSubmit,
    loading,
}) {

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "EMPLOYEE",
    });

    useEffect(() => {

        if (initialData) {

            setForm({
                name: initialData.name || "",
                email: initialData.email || "",
                phone: initialData.phone || "",
                password: "",
                role: initialData.role || "EMPLOYEE",
            });

        }

    }, [initialData]);

    const handleChange = (e) => {

        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

    };

    const handleSubmit = (e) => {

        e.preventDefault();

        onSubmit(form);

    };

    return (

        <form onSubmit={handleSubmit}>

            <div className="card shadow-sm border-0">

                <div className="card-body">

                    <div className="row g-3">

                        <div className="col-md-6">

                            <label className="form-label">
                                Name
                            </label>

                            <input
                                type="text"
                                className="form-control"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                            />

                        </div>

                        <div className="col-md-6">

                            <label className="form-label">
                                Email
                            </label>

                            <input
                                type="email"
                                className="form-control"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />

                        </div>

                        <div className="col-md-6">

                            <label className="form-label">
                                Phone
                            </label>

                            <input
                                type="tel"
                                className="form-control"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                required
                                maxLength={10}
                                pattern="[0-9]{10}"
                                title="Phone number must be exactly 10 digits."
                            />

                        </div>

                        <div className="col-md-6">

                            <label className="form-label">
                                Role
                            </label>

                            <select
                                className="form-select"
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                            >
                                <option value="EMPLOYEE">
                                    Employee
                                </option>

                                <option value="ADMIN">
                                    Administrator
                                </option>

                            </select>

                        </div>

                        <div className="col-12">

                            <label className="form-label">
                                Password
                            </label>

                            <input
                                type="password"
                                className="form-control"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder={
                                    initialData
                                        ? "Leave blank to keep current password"
                                        : "Enter password"
                                }
                                required={!initialData}
                            />

                        </div>

                    </div>

                </div>

            </div>

            <div className="mt-4 d-flex justify-content-end">

                <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Saving..." : "Save Employee"}
                </button>

            </div>

        </form>

    );

}