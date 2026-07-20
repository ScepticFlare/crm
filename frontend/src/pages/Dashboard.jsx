import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import QuickActionCard from "../components/QuickActionCard";
import StatCard from "../components/StatCard";

import { getAllLeads } from "../services/leadService";
import { getAllCustomers } from "../services/customerService";
import { getAllOpportunities } from "../services/opportunityService";
import { getAllFollowUps } from "../services/followupService";

export default function Dashboard() {

    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        leads: 0,
        customers: 0,
        opportunities: 0,
        followups: 0
    });

    const [recentLeads, setRecentLeads] = useState([]);
    const [pipeline, setPipeline] = useState({
        NEW: 0,
        QUOTATION_SENT: 0,
        NEGOTIATION: 0,
        POSTPONED: 0,
        WON: 0,
        LOST: 0
    });

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {

        try {

            const [
                leadRes,
                customerRes,
                opportunityRes,
                followupRes
            ] = await Promise.all([
                getAllLeads(),
                getAllCustomers(),
                getAllOpportunities(),
                getAllFollowUps()
            ]);

            const leads = leadRes.data;
            const customers = customerRes.data;
            const opportunities = opportunityRes.data;
            const followups = followupRes.data;

            setStats({
                leads: leads.length,
                customers: customers.length,
                opportunities: opportunities.length,
                followups: followups.length
            });

            const latest = [...leads]
                .sort(
                    (a, b) =>
                        new Date(b.createdAt) -
                        new Date(a.createdAt)
                )
                .slice(0, 5);

            setRecentLeads(latest);

            const stageCount = {
                NEW: 0,
                QUOTATION_SENT: 0,
                NEGOTIATION: 0,
                POSTPONED: 0,
                WON: 0,
                LOST: 0
            };

            opportunities.forEach((opp) => {

                if (stageCount.hasOwnProperty(opp.salesStage)) {

                    stageCount[opp.salesStage]++;

                }

            });

            setPipeline(stageCount);

        } catch (err) {

            console.log(err);

        } finally {

            setLoading(false);

        }

    }

    if (loading) {

        return (

            <div className="text-center mt-5">

                <div className="spinner-border text-primary"></div>

                <p className="mt-3">
                    Loading Dashboard...
                </p>

            </div>

        );

    }

    return (

        <>

            <PageHeader
                title="Dashboard"
                subtitle="Welcome back 👋 Here's what's happening today."
            />

            {/* Statistics */}

            <div className="row g-4">

                <div className="col-lg-3">

                    <StatCard
                        title="Leads"
                        value={stats.leads}
                        icon="bi-person-lines-fill"
                        color="#2563eb"
                    />

                </div>

                <div className="col-lg-3">

                    <StatCard
                        title="Customers"
                        value={stats.customers}
                        icon="bi-people-fill"
                        color="#10b981"
                    />

                </div>

                <div className="col-lg-3">

                    <StatCard
                        title="Opportunities"
                        value={stats.opportunities}
                        icon="bi-briefcase-fill"
                        color="#f59e0b"
                    />

                </div>

                <div className="col-lg-3">

                    <StatCard
                        title="Follow Ups"
                        value={stats.followups}
                        icon="bi-calendar-check"
                        color="#ef4444"
                    />

                </div>

            </div>

            {/* Quick Actions */}

            <div className="card mt-4">

                <div className="card-body">

                    <h5 className="mb-4">
                        Quick Actions
                    </h5>

                    <div className="row g-3">

                        <div className="col-md-4">

                            <QuickActionCard
                                icon="bi-person-plus-fill"
                                title="Add Lead"
                            />

                        </div>

                        <div className="col-md-4">

                            <QuickActionCard
                                icon="bi-people-fill"
                                title="Add Customer"
                            />

                        </div>

                        <div className="col-md-4">

                            <QuickActionCard
                                icon="bi-briefcase-fill"
                                title="New Opportunity"
                            />

                        </div>

                    </div>

                </div>

            </div>

            {/* Recent Leads + Pipeline */}

            <div className="row mt-4">

                <div className="col-lg-8">

                    <div className="card h-100">

                        <div className="card-body">

                            <h5 className="mb-4">
                                Recent Leads
                            </h5>

                            <table className="table align-middle">

                                <thead>

                                <tr>

                                    <th>Company</th>

                                    <th>Contact</th>

                                    <th>Status</th>

                                </tr>

                                </thead>

                                <tbody>

                                {

                                    recentLeads.length === 0 ?

                                        <tr>

                                            <td
                                                colSpan="3"
                                                className="text-center text-muted py-4"
                                            >

                                                No Leads Available

                                            </td>

                                        </tr>

                                        :

                                        recentLeads.map((lead) => (

                                            <tr key={lead.id}>

                                                <td>
                                                    {lead.companyName}
                                                </td>

                                                <td>
                                                    {lead.contactPerson}
                                                </td>

                                                <td>

                                                    <span className="badge bg-primary">

                                                        {lead.leadStatus}

                                                    </span>

                                                </td>

                                            </tr>

                                        ))

                                }

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>

                <div className="col-lg-4">

                    <div className="card h-100">

                        <div className="card-body">

                            <h5 className="mb-4">
                                Opportunity Pipeline
                            </h5>

                            {

                                Object.entries(pipeline).map(([stage, count]) => (

                                    <div
                                        key={stage}
                                        className="d-flex justify-content-between align-items-center mb-3"
                                    >

                                        <span>

                                            {stage.replaceAll("_", " ")}

                                        </span>

                                        <span className="badge bg-dark">

                                            {count}

                                        </span>

                                    </div>

                                ))

                            }

                        </div>

                    </div>

                </div>

            </div>

        </>

    );

}