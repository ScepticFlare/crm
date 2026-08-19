import api, { toListParams } from "./api";

export const getAllCustomers = async (listArgs) => {
    const response = await api.get("/customers", { params: toListParams(listArgs) });
    return response.data;
};

export const getCustomerById = async (id) => {

    const response = await api.get(`/customers/${id}`);

    return response.data;

};

export const createCustomer = async (customer) => {

    const { opportunityId, ...customerData } = customer;

    const response = await api.post(
        `/customers/convert/${opportunityId}`,
        customerData
    );

    return response.data;

};

export const updateCustomer = async (id, customer) => {

    const response = await api.put(`/customers/${id}`, customer);

    return response.data;

};

export const deleteCustomer = async (id) => {

    const response = await api.delete(`/customers/${id}`);

    return response.data;

};

// Preview of what deleting this Customer will also remove - always empty in
// practice (nothing references a Customer), but called for consistency with
// the Lead/Opportunity delete flow - see utils/deleteImpact.js.
export const getCustomerDeleteImpact = async (id) => {

    const response = await api.get(`/customers/${id}/delete-impact`);

    return response.data;

};

export const convertOpportunity = async (opportunityId, customerData) => {

    const response = await api.post(
        `/customers/convert/${opportunityId}`,
        customerData
    );

    return response.data;

};

export const convertCustomer = async (opportunityId, customer) => {

    const response = await api.post(
        `/customers/convert/${opportunityId}`,
        customer
    );

    return response.data;

};

export const getCustomerOpportunity = async (id) => {

    const response = await api.get(`/opportunities/${id}`);

    return response.data;

};

export const getCustomerByOpportunity = async (opportunityId) => {

    const response = await api.get(`/customers/by-opportunity/${opportunityId}`);

    return response.data;

};

export const bulkDeleteCustomers = async (ids) => {
    const response = await api.post("/customers/bulk-delete", { ids });
    return response.data;
};

export const exportCustomers = async ({ sort = null, filters = {}, selection = null } = {}) => {

    const response = await api.get("/customers/export", {
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
