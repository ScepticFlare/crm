import api from "./api";

export const getAllOpportunities = async () => {
    const response = await api.get("/opportunities");
    return response.data;
};

export const getOpportunityById = async (id) => {
    const response = await api.get(`/opportunities/${id}`);
    return response.data;
};

export const createOpportunity = async (opportunity) => {

    const { leadId, ...opportunityData } = opportunity;

    const response = await api.post(
        `/opportunities/convert/${leadId}`,
        opportunityData
    );

    return response.data;
};

export const updateOpportunity = async (id, opportunity) => {
    const response = await api.put(`/opportunities/${id}`, opportunity);
    return response.data;
};

export const deleteOpportunity = async (id) => {
    const response = await api.delete(`/opportunities/${id}`);
    return response.data;
};