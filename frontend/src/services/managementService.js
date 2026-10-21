import api from "./api";

// Management metrics (funnel, pipeline, overdue, closing windows, wins and
// losses, loss reasons, closure-date changes, uncontacted leads), scoped by
// the caller's existing visibility. from / to are optional yyyy-mm-dd.
export const getManagementSummary = async ({ from, to } = {}) => {

    const response = await api.get("/management/summary", {
        params: { from: from || undefined, to: to || undefined }
    });

    return response.data;
};
