import api from "./api";

export const getAllIndustries = async () => {
    const response = await api.get("/industries");
    return response.data;
};

export const getIndustryById = async (id) => {
    const response = await api.get(`/industries/${id}`);
    return response.data;
};

export const createIndustry = async (data) => {
    const response = await api.post("/industries", data);
    return response.data;
};

export const updateIndustry = async (id, data) => {
    const response = await api.put(`/industries/${id}`, data);
    return response.data;
};

export const deleteIndustry = async (id) => {
    await api.delete(`/industries/${id}`);
};