import api from "./api";

// The do-not-email list. ADMIN only - the backend enforces
// EMAIL_SUPPRESSION_MANAGE on every one of these calls.

export const listEmailSuppressions = async ({ q, page = 0, size = 25 } = {}) => {
    const response = await api.get("/email-suppressions", { params: { q: q || undefined, page, size } });
    return response.data;
};

// { email, reason: "OPT_OUT" | "BOUNCE" | "COMPLAINT" | "MANUAL", note }
export const addEmailSuppression = async (payload) => {
    const response = await api.post("/email-suppressions", payload);
    return response.data;
};

// A removal re-enables emailing to that address, so a written justification is
// mandatory and ends up in the audit trail.
export const removeEmailSuppression = async (id, justification) => {
    await api.delete(`/email-suppressions/${id}`, { params: { justification } });
};

export const listEmailSuppressionAudit = async ({ page = 0, size = 25 } = {}) => {
    const response = await api.get("/email-suppressions/audit", { params: { page, size } });
    return response.data;
};
