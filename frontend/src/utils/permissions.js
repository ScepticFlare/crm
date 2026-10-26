// UX guard only: whether to SHOW the lead / opportunity export actions.
// The backend is the real control - it requires the LEAD_EXPORT /
// OPPORTUNITY_EXPORT permission and limits every export to the caller's own
// permitted records, whatever this returns. ADMIN and MARKETING are the roles
// granted those permissions (see the backend V11 migration).
export const LEAD_EXPORT_ROLES = ["ADMIN", "MARKETING"];

export function canExportLeadsAndOpportunities(role = localStorage.getItem("role")) {
    return LEAD_EXPORT_ROLES.includes(role);
}
