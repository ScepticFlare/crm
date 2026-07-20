import api from "./api";

export const getAllEmployees = async () => {
    const response = await api.get("/employees");
    return response.data;
};

export const getEmployeeById = async (id) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
};