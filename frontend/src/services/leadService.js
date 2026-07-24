import api from "./api";

export const getAllLeads = async (page = 0, size = 50, search = "") => {
    const response = await api.get("/leads", {
        params: {
            page,
            size,
            search,
        },
    });

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