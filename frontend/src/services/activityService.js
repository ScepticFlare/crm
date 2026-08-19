import api, { toListParams } from "./api";

// listArgs: { page, size, search, sort: {field, dir}|null, filters } - see
// hooks/useServerList, which is what actually calls this.
export const getActivity = async (listArgs) => {
    const response = await api.get("/activity", { params: toListParams(listArgs) });
    return response.data;
};

// filters: the same { employeeId, createdFrom, createdTo, ... } shape the
// activity list is filtered by - the backend only actually applies
// employeeId/date-range to the summary counts (each stat already names its
// own module+action pair), so passing module/action through here is
// harmless, just unused.
export const getActivitySummary = async (filters = {}) => {
    const response = await api.get("/activity/summary", { params: filters });
    return response.data;
};

// JWTs are stateless - there's nothing server-side to invalidate. This
// exists purely so the backend can record a LOGOUT activity entry for the
// authenticated caller before the frontend discards its token.
export const logout = async () => {
    const response = await api.post("/auth/logout");
    return response.data;
};
