import { Dropdown } from "react-bootstrap";

// Reusable "..." per-row action menu for DataTable's renderActions column -
// same visual language as components/detail/DetailHeader.jsx's menu, but
// built on react-bootstrap's Dropdown (already a dependency, see
// DropdownAddManage.jsx) rather than the raw modal-style markup, since its
// Popper-based positioning avoids getting clipped by the list table's
// .table-responsive horizontal-scroll wrapper.
// items: [{ label, icon, danger, onClick, disabled }]
export default function RowActionsMenu({ items }) {

    if (!items || items.length === 0) {
        return null;
    }

    return (

        <Dropdown>

            <Dropdown.Toggle
                as="button"
                type="button"
                className="btn btn-sm btn-outline-secondary"
                aria-label="More actions"
            >
                <i className="bi bi-three-dots"></i>
            </Dropdown.Toggle>

            <Dropdown.Menu align="end">

                {items.map((item) => (

                    <Dropdown.Item
                        key={item.label}
                        className={item.danger ? "text-danger" : ""}
                        disabled={item.disabled}
                        onClick={item.onClick}
                    >
                        {item.icon && <i className={`bi ${item.icon} me-2`}></i>}
                        {item.label}
                    </Dropdown.Item>

                ))}

            </Dropdown.Menu>

        </Dropdown>

    );

}
