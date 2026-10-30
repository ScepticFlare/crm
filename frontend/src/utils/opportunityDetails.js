import { lineItemErrors } from "./lineItems";

const PHONE_PATTERN = /^\d{10}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Which of an Opportunity's own details must stay filled in: the ones it
// already has. A historical record that never had one stays editable
// without inventing a value (same rule as OpportunityService on the server).
export function requiredOpportunityDetails(original) {

    return {
        contactPerson: !!original?.contactPerson,
        contactPhone: !!original?.contactPhone,
        products: (original?.products || []).length > 0,
        batteries: (original?.batteries || []).length > 0,
    };

}

// Messages for the contact / product / battery part of the edit form ({}
// when valid). Phone and email formats are only checked when the value was
// changed, so an older record with an unusual value can still be saved.
export function opportunityDetailErrors(form, original) {

    const required = requiredOpportunityDetails(original);
    const errors = {};

    const person = (form.contactPerson || "").trim();
    const phone = (form.contactPhone || "").trim();
    const email = (form.contactEmail || "").trim();

    if (required.contactPerson && !person) {
        errors.contactPerson = "Contact Person is required.";
    }

    if (required.contactPhone && !phone) {
        errors.contactPhone = "Contact Phone is required.";
    } else if (phone && phone !== (original?.contactPhone || "") && !PHONE_PATTERN.test(phone)) {
        errors.contactPhone = "Contact Phone must contain exactly 10 digits.";
    }

    if (email && email !== (original?.contactEmail || "") && !EMAIL_PATTERN.test(email)) {
        errors.contactEmail = "Please enter a valid Contact Email.";
    }

    return {
        ...errors,
        ...lineItemErrors(form, { productRequired: required.products, batteryRequired: required.batteries }),
    };

}
