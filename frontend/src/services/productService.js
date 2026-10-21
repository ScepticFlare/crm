import api from "./api";
import { cachedFetch, invalidateCache } from "../utils/apiCache";

// Cached: this rarely-changing list is fetched independently by several
// pages (Leads, AddLead, EditLead, ImportLeads, ...) in the same session -
// see utils/apiCache. Invalidated below whenever a product is actually
// created/updated/(de)activated.
export const getAllProducts = async () => {
    return cachedFetch("products", async () => {
        const response = await api.get("/products");
        return response.data;
    });
};

export const getProductById = async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
};

export const createProduct = async (data) => {
    const response = await api.post("/products", data);
    invalidateCache("products");
    return response.data;
};

export const updateProduct = async (id, data) => {
    const response = await api.put(`/products/${id}`, data);
    invalidateCache("products");
    return response.data;
};

export const deleteProduct = async (id) => {
    await api.delete(`/products/${id}`);
    invalidateCache("products");
};

export const getAllProductsAdmin = async () => {
    const response = await api.get("/products/all");
    return response.data;
};

export const activateProduct = async (id) => {
    await api.put(`/products/${id}/activate`);
    invalidateCache("products");
};