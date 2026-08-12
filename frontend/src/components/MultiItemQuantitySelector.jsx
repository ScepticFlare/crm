import DropdownAddManage from "./DropdownAddManage";

export default function MultiItemQuantitySelector({
    label,
    items,
    onItemsChange,
    options,
    isAdmin,
    create,
    getAllIncludingInactive,
    deactivate,
    activate,
    onRefresh,
    placeholder
}) {

    function updateRow(index, field, value) {

        const updated = items.map((row, i) =>
            i === index ? { ...row, [field]: value } : row
        );

        onItemsChange(updated);

    }

    function addRow() {
        onItemsChange([
            ...items,
            { itemId: "", itemName: "", quantity: 1 }
        ]);
    }

    function removeRow(index) {
        onItemsChange(items.filter((_, i) => i !== index));
    }

    return (

        <div>

            {items.map((row, index) => (

                <div className="d-flex gap-2 mb-2" key={index}>

                    <div className="flex-grow-1">

                        <DropdownAddManage
                            title={label}
                            name="itemId"
                            value={row.itemId}
                            onChange={(e) => updateRow(index, "itemId", e.target.value)}
                            options={options}
                            isAdmin={isAdmin}
                            create={create}
                            getAllIncludingInactive={getAllIncludingInactive}
                            deactivate={deactivate}
                            activate={activate}
                            onRefresh={onRefresh}
                            currentLabel={row.itemName}
                            placeholder={placeholder || `Select ${label}`}
                        />

                    </div>

                    <input
                        type="number"
                        className="form-control"
                        style={{ maxWidth: "110px" }}
                        min="1"
                        value={row.quantity}
                        onChange={(e) => updateRow(index, "quantity", e.target.value)}
                        placeholder="Qty"
                    />

                    <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={() => removeRow(index)}
                    >
                        <i className="bi bi-trash"></i>
                    </button>

                </div>

            ))}

            <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={addRow}
            >
                + Add {label}
            </button>

        </div>

    );

}
