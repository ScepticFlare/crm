import api from "./api";

export const previewFullReport = async (filters) => {

    const response = await api.post("/reports/full", filters);

    return response.data;
};

export const exportFullReport = async (filters) => {

    const response = await api.post(
        "/reports/full/export",
        filters,
        {
            responseType: "blob"
        }
    );

    const url = window.URL.createObjectURL(
        new Blob([response.data])
    );

    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", "Full_Report.xlsx");

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);
};
