import api from "./api";

export const createOpportunity = async (leadId, data) => {

    const response = await api.post(
        `/opportunities/convert/${leadId}`,
        data
    );

    return response.data;

};

export const getAllOpportunities = async () => {

    const response = await api.get("/opportunities");

    return response.data;

};

export const getOpportunityById = async (id) => {

    const response = await api.get(`/opportunities/${id}`);

    return response.data;

};

export const updateOpportunity = async (id, data) => {

    const response = await api.put(`/opportunities/${id}`, data);

    return response.data;

};

export const deleteOpportunity = async (id) => {

    await api.delete(`/opportunities/${id}`);

};