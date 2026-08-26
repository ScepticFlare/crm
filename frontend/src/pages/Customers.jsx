import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import FilterPanel from "../components/list/FilterPanel";
import ManageColumnsMenu from "../components/list/ManageColumnsMenu";
import BulkActionBar from "../components/list/BulkActionBar";
import ListPagination from "../components/list/ListPagination";

import useServerList from "../hooks/useServerList";
import usePersistedColumns from "../hooks/usePersistedColumns";
import { formatDate } from "../utils/formatDate";
import { downloadBlob } from "../utils/downloadFile";

import {
    getAllCustomers,
    bulkDeleteCustomers,
    exportCustomers
} from "../services/customerService";
import { getAllIndustries } from "../services/industryService";
import { getAllEmployees } from "../services/employeeService";

const ALL_CUSTOMER_COLUMNS = [
    { key: "customerCode", label: "Customer Code", sortable: false },
    {
        key: "companyName", label: "Company", sortable: true, sortKey: "company",
        render: (row) => (
            <Link to={`/customers/${row.id}`} className="record-link">
                {row.companyName}
            </Link>
        )
    },
    { key: "contactPerson", label: "Contact", sortable: true, sortKey: "contactPerson", render: (row) => row.contactPerson },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    {
        key: "assignedEmployee", label: "Assigned Employee", sortable: true,
        render: (row) => row.assignedEmployee?.name || "-"
    },
    {
        key: "createdAt", label: "Created Date", sortable: true, sortKey: "createdDate",
        render: (row) => formatDate(row.createdAt)
    },
];

// Compact default: email, city, state stay available via Manage Columns.
const DEFAULT_VISIBLE_CUSTOMER_COLUMNS = [
    "customerCode", "companyName", "contactPerson", "phone", "assignedEmployee", "createdAt"
];

export default function Customers() {

    const navigate = useNavigate();

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

    useEffect(() => {

        getAllIndustries().then(setIndustries).catch(() => {});
        getAllEmployees().then(setEmployees).catch(() => {});

    }, []);

    const filterDefs = useMemo(() => {

        const defs = [];

        if (employees.length > 0) {
            defs.push({
                key: "assignedEmployeeId", label: "Assigned Employee", type: "select",
                options: employees.map((e) => ({ value: e.id, label: e.name }))
            });
        }

        defs.push(
            {
                key: "industryId", label: "Industry", type: "select",
                options: industries.map((i) => ({ value: i.id, label: i.name }))
            },
            { key: "city", label: "City", type: "text" },
            { key: "state", label: "State", type: "text" },
            { key: "created", label: "Created Date", type: "daterange", fromKey: "createdFrom", toKey: "createdTo" }
        );

        return defs;

    }, [industries, employees]);

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
                selection: selectedOnly ? list.selectedIds : null,
            });

            downloadBlob(blob, "customers.csv");

        } catch (error) {

            console.error(error);
            alert("Unable to export customers.");

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
                onRowClick={(row) => navigate(`/customers/${row.id}`)}
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
