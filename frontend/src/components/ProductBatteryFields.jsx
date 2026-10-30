import { useEffect, useState } from "react";

import MultiItemQuantitySelector from "./MultiItemQuantitySelector";
import {
    getAllProducts,
    getAllProductsAdmin,
    createProduct,
    deleteProduct,
    activateProduct
} from "../services/productService";
import {
    getAllBatteries,
    getAllBatteriesAdmin,
    createBattery,
    deleteBattery,
    activateBattery
} from "../services/batteryService";

// The Product and Battery line-item pickers shared by the Lead and
// Opportunity forms. `products` / `batteries` are selector rows
// ({ itemId, itemName, quantity }); changes are reported through
// handleChange({ target: { name: "products" | "batteries", value } }), the
// same way every other form field is.
//
// productRequired / batteryRequired add the * marker; `errors` carries the
// messages to show under each picker ({ products, batteries }).
export default function ProductBatteryFields({
    products,
    batteries,
    handleChange,
    productRequired = false,
    batteryRequired = false,
    errors = {},
}) {

    const role = localStorage.getItem("role");

    const [productOptions, setProductOptions] = useState([]);
    const [batteryOptions, setBatteryOptions] = useState([]);

    async function loadProducts() {
        try {
            setProductOptions(await getAllProducts());
        } catch (err) {
            console.error(err);
        }
    }

    async function loadBatteries() {
        try {
            setBatteryOptions(await getAllBatteries());
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        getAllProducts().then(setProductOptions).catch((err) => console.error(err));
        getAllBatteries().then(setBatteryOptions).catch((err) => console.error(err));
    }, []);

    return (

        <>

            <div className="mb-3">

                <label className="form-label">
                    Products{productRequired ? " *" : ""}
                </label>

                <MultiItemQuantitySelector
                    label="Product"
                    items={products || []}
                    onItemsChange={(items) =>
                        handleChange({ target: { name: "products", value: items } })
                    }
                    options={productOptions}
                    isAdmin={role === "ADMIN"}
                    create={createProduct}
                    getAllIncludingInactive={getAllProductsAdmin}
                    deactivate={deleteProduct}
                    activate={activateProduct}
                    onRefresh={loadProducts}
                    placeholder="Select Product"
                />

                {errors.products && (
                    <div className="invalid-feedback d-block" role="alert">{errors.products}</div>
                )}

            </div>

            <div className="mb-3">

                <label className="form-label">
                    Battery{batteryRequired ? " *" : ""}
                </label>

                <MultiItemQuantitySelector
                    label="Battery"
                    items={batteries || []}
                    onItemsChange={(items) =>
                        handleChange({ target: { name: "batteries", value: items } })
                    }
                    options={batteryOptions}
                    isAdmin={role === "ADMIN"}
                    create={createBattery}
                    getAllIncludingInactive={getAllBatteriesAdmin}
                    deactivate={deleteBattery}
                    activate={activateBattery}
                    onRefresh={loadBatteries}
                    placeholder="Select Battery"
                />

                {errors.batteries && (
                    <div className="invalid-feedback d-block" role="alert">{errors.batteries}</div>
                )}

            </div>

        </>

    );

}
