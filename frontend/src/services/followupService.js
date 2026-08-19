import api, { toListParams } from "./api";

export const getAllFollowUps = async (listArgs) => {
    const response = await api.get("/followups", { params: toListParams(listArgs) });
    return response.data;
};

export const getFollowUpById = async (id) => {
    const response = await api.get(`/followups/${id}`);
    return response.data;
};

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

export const bulkDeleteFollowUps = async (ids) => {
    const response = await api.post("/followups/bulk-delete", { ids });
    return response.data;
};

export const exportFollowUps = async ({ sort = null, filters = {}, selection = null } = {}) => {

    const response = await api.get("/followups/export", {
        params: {
            sortBy: sort?.field || undefined,
            sortDir: sort?.dir || undefined,
            ...filters,
            ids: selection && selection.length > 0 ? selection.join(",") : undefined,
        },
        responseType: "blob",
    });

    return response.data;

};
