import api, { selectionParams, toListParams, withRowCount } from "./api";

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

// selection: see api.selectionParams. columns: the column chooser's visible
// keys, in order - the file contains exactly those columns.
export const exportOpportunities = async ({ sort = null, filters = {}, selection = null, columns = null } = {}) => {

    const response = await api.get("/opportunities/export", {
        params: {
            sortBy: sort?.field || undefined,
            sortDir: sort?.dir || undefined,
            ...filters,
            ...selectionParams(selection),
            columns: columns && columns.length > 0 ? columns.join(",") : undefined,
        },
        responseType: "blob",
    });

    return withRowCount(response);

};


// Non-blocking Dashboard reminders: expired closing dates, active
// opportunities with no upcoming follow-up, postponed review dates due.
export const getWorkflowAlerts = async () => {

    const response = await api.get("/opportunities/workflow-alerts");

    return response.data;

};

// "OK" on a postponed review-date reminder. Does NOT change the stage.
export const acknowledgePostponedReminder = async (id) => {

    const response = await api.post(`/opportunities/${id}/postponed-reminder/acknowledge`);

    return response.data;

};

// Explicit, separate action: POSTPONED -> IN PROGRESS. The closing date is
// optional here - the backend keeps the existing one when omitted.
export const returnToInProgress = async (id, expectedClosingDate, nextAction = {}) => {

    // Resuming makes the opportunity active again, so it needs a pending
    // follow-up with a next action; when it has none, the user enters it with
    // the resume (nextAction) and the backend saves both together.
    const response = await api.post(
        `/opportunities/${id}/return-to-in-progress`,
        { ...(expectedClosingDate ? { expectedClosingDate } : {}), ...nextAction }
    );

    return response.data;

};
