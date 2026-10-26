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

// Leads the stale-lead scheduler automatically moved to INACTIVE after 6+
// months of no meaningful activity - a separate bucket from Invalid (a
// manual business judgment about a bad/unusable Lead).
export const getInactiveLeads = async (listArgs) => {
    const response = await api.get("/leads/inactive", { params: toListParams(listArgs) });
    return response.data;
};

// History / reporting view of any lead category (ALL, ACTIVE, NEW,
// VALID_UNCONVERTED, INVALID, CONVERTED) - invalid and converted leads are not
// on the normal Leads page but stay reachable here.
export const getLeadsByCategory = (category) => async (listArgs) => {
    const response = await api.get("/leads/report", {
        params: { ...toListParams(listArgs), category }
    });
    return response.data;
};

// { NEW, VALID_UNCONVERTED, INVALID, CONVERTED, TOTAL }
export const getLeadCategoryCounts = async () => {
    const response = await api.get("/leads/report/counts");
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
// category: which lead category to export (ACTIVE - the normal Leads page - is
// the backend default; ALL / INVALID / CONVERTED / ... for reporting).
// Returns an .xlsx workbook.
export const exportLeads = async ({ sort = null, filters = {}, selection = null, category = undefined } = {}) => {

    const response = await api.get("/leads/export", {
        params: {
            sortBy: sort?.field || undefined,
            sortDir: sort?.dir || undefined,
            ...filters,
            category,
            ids: selection && selection.length > 0 ? selection.join(",") : undefined,
        },
        responseType: "blob",
    });

    return response.data;

};

// Possible duplicates of the lead being entered (same phone / email /
// company). A warning aid only - nothing is blocked or merged. Blank values
// are simply not matched on.
export const getPossibleDuplicates = async ({ phone, email, company, excludeId }) => {

    const response = await api.get("/leads/duplicates", {
        params: { phone, email, company, excludeId }
    });

    return response.data;
};
