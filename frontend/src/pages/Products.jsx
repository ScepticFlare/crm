import MasterPage from "./MasterPage";

import {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct
} from "../services/productService";

export default function Products() {

    return (
        <MasterPage
            title="Products"
            getAll={getAllProducts}
            create={createProduct}
            update={updateProduct}
            remove={deleteProduct}
        />
    );

}