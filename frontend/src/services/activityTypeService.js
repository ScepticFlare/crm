import api from "./api";
import { cachedFetch, invalidateCache } from "../utils/apiCache";

// Cached: see utils/apiCache - rarely-changing master data fetched
// independently by several pages in the same session.
export const getAllActivityTypes = async () => {
    return cachedFetch("activityTypes", async () => {
        const response = await api.get("/activity-types");
        return response.data;
    });
};

export const getActivityTypeById = async (id) => {
    const response = await api.get(`/activity-types/${id}`);
    return response.data;
};

export const createActivityType = async (data) => {
    const response = await api.post("/activity-types", data);
    invalidateCache("activityTypes");
    return response.data;
};

export const updateActivityType = async (id, data) => {
    const response = await api.put(`/activity-types/${id}`, data);
    invalidateCache("activityTypes");
    return response.data;
};

export const deleteActivityType = async (id) => {
    await api.delete(`/activity-types/${id}`);
    invalidateCache("activityTypes");
};

export const getAllActivityTypesAdmin = async () => {
    const response = await api.get("/activity-types/all");
    return response.data;
};

export const activateActivityType = async (id) => {
    await api.put(`/activity-types/${id}/activate`);
    invalidateCache("activityTypes");
};
