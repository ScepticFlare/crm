// Opportunity-workflow helpers. Stages are identified by the stable
// `stageType` the API sends with every sales stage (IN_PROGRESS, LOST,
// POSTPONED, WON, LEGACY_DROPPED, the historical/retired types, or none for
// a custom stage) - never by display name, because Admins may rename a
// stage. `workflowActive` (also from the API) says whether an opportunity in
// that stage is still being worked; `mainStage` says whether it is one of the
// five main stages (In Progress, Won, Lost, Postponed, Dropped) - the only
// stages that can be chosen.

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

// Whether an opportunity in this stage must have a next follow-up: an active
// stage (workflowActive, computed by the backend's OpportunityWorkflow.isActive)
// or POSTPONED. WON, LOST and the historical closed stages need none. Mirrors
// OpportunityWorkflow.requiresNextFollowUp; the backend enforces it.
export function requiresNextFollowUp(stage) {

    if (!stage) {
        return false;
    }

    const type = typeOfStage(stage);

    if (type === "POSTPONED") {
        return true;
    }

    if (typeof stage.workflowActive === "boolean") {
        return stage.workflowActive;
    }

    // Without the flag, judge by the stable type (an untyped custom stage is active).
    return !CLOSED_STAGE_TYPES.includes(type);
}

const CLOSED_STAGE_TYPES = ["WON", "LOST", "LEGACY_DROPPED", "LEGACY_UNRESPONSIVE", "LEGACY_INVALID"];

// Historical QUOTATION SENT / NEGOTIATION stages: kept for old records,
// not offered as a stage choice any more (they are sub-statuses of IN
// PROGRESS now).
export function isLegacySubStage(stage) {
    const type = typeOfStage(stage);
    return type === "LEGACY_QUOTATION_SENT" || type === "LEGACY_NEGOTIATION";
}

// One of the five main stages - the only stages a dropdown or stage filter
// offers. Decided by the backend (SalesStage.mainStage).
export function isMainStage(stage) {
    return stage?.mainStage === true;
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
