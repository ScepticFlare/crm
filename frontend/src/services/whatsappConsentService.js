import api from "./api";

// WhatsApp consent (backend WhatsAppConsentController).

export const getLeadWhatsAppConsent = async (leadId) => (await api.get(`/leads/${leadId}/whatsapp-consent`)).data;

// { status: "OPTED_IN" | "OPTED_OUT", source, evidence, consentedAt: "yyyy-mm-dd" }
export const recordLeadWhatsAppConsent = async (leadId, payload) =>
    (await api.post(`/leads/${leadId}/whatsapp-consent`, payload)).data;

// ---- admin ----

export const listWhatsAppConsent = async ({ query, page = 0, size = 25 } = {}) =>
    (await api.get("/whatsapp-consent", { params: { query: query || undefined, page, size } })).data;

export const recordWhatsAppConsentForPhone = async (payload) => (await api.post("/whatsapp-consent", payload)).data;

// { phones: [...], source, evidence, consentedAt }
export const bulkWhatsAppOptIn = async (payload) => (await api.post("/whatsapp-consent/bulk-opt-in", payload)).data;

export const listWhatsAppConsentAudit = async ({ page = 0, size = 25 } = {}) =>
    (await api.get("/whatsapp-consent/audit", { params: { page, size } })).data;
