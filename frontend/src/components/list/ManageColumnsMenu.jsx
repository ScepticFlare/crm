import { useEffect, useRef, useState } from "react";

export default function ManageColumnsMenu({ allColumns, visibleKeys, onToggle, onReset }) {

    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {

        function handleClickOutside(e) {

            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }

        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => document.removeEventListener("mousedown", handleClickOutside);

    }, []);

    return (

        <div className="dropdown" ref={ref}>

            <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setOpen((v) => !v)}
            >
                <i className="bi bi-layout-three-columns me-2"></i>
                Columns
            </button>

            {open && (

                <div
                    className="dropdown-menu p-3 show"
                    style={{ minWidth: "220px", right: 0, left: "auto", maxHeight: "320px", overflowY: "auto" }}
                >

                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong className="small">Manage Columns</strong>
                        <button type="button" className="btn btn-sm btn-link p-0" onClick={onReset}>
                            Reset
                        </button>
                    </div>

                    {allColumns.map((col) => (

                        <div className="form-check" key={col.key}>
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id={`col-${col.key}`}
                                checked={visibleKeys.includes(col.key)}
                                onChange={() => onToggle(col.key)}
                            />
                            <label className="form-check-label small" htmlFor={`col-${col.key}`}>
                                {col.label}
                            </label>
                        </div>

                    ))}

                </div>

            )}

        </div>

    );

}
