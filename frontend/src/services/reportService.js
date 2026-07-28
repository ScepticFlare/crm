import api from "./api";

export const getLeadReport = async (from, to) => {

    const response = await api.get("/reports/leads", {
        params: {
            from,
            to
        }
    });

    return response.data;

};