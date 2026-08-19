import { useEffect, useMemo, useState } from "react";

import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import StatCard from "../components/StatCard";
import SummaryCard from "../components/ui/SummaryCard";
import FilterPanel from "../components/list/FilterPanel";
import ListPagination from "../components/list/ListPagination";

import useServerList from "../hooks/useServerList";
import { getActivity, getActivitySummary } from "../services/activityService";
import { getAllEmployees } from "../services/employeeService";

const MODULE_OPTIONS = [
    { value: "AUTH", label: "Auth" },
    { value: "LEAD", label: "Lead" },
    { value: "OPPORTUNITY", label: "Opportunity" },
    { value: "CUSTOMER", label: "Customer" },
    { value: "FOLLOWUP", label: "Follow-up" },
    { value: "EMPLOYEE", label: "Employee" },
];

const ACTION_OPTIONS = [
    { value: "LOGIN", label: "Login" },
    { value: "LOGOUT", label: "Logout" },
    { value: "FAILED_LOGIN", label: "Failed Login" },
    { value: "CREATE", label: "Create" },
    { value: "VIEW", label: "View" },
    { value: "UPDATE", label: "Update" },
    { value: "DELETE", label: "Delete" },
    { value: "IMPORT", label: "Import" },
    { value: "EXPORT", label: "Export" },
    { value: "CONVERT", label: "Convert" },
    { value: "COMPLETE", label: "Complete" },
    { value: "EMPLOYEE_CREATED", label: "Employee Created" },
    { value: "EMPLOYEE_UPDATED", label: "Employee Updated" },
    { value: "ROLE_CHANGED", label: "Role Changed" },
    { value: "MANAGER_CHANGED", label: "Manager Changed" },
    { value: "EMPLOYEE_ACTIVATED", label: "Employee Activated" },
    { value: "EMPLOYEE_DEACTIVATED", label: "Employee Deactivated" },
];

const MODULE_LABELS = Object.fromEntries(MODULE_OPTIONS.map((m) => [m.value, m.label]));

function formatDateTime(value) {

    if (!value) {
        return "—";
    }

    return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

}

const COLUMNS = [
    {
        key: "createdAt",
        label: "Time",
        sortable: true,
        sortKey: "createdDate",
        render: (row) => formatDateTime(row.createdAt),
    },
    {
        key: "employeeName",
        label: "Employee",
        sortable: true,
        sortKey: "employee",
    },
    {
        key: "module",
        label: "Module",
        sortable: true,
        render: (row) => MODULE_LABELS[row.module] || row.module,
    },
    {
        key: "activity",
        label: "Activity",
        render: (row) => (
            <>
                <div>{row.description || row.action}</div>
                {row.entityName && (
                    <div className="text-muted small">{row.entityName}</div>
                )}
            </>
        ),
    },
];

// Admin/Manager dashboard for the Employee Activity/Audit Log feature -
// summary stat row on top, filterable/paginated chronological timeline
// below. Backend (ActivityLogService via AccessControlService) is the
// source of truth for visibility - an Admin sees every employee's
// activity, a Manager sees their own + direct reports', exactly the same
// ALL/TEAM/OWN scoping as every other module. This page never trusts
// anything client-side for that; it just renders whatever the API returns.
export default function EmployeeActivity() {

    const list = useServerList({
        fetchFn: getActivity,
        initialSort: { field: "createdDate", dir: "desc" },
    });

    const [employees, setEmployees] = useState([]);
    const [summary, setSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(true);

    useEffect(() => {

        // A Manager's EMPLOYEE_VIEW grant is TEAM-scoped, so this already
        // comes back as just their own team - no extra filtering needed
        // here to keep the Employee picker in-scope.
        getAllEmployees().then(setEmployees).catch(() => {});

    }, []);

    useEffect(() => {

        let cancelled = false;

        setSummaryLoading(true);

        getActivitySummary(list.filters)
            .then((data) => {
                if (!cancelled) {
                    setSummary(data);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setSummary(null);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setSummaryLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };

    }, [list.filters]);

    const filterDefs = useMemo(() => {

        const defs = [];

        if (employees.length > 0) {
            defs.push({
                key: "employeeId",
                label: "Employee",
                type: "select",
                options: employees.map((e) => ({ value: e.id, label: e.name })),
            });
        }

        defs.push(
            { key: "module", label: "Module", type: "select", options: MODULE_OPTIONS },
            { key: "action", label: "Action", type: "select", options: ACTION_OPTIONS },
            { key: "created", label: "Date", type: "daterange", fromKey: "createdFrom", toKey: "createdTo" }
        );

        return defs;

    }, [employees]);

    const statValue = (value) => (summaryLoading ? "…" : value ?? 0);

    return (

        <>

            <PageHeader
                title="Employee Activity"
                subtitle="A chronological record of meaningful actions across the CRM"
            />

            <div className="row g-3 mb-3">

                <div className="col-xl-3 col-lg-4 col-md-6">
                    <StatCard
                        title="Total Actions"
                        value={statValue(summary?.totalActions)}
                        icon="bi-activity"
                        color="#2563eb"
                    />
                </div>

                <div className="col-xl-3 col-lg-4 col-md-6">
                    <StatCard
                        title="Leads Created"
                        value={statValue(summary?.leadsCreated)}
                        icon="bi-person-plus-fill"
                        color="#10b981"
                    />
                </div>

                <div className="col-xl-3 col-lg-4 col-md-6">
                    <StatCard
                        title="Leads Updated"
                        value={statValue(summary?.leadsUpdated)}
                        icon="bi-pencil-square"
                        color="#f59e0b"
                    />
                </div>

                <div className="col-xl-3 col-lg-4 col-md-6">
                    <StatCard
                        title="Follow-ups Completed"
                        value={statValue(summary?.followUpsCompleted)}
                        icon="bi-calendar-check-fill"
                        color="#ef4444"
                    />
                </div>

                <div className="col-xl-3 col-lg-4 col-md-6">
                    <StatCard
                        title="Conversions"
                        value={statValue(summary?.conversions)}
                        icon="bi-arrow-repeat"
                        color="#8b5cf6"
                    />
                </div>

                <div className="col-xl-3 col-lg-4 col-md-6">
                    <SummaryCard
                        title="Last Active"
                        value={summaryLoading ? "…" : formatDateTime(summary?.lastActiveAt)}
                        subtitle="Most recent activity"
                    />
                </div>

                <div className="col-xl-3 col-lg-4 col-md-6">
                    <SummaryCard
                        title="Last Login"
                        value={summaryLoading ? "…" : formatDateTime(summary?.lastLoginAt)}
                        subtitle="Most recent login"
                    />
                </div>

            </div>

            <div className="card shadow-sm border-0 mb-3">

                <div className="card-body">

                    <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">

                        <h6 className="mb-0">Activity Timeline</h6>

                        <FilterPanel
                            filterDefs={filterDefs}
                            filters={list.filters}
                            onChange={list.setFilters}
                            onClear={list.clearFilters}
                        />

                    </div>

                </div>

            </div>

            <DataTable
                columns={COLUMNS}
                data={list.data}
                loading={list.loading}
                sort={list.sort}
                onSortChange={list.toggleSort}
            />

            <ListPagination
                page={list.page}
                pageSize={list.pageSize}
                totalPages={list.totalPages}
                totalElements={list.totalElements}
                onPageChange={list.setPage}
                onPageSizeChange={list.setPageSize}
            />

            {!list.loading && list.data.length === 0 && (
                <div className="alert alert-light border text-center mt-3">
                    <i className="bi bi-inbox me-2"></i>
                    No activity found for the selected filters.
                </div>
            )}

            {list.error && !list.loading && (
                <div className="alert alert-danger text-center mt-3">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Unable to load activity.
                </div>
            )}

        </>

    );

}
