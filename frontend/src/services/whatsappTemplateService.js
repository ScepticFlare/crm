import api from "./api";

// CRM-managed WhatsApp templates (backend WhatsAppTemplateController).

// Active, usable templates - the bulk-send picker.
export const getActiveWhatsAppTemplates = async () => (await api.get("/whatsapp-templates")).data;

// Admin: every template.
export const getAllWhatsAppTemplates = async () => (await api.get("/whatsapp-templates/all")).data;

// Admin: supported merge fields [{ key, label, token, note }].
export const getWhatsAppTemplateFields = async () => (await api.get("/whatsapp-templates/fields")).data;

export const createWhatsAppTemplate = async (payload) => (await api.post("/whatsapp-templates", payload)).data;

export const updateWhatsAppTemplate = async (id, payload) => (await api.put(`/whatsapp-templates/${id}`, payload)).data;

export const deactivateWhatsAppTemplate = async (id) => api.delete(`/whatsapp-templates/${id}`);

export const activateWhatsAppTemplate = async (id) => api.put(`/whatsapp-templates/${id}/activate`);

// Admin editor preview: { body } with sample data, or { body, target, recordId }.
export const previewWhatsAppTemplate = async (payload) => (await api.post("/whatsapp-templates/preview", payload)).data;
