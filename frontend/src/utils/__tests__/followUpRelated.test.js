import { describe, expect, it } from "vitest";

import {
    companyText, groupTargets, linkNote, relatedOf, targetDetails, targetFromFollowUp, targetKey, targetTitle,
} from "../followUpRelated";

const oppFollowUp = {
    id: 1, lead: null,
    opportunity: {
        id: 40, title: "6kva online ups", salesStage: { name: "IN PROGRESS" },
        lead: { id: 7, companyName: "Metro Diagnostics", contactPerson: "Ms Iyer", assignedEmployee: { id: 3, name: "lakshmi narayana" } },
    },
};

describe("what a follow-up is about", () => {

    it("uses the backend's related block as is", () => {
        const related = { kind: "OPPORTUNITY", companyName: "From API", leadId: 7, opportunityId: 40 };
        expect(relatedOf({ ...oppFollowUp, related })).toBe(related);
    });

    it("derives the company of an opportunity follow-up from the opportunity's lead (no lead of its own)", () => {
        const r = relatedOf(oppFollowUp);
        expect(r.kind).toBe("OPPORTUNITY");
        expect(r.companyName).toBe("Metro Diagnostics");
        expect(r.leadId).toBe(7);
        expect(r.leadViaOpportunity).toBe(true);
        expect(r.ownerName).toBe("lakshmi narayana");
        expect(r.label).toBe("Metro Diagnostics - 6kva online ups");
        expect(linkNote(r)).toBe("Opportunity follow-up");
    });

    it("never shows a bare dash: meaningful fallbacks when a link genuinely does not exist", () => {
        const legacy = relatedOf({ id: 2, opportunity: { id: 41, title: "Legacy 5kva" } });
        expect(companyText(legacy)).toBe("No linked lead");
        expect(legacy.label).toBe("Opportunity: Legacy 5kva");
        expect(linkNote(legacy)).toBe("Opportunity follow-up (no linked lead)");
        expect(companyText(relatedOf({ id: 3 }))).toBe("No linked record");
        expect(companyText(null)).toBe("No linked record");
    });

    it("prefers the follow-up's own lead and does not invent one from a name", () => {
        const r = relatedOf({ id: 4, lead: { id: 8, companyName: "Lotus Textiles" }, opportunity: null });
        expect(r.kind).toBe("LEAD");
        expect(r.leadViaOpportunity).toBe(false);
        expect(r.opportunityId).toBeNull();
        expect(linkNote(r)).toBe("Lead follow-up");
    });
});

describe("picker options", () => {

    const a = { type: "OPPORTUNITY", opportunityId: 40, leadId: 7, companyName: "Green Valley School", opportunityTitle: "6kva online ups", stage: "IN PROGRESS", contactPerson: "Principal", assignedEmployeeName: "lakshmi" };
    const b = { ...a, opportunityId: 41, leadId: 8, companyName: "Harbour Logistics", contactPerson: "Ops head" };
    const lead = { type: "LEAD", leadId: 9, companyName: "Sunrise Hospital", contactPerson: "Dr Rao", assignedEmployeeName: "ravi" };

    it("tells two same-named opportunities apart by company, id, contact and owner", () => {
        expect(targetTitle(a)).toBe("Green Valley School - 6kva online ups");
        expect(targetTitle(b)).toBe("Harbour Logistics - 6kva online ups");
        expect(targetDetails(a)).toBe("Opportunity #40 · IN PROGRESS · Contact: Principal · Owner: lakshmi");
        expect(targetKey(a)).not.toBe(targetKey(b));
        expect(targetKey(lead)).toBe("L9");
        expect(targetDetails(lead)).toBe("Lead #9 · Contact: Dr Rao · Owner: ravi");
    });

    it("groups opportunities and unconverted leads", () => {
        expect(groupTargets([lead, a, b])).toEqual([
            { label: "Opportunities", options: [a, b] },
            { label: "Leads (not yet converted)", options: [lead] },
        ]);
        expect(groupTargets([])).toEqual([]);
    });

    it("starts an edit from exactly the ids the follow-up is stored with", () => {
        expect(targetFromFollowUp(oppFollowUp)).toMatchObject({ type: "OPPORTUNITY", opportunityId: 40, leadId: null, companyName: "Metro Diagnostics" });
        expect(targetFromFollowUp({ id: 5, lead: { id: 8, companyName: "Lotus" } })).toMatchObject({ type: "LEAD", leadId: 8, opportunityId: null });
        const both = { id: 6, lead: { id: 7, companyName: "Metro" }, opportunity: { id: 40, title: "x", lead: { id: 7 } } };
        expect(targetFromFollowUp(both)).toMatchObject({ leadId: 7, opportunityId: 40 });
        expect(targetFromFollowUp({ id: 9 })).toBeNull();
    });
});
