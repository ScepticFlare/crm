import api from "./api";

// Preview is read-only and never sends anything - see
// components/email/EmailComposerModal.jsx. templateId omitted falls back to
// the type's default template (see EmailTemplateService.getDefaultForType
// on the backend).
export const previewLeadEmail = async (leadId, { type, templateId } = {}) => {
    const response = await api.get(`/leads/${leadId}/email/preview`, {
        params: {
            type,
            templateId: templateId || undefined,
        },
    });
    return response.data;
};

// Sends exactly the reviewed subject/body/attachments - see
// dto.request.SendLeadEmailRequest on the backend for why this never
// re-renders from templateId server-side.
export const sendLeadEmail = async (leadId, payload) => {
    const response = await api.post(`/leads/${leadId}/email/send`, payload);
    return response.data;
};

// Read-only eligibility check for the bulk review step - see
// components/email/BulkKeepInTouchModal.jsx.
export const getBulkKeepInTouchEligibility = async (ids) => {
    const response = await api.get("/leads/email/keep-in-touch/bulk/preview", {
        params: { ids: ids.join(",") },
    });
    return response.data;
};

export const sendBulkKeepInTouch = async (payload) => {
    const response = await api.post("/leads/email/keep-in-touch/bulk", payload);
    return response.data;
};
