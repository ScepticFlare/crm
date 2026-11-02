// Merge fields an email template can use. The backend fills them in
// separately for every recipient, from that recipient's own record (see
// EmailPlaceholderRenderer, which supports exactly these keys) - users pick
// them from the "Insert field" menu instead of typing {{...}} by hand.
// Several products / batteries are listed comma-separated.
export const MERGE_FIELDS = [
    { key: "contactPerson", label: "Contact person" },
    { key: "companyName", label: "Company" },
    { key: "designation", label: "Designation" },
    { key: "city", label: "City" },
    { key: "interestedProduct", label: "Product(s)" },
    { key: "interestedBattery", label: "Battery(ies)" },
    { key: "opportunityTitle", label: "Opportunity title", opportunityOnly: true },
];

// The fields that make sense for this kind of recipient ("LEAD" / "OPPORTUNITY").
export function mergeFieldsFor(target) {
    return MERGE_FIELDS.filter((f) => !f.opportunityOnly || target === "OPPORTUNITY");
}

export function mergeToken(key) {
    return `{{${key}}}`;
}

// `text` with `insert` replacing the [start, end) selection; returns the new
// text and the caret position just after the insertion.
export function insertAt(text, start, end, insert) {

    const value = text || "";
    const from = Math.max(0, Math.min(start ?? value.length, value.length));
    const to = Math.max(from, Math.min(end ?? from, value.length));

    return { text: value.slice(0, from) + insert + value.slice(to), caret: from + insert.length };
}
