import { useEffect, useState } from "react";

import { getDocuments } from "../../services/documentService";

// Checkbox list of active documents, filtered client-side by mode -
// "brochure" shows only PRODUCT_BROCHURE documents, "general" shows
// everything else (COMPANY_PROFILE + GENERAL) so a Keep in Touch email can
// never end up with a product brochure attached. Fetches the full active
// list once per mount rather than one request per product, since the
// backend's suggestedDocumentIds (see EmailComposerModal) already does the
// per-product relevance work.
export default function DocumentPicker({ mode, selectedIds, onChange }) {

    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        let cancelled = false;

        setLoading(true);

        getDocuments()
            .then((data) => {
                if (!cancelled) {
                    setDocuments(data);
                }
            })
            .catch((err) => {
                console.error(err);
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };

    }, []);

    const filtered = documents.filter((doc) =>
        mode === "brochure"
            ? doc.category === "PRODUCT_BROCHURE"
            : doc.category !== "PRODUCT_BROCHURE"
    );

    function toggle(id) {

        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter((existingId) => existingId !== id));
        } else {
            onChange([...selectedIds, id]);
        }

    }

    if (loading) {
        return <div className="text-muted small">Loading documents...</div>;
    }

    if (filtered.length === 0) {
        return <div className="text-muted small">No documents available.</div>;
    }

    return (

        <div className="border rounded p-2" style={{ maxHeight: "160px", overflowY: "auto" }}>

            {filtered.map((doc) => (

                <div className="form-check" key={doc.id}>

                    <input
                        type="checkbox"
                        className="form-check-input"
                        id={`document-${doc.id}`}
                        checked={selectedIds.includes(doc.id)}
                        onChange={() => toggle(doc.id)}
                    />

                    <label className="form-check-label" htmlFor={`document-${doc.id}`}>
                        {doc.fileName}
                        {doc.product?.name && (
                            <span className="text-muted"> — {doc.product.name}</span>
                        )}
                    </label>

                </div>

            ))}

        </div>

    );

}
