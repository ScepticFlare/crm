import api from "./api";

export const getAllFollowUps = async () => {
    const response = await api.get("/followups");
    return response.data;
};

export const getFollowUpById = async (id) => {
    const response = await api.get(`/followups/${id}`);
    return response.data;
};

export const createFollowUp = async (followUp) => {
    const response = await api.post("/followups", followUp);
    return response.data;
};

export const updateFollowUp = async (id, followUp) => {
    const response = await api.put(`/followups/${id}`, followUp);
    return response.data;
};

export const deleteFollowUp = async (id) => {
    await api.delete(`/followups/${id}`);
};