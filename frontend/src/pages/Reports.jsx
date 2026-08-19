import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/ui/SectionCard";
import {
    getLeadReport,
    exportLeadReport,
    getLeadSources
} from "../services/reportService";

export default function Reports() {

    const today = new Date().toISOString().split("T")[0];

    const firstDay = new Date(
        new Date().getFullYear(),
        0,
        1
    ).toISOString().split("T")[0];

    const [from, setFrom] = useState(firstDay);
    const [to, setTo] = useState(today);

    const [leadSources, setLeadSources] = useState([]);
    const [leadSourceId, setLeadSourceId] = useState("");

    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadLeadSources();
    }, []);

    async function loadLeadSources() {

        try {

            const data = await getLeadSources();

            setLeadSources(data);

        } catch (err) {

            console.log(err);

        }

    }

    async function generateReport() {

        try {

            setLoading(true);

            const data = await getLeadReport(
                from,
                to,
                leadSourceId === "" ? null : Number(leadSourceId)
            );

            setReport(data);

        } catch (err) {

            console.log(err);

            alert("Failed to generate report.");

        } finally {

            setLoading(false);

        }

    }

    async function downloadExcel() {

    if (report.length === 0) {
        alert("No report available to export.");
        return;
    }

    try {

        await exportLeadReport(
            from,
            to,
            leadSourceId === "" ? null : Number(leadSourceId)
        );

    } catch (err) {

        console.log(err);
        alert("Export failed.");

    }

}

    return (
        <>

            <PageHeader
                title="Reports"
                subtitle="Month-by-month lead performance. For a custom multi-record analysis, use Full Report."
            />

            <div className="d-flex justify-content-end mb-3">

                <Link to="/full-report" className="btn btn-outline-primary btn-sm">
                    <i className="bi bi-sliders me-2"></i>
                    Go to Full Report
                </Link>

            </div>

            <SectionCard title="Monthly Lead Report">

                    <div className="row g-3 align-items-end">

                        <div className="col-md-4">

                            <label className="form-label">
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

                            <label className="form-label">
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

                            <label className="form-label">
                                Lead Source
                            </label>

                            <select
                                className="form-select"
                                value={leadSourceId}
                                onChange={(e) =>
                                    setLeadSourceId(e.target.value)
                                }
                            >

                                <option value="">
                                    All
                                </option>

                                {leadSources.map((source) => (

                                    <option
                                        key={source.id}
                                        value={source.id}
                                    >
                                        {source.name}
                                    </option>

                                ))}

                            </select>

                        </div>

                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-3">

                        <button
                            className="btn btn-primary"
                            onClick={generateReport}
                            disabled={loading}
                        >

                            {loading
                                ? "Generating..."
                                : "Generate Report"}

                        </button>

                        <button
                            className="btn btn-success"
                            onClick={downloadExcel}
                            disabled={report.length === 0}
                        >
                            Export Excel
                        </button>

                    </div>

            </SectionCard>

            <SectionCard title="Monthly Breakdown">

                <div className="table-responsive">

                    <table className="table table-bordered table-hover align-middle">

                        <thead className="table-light">

                            <tr>

                                <th>Month</th>
                                <th>Total Leads</th>
                                <th>Invalid</th>
                                <th>Valid</th>
                                <th>Won</th>
                                <th>Lost</th>
                                <th>In Progress</th>
                                <th>Postponed</th>
                                <th>Dropped</th>
                                <th>Unresponsive</th>
                                <th>Won %</th>

                            </tr>

                        </thead>

                        <tbody>
                                                        {report.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="11"
                                        className="text-center"
                                    >
                                        No report generated.
                                    </td>

                                </tr>

                            ) : (

                                report.map((row, index) => (

                                    <tr key={index}>

                                        <td>{row.month}</td>

                                        <td>{row.totalLeadsReceived}</td>

                                        <td>{row.invalidLeads}</td>

                                        <td>{row.validLeads}</td>

                                        <td>{row.won}</td>

                                        <td>{row.lost}</td>

                                        <td>{row.inProgress}</td>

                                        <td>{row.postponed}</td>

                                        <td>{row.dropped}</td>

                                        <td>{row.unresponsive}</td>

                                        <td>
                                            {row.wonConversionRate.toFixed(2)}%
                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </SectionCard>

        </>

    );

}