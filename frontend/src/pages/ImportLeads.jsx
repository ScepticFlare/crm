import { useState } from "react";
import { importLeads } from "../services/leadService";

export default function ImportLeads() {

    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!file) {
            alert("Please choose an Excel file.");
            return;
        }

        try {

            setLoading(true);
            setMessage("");

            const response = await importLeads(file);

            setMessage(response);

        } catch (error) {

            console.error(error);
            setMessage("Import failed.");

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="container py-4">

            <div className="card shadow">

                <div className="card-header bg-primary text-white">

                    <h4 className="mb-0">
                        Excel Lead Import
                    </h4>

                </div>

                <div className="card-body">

                    <form onSubmit={handleSubmit}>

                        <div
                            className="border rounded p-5 text-center mb-4"
                            style={{
                                borderStyle: "dashed",
                                background: "#f8f9fa"
                            }}
                        >

                            <i
                                className="bi bi-file-earmark-excel-fill"
                                style={{
                                    fontSize: "60px",
                                    color: "#198754"
                                }}
                            ></i>

                            <h5 className="mt-3">
                                Upload Excel File
                            </h5>

                            <p className="text-muted">
                                Supported formats: .xlsx .xls
                            </p>

                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                className="form-control"
                                onChange={(e) =>
                                    setFile(e.target.files[0])
                                }
                            />

                            {file && (

                                <div className="alert alert-info mt-3">

                                    <strong>Selected:</strong> {file.name}

                                </div>

                            )}

                        </div>

                        <button
                            type="submit"
                            className="btn btn-success w-100"
                            disabled={loading}
                        >

                            {loading
                                ? "Importing..."
                                : "Import Leads"}

                        </button>

                    </form>

                    {message && (

                        <div className="alert alert-success mt-4">

                            {message}

                        </div>

                    )}

                </div>

            </div>

        </div>

    );

}