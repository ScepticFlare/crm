// What a follow-up is about, for display. The backend sends it as `related`
// (FollowUpRelatedRecord), resolved from the follow-up's own lead or - for an
// opportunity follow-up, which has no lead of its own - its opportunity's
// lead. Never derived from matching names.

// The `related` block, or the same shape derived from lead / opportunity for a
// response that predates it.
export function relatedOf(followUp) {

    if (!followUp) {
        return null;
    }

    if (followUp.related) {
        return followUp.related;
    }

    const direct = followUp.lead || null;
    const opportunity = followUp.opportunity || null;
    const lead = direct || opportunity?.lead || null;
    const companyName = lead?.companyName || null;
    const opportunityTitle = opportunity?.title || null;

    return {
        kind: direct && opportunity ? "LEAD_AND_OPPORTUNITY" : direct ? "LEAD" : opportunity ? "OPPORTUNITY" : "NONE",
        leadId: lead?.id ?? null,
        companyName,
        contactPerson: opportunity?.contactPerson || lead?.contactPerson || null,
        leadViaOpportunity: !direct && !!lead,
        opportunityId: opportunity?.id ?? null,
        opportunityTitle,
        opportunityStage: opportunity?.salesStage?.name || null,
        ownerId: lead?.assignedEmployee?.id ?? null,
        ownerName: lead?.assignedEmployee?.name || null,
        label: companyName && opportunityTitle ? `${companyName} - ${opportunityTitle}`
            : companyName || (opportunity ? `Opportunity: ${opportunityTitle || "(untitled)"}` : "No linked record"),
    };
}

// The company line of a follow-up: the company, or a meaningful fallback that
// never hides a relationship behind a dash.
export function companyText(related) {
    if (!related) {
        return "No linked record";
    }
    if (related.companyName) {
        return related.companyName;
    }
    return related.opportunityId ? "No linked lead" : "No linked record";
}

// "via opportunity" when the lead is reached through the opportunity.
export function linkNote(related) {
    if (!related) {
        return "";
    }
    if (related.kind === "OPPORTUNITY") {
        return related.leadId ? "Opportunity follow-up" : "Opportunity follow-up (no linked lead)";
    }
    if (related.kind === "LEAD_AND_OPPORTUNITY") {
        return "Lead and opportunity";
    }
    if (related.kind === "LEAD") {
        return "Lead follow-up";
    }
    return "";
}

// ---- picker options (GET /api/followups/targets) ----------------------------

export function targetKey(t) {
    return t.type === "OPPORTUNITY" ? `O${t.opportunityId}` : `L${t.leadId}`;
}

// Main line of an option / the selected value.
export function targetTitle(t) {
    if (t.type === "OPPORTUNITY") {
        return `${t.companyName || "No linked lead"} - ${t.opportunityTitle || "(untitled opportunity)"}`;
    }
    return t.companyName || "(unnamed lead)";
}

// Second line: everything that tells two similar records apart.
export function targetDetails(t) {
    const parts = [t.type === "OPPORTUNITY" ? `Opportunity #${t.opportunityId}` : `Lead #${t.leadId}`];
    if (t.type === "OPPORTUNITY" && t.stage) {
        parts.push(t.stage);
    }
    if (t.contactPerson) {
        parts.push(`Contact: ${t.contactPerson}`);
    }
    if (t.assignedEmployeeName) {
        parts.push(`Owner: ${t.assignedEmployeeName}`);
    }
    return parts.join(" · ");
}

// The picker value for an existing follow-up (edit page), from its relationships.
export function targetFromFollowUp(followUp) {

    const r = relatedOf(followUp);

    if (!r || r.kind === "NONE") {
        return null;
    }

    const direct = r.kind === "LEAD" || r.kind === "LEAD_AND_OPPORTUNITY";

    return {
        type: r.opportunityId ? "OPPORTUNITY" : "LEAD",
        // the ids the follow-up is actually stored with - submitted unchanged
        leadId: direct ? r.leadId : null,
        opportunityId: r.opportunityId,
        companyName: r.companyName,
        contactPerson: r.contactPerson,
        opportunityTitle: r.opportunityTitle,
        stage: r.opportunityStage,
        assignedEmployeeId: r.ownerId,
        assignedEmployeeName: r.ownerName,
    };
}

// Picker groups: opportunities first (where most follow-ups belong), then
// unconverted leads.
export function groupTargets(targets) {
    const leads = targets.filter((t) => t.type === "LEAD");
    const opportunities = targets.filter((t) => t.type === "OPPORTUNITY");
    return [
        ...(opportunities.length ? [{ label: "Opportunities", options: opportunities }] : []),
        ...(leads.length ? [{ label: "Leads (not yet converted)", options: leads }] : []),
    ];
}
