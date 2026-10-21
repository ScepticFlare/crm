import api from "./api";
import { cachedFetch, invalidateCache } from "../utils/apiCache";

// Cached: see utils/apiCache - this RBAC-scoped list (same for the whole
// session for a given logged-in user) is fetched independently by several
// pages (Leads, Opportunities, Customers, FollowUps filters, Employees
// page itself, ...). Cleared on login/logout so a user switch in the same
// tab never leaks a previous user's scoped list.
export const getAllEmployees = async () => {
    return cachedFetch("employees", async () => {
        const response = await api.get("/employees");
        return response.data;
    });
};

export const getEmployeeById = async (id) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
};

export const createEmployee = async (employee) => {
    const response = await api.post("/employees", employee);
    invalidateCache("employees");
    return response.data;
};

export const updateEmployee = async (id, employee) => {
    const response = await api.put(`/employees/${id}`, employee);
    invalidateCache("employees");
    return response.data;
};

export const deleteEmployee = async (id) => {
    const response = await api.delete(`/employees/${id}`);
    invalidateCache("employees");
    return response.data;
};
