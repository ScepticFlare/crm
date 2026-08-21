import api from "./api";

// type is optional - omitted, the backend returns every active template
// regardless of type (see pages/EmailTemplates.jsx, the admin management
// list). Passed, it narrows to PRODUCT_BROCHURE or KEEP_IN_TOUCH (see
// components/email/TemplateSelect.jsx, the composer's picker).
export const getEmailTemplates = async (type) => {
    const response = await api.get("/email-templates", {
        params: type ? { type } : {},
    });
    return response.data;
};

export const getEmailTemplateById = async (id) => {
    const response = await api.get(`/email-templates/${id}`);
    return response.data;
};

// ADMIN only - backend enforces EMAIL_TEMPLATE_MANAGE.
export const createEmailTemplate = async (template) => {
    const response = await api.post("/email-templates", template);
    return response.data;
};

export const updateEmailTemplate = async (id, template) => {
    const response = await api.put(`/email-templates/${id}`, template);
    return response.data;
};

// Soft delete (isActive=false) - see EmailTemplateService.deactivate.
export const deactivateEmailTemplate = async (id) => {
    const response = await api.delete(`/email-templates/${id}`);
    return response.data;
};

export const activateEmailTemplate = async (id) => {
    const response = await api.put(`/email-templates/${id}/activate`);
    return response.data;
};
