import api from "./api";
import { cachedFetch, invalidateCache } from "../utils/apiCache";

// Cached: see utils/apiCache - rarely-changing master data fetched
// independently by several pages in the same session.
export const getAllBatteries = async () => {
    return cachedFetch("batteries", async () => {
        const response = await api.get("/batteries");
        return response.data;
    });
};

export const getBatteryById = async (id) => {
    const response = await api.get(`/batteries/${id}`);
    return response.data;
};

export const createBattery = async (data) => {
    const response = await api.post("/batteries", data);
    invalidateCache("batteries");
    return response.data;
};

export const updateBattery = async (id, data) => {
    const response = await api.put(`/batteries/${id}`, data);
    invalidateCache("batteries");
    return response.data;
};

export const deleteBattery = async (id) => {
    await api.delete(`/batteries/${id}`);
    invalidateCache("batteries");
};

export const getAllBatteriesAdmin = async () => {
    const response = await api.get("/batteries/all");
    return response.data;
};

export const activateBattery = async (id) => {
    await api.put(`/batteries/${id}/activate`);
    invalidateCache("batteries");
};
