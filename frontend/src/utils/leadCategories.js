// The four lifecycle categories, in the same terms as the backend's
// LeadCategory. Each lead is in exactly one, so the counts add up to the total.
// The normal Leads page lists only NEW + VALID_UNCONVERTED; INVALID and
// CONVERTED leads are not shown there but stay reachable (and exportable) on
// the Lead Categories page.
export const LEAD_CATEGORY_TABS = [
    { value: "ALL", label: "All leads", countKey: "TOTAL", hint: "Every lead you can access" },
    { value: "NEW", label: "New", countKey: "NEW", hint: "Not yet reviewed" },
    { value: "VALID_UNCONVERTED", label: "Valid - not converted", countKey: "VALID_UNCONVERTED", hint: "Marked valid, no opportunity yet" },
    { value: "INVALID", label: "Invalid", countKey: "INVALID", hint: "Marked invalid" },
    { value: "CONVERTED", label: "Converted to opportunity", countKey: "CONVERTED", hint: "Valid and turned into an opportunity" },
];

export const LEAD_CATEGORY_VALUES = LEAD_CATEGORY_TABS.map((t) => t.value);
