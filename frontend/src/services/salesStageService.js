import api from "./api";

export const getAllSalesStages = async () => {

    const response = await api.get("/sales-stages");

    return response.data;

};

export const createSalesStage = async (data) => {

    const response = await api.post("/sales-stages", data);

    return response.data;

};

export const getSalesStageById = async (id) => {

    const response = await api.get(`/sales-stages/${id}`);

    return response.data;

};

export const updateSalesStage = async (id, data) => {

    const response = await api.put(`/sales-stages/${id}`, data);

    return response.data;

};

export const deleteSalesStage = async (id) => {

    await api.delete(`/sales-stages/${id}`);

};