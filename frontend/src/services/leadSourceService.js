import api from "./api";

export const getAllLeadSources = async () => {
    const response = await api.get("/lead-sources");
    return response.data;
};

export const getLeadSourceById = async (id) => {
    const response = await api.get(`/lead-sources/${id}`);
    return response.data;
};

export const createLeadSource = async (data) => {
    const response = await api.post("/lead-sources", data);
    return response.data;
};

export const updateLeadSource = async (id, data) => {
    const response = await api.put(`/lead-sources/${id}`, data);
    return response.data;
};

export const deleteLeadSource = async (id) => {
    await api.delete(`/lead-sources/${id}`);
};