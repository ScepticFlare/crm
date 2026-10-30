import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import FilterPanel from "../components/list/FilterPanel";
import ManageColumnsMenu from "../components/list/ManageColumnsMenu";
import BulkActionBar from "../components/list/BulkActionBar";
import RecordLink from "../components/list/RecordLink";
import ListPagination from "../components/list/ListPagination";

import useServerList from "../hooks/useServerList";
import usePersistedColumns from "../hooks/usePersistedColumns";
import { formatDate } from "../utils/formatDate";
import { downloadBlob, exportCountNotice, exportErrorMessage } from "../utils/downloadFile";
import { describeLineItems } from "../utils/lineItems";

import {
    getAllCustomers,
    bulkDeleteCustomers,
    exportCustomers
} from "../services/customerService";
import { getAllIndustries } from "../services/industryService";
import { getAllEmployees } from "../services/employeeService";
import { getAllProducts } from "../services/productService";
import { getAllBatteries } from "../services/batteryService";

// Column keys double as export column keys (backend CustomerController.
// EXPORT_COLUMNS): the exported file contains exactly the visible columns.
// Opportunity / value / products / batteries come from the won Opportunity.
const ALL_CUSTOMER_COLUMNS = [
    { key: "customerCode", label: "Customer Code", sortable: true, sortKey: "customerCode" },
    {
        key: "companyName", label: "Company", sortable: true, sortKey: "company",
        render: (row) => (
            <RecordLink to={`/customers/${row.id}`} className="record-link">
                {row.companyName}
            </RecordLink>
        )
    },
    { key: "contactPerson", label: "Contact", sortable: true, sortKey: "contactPerson", render: (row) => row.contactPerson },
    { key: "designation", label: "Designation" },
    { key: "phone", label: "Phone" },
    { key: "alternatePhone", label: "Alternate Phone" },
    { key: "email", label: "Email" },
    { key: "secondaryEmail", label: "Secondary Email" },
    { key: "website", label: "Website" },
    { key: "city", label: "City", sortable: true, sortKey: "city" },
    { key: "state", label: "State" },
    { key: "pincode", label: "Pincode" },
    { key: "billingAddress", label: "Billing Address" },
    { key: "shippingAddress", label: "Shipping Address" },
    { key: "gstNumber", label: "GST Number" },
    { key: "industry", label: "Industry", render: (row) => row.opportunity?.lead?.industry?.name || "-" },
    { key: "opportunity", label: "Opportunity", render: (row) => row.opportunity?.title || "-" },
    {
        key: "value", label: "Value",
        render: (row) => (row.opportunity?.productValue != null
            ? `₹${Number(row.opportunity.productValue).toLocaleString("en-IN")}` : "-")
    },
    {
        key: "products", label: "Product",
        render: (row) => describeLineItems(row.opportunity?.opportunityProducts, "product")
    },
    {
        key: "batteries", label: "Battery",
        render: (row) => describeLineItems(row.opportunity?.opportunityBatteries, "battery")
    },
    {
        key: "assignedEmployee", label: "Assigned Employee", sortable: true,
        render: (row) => row.assignedEmployee?.name || "-"
    },
    {
        key: "createdAt", label: "Created Date", sortable: true, sortKey: "createdDate",
        render: (row) => formatDate(row.createdAt)
    },
    {
        key: "updatedAt", label: "Last Modified", sortable: true, sortKey: "updatedDate",
        render: (row) => formatDate(row.updatedAt)
    },
];

// Compact default: email, city, state stay available via Manage Columns.
const DEFAULT_VISIBLE_CUSTOMER_COLUMNS = [
    "customerCode", "companyName", "contactPerson", "phone", "assignedEmployee", "createdAt"
];

export default function Customers() {

    const navigate = useNavigate();
    const location = useLocation();

    // Backend is the source of truth (CUSTOMER_DELETE/CUSTOMER_EXPORT are
    // ADMIN-only permissions - see CustomerService) - this only controls
    // whether the checkbox/bulk-delete/export affordances are shown at all,
    // same "UX/defense-in-depth guard" rationale as AdminRoute.
    const isAdmin = localStorage.getItem("role") === "ADMIN";

    const list = useServerList({
        fetchFn: getAllCustomers,
        initialSort: { field: "createdDate", dir: "desc" }
    });

    const columns = usePersistedColumns(
        "crm.columns.customers", ALL_CUSTOMER_COLUMNS, DEFAULT_VISIBLE_CUSTOMER_COLUMNS
    );

    const [industries, setIndustries] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [products, setProducts] = useState([]);
    const [batteries, setBatteries] = useState([]);

    useEffect(() => {

        getAllIndustries().then(setIndustries).catch(() => {});
        getAllEmployees().then(setEmployees).catch(() => {});
        getAllProducts().then(setProducts).catch(() => {});
        getAllBatteries().then(setBatteries).catch(() => {});

    }, []);

    // Multi-select: any chosen value within a filter (OR), all filters (AND).
    const filterDefs = useMemo(() => {

        const defs = [];

        if (employees.length > 0) {
            defs.push({
                key: "assignedEmployeeId", label: "Assigned Employee", type: "multiselect",
                options: employees.map((e) => ({ value: e.id, label: e.name }))
            });
        }

        defs.push(
            {
                key: "industryId", label: "Industry", type: "multiselect",
                options: industries.map((i) => ({ value: i.id, label: i.name }))
            },
            {
                key: "productId", label: "Product", type: "multiselect",
                options: products.map((p) => ({ value: p.id, label: p.name }))
            },
            {
                key: "batteryId", label: "Battery", type: "multiselect",
                options: batteries.map((b) => ({ value: b.id, label: b.name }))
            },
            { key: "city", label: "City", type: "text" },
            { key: "state", label: "State", type: "text" },
            { key: "created", label: "Created Date", type: "daterange", fromKey: "createdFrom", toKey: "createdTo" }
        );

        return defs;

    }, [industries, employees, products, batteries]);

    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [exporting, setExporting] = useState(false);

    async function handleBulkDelete() {

        if (!window.confirm(`Delete ${list.selectedIds.length} selected customer(s)?`)) {
            return;
        }

        setBulkDeleting(true);

        try {

            const result = await bulkDeleteCustomers(list.selectedIds);

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
            alert("Unable to delete the selected customers.");

        } finally {

            setBulkDeleting(false);

        }

    }

    async function handleExport(selectedOnly) {

        setExporting(true);

        try {

            const blob = await exportCustomers({
                sort: list.sort,
                filters: { search: list.search || undefined, ...list.filters },
                selection: selectedOnly ? list.selection : null,
                columns: columns.visibleColumns.map((c) => c.key),
            });

            downloadBlob(blob, "customers.xlsx");

            const notice = exportCountNotice(
                blob, selectedOnly ? list.selectedCount : list.totalElements, "customers");

            if (notice) {
                alert(notice);
            }

        } catch (error) {

            console.error(error);
            alert(await exportErrorMessage(error, "customers"));

        } finally {

            setExporting(false);

        }

    }

    const uniqueCities = new Set(list.data.map((c) => c.city)).size;
    const uniqueEmployees = new Set(list.data.map((c) => c.assignedEmployee?.id)).size;

    return (

        <>

            <PageHeader
                title="Won"
                subtitle={`${list.totalElements} Won Customer(s) Found`}
            />

            <div className="row mb-4">

                <div className="col-md-3">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <small className="text-muted">Total Customers</small>
                            <h3>{list.totalElements}</h3>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <small className="text-muted">Cities (this page)</small>
                            <h3>{uniqueCities}</h3>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <small className="text-muted">Employees (this page)</small>
                            <h3>{uniqueEmployees}</h3>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card shadow-sm border-0">
                        <div className="card-body">
                            <small className="text-muted">GST Registered (this page)</small>
                            <h3>{list.data.filter((c) => c.gstNumber).length}</h3>
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
                                    placeholder="Search by company, contact, phone, email or GST..."
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

            {isAdmin && (
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
                            key: "export", label: "Export Selected", icon: "bi-download",
                            variant: "btn-outline-secondary", onClick: () => handleExport(true), disabled: exporting
                        },
                        {
                            key: "delete", label: "Delete", icon: "bi-trash",
                            variant: "btn-outline-danger", onClick: handleBulkDelete, disabled: bulkDeleting,
                            unavailableForAllMatching:
                                "Delete only works on records you tick individually, so nothing is deleted by accident."
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
                isRowSelected={list.isSelected}
                onToggleSelect={list.toggleSelect}
                onToggleSelectAll={list.toggleSelectAll}
                sort={list.sort}
                onSortChange={list.toggleSort}
                onRowClick={(row) => navigate(`/customers/${row.id}`, { state: { from: location.pathname + location.search } })}
            />

            {!list.loading && list.data.length === 0 && (
                <div className="alert alert-light border text-center mt-3">
                    <i className="bi bi-search me-2"></i>
                    No matching customers found.
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
