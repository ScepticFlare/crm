import api, { toListParams } from "./api";

export const createOpportunity = async (leadId, data) => {

    const response = await api.post(
        `/opportunities/convert/${leadId}`,
        data
    );

    return response.data;

};

export const getAllOpportunities = async (listArgs) => {
    const response = await api.get("/opportunities", { params: toListParams(listArgs) });
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

// Preview of what deleting this Opportunity will also remove (Won Customer,
// Follow-Ups) - see utils/deleteImpact.js.
export const getOpportunityDeleteImpact = async (id) => {

    const response = await api.get(`/opportunities/${id}/delete-impact`);

    return response.data;

};

export const getInProgressOpportunities = async (listArgs) => {
    const response = await api.get("/opportunities/in-progress", { params: toListParams(listArgs) });
    return response.data;
};

export const getPostponedOpportunities = async (listArgs) => {
    const response = await api.get("/opportunities/postponed", { params: toListParams(listArgs) });
    return response.data;
};

export const getDroppedOpportunities = async (listArgs) => {
    const response = await api.get("/opportunities/dropped", { params: toListParams(listArgs) });
    return response.data;
};

export const getLostOpportunities = async (listArgs) => {
    const response = await api.get("/opportunities/lost", { params: toListParams(listArgs) });
    return response.data;
};

export const getUnresponsiveOpportunities = async (listArgs) => {
    const response = await api.get("/opportunities/unresponsive", { params: toListParams(listArgs) });
    return response.data;
};

export const getInvalidOpportunities = async (listArgs) => {
    const response = await api.get("/opportunities/invalid", { params: toListParams(listArgs) });
    return response.data;
};

export const bulkDeleteOpportunities = async (ids) => {
    const response = await api.post("/opportunities/bulk-delete", { ids });
    return response.data;
};

export const exportOpportunities = async ({ sort = null, filters = {}, selection = null } = {}) => {

    const response = await api.get("/opportunities/export", {
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
