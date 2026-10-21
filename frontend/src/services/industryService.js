import api from "./api";
import { cachedFetch, invalidateCache } from "../utils/apiCache";

// Cached: see utils/apiCache - rarely-changing master data fetched
// independently by several pages in the same session.
export const getAllIndustries = async () => {
    return cachedFetch("industries", async () => {
        const response = await api.get("/industries");
        return response.data;
    });
};

export const getIndustryById = async (id) => {
    const response = await api.get(`/industries/${id}`);
    return response.data;
};

export const createIndustry = async (data) => {
    const response = await api.post("/industries", data);
    invalidateCache("industries");
    return response.data;
};

export const updateIndustry = async (id, data) => {
    const response = await api.put(`/industries/${id}`, data);
    invalidateCache("industries");
    return response.data;
};

export const deleteIndustry = async (id) => {
    await api.delete(`/industries/${id}`);
    invalidateCache("industries");
};

export const getAllIndustriesAdmin = async () => {
    const response = await api.get("/industries/all");
    return response.data;
};

export const activateIndustry = async (id) => {
    await api.put(`/industries/${id}/activate`);
    invalidateCache("industries");
};
