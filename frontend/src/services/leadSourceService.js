import api from "./api";
import { cachedFetch, invalidateCache } from "../utils/apiCache";

// Cached: see utils/apiCache - rarely-changing master data fetched
// independently by several pages in the same session.
export const getAllLeadSources = async () => {
    return cachedFetch("leadSources", async () => {
        const response = await api.get("/lead-sources");
        return response.data;
    });
};

export const getLeadSourceById = async (id) => {
    const response = await api.get(`/lead-sources/${id}`);
    return response.data;
};

export const createLeadSource = async (data) => {
    const response = await api.post("/lead-sources", data);
    invalidateCache("leadSources");
    return response.data;
};

export const updateLeadSource = async (id, data) => {
    const response = await api.put(`/lead-sources/${id}`, data);
    invalidateCache("leadSources");
    return response.data;
};

export const deleteLeadSource = async (id) => {
    await api.delete(`/lead-sources/${id}`);
    invalidateCache("leadSources");
};

export const getAllLeadSourcesAdmin = async () => {
    const response = await api.get("/lead-sources/all");
    return response.data;
};

export const activateLeadSource = async (id) => {
    await api.put(`/lead-sources/${id}/activate`);
    invalidateCache("leadSources");
};
