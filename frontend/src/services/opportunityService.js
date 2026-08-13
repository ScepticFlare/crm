import api, { monthParams } from "./api";

export const createOpportunity = async (leadId, data) => {

    const response = await api.post(
        `/opportunities/convert/${leadId}`,
        data
    );

    return response.data;

};

export const getAllOpportunities = async (
    page = 0,
    size = 50,
    search = "",
    month = ""
) => {

    const response = await api.get("/opportunities", {
        params: {
            page,
            size,
            search,
            ...monthParams(month)
        }
    });

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
export const getInProgressOpportunities = async (
    page = 0,
    size = 50,
    search = "",
    month = ""
) => {

    const response = await api.get("/opportunities/in-progress", {
        params: {
            page,
            size,
            search,
            ...monthParams(month)
        }
    });

    return response.data;

};

export const getPostponedOpportunities = async (
    page = 0,
    size = 50,
    search = "",
    month = ""
) => {

    const response = await api.get("/opportunities/postponed", {
        params: {
            page,
            size,
            search,
            ...monthParams(month)
        }
    });

    return response.data;

};

export const getDroppedOpportunities = async (
    page = 0,
    size = 50,
    search = "",
    month = ""
) => {

    const response = await api.get("/opportunities/dropped", {
        params: {
            page,
            size,
            search,
            ...monthParams(month)
        }
    });

    return response.data;

};

export const getLostOpportunities = async (
    page = 0,
    size = 50,
    search = "",
    month = ""
) => {

    const response = await api.get("/opportunities/lost", {
        params: {
            page,
            size,
            search,
            ...monthParams(month)
        }
    });

    return response.data;

};

export const getUnresponsiveOpportunities = async (
    page = 0,
    size = 50,
    search = "",
    month = ""
) => {

    const response = await api.get("/opportunities/unresponsive", {
        params: {
            page,
            size,
            search,
            ...monthParams(month)
        }
    });

    return response.data;

};

export const getInvalidOpportunities = async (
    page = 0,
    size = 50,
    search = "",
    month = ""
) => {

    const response = await api.get("/opportunities/invalid", {
        params: {
            page,
            size,
            search,
            ...monthParams(month)
        }
    });

    return response.data;

};