import api from "./api";

export const getLeadReport = async (from, to, leadSourceId) => {

    const params = {
        from,
        to
    };

    if (leadSourceId) {
        params.leadSourceId = leadSourceId;
    }

    const response = await api.get("/reports/leads", {
        params
    });

    return response.data;
};

export const exportLeadReport = async (from, to, leadSourceId) => {

    const params = {
        from,
        to
    };

    if (leadSourceId) {
        params.leadSourceId = leadSourceId;
    }

    const response = await api.get(
        "/reports/leads/export",
        {
            params,
            responseType: "blob"
        }
    );

    const url = window.URL.createObjectURL(
        new Blob([response.data])
    );

    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", "Lead_Report.xlsx");

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);
};

export const getLeadSources = async () => {

    const response = await api.get("/lead-sources");

    return response.data;
};