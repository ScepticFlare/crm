import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/ui/StatusBadge";
import FilterPanel from "../components/list/FilterPanel";
import ManageColumnsMenu from "../components/list/ManageColumnsMenu";
import BulkActionBar from "../components/list/BulkActionBar";
import ListPagination from "../components/list/ListPagination";

import useServerList from "../hooks/useServerList";
import usePersistedColumns from "../hooks/usePersistedColumns";
import { downloadBlob } from "../utils/downloadFile";

import {
    getAllFollowUps,
    bulkDeleteFollowUps,
    exportFollowUps
} from "../services/followupService";
import { getAllActivityTypes } from "../services/activityTypeService";
import { getAllEmployees } from "../services/employeeService";

const FOLLOWUP_STATUS_OPTIONS = [
    { value: "PENDING", label: "Pending" },
    { value: "COMPLETED", label: "Completed" },
    { value: "MISSED", label: "Missed" },
    { value: "CANCELLED", label: "Cancelled" },
];

const ALL_FOLLOWUP_COLUMNS = [
    { key: "lead", label: "Lead", render: (row) => row.lead?.companyName || "-" },
    { key: "opportunity", label: "Opportunity", render: (row) => row.opportunity?.title || "-" },
    { key: "employee", label: "Employee", sortable: true, render: (row) => row.employee?.name || "-" },
    {
        key: "activity", label: "Activity", sortable: true, sortKey: "activityType",
        render: (row) => (
            <Link to={`/followups/${row.id}`} className="record-link">
                {row.activityType?.name || "-"}
            </Link>
        )
    },
    {
        key: "scheduledDate", label: "Scheduled", sortable: true,
        render: (row) => row.scheduledDate ? new Date(row.scheduledDate).toLocaleString() : "-"
    },
    { key: "status", label: "Status", sortable: true, render: (row) => <StatusBadge status={row.status} /> },
];

const DEFAULT_VISIBLE_FOLLOWUP_COLUMNS = ALL_FOLLOWUP_COLUMNS.map((c) => c.key);

export default function FollowUps() {

    const navigate = useNavigate();

    // Backend is the source of truth (FOLLOWUP_DELETE/FOLLOWUP_EXPORT are
    // ADMIN-only permissions - see FollowUpService) - this only controls
    // whether the checkbox/bulk-delete/export affordances are shown at all,
    // same "UX/defense-in-depth guard" rationale as AdminRoute.
    const isAdmin = localStorage.getItem("role") === "ADMIN";

    const list = useServerList({
        fetchFn: getAllFollowUps,
        initialSort: { field: "scheduledDate", dir: "asc" }
    });

    const columns = usePersistedColumns(
        "crm.columns.followups", ALL_FOLLOWUP_COLUMNS, DEFAULT_VISIBLE_FOLLOWUP_COLUMNS
    );

    const [activityTypes, setActivityTypes] = useState([]);
    const [employees, setEmployees] = useState([]);

    useEffect(() => {

        getAllActivityTypes().then(setActivityTypes).catch(() => {});
        getAllEmployees().then(setEmployees).catch(() => {});

    }, []);

    const filterDefs = useMemo(() => {

        const defs = [
            {
                key: "activityTypeId", label: "Activity Type", type: "select",
                options: activityTypes.map((a) => ({ value: a.id, label: a.name }))
            },
            { key: "status", label: "Status", type: "select", options: FOLLOWUP_STATUS_OPTIONS },
        ];

        if (employees.length > 0) {
            defs.push({
                key: "assignedEmployeeId", label: "Assigned Employee", type: "select",
                options: employees.map((e) => ({ value: e.id, label: e.name }))
            });
        }

        defs.push({
            key: "scheduled", label: "Follow-up Date", type: "daterange",
            fromKey: "scheduledFrom", toKey: "scheduledTo"
        });

        return defs;

    }, [activityTypes, employees]);

    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [exporting, setExporting] = useState(false);

    async function handleBulkDelete() {

        if (!window.confirm(`Delete ${list.selectedIds.length} selected follow-up(s)?`)) {
            return;
        }

        setBulkDeleting(true);

        try {

            const result = await bulkDeleteFollowUps(list.selectedIds);

            if (result.skippedIds && result.skippedIds.length > 0) {
                alert(
                    `Deleted ${result.succeededIds.length}. Skipped ${result.skippedIds.length} ` +
                    "(not authorized or no longer exist)."
                );
            }

            list.clearSelection();
            await list.reload();

        } catch (error) {

            console.error(error);
            alert("Unable to delete the selected follow-ups.");

        } finally {

            setBulkDeleting(false);

        }

    }

    async function handleExport(selectedOnly) {

        setExporting(true);

        try {

            const blob = await exportFollowUps({
                sort: list.sort,
                filters: { search: list.search || undefined, ...list.filters },
                selection: selectedOnly ? list.selectedIds : null,
            });

            downloadBlob(blob, "followups.csv");

        } catch (error) {

            console.error(error);
            alert("Unable to export follow-ups.");

        } finally {

            setExporting(false);

        }

    }

    const totalFollowUps = list.totalElements;
    const pendingFollowUps = list.data.filter((f) => f.status === "PENDING").length;
    const completedFollowUps = list.data.filter((f) => f.status === "COMPLETED").length;

    const today = new Date().toISOString().split("T")[0];
    const todayFollowUps = list.data.filter((f) => f.scheduledDate?.startsWith(today)).length;

    return (

        <>

            <PageHeader
                title="Follow Ups"
                subtitle={`${list.totalElements} Follow Up(s) Found`}
                buttonText="Add Follow Up"
                onButtonClick={() => navigate("/followups/add")}
            />

            <div className="row mb-4">

                <div className="col-md-3">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <small className="text-muted">Total Follow Ups</small>
                            <h3>{totalFollowUps}</h3>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <small className="text-muted">Pending (this page)</small>
                            <h3 className="text-warning">{pendingFollowUps}</h3>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <small className="text-muted">Completed (this page)</small>
                            <h3 className="text-success">{completedFollowUps}</h3>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <small className="text-muted">Today's (this page)</small>
                            <h3>{todayFollowUps}</h3>
                        </div>
                    </div>
                </div>

            </div>

            <div className="card shadow-sm border-0 mb-3">

                <div className="card-body">

                    <div className="d-flex flex-wrap gap-2 align-items-center">

                        <div className="flex-grow-1" style={{ minWidth: "240px" }}>

                            <div className="input-group">

                                <span className="input-group-text bg-white">
                                    <i className="bi bi-search"></i>
                                </span>

                                <input
                                    className="form-control border-start-0"
                                    placeholder="Search by lead, opportunity, employee, activity or remarks..."
                                    value={list.search}
                                    onChange={(e) => list.setSearch(e.target.value)}
                                />

                            </div>

                        </div>

                        <FilterPanel
                            filterDefs={filterDefs}
                            filters={list.filters}
                            onChange={list.setFilters}
                            onClear={list.clearFilters}
                        />

                        <ManageColumnsMenu
                            allColumns={columns.allColumns}
                            visibleKeys={columns.visibleKeys}
                            onToggle={columns.toggleColumn}
                            onReset={columns.resetColumns}
                        />

                        {isAdmin && (
                            <div className="dropdown">

                                <button
                                    className="btn btn-outline-secondary dropdown-toggle"
                                    type="button"
                                    data-bs-toggle="dropdown"
                                    disabled={exporting}
                                >
                                    <i className="bi bi-download me-2"></i>
                                    Export
                                </button>

                                <ul className="dropdown-menu dropdown-menu-end">
                                    <li>
                                        <button className="dropdown-item" onClick={() => handleExport(false)}>
                                            Export all matching
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            className="dropdown-item"
                                            disabled={list.selectedIds.length === 0}
                                            onClick={() => handleExport(true)}
                                        >
                                            Export selected ({list.selectedIds.length})
                                        </button>
                                    </li>
                                </ul>

                            </div>
                        )}

                    </div>

                </div>

            </div>

            {isAdmin && (
                <BulkActionBar
                    count={list.selectedIds.length}
                    onClear={list.clearSelection}
                    actions={[
                        {
                            key: "export", label: "Export Selected", icon: "bi-download",
                            variant: "btn-outline-secondary", onClick: () => handleExport(true), disabled: exporting
                        },
                        {
                            key: "delete", label: "Delete", icon: "bi-trash",
                            variant: "btn-outline-danger", onClick: handleBulkDelete, disabled: bulkDeleting
                        },
                    ]}
                />
            )}

            <DataTable
                columns={columns.visibleColumns}
                data={list.data}
                loading={list.loading}
                selectable={isAdmin}
                selectedIds={list.selectedIds}
                onToggleSelect={list.toggleSelect}
                onToggleSelectAll={list.toggleSelectAll}
                sort={list.sort}
                onSortChange={list.toggleSort}
                onRowClick={(row) => navigate(`/followups/${row.id}`)}
            />

            {!list.loading && list.data.length === 0 && (
                <div className="alert alert-light border text-center mt-3">
                    <i className="bi bi-search me-2"></i>
                    No matching follow ups found.
                </div>
            )}

            <ListPagination
                page={list.page}
                pageSize={list.pageSize}
                totalPages={list.totalPages}
                totalElements={list.totalElements}
                onPageChange={list.setPage}
                onPageSizeChange={list.setPageSize}
            />

        </>

    );

}
