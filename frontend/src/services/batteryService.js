import api from "./api";

export const getAllBatteries = async () => {
    const response = await api.get("/batteries");
    return response.data;
};

export const getBatteryById = async (id) => {
    const response = await api.get(`/batteries/${id}`);
    return response.data;
};

export const createBattery = async (data) => {
    const response = await api.post("/batteries", data);
    return response.data;
};

export const updateBattery = async (id, data) => {
    const response = await api.put(`/batteries/${id}`, data);
    return response.data;
};

export const deleteBattery = async (id) => {
    await api.delete(`/batteries/${id}`);
};

export const getAllBatteriesAdmin = async () => {
    const response = await api.get("/batteries/all");
    return response.data;
};

export const activateBattery = async (id) => {
    await api.put(`/batteries/${id}/activate`);
};
