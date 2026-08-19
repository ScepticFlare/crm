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
    getAllLeads,
    bulkDeleteLeads,
    exportLeads
} from "../services/leadService";
import { getAllIndustries } from "../services/industryService";
import { getAllLeadSources } from "../services/leadSourceService";
import { getAllProducts } from "../services/productService";
import { getAllBatteries } from "../services/batteryService";
import { getAllEmployees } from "../services/employeeService";

const LEAD_STATUS_OPTIONS = [
    { value: "NEW", label: "New" },
    { value: "CONTACTED", label: "Contacted" },
    { value: "QUOTATION_SENT", label: "Quotation Sent" },
    { value: "NEGOTIATION", label: "Negotiation" },
    { value: "WON", label: "Won" },
    { value: "LOST", label: "Lost" },
    { value: "DROPPED", label: "Dropped" },
    { value: "UNRESPONSIVE", label: "Unresponsive" },
    { value: "INVALID", label: "Invalid" },
    { value: "INACTIVE", label: "Inactive" },
];

const LEAD_VALIDITY_OPTIONS = [
    { value: "VALID", label: "Valid" },
    { value: "INVALID", label: "Invalid" },
];

const ALL_LEAD_COLUMNS = [
    {
        key: "companyName", label: "Company", sortable: true, sortKey: "company",
        render: (row) => (
            <Link to={`/leads/${row.id}`} className="record-link">
                {row.companyName}
            </Link>
        )
    },
    { key: "contactPerson", label: "Contact Person", sortable: true },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    {
        key: "leadStatus",
        label: "Lead Status",
        sortable: true,
        sortKey: "status",
        render: (row) => <StatusBadge status={row.leadStatus} />
    },
    { key: "leadSource", label: "Lead Source", render: (row) => row.leadSource?.name || "-" },
    { key: "industry", label: "Industry", render: (row) => row.industry?.name || "-" },
    {
        key: "products",
        label: "Product",
        render: (row) =>
            (row.leadProducts || []).map((lp) => lp.product?.name).filter(Boolean).join(", ") || "-"
    },
    {
        key: "batteries",
        label: "Battery",
        render: (row) =>
            (row.leadBatteries || []).map((lb) => lb.battery?.name).filter(Boolean).join(", ") || "-"
    },
    {
        key: "assignedEmployee",
        label: "Assigned Employee",
        sortable: true,
        render: (row) => row.assignedEmployee?.name || "-"
    },
    { key: "city", label: "City" },
    {
        key: "createdAt",
        label: "Created Date",
        sortable: true,
        sortKey: "createdDate",
        render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"
    },
];

// Product/Battery are core business fields on Lead, so they stay visible
// by default alongside contact/status/ownership info. The rest (email,
// lead source, industry, city) stay one click away via Manage Columns
// instead of crowding the table on first load.
const DEFAULT_VISIBLE_LEAD_COLUMNS = [
    "companyName", "contactPerson", "phone", "leadStatus", "products", "batteries", "assignedEmployee", "createdAt"
];

export default function Leads({
    title = "Leads",
    fetchLeads = getAllLeads,
    addLeadPath = "/leads/add"
}) {

    const navigate = useNavigate();

    // Backend is the source of truth (LEAD_DELETE/LEAD_EXPORT are
    // ADMIN-only permissions - see LeadService) - this only controls
    // whether the checkbox/bulk-delete/export affordances are shown at all,
    // same "UX/defense-in-depth guard" rationale as AdminRoute.
    const isAdmin = localStorage.getItem("role") === "ADMIN";

    const list = useServerList({
        fetchFn: fetchLeads,
        initialSort: { field: "createdDate", dir: "desc" }
    });

    const columns = usePersistedColumns("crm.columns.leads", ALL_LEAD_COLUMNS, DEFAULT_VISIBLE_LEAD_COLUMNS);

    const [industries, setIndustries] = useState([]);
    const [leadSources, setLeadSources] = useState([]);
    const [products, setProducts] = useState([]);
    const [batteries, setBatteries] = useState([]);
    const [employees, setEmployees] = useState([]);

    useEffect(() => {

        getAllIndustries().then(setIndustries).catch(() => {});
        getAllLeadSources().then(setLeadSources).catch(() => {});
        getAllProducts().then(setProducts).catch(() => {});
        getAllBatteries().then(setBatteries).catch(() => {});

        // A plain Employee has no grant to list the roster (403) - that's
        // expected, not an error; the Assigned Employee filter just won't
        // offer options for them (their own scope is OWN anyway).
        getAllEmployees().then(setEmployees).catch(() => {});

    }, []);

    const filterDefs = useMemo(() => {

        const defs = [
            { key: "status", label: "Lead Status", type: "select", options: LEAD_STATUS_OPTIONS },
            {
                key: "leadSourceId", label: "Lead Source", type: "select",
                options: leadSources.map((s) => ({ value: s.id, label: s.name }))
            },
            {
                key: "industryId", label: "Industry", type: "select",
                options: industries.map((i) => ({ value: i.id, label: i.name }))
            },
            {
                key: "productId", label: "Product", type: "select",
                options: products.map((p) => ({ value: p.id, label: p.name }))
            },
            {
                key: "batteryId", label: "Battery", type: "select",
                options: batteries.map((b) => ({ value: b.id, label: b.name }))
            },
        ];

        if (employees.length > 0) {
            defs.push({
                key: "assignedEmployeeId", label: "Assigned Employee", type: "select",
                options: employees.map((e) => ({ value: e.id, label: e.name }))
            });
        }

        defs.push(
            { key: "city", label: "City", type: "text" },
            { key: "state", label: "State", type: "text" },
            { key: "leadValidity", label: "Lead Validity", type: "select", options: LEAD_VALIDITY_OPTIONS },
            { key: "created", label: "Created Date", type: "daterange", fromKey: "createdFrom", toKey: "createdTo" }
        );

        return defs;

    }, [industries, leadSources, products, batteries, employees]);

    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [exporting, setExporting] = useState(false);

    async function handleBulkDelete() {

        if (!window.confirm(
            `Delete ${list.selectedIds.length} selected lead(s)? ` +
            "Any Opportunity, Won Customer record and Follow-Ups belonging to them will also be deleted."
        )) {
            return;
        }

        setBulkDeleting(true);

        try {

            const result = await bulkDeleteLeads(list.selectedIds);

            if (result.skippedIds && result.skippedIds.length > 0) {
                alert(
                    `Deleted ${result.succeededIds.length} lead(s). ` +
                    `Skipped ${result.skippedIds.length} you're not authorized to delete or that no longer exist.`
                );
            }

            list.clearSelection();
            await list.reload();

        } catch (error) {

            console.error(error);
            alert("Unable to delete the selected leads.");

        } finally {

            setBulkDeleting(false);

        }

    }

    async function handleExport(selectedOnly) {

        setExporting(true);

        try {

            const blob = await exportLeads({
                sort: list.sort,
                filters: { search: list.search || undefined, ...list.filters },
                selection: selectedOnly ? list.selectedIds : null,
            });

            downloadBlob(blob, "leads.csv");

        } catch (error) {

            console.error(error);
            alert("Unable to export leads.");

        } finally {

            setExporting(false);

        }

    }

    return (

        <>

            <PageHeader
                title={title}
                subtitle={`${list.totalElements} Lead(s) Found`}
                buttonText="Add Lead"
                onButtonClick={() => navigate(addLeadPath)}
            />

            <div className="card shadow-sm border-0 mb-3">

                <div className="card-body">

                    <div className="d-flex flex-wrap gap-2 align-items-center">

                        <div className="flex-grow-1" style={{ minWidth: "240px" }}>

                            <div className="input-group">

                                <span className="input-group-text bg-white">
                                    <i className="bi bi-search"></i>
                                </span>

                                <input
                                    type="text"
                                    className="form-control border-start-0"
                                    placeholder="Search by company, contact, phone or email..."
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
                onRowClick={(row) => navigate(`/leads/${row.id}`)}
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
                        No matching leads found.
                </div>
            )}

            {list.error && !list.loading && (
                <div className="alert alert-danger text-center mt-3">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Unable to load leads. Please try again.
                </div>
            )}

        </>

    );

}
