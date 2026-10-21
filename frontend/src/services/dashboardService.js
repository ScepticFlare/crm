import api from "./api";

// Single stats endpoint (GET /api/dashboard/stats) that replaces the old
// Dashboard.jsx approach of fetching a full paginated page each of leads/
// customers/opportunities/followups just to read totals and eyeball the
// first page for "recent"/"upcoming" widgets.
export const getDashboardStats = async () => {
    const response = await api.get("/dashboard/stats");
    return response.data;
};
