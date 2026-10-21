import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import SectionCard from "../components/ui/SectionCard";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";

import { getManagementSummary } from "../services/managementService";
import { formatDate, formatDateTime } from "../utils/formatDate";

function money(value) {
    return Number(value || 0).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    });
}

function Tile({ title, value, hint, variant = "" }) {

    return (
        <div className="col-lg-3 col-md-4 col-6">
            <div className={`card border-0 shadow-sm h-100 ${variant}`}>
                <div className="card-body">
                    <small className="text-muted d-block">{title}</small>
                    <h4 className="mb-0 mt-1">{value}</h4>
                    {hint && <small className="text-muted">{hint}</small>}
                </div>
            </div>
        </div>
    );
}

function SimpleTable({ columns, rows, empty }) {

    if (!rows || rows.length === 0) {
        return <div className="text-muted small">{empty}</div>;
    }

    return (
        <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
                <thead className="table-light">
                    <tr>{columns.map((c) => <th key={c.label}>{c.label}</th>)}</tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i}>
                            {columns.map((c) => <td key={c.label}>{c.render(row)}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Management metrics for the Director: lead funnel, open pipeline, overdue
// opportunities and follow-ups, closures expected soon, wins and losses by
// salesperson / source, loss reasons, repeated closing-date changes and
// leads not contacted by their deadline. All figures come from
// GET /api/management/summary and are scoped to what the signed-in user may
// see (Admin: everyone, Manager: their team). The notes at the bottom state
// the exact basis of the figures that have a caveat.
export default function ManagementSummary() {

    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    async function load() {

        setLoading(true);
        setError(false);

        try {

            setData(await getManagementSummary({ from, to }));

        } catch (err) {

            console.error(err);
            setError(true);

        } finally {

            setLoading(false);

        }

    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading && !data) {
        return <LoadingState className="text-center mt-5" message="Loading management summary..." />;
    }

    if (error && !data) {
        return (
            <EmptyState
                icon="bi-exclamation-triangle"
                title="Unable to Load"
                message="The management summary could not be loaded."
                className="text-center text-muted py-5"
            />
        );
    }

    const f = data.funnel;

    return (

        <>

            <PageHeader
                title="Management Summary"
                subtitle={`Lead funnel, pipeline and follow-up discipline - ${formatDate(data.from)} to ${formatDate(data.to)}`}
            />

            <div className="card shadow-sm border-0 mb-4">
                <div className="card-body d-flex flex-wrap align-items-end gap-3">
                    <div>
                        <label className="form-label mb-1 small">Leads created from</label>
                        <input type="date" className="form-control form-control-sm" value={from}
                            onChange={(e) => setFrom(e.target.value)} />
                    </div>
                    <div>
                        <label className="form-label mb-1 small">to</label>
                        <input type="date" className="form-control form-control-sm" value={to}
                            onChange={(e) => setTo(e.target.value)} />
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={load} disabled={loading}>
                        {loading ? "Loading..." : "Apply"}
                    </button>
                    <small className="text-muted">Leave blank for the last 30 days.</small>
                </div>
            </div>

            <h5 className="mb-2">Lead funnel (leads created in the period)</h5>

            <div className="row g-3 mb-4">
                <Tile title="Leads received" value={f.leadsReceived} />
                <Tile title="New (not yet qualified)" value={f.newLeads} hint={`${f.newLeadsNow} New in total right now`} />
                <Tile title="Valid" value={f.validLeads} hint={`${f.validRatePercent}% valid rate`} />
                <Tile title="Invalid" value={f.invalidLeads} />
                <Tile title="Converted to opportunity" value={f.convertedToOpportunity} />
                <Tile title="Currently at Quotation Sent" value={f.currentlyQuotationSent} />
                <Tile title="Won" value={f.won} />
            </div>

            <h5 className="mb-2">Open pipeline</h5>

            <div className="row g-3 mb-4">
                <Tile title="Open opportunities" value={data.pipeline.openCount} />
                <Tile title="Open pipeline value" value={money(data.pipeline.openValue)} />
                {data.closingSoon.map((w) => (
                    <Tile
                        key={w.days}
                        title={`Closing within ${w.days} days`}
                        value={w.count}
                        hint={money(w.value)}
                    />
                ))}
            </div>

            <div className="row g-3">

                <div className="col-lg-6">
                    <SectionCard title="Open pipeline by stage">
                        <SimpleTable
                            empty="No open opportunities."
                            columns={[
                                { label: "Stage", render: (r) => r.stage },
                                { label: "Opportunities", render: (r) => r.count },
                                { label: "Value", render: (r) => money(r.value) },
                            ]}
                            rows={data.pipeline.byStage}
                        />
                    </SectionCard>
                </div>

                <div className="col-lg-6">
                    <SectionCard title={`Overdue opportunities (${data.overdue.opportunityCount} - ${money(data.overdue.opportunityValue)})`}>
                        <SimpleTable
                            empty="No opportunity is past its expected closing date."
                            columns={[
                                { label: "Opportunity", render: (r) => <Link to={`/opportunities/${r.id}`}>{r.title}</Link> },
                                { label: "Owner", render: (r) => r.owner },
                                { label: "Was due", render: (r) => formatDate(r.expectedClosingDate) },
                                { label: "Value", render: (r) => money(r.value) },
                            ]}
                            rows={data.overdue.opportunities}
                        />
                    </SectionCard>
                </div>

                <div className="col-lg-6">
                    <SectionCard title={`Overdue follow-ups (${data.overdue.followUpCount})`}>
                        <SimpleTable
                            empty="No pending follow-up is overdue."
                            columns={[
                                { label: "Lead / company", render: (r) => r.company || "-" },
                                { label: "Scheduled", render: (r) => formatDateTime(r.scheduledDate) },
                                {
                                    label: "Open",
                                    render: (r) => r.opportunityId
                                        ? <Link to={`/opportunities/${r.opportunityId}`}>Opportunity</Link>
                                        : (r.leadId ? <Link to={`/leads/${r.leadId}`}>Lead</Link> : "-")
                                },
                            ]}
                            rows={data.overdue.followUps}
                        />
                    </SectionCard>
                </div>

                <div className="col-lg-6">
                    <SectionCard title={`Leads not contacted by their deadline (${data.uncontactedLeads.count})`}>
                        <SimpleTable
                            empty="Every New lead has been contacted within its deadline."
                            columns={[
                                { label: "Lead", render: (r) => <Link to={`/leads/${r.id}`}>{r.company}</Link> },
                                { label: "Owner", render: (r) => r.owner },
                                { label: "Contact by", render: (r) => formatDate(r.contactDeadline) },
                            ]}
                            rows={data.uncontactedLeads.leads}
                        />
                    </SectionCard>
                </div>

                <div className="col-lg-6">
                    <SectionCard title="Wins and losses by salesperson">
                        <SimpleTable
                            empty="No won or lost opportunities yet."
                            columns={[
                                { label: "Salesperson", render: (r) => r.salesperson },
                                { label: "Won", render: (r) => r.won },
                                { label: "Won value", render: (r) => money(r.wonValue) },
                                { label: "Lost", render: (r) => r.lost },
                            ]}
                            rows={data.resultsBySalesperson}
                        />
                    </SectionCard>
                </div>

                <div className="col-lg-6">
                    <SectionCard title="Wins and losses by lead source">
                        <SimpleTable
                            empty="No won or lost opportunities yet."
                            columns={[
                                { label: "Source", render: (r) => r.source },
                                { label: "Won", render: (r) => r.won },
                                { label: "Won value", render: (r) => money(r.wonValue) },
                                { label: "Lost", render: (r) => r.lost },
                            ]}
                            rows={data.resultsBySource}
                        />
                    </SectionCard>
                </div>

                <div className="col-lg-6">
                    <SectionCard title="Loss reasons">
                        <SimpleTable
                            empty="No loss reasons recorded yet."
                            columns={[
                                { label: "Reason", render: (r) => r.reason },
                                { label: "Opportunities", render: (r) => r.count },
                            ]}
                            rows={data.lossReasons.reasons}
                        />
                        {data.lossReasons.lostWithoutReason > 0 && (
                            <div className="small text-muted mt-2">
                                {data.lossReasons.lostWithoutReason} older lost opportunit
                                {data.lossReasons.lostWithoutReason > 1 ? "ies have" : "y has"} no reason recorded.
                            </div>
                        )}
                    </SectionCard>
                </div>

                <div className="col-lg-6">
                    <SectionCard title={`Repeated closing-date changes (${data.closureDateChanges.opportunitiesWithRepeatedChanges})`}>
                        <SimpleTable
                            empty="No opportunity's closing date has been changed more than once."
                            columns={[
                                { label: "Opportunity", render: (r) => <Link to={`/opportunities/${r.opportunityId}`}>{r.title}</Link> },
                                { label: "Date changes", render: (r) => r.changes },
                            ]}
                            rows={data.closureDateChanges.top}
                        />
                    </SectionCard>
                </div>

            </div>

            <div className="small text-muted mt-4">
                <div className="fw-semibold">How these figures are calculated</div>
                <ul className="mb-0">
                    {data.notes.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
            </div>

        </>

    );

}
