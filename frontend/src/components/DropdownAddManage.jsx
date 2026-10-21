import { useState } from "react";
import { Modal, Button, Form, Badge } from "react-bootstrap";

export default function DropdownAddManage({
    title,
    name,
    value,
    onChange,
    options,
    required = false,
    isAdmin = false,
    // Whether this user may open the "+ Add" / manage dialog at all.
    // Defaults to true so every existing dropdown behaves exactly as
    // before; Sales Stage passes false for non-Admins (the backend also
    // rejects non-Admin stage changes).
    canAdd = true,
    create,
    getAllIncludingInactive,
    deactivate,
    activate,
    // Optional: (id, { name }) => Promise. When given, an Admin can rename
    // existing items from the manage dialog (used for Sales Stage only).
    rename,
    onRefresh,
    valueKey = "id",
    currentLabel,
    placeholder
}) {

    const [show, setShow] = useState(false);
    const [newName, setNewName] = useState("");
    const [saving, setSaving] = useState(false);
    const [allItems, setAllItems] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");

    async function handleRename(item) {

        const name = editName.trim();

        if (!name) {
            alert(`${title} name is required.`);
            return;
        }

        if (name === item.name) {
            setEditingId(null);
            return;
        }

        try {

            await rename(item.id, { name });

            setEditingId(null);

            await onRefresh();
            await loadAllItems();

        } catch (err) {

            console.error(err);

            alert(err.response?.data?.message || `Unable to rename ${title}.`);

        }

    }

    function openModal() {
        setShow(true);
        setNewName("");

        if (isAdmin) {
            loadAllItems();
        }
    }

    async function loadAllItems() {

        try {

            setLoadingList(true);

            const data = await getAllIncludingInactive();

            setAllItems(data);

        } catch (err) {

            console.error(err);

        } finally {

            setLoadingList(false);

        }

    }

    async function handleCreate() {

        if (!newName.trim()) {
            alert(`${title} name is required.`);
            return;
        }

        try {

            setSaving(true);

            const created = await create({ name: newName.trim() });

            setNewName("");

            await onRefresh();

            if (isAdmin) {
                await loadAllItems();
            }

            onChange({
                target: {
                    name,
                    value: created[valueKey]
                }
            });

        } catch (err) {

            console.error(err);

            alert(
                err.response?.data?.message ||
                `Unable to create ${title}.`
            );

        } finally {

            setSaving(false);

        }

    }

    async function handleToggle(item) {

        try {

            if (item.isActive) {
                await deactivate(item.id);
            } else {
                await activate(item.id);
            }

            await onRefresh();
            await loadAllItems();

        } catch (err) {

            console.error(err);

            alert(
                err.response?.data?.message ||
                "Unable to update status."
            );

        }

    }

    const activeValues = options.map(opt => opt[valueKey]);
    const fallbackLabel = currentLabel || (valueKey === "name" ? value : null);
    const showFallbackOption =
        value && !activeValues.includes(value) && fallbackLabel;

    return (

        <>

            <div className="d-flex gap-2">

                <select
                    className="form-select"
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                >

                    <option value="">
                        {placeholder || `Select ${title}`}
                    </option>

                    {showFallbackOption && (
                        <option value={value}>
                            {fallbackLabel} (Inactive)
                        </option>
                    )}

                    {options.map(opt => (

                        <option
                            key={opt.id}
                            value={opt[valueKey]}
                        >
                            {opt.name}
                        </option>

                    ))}

                </select>

                {canAdd && (
                    <button
                        type="button"
                        className="btn btn-outline-primary text-nowrap"
                        onClick={openModal}
                    >
                        + Add
                    </button>
                )}

            </div>

            <Modal show={show} onHide={() => setShow(false)} centered>

                <Modal.Header closeButton>
                    <Modal.Title>Manage {title}</Modal.Title>
                </Modal.Header>

                <Modal.Body>

                    <Form.Group className="mb-3">

                        <Form.Label>
                            Add New {title}
                        </Form.Label>

                        <div className="d-flex gap-2">

                            <Form.Control
                                autoFocus
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder={`Enter ${title} name`}
                            />

                            <Button
                                variant="primary"
                                disabled={saving}
                                onClick={handleCreate}
                                className="text-nowrap"
                            >
                                {saving ? "Saving..." : "Add"}
                            </Button>

                        </div>

                    </Form.Group>

                    {isAdmin && (

                        <>

                            <hr />

                            <Form.Label>
                                Existing {title}s
                            </Form.Label>

                            {loadingList ? (

                                <div className="text-muted small">
                                    Loading...
                                </div>

                            ) : (

                                <div
                                    className="list-group"
                                    style={{ maxHeight: "220px", overflowY: "auto" }}
                                >

                                    {allItems.map(item => (

                                        <div
                                            key={item.id}
                                            className="list-group-item d-flex justify-content-between align-items-center py-2"
                                        >

                                            {editingId === item.id ? (

                                                <div className="d-flex gap-2 flex-grow-1 me-2">
                                                    <Form.Control
                                                        size="sm"
                                                        autoFocus
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") handleRename(item);
                                                            if (e.key === "Escape") setEditingId(null);
                                                        }}
                                                    />
                                                    <Button size="sm" variant="primary" onClick={() => handleRename(item)}>
                                                        Save
                                                    </Button>
                                                    <Button size="sm" variant="outline-secondary" onClick={() => setEditingId(null)}>
                                                        Cancel
                                                    </Button>
                                                </div>

                                            ) : (

                                                <span>
                                                    {item.name}{" "}
                                                    <Badge
                                                        bg={item.isActive ? "success" : "secondary"}
                                                        className="ms-2"
                                                    >
                                                        {item.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                </span>

                                            )}

                                            {editingId !== item.id && (

                                                <div className="d-flex gap-2">

                                                    {rename && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline-primary"
                                                            onClick={() => {
                                                                setEditingId(item.id);
                                                                setEditName(item.name);
                                                            }}
                                                        >
                                                            Rename
                                                        </Button>
                                                    )}

                                                    <Button
                                                        size="sm"
                                                        variant={item.isActive ? "outline-danger" : "outline-success"}
                                                        onClick={() => handleToggle(item)}
                                                    >
                                                        {item.isActive ? "Deactivate" : "Activate"}
                                                    </Button>

                                                </div>

                                            )}

                                        </div>

                                    ))}

                                </div>

                            )}

                        </>

                    )}

                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShow(false)}>
                        Close
                    </Button>
                </Modal.Footer>

            </Modal>

        </>

    );

}
