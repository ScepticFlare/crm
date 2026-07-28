import { useState } from "react";

import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";

import { getLeadReport } from "../services/reportService";

export default function Reports() {

    const today = new Date().toISOString().split("T")[0];

    const firstDay = new Date(
        new Date().getFullYear(),
        0,
        1
    ).toISOString().split("T")[0];

    const [from, setFrom] = useState(firstDay);
    const [to, setTo] = useState(today);

    const [loading, setLoading] = useState(false);

    const [report, setReport] = useState({

        totalLeads: 0,

        wonLeads: 0,

        lostLeads: 0,

        leadsByEmployee: {},

        leadsBySource: {}

    });

    async function generateReport() {

        try {

            setLoading(true);

            const data = await getLeadReport(from, to);

            setReport(data);

        }

        catch (err) {

            console.log(err);

            alert("Failed to generate report.");

        }

        finally {

            setLoading(false);

        }

    }

    return (
    <>

        <PageHeader
            title="Lead Reports"
            subtitle="Generate analytics for your CRM leads."
        />

        <div className="card shadow-sm border-0 mb-4">

            <div className="card-body">

                <div className="row align-items-end">

                    <div className="col-md-4">

                        <label className="form-label fw-semibold">
                            From Date
                        </label>

                        <input
                            type="date"
                            className="form-control"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                        />

                    </div>

                    <div className="col-md-4">

                        <label className="form-label fw-semibold">
                            To Date
                        </label>

                        <input
                            type="date"
                            className="form-control"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                        />

                    </div>

                    <div className="col-md-4">

                        <button
                            className="btn btn-primary w-100"
                            onClick={generateReport}
                            disabled={loading}
                        >

                            {loading
                                ? "Generating..."
                                : "Generate Report"}

                        </button>

                    </div>

                </div>

            </div>

        </div>

        <div className="row g-4">

            <div className="col-lg-4">

                <StatCard
                    title="Total Leads"
                    value={report.totalLeads}
                    icon="bi-person-lines-fill"
                    color="#2563eb"
                />

            </div>

            <div className="col-lg-4">

                <StatCard
                    title="Won Leads"
                    value={report.wonLeads}
                    icon="bi-check-circle-fill"
                    color="#10b981"
                />

            </div>

            <div className="col-lg-4">

                <StatCard
                    title="Lost Leads"
                    value={report.lostLeads}
                    icon="bi-x-circle-fill"
                    color="#ef4444"
                />

            </div>

        </div>

    </>
);
}