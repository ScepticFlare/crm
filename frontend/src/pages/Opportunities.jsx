import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/ui/StatusBadge";
import FilterPanel from "../components/list/FilterPanel";
import ManageColumnsMenu from "../components/list/ManageColumnsMenu";
import BulkActionBar from "../components/list/BulkActionBar";
import RecordLink from "../components/list/RecordLink";
import RowActionsMenu from "../components/list/RowActionsMenu";
import BulkEmailModal from "../components/email/BulkEmailModal";
import BulkEmailResumeBanner from "../components/email/BulkEmailResumeBanner";
import ListPagination from "../components/list/ListPagination";

import useServerList from "../hooks/useServerList";
import usePersistedColumns from "../hooks/usePersistedColumns";
import { formatDate, formatDateTime } from "../utils/formatDate";
import { downloadBlob, exportCountNotice, exportErrorMessage } from "../utils/downloadFile";
import { describeLineItems } from "../utils/lineItems";

import {
    getAllOpportunities,
    bulkDeleteOpportunities,
    exportOpportunities
} from "../services/opportunityService";
import { getAllSalesStages } from "../services/salesStageService";
import { getAllProducts } from "../services/productService";
import { getAllBatteries } from "../services/batteryService";
import { getAllIndustries } from "../services/industryService";
import { getAllEmployees } from "../services/employeeService";
import { subStatusLabel } from "../components/workflowConstants";

// Column keys double as export column keys (backend OpportunityController.
// EXPORT_COLUMNS): the exported file contains exactly the visible columns.
// Contact, product and battery values are the Opportunity's own current
// values (editable after conversion), not the original Lead's.
const ALL_OPPORTUNITY_COLUMNS = [
    {
        key: "company", label: "Company", sortable: true, sortKey: "company",
        render: (row) => row.lead?.companyName || "-"
    },
    {
        key: "title", label: "Opportunity", sortable: true,
        render: (row) => (
            <RecordLink to={`/opportunities/${row.id}`} className="record-link">
                {row.title}
            </RecordLink>
        )
    },
    { key: "contactPerson", label: "Contact Person", sortable: true, render: (row) => row.contactPerson || "-" },
    { key: "contactPhone", label: "Contact Phone", render: (row) => row.contactPhone || "-" },
    { key: "contactEmail", label: "Contact Email", render: (row) => row.contactEmail || "-" },
    {
        key: "products", label: "Product",
        render: (row) => describeLineItems(row.opportunityProducts, "product")
    },
    {
        key: "batteries", label: "Battery",
        render: (row) => describeLineItems(row.opportunityBatteries, "battery")
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
        key: "subStatus", label: "Sub-Status",
        render: (row) => (row.effectiveSubStatus ? subStatusLabel(row.effectiveSubStatus) : "-")
    },
    {
        key: "assignedEmployee", label: "Assigned Employee", sortable: true,
        render: (row) => row.lead?.assignedEmployee?.name || "-"
    },
    { key: "industry", label: "Industry", render: (row) => row.lead?.industry?.name || "-" },
    { key: "city", label: "City", render: (row) => row.lead?.city || "-" },
    { key: "state", label: "State", render: (row) => row.lead?.state || "-" },
    { key: "leadSource", label: "Lead Source", render: (row) => row.lead?.leadSource?.name || "-" },
    { key: "leadValidity", label: "Validity", render: (row) => row.leadValidity || "-" },
    {
        key: "nextFollowUp", label: "Next Follow-up",
        render: (row) => formatDateTime(row.nextFollowUpDate)
    },
    {
        key: "postponedReviewDate", label: "Postponed Review Date",
        render: (row) => formatDate(row.postponedReviewDate)
    },
    { key: "postponedReason", label: "Postponed Reason", render: (row) => row.postponedReason || "-" },
    { key: "lostReason", label: "Lost Reason", render: (row) => row.lostReason || "-" },
    {
        key: "createdAt", label: "Created Date", sortable: true, sortKey: "createdDate",
        render: (row) => formatDate(row.createdAt)
    },
    {
        key: "updatedAt", label: "Last Modified", sortable: true, sortKey: "updatedDate",
        render: (row) => formatDate(row.updatedAt)
    },
];

// Compact default: everything else stays one click away via Manage Columns.
const DEFAULT_VISIBLE_OPPORTUNITY_COLUMNS = [
    "company", "title", "products", "batteries", "value", "date", "stage", "assignedEmployee"
];

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

    // Every employee can export opportunities (OPPORTUNITY_EXPORT is granted to
    // every role by migration V11); the backend limits the file to the records
    // the caller may already view and answers 403 otherwise.

    const list = useServerList({
        fetchFn: fetchOpportunities,
        initialSort: { field: "createdDate", dir: "desc" }
    });

    const columns = usePersistedColumns(
        "crm.columns.opportunities", ALL_OPPORTUNITY_COLUMNS, DEFAULT_VISIBLE_OPPORTUNITY_COLUMNS
    );

    const [salesStages, setSalesStages] = useState([]);
    const [products, setProducts] = useState([]);
    const [batteries, setBatteries] = useState([]);
    const [industries, setIndustries] = useState([]);
    const [employees, setEmployees] = useState([]);

    useEffect(() => {

        getAllSalesStages().then(setSalesStages).catch(() => {});
        getAllProducts().then(setProducts).catch(() => {});
        getAllBatteries().then(setBatteries).catch(() => {});
        getAllIndustries().then(setIndustries).catch(() => {});
        getAllEmployees().then(setEmployees).catch(() => {});

    }, []);

    // Categorical filters are multi-select: any of the chosen values within a
    // filter (e.g. Stage is In Progress OR Postponed), and every filter must
    // match (AND). Product / Battery match the Opportunity's own current items.
    const filterDefs = useMemo(() => {

        const defs = [
            {
                key: "salesStageId", label: "Stage", type: "multiselect",
                options: salesStages.map((s) => ({ value: s.id, label: s.name }))
            },
            {
                key: "productId", label: "Product", type: "multiselect",
                options: products.map((p) => ({ value: p.id, label: p.name }))
            },
            {
                key: "batteryId", label: "Battery", type: "multiselect",
                options: batteries.map((b) => ({ value: b.id, label: b.name }))
            },
            {
                key: "industryId", label: "Industry", type: "multiselect",
                options: industries.map((i) => ({ value: i.id, label: i.name }))
            },
        ];

        if (employees.length > 0) {
            defs.push({
                key: "assignedEmployeeId", label: "Assigned Employee", type: "multiselect",
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

    }, [salesStages, products, batteries, industries, employees]);

    const [bulkDeleting, setBulkDeleting] = useState(false);

    // Bulk Email to the opportunities' lead contacts - see BulkEmailModal.
    const [showBulkEmail, setShowBulkEmail] = useState(false);
    // Re-opening an unfinished batch (no selection needed) - see BulkEmailResumeBanner.
    const [resumeBulkEmail, setResumeBulkEmail] = useState(false);
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

    // Exports exactly what is listed: same search, filters, page-forced
    // parameters and sort, with the visible columns (in table order).
    // selectedOnly: the current selection - picked rows, or every matching
    // record minus unticked ones; otherwise every matching record.
    async function handleExport(selectedOnly) {

        setExporting(true);

        try {

            const blob = await exportOpportunities({
                sort: list.sort,
                filters: { search: list.search || undefined, ...list.filters, ...exportParams },
                selection: selectedOnly ? list.selection : null,
                columns: columns.visibleColumns.map((c) => c.key),
            });

            downloadBlob(blob, "opportunities.xlsx");

            const notice = exportCountNotice(
                blob, selectedOnly ? list.selectedCount : list.totalElements, "opportunities");

            if (notice) {
                alert(notice);
            }

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

            {!showBulkEmail && !resumeBulkEmail && (
                <BulkEmailResumeBanner target="OPPORTUNITY" onResume={() => setResumeBulkEmail(true)} />
            )}

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

                        {(
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
                                            Export all matching ({list.totalElements})
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            className="dropdown-item"
                                            disabled={list.selectedCount === 0}
                                            onClick={() => handleExport(true)}
                                        >
                                            Export selected ({list.selectedCount})
                                        </button>
                                    </li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li>
                                        <span className="dropdown-item-text small text-muted">
                                            Includes the {columns.visibleColumns.length} visible column(s) -
                                            change them with Columns.
                                        </span>
                                    </li>
                                </ul>

                            </div>
                        )}

                    </div>

                </div>

            </div>

            {(
                <BulkActionBar
                    count={list.selectedCount}
                    onClear={list.clearSelection}
                    allMatching={list.allMatching}
                    excludedCount={list.excludedIds.length}
                    pageFullySelected={list.pageFullySelected}
                    pageRowCount={list.data.length}
                    totalElements={list.totalElements}
                    onSelectAllMatching={list.selectAllMatching}
                    actions={[
                        {
                            key: "bulkEmail", label: "Bulk Email", icon: "bi-envelope-paper",
                            variant: "btn-outline-primary", onClick: () => setShowBulkEmail(true),
                            unavailableForAllMatching:
                                "Bulk Email sends to records you tick individually (at most 100 per batch). " +
                                "Clear the selection and tick the records instead."
                        },
                        {
                            key: "export", label: "Export Selected", icon: "bi-download",
                            variant: "btn-outline-secondary", onClick: () => handleExport(true), disabled: exporting
                        },
                        ...(isAdmin ? [{
                            key: "delete", label: "Delete", icon: "bi-trash",
                            variant: "btn-outline-danger", onClick: handleBulkDelete, disabled: bulkDeleting,
                            unavailableForAllMatching:
                                "Delete only works on records you tick individually, so nothing is deleted by accident."
                        }] : []),
                    ]}
                />
            )}

            <DataTable
                columns={columns.visibleColumns}
                data={list.data}
                loading={list.loading}
                selectable
                selectedIds={list.selectedIds}
                isRowSelected={list.isSelected}
                onToggleSelect={list.toggleSelect}
                onToggleSelectAll={list.toggleSelectAll}
                sort={list.sort}
                onSortChange={list.toggleSort}
                onRowClick={(row) => navigate(`/opportunities/${row.id}`, { state: { from: location.pathname + location.search } })}
                renderActions={(row) => (
                    <RowActionsMenu
                        items={[{
                            // The backend decides whether this user may edit it
                            // (OPPORTUNITY_MANAGE within their scope).
                            label: "Edit Opportunity",
                            icon: "bi-pencil",
                            onClick: () => navigate(`/opportunities/edit/${row.id}`, {
                                state: { from: location.pathname + location.search }
                            }),
                        }]}
                    />
                )}
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

            <BulkEmailModal
                show={showBulkEmail || resumeBulkEmail}
                target="OPPORTUNITY"
                ids={resumeBulkEmail ? [] : list.selectedIds}
                resumeOnly={resumeBulkEmail}
                onClose={() => {
                    setShowBulkEmail(false);
                    setResumeBulkEmail(false);
                }}
                onSent={() => {
                    list.clearSelection();
                    list.reload();
                }}
            />

        </>

    );

}
