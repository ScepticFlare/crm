import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/ui/StatusBadge";
import FilterPanel from "../components/list/FilterPanel";
import ManageColumnsMenu from "../components/list/ManageColumnsMenu";
import BulkActionBar from "../components/list/BulkActionBar";
import RecordLink from "../components/list/RecordLink";
import ListPagination from "../components/list/ListPagination";

import useServerList from "../hooks/useServerList";
import usePersistedColumns from "../hooks/usePersistedColumns";
import { formatDate } from "../utils/formatDate";
import { downloadBlob, exportErrorMessage } from "../utils/downloadFile";
import { canExportLeadsAndOpportunities } from "../utils/permissions";

import {
    getAllOpportunities,
    bulkDeleteOpportunities,
    exportOpportunities
} from "../services/opportunityService";
import { getAllSalesStages } from "../services/salesStageService";
import { getAllProducts } from "../services/productService";
import { getAllIndustries } from "../services/industryService";
import { getAllEmployees } from "../services/employeeService";
import { subStatusLabel } from "../components/workflowConstants";

const ALL_OPPORTUNITY_COLUMNS = [
    { key: "company", label: "Lead", render: (row) => row.lead?.companyName || "-" },
    {
        key: "title", label: "Opportunity", sortable: true,
        render: (row) => (
            <RecordLink to={`/opportunities/${row.id}`} className="record-link">
                {row.title}
            </RecordLink>
        )
    },
    {
        key: "value", label: "Value", sortable: true, sortKey: "value",
        render: (row) => `₹${Number(row.productValue || 0).toLocaleString("en-IN")}`
    },
    {
        key: "date", label: "Closing Date", sortable: true, sortKey: "closingDate",
        render: (row) => formatDate(row.expectedClosingDate)
    },
    {
        key: "stage", label: "Stage", sortable: true,
        render: (row) => (
            <>
                <StatusBadge status={row.salesStage?.name || "Not Set"} />
                {row.effectiveSubStatus && (
                    <span className="badge bg-light text-dark border ms-1">
                        {subStatusLabel(row.effectiveSubStatus)}
                    </span>
                )}
                {row.closingDateExpired && (
                    <i
                        className="bi bi-exclamation-triangle-fill text-warning ms-2"
                        title="Expected closing date has passed - review this opportunity"
                    ></i>
                )}
                {row.noNextAction && (
                    <i
                        className="bi bi-bell-slash text-secondary ms-2"
                        title="Next action missing - needs a pending follow-up with a future date"
                    ></i>
                )}
                {row.postponedReminderDue && (
                    <i
                        className="bi bi-alarm text-info ms-2"
                        title="Postponed review date reached"
                    ></i>
                )}
            </>
        )
    },
    {
        key: "assignedEmployee", label: "Assigned Employee", sortable: true,
        render: (row) => row.lead?.assignedEmployee?.name || "-"
    },
    {
        key: "createdAt", label: "Created Date", sortable: true, sortKey: "createdDate",
        render: (row) => formatDate(row.createdAt)
    },
];

// Compact default: createdAt stays available via Manage Columns.
const DEFAULT_VISIBLE_OPPORTUNITY_COLUMNS = ["company", "title", "value", "date", "stage", "assignedEmployee"];

export default function Opportunities({
    title = "Opportunities",
    fetchOpportunities = getAllOpportunities,
    // Export parameters mirroring a stage page's forced server-side filter
    // (e.g. { stageType: "LOST" }), so Export matches what the page lists.
    exportParams = {}
}) {

    const navigate = useNavigate();
    const location = useLocation();

    // Backend is the source of truth (OPPORTUNITY_DELETE/OPPORTUNITY_EXPORT
    // are ADMIN-only permissions - see OpportunityService) - this only
    // controls whether the checkbox/bulk-delete/export affordances are
    // shown at all, same "UX/defense-in-depth guard" rationale as AdminRoute.
    const isAdmin = localStorage.getItem("role") === "ADMIN";

    // ADMIN and MARKETING see the export actions (the backend enforces the
    // OPPORTUNITY_EXPORT permission and the caller's own data scope).
    const canExport = canExportLeadsAndOpportunities();

    const list = useServerList({
        fetchFn: fetchOpportunities,
        initialSort: { field: "createdDate", dir: "desc" }
    });

    const columns = usePersistedColumns(
        "crm.columns.opportunities", ALL_OPPORTUNITY_COLUMNS, DEFAULT_VISIBLE_OPPORTUNITY_COLUMNS
    );

    const [salesStages, setSalesStages] = useState([]);
    const [products, setProducts] = useState([]);
    const [industries, setIndustries] = useState([]);
    const [employees, setEmployees] = useState([]);

    useEffect(() => {

        getAllSalesStages().then(setSalesStages).catch(() => {});
        getAllProducts().then(setProducts).catch(() => {});
        getAllIndustries().then(setIndustries).catch(() => {});
        getAllEmployees().then(setEmployees).catch(() => {});

    }, []);

    const filterDefs = useMemo(() => {

        const defs = [
            {
                key: "salesStageId", label: "Stage", type: "select",
                options: salesStages.map((s) => ({ value: s.id, label: s.name }))
            },
            {
                key: "productId", label: "Product", type: "select",
                options: products.map((p) => ({ value: p.id, label: p.name }))
            },
            {
                key: "industryId", label: "Industry", type: "select",
                options: industries.map((i) => ({ value: i.id, label: i.name }))
            },
        ];

        if (employees.length > 0) {
            defs.push({
                key: "assignedEmployeeId", label: "Assigned Employee", type: "select",
                options: employees.map((e) => ({ value: e.id, label: e.name }))
            });
        }

        defs.push(
            { key: "created", label: "Created Date", type: "daterange", fromKey: "createdFrom", toKey: "createdTo" },
            {
                key: "closing", label: "Expected Closing Date", type: "daterange",
                fromKey: "expectedClosingFrom", toKey: "expectedClosingTo"
            },
            { key: "minValue", label: "Min Value", type: "text" },
            { key: "maxValue", label: "Max Value", type: "text" }
        );

        return defs;

    }, [salesStages, products, industries, employees]);

    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [exporting, setExporting] = useState(false);

    async function handleBulkDelete() {

        if (!window.confirm(
            `Delete ${list.selectedIds.length} selected opportunity(s)? ` +
            "Any Won Customer record and Follow-Ups belonging to them will also be deleted."
        )) {
            return;
        }

        setBulkDeleting(true);

        try {

            const result = await bulkDeleteOpportunities(list.selectedIds);

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
            alert("Unable to delete the selected opportunities.");

        } finally {

            setBulkDeleting(false);

        }

    }

    async function handleExport(selectedOnly) {

        setExporting(true);

        try {

            const blob = await exportOpportunities({
                sort: list.sort,
                filters: { search: list.search || undefined, ...list.filters, ...exportParams },
                selection: selectedOnly ? list.selectedIds : null,
            });

            downloadBlob(blob, "opportunities.xlsx");

        } catch (error) {

            console.error(error);
            alert(await exportErrorMessage(error, "opportunities"));

        } finally {

            setExporting(false);

        }

    }

    const totalValue = list.data.reduce((sum, o) => sum + (o.productValue || 0), 0);

    const wonValue = list.data
        .filter((o) => o.salesStage?.stageType === "WON")
        .reduce((sum, o) => sum + (o.productValue || 0), 0);

    return (

        <>

            <PageHeader
                title={title}
                subtitle={`${list.totalElements} Opportunity(s) Found`}
            />

            <div className="row mb-4">

                <div className="col-md-4">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <small className="text-muted">Total Opportunities</small>
                            <h3>{list.totalElements}</h3>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <small className="text-muted">Pipeline Value (this page)</small>
                            <h3>₹{totalValue.toLocaleString("en-IN")}</h3>
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <small className="text-muted">Won Deals (this page)</small>
                            <h3 className="text-success">₹{wonValue.toLocaleString("en-IN")}</h3>
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
                                    placeholder="Search by company, contact, phone, email or stage..."
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

                        {canExport && (
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

            {(isAdmin || canExport) && (
                <BulkActionBar
                    count={list.selectedIds.length}
                    onClear={list.clearSelection}
                    actions={[
                        ...(canExport ? [{
                            key: "export", label: "Export Selected", icon: "bi-download",
                            variant: "btn-outline-secondary", onClick: () => handleExport(true), disabled: exporting
                        }] : []),
                        ...(isAdmin ? [{
                            key: "delete", label: "Delete", icon: "bi-trash",
                            variant: "btn-outline-danger", onClick: handleBulkDelete, disabled: bulkDeleting
                        }] : []),
                    ]}
                />
            )}

            <DataTable
                columns={columns.visibleColumns}
                data={list.data}
                loading={list.loading}
                selectable={isAdmin || canExport}
                selectedIds={list.selectedIds}
                onToggleSelect={list.toggleSelect}
                onToggleSelectAll={list.toggleSelectAll}
                sort={list.sort}
                onSortChange={list.toggleSort}
                onRowClick={(row) => navigate(`/opportunities/${row.id}`, { state: { from: location.pathname + location.search } })}
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
                    <i className="bi bi-search me-2"></i>
                    No matching opportunities found.
                </div>
            )}

        </>

    );

}
