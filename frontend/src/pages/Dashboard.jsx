import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import QuickActionCard from "../components/QuickActionCard";
import StatCard from "../components/StatCard";

import { getAllLeads } from "../services/leadService";
import { getAllCustomers } from "../services/customerService";
import { getAllOpportunities } from "../services/opportunityService";
import { getAllFollowUps } from "../services/followupService";

export default function Dashboard() {

    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        leads: 0,
        customers: 0,
        opportunities: 0,
        followups: 0
    });

    const [recentLeads, setRecentLeads] = useState([]);
    const [upcomingFollowUps, setUpcomingFollowUps] = useState([]);

    const [pipeline, setPipeline] = useState({
        NEW: 0,
        QUOTATION_SENT: 0,
        NEGOTIATION: 0,
        POSTPONED: 0,
        WON: 0,
        LOST: 0
    });

    const greeting = useMemo(() => {

        const hour = new Date().getHours();

        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";

        return "Good Evening";

    }, []);

    
const role = localStorage.getItem("role");
const employeeName =
    role === "ADMIN"
        ? "Administrator"
        : localStorage.getItem("employeeName") || "Employee";

    const pipelineColors = {
        NEW: "primary",
        QUOTATION_SENT: "warning",
        NEGOTIATION: "info",
        POSTPONED: "secondary",
        WON: "success",
        LOST: "danger"
    };

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
            

            const leads = leadRes || [];
            const customers = customerRes || [];
            const opportunities = opportunityRes || [];
            const followups = followupRes || [];
            console.log("Follow Ups:", followups);

            setStats({

                leads: leads.length,
                customers: customers.length,
                opportunities: opportunities.length,
                followups: followups.length

            });

            const latestLeads = [...leads]
                .sort(
                    (a, b) =>
                        new Date(b.createdAt) -
                        new Date(a.createdAt)
                )
                .slice(0, 5);

            setRecentLeads(latestLeads);

            
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const nextFollowUps = [...followups]
                .filter((followUp) => {

                    if (followUp.status !== "PENDING") return false;

                    const scheduledDate = new Date(followUp.scheduledDate);
                    scheduledDate.setHours(0, 0, 0, 0);

                    return scheduledDate >= today;

                })
                .sort(
                    (a, b) =>
                        new Date(a.scheduledDate) -
                        new Date(b.scheduledDate)
                )
                .slice(0, 5);

            setUpcomingFollowUps(nextFollowUps);

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

        }

        catch (err) {

            console.log(err);

        }

        finally {

            setLoading(false);

        }

    }

    function openFollowUp(item) {

        if (item.lead) {

            navigate(`/leads/${item.lead.id}`);

            return;

        }

        if (item.opportunity) {

            navigate(`/opportunities/${item.opportunity.id}`);

        }

    }

    if (loading) {

        return (

            <div className="text-center mt-5">

                <div
                    className="spinner-border text-primary"
                    style={{
                        width: "3rem",
                        height: "3rem"
                    }}
                ></div>

                <p className="mt-3 text-muted">

                    Loading Dashboard...

                </p>

            </div>

        );

    }

    return (

    <>

        <PageHeader
            title={`${greeting}, ${employeeName} 👋`}
            subtitle="Here's a quick overview of your CRM."
        />

        <div className="row g-4">

            <div className="col-lg-3 col-md-6">

                <StatCard
                    title="Leads"
                    value={stats.leads}
                    icon="bi-person-lines-fill"
                    color="#2563eb"
                />

            </div>

            <div className="col-lg-3 col-md-6">

                <StatCard
                    title="Customers"
                    value={stats.customers}
                    icon="bi-people-fill"
                    color="#10b981"
                />

            </div>

            <div className="col-lg-3 col-md-6">

                <StatCard
                    title="Opportunities"
                    value={stats.opportunities}
                    icon="bi-briefcase-fill"
                    color="#f59e0b"
                />

            </div>

            <div className="col-lg-3 col-md-6">

                <StatCard
                    title="Follow Ups"
                    value={stats.followups}
                    icon="bi-calendar-check-fill"
                    color="#ef4444"
                />

            </div>

        </div>
                {/* Quick Actions */}

<div className="card shadow-sm border-0 mt-4">

    <div className="card-body">

        <div className="d-flex justify-content-between align-items-center mb-4">

            <h5 className="fw-bold mb-0">
                Quick Actions
            </h5>

            <span className="text-muted small">
                Frequently Used
            </span>

        </div>

        <div className="row g-3">

            <div className={role === "ADMIN" ? "col-lg-4 col-md-6" : "col-md-6"}>

                <QuickActionCard
                    icon="bi-person-plus-fill"
                    title="Add Lead"
                    onClick={() => navigate("/leads/add")}
                />

            </div>

            <div className={role === "ADMIN" ? "col-lg-4 col-md-6" : "col-md-6"}>

                <QuickActionCard
                    icon="bi-calendar-plus-fill"
                    title="Add Follow Up"
                    onClick={() => navigate("/followups/add")}
                />

            </div>

            {role === "ADMIN" && (

                <div className="col-lg-4 col-md-6">

                    <QuickActionCard
                        icon="bi-people-fill"
                        title="Employees"
                        onClick={() => navigate("/employees")}
                    />

                </div>

            )}

        </div>

    </div>

</div>

        {/* Recent Leads + Upcoming Follow Ups */}

        <div className="row mt-4">

            <div className="col-lg-7">

                <div className="card shadow-sm border-0 h-100">

                    <div className="card-body">

                        <div className="d-flex justify-content-between align-items-center mb-4">

                            <h5 className="fw-bold mb-0">

                                🧾 Recent Leads

                            </h5>

                            <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => navigate("/leads")}
                            >

                                View All

                            </button>

                        </div>

                        <table className="table table-hover align-middle">

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
                                            className="text-center py-5"
                                        >

                                            <i
                                                className="bi bi-inbox display-6 text-secondary"
                                            ></i>

                                            <h6 className="mt-3">

                                                No Recent Leads

                                            </h6>

                                            <p className="text-muted">

                                                Start by creating your first lead.

                                            </p>

                                            <button
                                                className="btn btn-primary"
                                                onClick={() => navigate("/leads/add")}
                                            >

                                                Add Lead

                                            </button>

                                        </td>

                                    </tr>

                                    :

                                    recentLeads.map((lead) => (

                                        <tr
                                            key={lead.id}
                                            style={{
                                                cursor: "pointer"
                                            }}
                                            onClick={() =>
                                                navigate(`/leads/${lead.id}`)
                                            }
                                        >

                                            <td className="fw-semibold">

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

            <div className="col-lg-5">

                <div className="card shadow-sm border-0 h-100">

                    <div className="card-body">

                        <div className="d-flex justify-content-between align-items-center mb-4">

                            <h5 className="fw-bold mb-0">

                                📅 Upcoming Follow Ups

                            </h5>

                            <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => navigate("/followups")}
                            >

                                View All

                            </button>

                        </div>

                        {

                            upcomingFollowUps.length === 0 ?

                                <div className="text-center py-5">

                                    <i
                                        className="bi bi-calendar-x display-6 text-secondary"
                                    ></i>

                                    <h6 className="mt-3">

                                        No Upcoming Follow Ups

                                    </h6>

                                    <p className="text-muted">

                                        Everything is up to date.

                                    </p>

                                </div>

                                :

                                upcomingFollowUps.map((item) => (

                                    <div
                                        key={item.id}
                                        className="border rounded p-3 mb-3 shadow-sm"
                                        style={{
                                            cursor: "pointer",
                                            transition: "0.2s"
                                        }}
                                        onClick={() => openFollowUp(item)}
                                    >

                                        <div className="fw-bold">

                                            {

                                                item.lead?.companyName ||

                                                item.opportunity?.lead?.companyName ||

                                                "Unknown"

                                            }

                                        </div>

                                        <div className="text-muted small">

                                            {

                                                item.activityType?.name ||

                                                "Follow Up"

                                            }

                                        </div>

                                        <div className="mt-2">

                                            <span className="badge bg-light text-dark">

                                                {new Date(item.scheduledDate).toLocaleString()}

                                            </span>

                                        </div>

                                    </div>

                                ))

                        }

                    </div>

                </div>

            </div>

        </div>
                {/* Opportunity Pipeline */}

        <div className="card shadow-sm border-0 mt-4">

            <div className="card-body">

                <div className="d-flex justify-content-between align-items-center mb-4">

                    <h5 className="fw-bold mb-0">

                        📈 Opportunity Pipeline

                    </h5>

                    <span className="text-muted small">

                        Current Sales Stages

                    </span>

                </div>

                <div className="row g-3">

                    {

                        Object.entries(pipeline).map(([stage, count]) => (

                            <div
                                key={stage}
                                className="col-lg-4 col-md-6"
                            >

                                <div
                                    className="border rounded-4 p-3 h-100 shadow-sm"
                                    style={{
                                        transition: "0.25s",
                                        cursor: "default"
                                    }}
                                >

                                    <div className="d-flex justify-content-between align-items-center">

                                        <div>

                                            <div
                                                className="fw-semibold"
                                                style={{ fontSize: "0.95rem" }}
                                            >

                                                {stage.replaceAll("_", " ")}

                                            </div>

                                            <small className="text-muted">

                                                Opportunities

                                            </small>

                                        </div>

                                        <span
                                            className={`badge bg-${pipelineColors[stage]} fs-6 px-3 py-2`}
                                        >

                                            {count}

                                        </span>

                                    </div>

                                </div>

                            </div>

                        ))

                    }

                </div>

            </div>

        </div>

    </>

    );

}