import api from "./api";

export const getAllActivityTypes = async () => {
    const response = await api.get("/activity-types");
    return response.data;
};

export const getActivityTypeById = async (id) => {
    const response = await api.get(`/activity-types/${id}`);
    return response.data;
};

export const createActivityType = async (data) => {
    const response = await api.post("/activity-types", data);
    return response.data;
};

export const updateActivityType = async (id, data) => {
    const response = await api.put(`/activity-types/${id}`, data);
    return response.data;
};

export const deleteActivityType = async (id) => {
    await api.delete(`/activity-types/${id}`);
};