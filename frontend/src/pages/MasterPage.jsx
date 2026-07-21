import { useEffect, useMemo, useState } from "react";
import MasterModal from "../components/MasterModal";

export default function MasterPage({
    title,
    getAll,
    create,
    update,
    remove,
}) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);

    const [search, setSearch] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);

            const data = await getAll();

            setItems(data);
        } catch (err) {
            console.error(err);
            alert("Unable to load data.");
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(name) {
        if (!name.trim()) {
            alert("Please enter a name.");
            return;
        }

        try {
            setSaving(true);

            if (editing) {
                await update(editing.id, {
                    name: name.trim(),
                });
            } else {
                await create({
                    name: name.trim(),
                });
            }

            setShowModal(false);
            setEditing(null);

            await loadData();
        } catch (err) {
            console.error(err);

            alert(
                err?.response?.data?.message ||
                    "Unable to save."
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm("Delete this record?"))
            return;

        try {
            await remove(id);

            await loadData();
        } catch (err) {
            console.error(err);

            alert("Unable to delete.");
        }
    }

    const filteredItems = useMemo(() => {
        return items.filter((item) =>
            item.name
                ?.toLowerCase()
                .includes(search.toLowerCase())
        );
    }, [items, search]);

    return (
        <div className="container-fluid">

            {/* Header */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>

                    <h2 className="fw-bold mb-1">
                        {title}
                    </h2>

                    <p className="text-muted mb-0">
                        Manage all {title.toLowerCase()} used
                        throughout the CRM.
                    </p>

                </div>

                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setEditing(null);
                        setShowModal(true);
                    }}
                >
                    <i className="bi bi-plus-lg me-2"></i>

                    Add {title}
                </button>

            </div>

            {/* Search */}

            <div className="card shadow-sm mb-3">

                <div className="card-body d-flex justify-content-between align-items-center">

                    <input
                        type="text"
                        className="form-control"
                        style={{ maxWidth: "350px" }}
                        placeholder={`Search ${title}...`}
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                    />

                    <span className="badge bg-primary fs-6">

                        {filteredItems.length} Records

                    </span>

                </div>

            </div>

            {/* Table */}

            <div className="card shadow-sm">

                <div className="table-responsive">

                    <table className="table table-hover align-middle mb-0">

                        <thead className="table-light">

                        <tr>

                            <th>ID</th>

                            <th>Name</th>

                            <th>Status</th>

                            <th>Created</th>

                            <th>Updated</th>

                            <th width="220">
                                Actions
                            </th>

                        </tr>

                        </thead>

                        <tbody>

                        {loading ? (

                            <tr>

                                <td
                                    colSpan="6"
                                    className="text-center py-5"
                                >

                                    Loading...

                                </td>

                            </tr>

                        ) : filteredItems.length === 0 ? (

                            <tr>

                                <td
                                    colSpan="6"
                                    className="text-center py-5"
                                >

                                    <i className="bi bi-inbox display-4 text-muted"></i>

                                    <h5 className="mt-3">

                                        No {title} Found

                                    </h5>

                                    <p className="text-muted">

                                        Click "Add {title}" to
                                        create your first record.

                                    </p>

                                </td>

                            </tr>

                        ) : (

                            filteredItems.map((item) => (

                                <tr key={item.id}>

                                    <td>

                                        {item.id}

                                    </td>

                                    <td>

                                        {item.name}

                                    </td>

                                    <td>

                                        {item.isActive ? (

                                            <span className="badge bg-success">

                                                Active

                                            </span>

                                        ) : (

                                            <span className="badge bg-secondary">

                                                Inactive

                                            </span>

                                        )}

                                    </td>

                                    <td>

                                        {item.createdAt
                                            ? new Date(
                                                  item.createdAt
                                              ).toLocaleDateString()
                                            : "-"}

                                    </td>

                                    <td>

                                        {item.updatedAt
                                            ? new Date(
                                                  item.updatedAt
                                              ).toLocaleDateString()
                                            : "-"}

                                    </td>

                                    <td>

                                        <button
                                            className="btn btn-warning btn-sm me-2"
                                            onClick={() => {
                                                setEditing(
                                                    item
                                                );
                                                setShowModal(
                                                    true
                                                );
                                            }}
                                        >
                                            <i className="bi bi-pencil me-1"></i>

                                            Edit

                                        </button>

                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() =>
                                                handleDelete(
                                                    item.id
                                                )
                                            }
                                        >
                                            <i className="bi bi-trash me-1"></i>

                                            Delete

                                        </button>

                                    </td>

                                </tr>

                            ))

                        )}

                        </tbody>

                    </table>

                </div>

            </div>

            <MasterModal
                show={showModal}
                title={title}
                initialValue={editing?.name || ""}
                saving={saving}
                onSave={handleSave}
                onClose={() => {
                    setEditing(null);
                    setShowModal(false);
                }}
            />

        </div>
    );
}