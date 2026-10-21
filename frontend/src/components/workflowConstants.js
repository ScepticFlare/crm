// Opportunity-workflow helpers. Stages are identified by the stable
// `stageType` the API sends with every sales stage (IN_PROGRESS, LOST,
// POSTPONED, WON, NEW, LEGACY_QUOTATION_SENT, LEGACY_NEGOTIATION, or none
// for a custom stage) - never by display name, because Admins may rename
// any stage. `workflowActive` (also from the API) says whether an
// opportunity in that stage is still being worked.

export const SUB_STATUS_OPTIONS = [
    { value: "QUOTATION_SENT", label: "Quotation Sent" },
    { value: "NEGOTIATION", label: "Negotiation" },
];

export function subStatusLabel(value) {
    const found = SUB_STATUS_OPTIONS.find((o) => o.value === value);
    return found ? found.label : "";
}

export function typeOfStage(stage) {
    return stage?.stageType || null;
}

// Historical QUOTATION SENT / NEGOTIATION stages: kept for old records,
// not offered as a stage choice any more.
export function isLegacySubStage(stage) {
    return (typeOfStage(stage) || "").startsWith("LEGACY_");
}

// Request-body fields for the workflow additions; empty strings become null.
export function workflowPayload(form) {
    return {
        subStatus: form.subStatus || null,
        lostReason: form.lostReason || null,
        postponedReviewDate: form.postponedReviewDate || null,
        postponedReason: form.postponedReason || null,
        closingDateChangeReason: form.closingDateChangeReason || null,
    };
}

// The next action an active opportunity needs, when it is being entered with
// the save (see OpportunityForm). Sent only when the user filled it in - the
// backend decides whether one is required, and never invents one.
export function nextActionPayload(form) {

    if (!form.nextActionDescription && !form.nextFollowUpDate && !form.nextActionActivityTypeId) {
        return {};
    }

    return {
        nextActionDescription: form.nextActionDescription || null,
        // datetime-local gives "YYYY-MM-DDTHH:mm"; the API wants seconds too
        nextFollowUpDate: form.nextFollowUpDate
            ? (form.nextFollowUpDate.length === 16 ? form.nextFollowUpDate + ":00" : form.nextFollowUpDate)
            : null,
        nextActionActivityTypeId: form.nextActionActivityTypeId
            ? Number(form.nextActionActivityTypeId)
            : null,
    };
}
