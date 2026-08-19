export default function ListPagination({
    page,
    pageSize,
    totalPages,
    totalElements,
    onPageChange,
    onPageSizeChange,
}) {

    return (

        <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">

            <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">Show</span>
                <select
                    className="form-select form-select-sm"
                    style={{ width: "80px" }}
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
                <span className="text-muted small">of {totalElements} entries</span>
            </div>

            <div className="d-flex align-items-center gap-2">
                <button
                    className="btn btn-outline-secondary btn-sm"
                    disabled={page === 0}
                    onClick={() => onPageChange(page - 1)}
                >
                    Previous
                </button>
                <span className="small">
                    Page {page + 1} of {Math.max(totalPages, 1)}
                </span>
                <button
                    className="btn btn-outline-secondary btn-sm"
                    disabled={page + 1 >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    Next
                </button>
            </div>

        </div>

    );

}
