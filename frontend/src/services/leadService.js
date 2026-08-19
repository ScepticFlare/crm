import api, { toListParams } from "./api";

// listArgs: { page, size, search, sort: {field, dir}|null, filters } - see
// hooks/useServerList, which is what actually calls these.
export const getAllLeads = async (listArgs) => {
    const response = await api.get("/leads", { params: toListParams(listArgs) });
    return response.data;
};

export const getLeadById = async (id) => {
    const response = await api.get(`/leads/${id}`);
    return response.data;
};

export const createLead = async (lead) => {
    const response = await api.post("/leads", lead);
    return response.data;
};

export const updateLead = async (id, lead) => {
    const response = await api.put(`/leads/${id}`, lead);
    return response.data;
};

export const deleteLead = async (id) => {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
};

// Preview of what deleting this Lead will also remove (Opportunity, Won
// Customer, Follow-Ups) - see utils/deleteImpact.js for how the UI turns
// this into the confirmation dialog's message.
export const getLeadDeleteImpact = async (id) => {
    const response = await api.get(`/leads/${id}/delete-impact`);
    return response.data;
};

// Status-bucket fetchers: same shared param shape, backend forces the
// status filter server-side - the frontend never needs to pass it.
export const getDroppedLeads = async (listArgs) => {
    const response = await api.get("/leads/dropped", { params: toListParams(listArgs) });
    return response.data;
};

export const getLostLeads = async (listArgs) => {
    const response = await api.get("/leads/lost", { params: toListParams(listArgs) });
    return response.data;
};

export const getUnresponsiveLeads = async (listArgs) => {
    const response = await api.get("/leads/unresponsive", { params: toListParams(listArgs) });
    return response.data;
};

export const getInvalidLeads = async (listArgs) => {
    const response = await api.get("/leads/invalid", { params: toListParams(listArgs) });
    return response.data;
};

export const importLeads = async (file) => {

    const formData = new FormData();

    formData.append("file", file);

    const response = await api.post(
        "/leads/import",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        }
    );

    return response.data;

};

// Deletes only the ids the caller is authorized for - see
// BulkOperationResult on the backend for the exact succeeded/skipped shape.
export const bulkDeleteLeads = async (ids) => {
    const response = await api.post("/leads/bulk-delete", { ids });
    return response.data;
};

// selection: array of row ids to export exactly (bulk "export selected"),
// or null/undefined to export everything matching the current filters/search.
export const exportLeads = async ({ sort = null, filters = {}, selection = null } = {}) => {

    const response = await api.get("/leads/export", {
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
