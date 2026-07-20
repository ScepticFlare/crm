export default function DataTable({
    columns,
    data,
    loading,
    renderActions,
}) {

    if (loading) {
        return (
            <div className="text-center py-5">
                <div
                    className="spinner-border text-primary"
                    role="status"
                >
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="card shadow-sm border-0">

                <div className="card-body text-center py-5">

                    <i
                        className="bi bi-folder2-open display-3 text-secondary"
                    ></i>

                    <h4 className="mt-3">
                        No Records Found
                    </h4>

                    <p className="text-muted mb-0">
                        There is nothing to display.
                    </p>

                </div>

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
                                            : row[column.key] ?? "-"}

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