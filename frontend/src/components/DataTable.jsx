import LoadingState from "./ui/LoadingState";
import EmptyState from "./ui/EmptyState";

export default function DataTable({
    columns,
    data,
    loading,
    renderActions,
}) {

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

    return (

        <div className="card shadow-sm border-0">

            <div className="table-responsive">

                <table className="table table-hover align-middle mb-0">

                    <thead className="table-light">

                        <tr>

                            {columns.map((column) => (

                                <th
                                    key={column.key}
                                    className="fw-semibold"
                                >
                                    {column.label}
                                </th>

                            ))}

                            <th
                                className="text-center"
                                style={{ width: "170px" }}
                            >
                                Actions
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {data.map((row) => (

                            <tr key={row.id}>

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

                                <td className="text-center">

                                    {renderActions(row)}

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>

    );

}