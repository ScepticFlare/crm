import api from "./api";

// category/productId are both optional filters - see
// components/email/DocumentPicker.jsx (the composer's attachment picker,
// which fetches everything once and filters client-side) and
// pages/Documents.jsx (the admin management list, which fetches everything
// unfiltered).
export const getDocuments = async ({ category, productId } = {}) => {
    const response = await api.get("/documents", {
        params: {
            category: category || undefined,
            productId: productId || undefined,
        },
    });
    return response.data;
};

export const getDocumentById = async (id) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
};

// ADMIN only - backend enforces DOCUMENT_MANAGE. multipart/form-data,
// mirroring services/leadService.js's importLeads.
export const uploadDocument = async ({ file, category, productId }) => {

    const formData = new FormData();

    formData.append("file", file);
    formData.append("category", category);

    if (productId) {
        formData.append("productId", productId);
    }

    const response = await api.post("/documents", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return response.data;

};

// Soft delete - no reactivate endpoint exists for documents (unlike email
// templates), so this is permanent as far as the UI is concerned.
export const deactivateDocument = async (id) => {
    await api.delete(`/documents/${id}`);
};

// Blob response - the endpoint requires the JWT auth header (via the api.js
// interceptor), so a plain <a href> download link won't work; callers pass
// this blob to utils/downloadFile.js's downloadBlob, same pattern the CSV
// exports already use.
export const downloadDocument = async (id) => {
    const response = await api.get(`/documents/${id}/download`, {
        responseType: "blob",
    });
    return response.data;
};
