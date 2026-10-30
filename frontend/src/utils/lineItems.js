// "Online UPS (2), Inverter (1)" for a list of product / battery line items
// as the API returns them ({ product|battery: { name }, quantity }). `field`
// is "product" or "battery". Returns "-" when there are none - nothing is
// filled in for a record that has no value.
export function describeLineItems(items, field) {

    const text = (items || [])
        .filter((item) => item?.[field]?.name)
        .map((item) => `${item[field].name} (${item.quantity})`)
        .join(", ");

    return text || "-";

}

// Line items in the shape the form's MultiItemQuantitySelector edits.
export function toSelectorRows(items, field) {

    return (items || [])
        .filter((item) => item?.[field])
        .map((item) => ({
            itemId: item[field].id,
            itemName: item[field].name,
            quantity: item.quantity,
        }));

}

// Selector rows back to the request shape ({ productId|batteryId, quantity }),
// dropping rows where nothing was picked.
export function toRequestItems(rows, idKey) {

    return (rows || [])
        .filter((row) => row.itemId)
        .map((row) => ({
            [idKey]: Number(row.itemId),
            quantity: Number(row.quantity) || 1,
        }));

}

// True when at least one row has an item picked.
export function hasPickedItem(rows) {
    return (rows || []).some((row) => row.itemId);
}

// Same wording as the backend (LeadService), so the message reads the same
// whether the form or the server catches it.
export const PRODUCT_REQUIRED_MESSAGE = "Please select at least one Product.";
export const BATTERY_REQUIRED_MESSAGE = "Please select at least one Battery.";

// Messages for missing required line items ({} when everything is fine).
export function lineItemErrors({ products, batteries }, { productRequired = false, batteryRequired = false } = {}) {

    const errors = {};

    if (productRequired && !hasPickedItem(products)) {
        errors.products = PRODUCT_REQUIRED_MESSAGE;
    }

    if (batteryRequired && !hasPickedItem(batteries)) {
        errors.batteries = BATTERY_REQUIRED_MESSAGE;
    }

    return errors;

}
