import api from "./api";

export const getAllLostReasons = async () => {
    const response = await api.get("/lost-reasons");
    return response.data;
};

export const getLostReasonById = async (id) => {
    const response = await api.get(`/lost-reasons/${id}`);
    return response.data;
};

export const createLostReason = async (data) => {
    const response = await api.post("/lost-reasons", data);
    return response.data;
};

export const updateLostReason = async (id, data) => {
    const response = await api.put(`/lost-reasons/${id}`, data);
    return response.data;
};

export const deleteLostReason = async (id) => {
    await api.delete(`/lost-reasons/${id}`);
};