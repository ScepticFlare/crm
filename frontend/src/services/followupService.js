import api from "./api";

export const getAllFollowUps = async (
    page = 0,
    size = 50,
    search = ""
) => {

    const response = await api.get("/followups", {
        params: {
            page,
            size,
            search
        }
    });

    return response.data;

};

export const getFollowUpById = async (id) => {
    const response = await api.get(`/followups/${id}`);
    return response.data;
};

// ADD THESE TWO FUNCTIONS 👇
export const getFollowUpsByLead = async (leadId) => {
    const response = await api.get(`/followups/lead/${leadId}`);
    return response.data;
};

export const getFollowUpsByOpportunity = async (opportunityId) => {
    const response = await api.get(`/followups/opportunity/${opportunityId}`);
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