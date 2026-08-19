import LoadingState from "./ui/LoadingState";
import EmptyState from "./ui/EmptyState";

// selectable/sort/onRowClick props are optional and default to today's
// plain-table behavior, so existing callers (Employees, MasterPage, etc.)
// are unaffected - only list pages that opt in pass them.
export default function DataTable({
    columns,
    data,
    loading,
    renderActions,
    selectable = false,
    selectedIds = [],
    onToggleSelect,
    onToggleSelectAll,
    sort = null,
    onSortChange,
    onRowClick,
}) {

    // Lets the whole row open a record's details (per-page callers pass
    // onRowClick) without hunting for one specific clickable column, while
    // never hijacking a click that was actually meant for something
    // interactive inside the row - a checkbox, an action button/icon, a
    // dropdown, or a column that renders its own <a> (e.g. the company-name
    // link some list pages still render). Checking event.target.closest
    // here means individual pages don't need to remember to stopPropagation
    // on every such element themselves.
    function handleRowClick(event, row) {

        if (!onRowClick) {
            return;
        }

        if (event.target.closest("a, button, input, select, .dropdown-menu")) {
            return;
        }

        onRowClick(row);
    }

    if (loading) {
        return <LoadingState />;
    }

    if (!data || data.length === 0) {
        return (
            <div className="card shadow-sm border-0">
                <EmptyState icon="bi-folder2-open" title="No Records Found" />
            </div>
        );
    }

    const pageIds = data.map((row) => row.id);
    const allSelected = selectable && pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    const someSelected = selectable && !allSelected && pageIds.some((id) => selectedIds.includes(id));

    return (

        <div className="card shadow-sm border-0">

            <div className="table-responsive">

                <table className="table table-hover align-middle mb-0">

                    <thead className="table-light">

                        <tr>

                            {selectable && (
                                <th style={{ width: "40px" }}>
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={allSelected}
                                        ref={(el) => {
                                            if (el) el.indeterminate = someSelected;
                                        }}
                                        onChange={onToggleSelectAll}
                                    />
                                </th>
                            )}

                            {columns.map((column) => {

                                const sortKey = column.sortKey || column.key;
                                const isSorted = column.sortable && sort?.field === sortKey;

                                return (

                                    <th
                                        key={column.key}
                                        className="fw-semibold"
                                        style={column.sortable ? { cursor: "pointer", userSelect: "none" } : undefined}
                                        onClick={
                                            column.sortable && onSortChange
                                                ? () => onSortChange(sortKey)
                                                : undefined
                                        }
                                    >
                                        {column.label}
                                        {isSorted && (
                                            <i
                                                className={`bi ms-1 ${sort.dir === "asc" ? "bi-caret-up-fill" : "bi-caret-down-fill"}`}
                                            ></i>
                                        )}
                                    </th>

                                );

                            })}

                            {renderActions && (
                                <th
                                    className="text-center"
                                    style={{ width: "170px" }}
                                >
                                    Actions
                                </th>
                            )}

                        </tr>

                    </thead>

                    <tbody>

                        {data.map((row) => (

                            <tr
                                key={row.id}
                                onClick={onRowClick ? (event) => handleRowClick(event, row) : undefined}
                                style={onRowClick ? { cursor: "pointer" } : undefined}
                            >

                                {selectable && (
                                    <td>
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={selectedIds.includes(row.id)}
                                            onChange={() => onToggleSelect(row.id)}
                                        />
                                    </td>
                                )}

                                {columns.map((column) => (

                                    <td key={column.key}>

                                        {column.render
    ? column.render(row)
    : (() => {

        const value = row[column.key];

        if (value == null) return "-";

        if (typeof value === "object") {

            if ("name" in value) return value.name;

            if ("companyName" in value) return value.companyName;

            if ("contactPerson" in value) return value.contactPerson;

            return "-";

        }

        return value;

    })()}

                                    </td>

                                ))}

                                {renderActions && (
                                    <td className="text-center">

                                        {renderActions(row)}

                                    </td>
                                )}

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>

    );

}
