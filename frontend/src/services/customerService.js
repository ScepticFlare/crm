import api from "./api";

export const getAllCustomers = async (
    page = 0,
    size = 50,
    search = ""
) => {

    const response = await api.get("/customers", {
        params: {
            page,
            size,
            search
        }
    });

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