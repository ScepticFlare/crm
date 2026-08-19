// Turns the backend's delete-impact preview (opportunityCount/customerCount/
// followUpCount/wonCustomer - see dto.response.DeleteImpactResponse) into
// the { details, warning } shape DeleteModal renders. Counts/text are never
// hardcoded per record - always derived from whatever the API actually
// returned, so the confirmation dialog can't drift out of sync with what
// the backend will really delete.
export function describeDeleteImpact(impact, entityLabel) {

    if (!impact) {
        return { details: [], warning: null };
    }

    const details = [];

    if (impact.opportunityCount > 0) {
        details.push(`${impact.opportunityCount} Opportunity`);
    }

    if (impact.customerCount > 0) {
        details.push(`${impact.customerCount} Customer/Won record`);
    }

    if (impact.followUpCount > 0) {
        details.push(`${impact.followUpCount} Follow-Up${impact.followUpCount === 1 ? "" : "s"}`);
    }

    const warning = impact.wonCustomer
        ? `This ${entityLabel} has progressed to a Won Customer. Deleting it will also delete ` +
          "the related CRM records listed below."
        : null;

    return { details, warning };

}
