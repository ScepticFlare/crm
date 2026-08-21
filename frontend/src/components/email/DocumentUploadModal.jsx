import { useEffect, useState } from "react";

import { getAllProducts } from "../../services/productService";

const CATEGORY_OPTIONS = [
    { value: "PRODUCT_BROCHURE", label: "Product Brochure" },
    { value: "COMPANY_PROFILE", label: "Company Profile" },
    { value: "GENERAL", label: "General" },
];

// Upload form for pages/Documents.jsx (ADMIN only).
export default function DocumentUploadModal({ show, saving, onSave, onClose }) {

    const [file, setFile] = useState(null);
    const [category, setCategory] = useState("GENERAL");
    const [productId, setProductId] = useState("");
    const [products, setProducts] = useState([]);

    useEffect(() => {

        if (show) {
            setFile(null);
            setCategory("GENERAL");
            setProductId("");
            getAllProducts().then(setProducts).catch(() => {});
        }

    }, [show]);

    if (!show) {
        return null;
    }

    function handleSubmit() {

        if (!file) {
            alert("Please choose a file to upload.");
            return;
        }

        if (category === "PRODUCT_BROCHURE" && !productId) {
            alert("Please select the product this brochure is for.");
            return;
        }

        onSave({
            file,
            category,
            productId: category === "PRODUCT_BROCHURE" ? productId : null,
        });

    }

    return (

        <>

            <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">

                <div className="modal-dialog">

                    <div className="modal-content">

                        <div className="modal-header">
                            <h5 className="modal-title">Upload Document</h5>
                            <button className="btn-close" onClick={onClose}></button>
                        </div>

                        <div className="modal-body">

                            <div className="mb-3">

                                <label className="form-label">File</label>

                                <input
                                    type="file"
                                    className="form-control"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />

                            </div>

                            <div className="mb-3">

                                <label className="form-label">Category</label>

                                <select
                                    className="form-select"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    {CATEGORY_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>

                            </div>

                            {category === "PRODUCT_BROCHURE" && (

                                <div className="mb-3">

                                    <label className="form-label">Product</label>

                                    <select
                                        className="form-select"
                                        value={productId}
                                        onChange={(e) => setProductId(e.target.value)}
                                    >
                                        <option value="">Select Product</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>

                                </div>

                            )}

                        </div>

                        <div className="modal-footer">

                            <button className="btn btn-secondary" onClick={onClose}>
                                Cancel
                            </button>

                            <button className="btn btn-primary" disabled={saving} onClick={handleSubmit}>
                                {saving ? "Uploading..." : "Upload"}
                            </button>

                        </div>

                    </div>

                </div>

            </div>

            <div className="modal-backdrop fade show"></div>

        </>

    );

}
