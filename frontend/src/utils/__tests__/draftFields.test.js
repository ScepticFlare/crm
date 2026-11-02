import { describe, it, expect } from "vitest";

import { applyDraftEdit, fieldsUsed, layoutDraft, parseDraft } from "../draftFields";

const f = (key, label, value) => ({ key, label, value });

// As the backend's EmailPlaceholderRenderer.fieldValues sends them: every
// accepted spelling, value null when the record has none.
function fieldsOf(values) {
    const m = {
        contactPerson: f("contactPerson", "Contact person", values.contactPerson ?? null),
        companyName: f("companyName", "Company", values.companyName ?? null),
        interestedProduct: f("interestedProduct", "Product", values.interestedProduct ?? null),
    };
    return { ...m, name: m.contactPerson, company: m.companyName, product: m.interestedProduct };
}

const RAJESH = fieldsOf({ contactPerson: "Rajesh", companyName: "Acme", interestedProduct: "Genset, UPS" });
const NO_NAME = fieldsOf({ companyName: "Beta" });

describe("draftFields", () => {

    it("shows the draft filled in with the record's values, never a {{token}}", () => {
        const raw = "Dear {{contactPerson}}, about {{ product }} for {{company}}";
        expect(layoutDraft(raw, RAJESH).display).toBe("Dear Rajesh, about Genset, UPS for Acme");
        expect(layoutDraft(raw, RAJESH).display).not.toContain("{{");
    });

    it("flags a missing value and an unsupported field in place, without inventing anything", () => {
        const raw = "Dear {{contactPerson}} at {{companyName}} {{nmae}}";
        const shown = layoutDraft(raw, NO_NAME).display;

        expect(shown).toBe('Dear [Contact person missing] at Beta [Unknown field "nmae"]');
        expect(shown).not.toContain("{{");

        const used = fieldsUsed([raw], NO_NAME);
        expect(used.filter((x) => x.missing).map((x) => x.label)).toEqual(["Contact person"]);
        expect(used.filter((x) => x.unknown).map((x) => x.name)).toEqual(["nmae"]);
    });

    it("the same draft shows each record's own values", () => {
        const raw = "Hello {{name}}";
        expect(layoutDraft(raw, RAJESH).display).toBe("Hello Rajesh");
        expect(layoutDraft(raw, fieldsOf({ contactPerson: "Meera" })).display).toBe("Hello Meera");
    });

    it("typing outside a value edits the draft and keeps the field for every recipient", () => {
        const raw = "Dear {{contactPerson}},";

        // "Dear Rajesh," -> "Dear Rajesh, thanks" (caret at the end)
        expect(applyDraftEdit(raw, RAJESH, "Dear Rajesh, thanks", 19).raw).toBe("Dear {{contactPerson}}, thanks");

        // typed right before the value, with a character equal to its first letter
        expect(applyDraftEdit(raw, RAJESH, "Dear RRajesh,", 6).raw).toBe("Dear R{{contactPerson}},");

        // right after it
        expect(applyDraftEdit(raw, RAJESH, "Dear Rajesh Kumar,", 17).raw).toBe("Dear {{contactPerson}} Kumar,");
    });

    it("a value cannot be partly edited, but can be removed as a whole", () => {
        const raw = "Dear {{contactPerson}},";

        expect(applyDraftEdit(raw, RAJESH, "Dear Rajsh,", 8).rejected.label).toBe("Contact person");
        expect(applyDraftEdit(raw, RAJESH, "Dear Ra-jesh,", 8).rejected).toBeTruthy();
        expect(applyDraftEdit(raw, RAJESH, "Dear ,", 5).raw).toBe("Dear ,");
        expect(applyDraftEdit(raw, NO_NAME, "Dear ,", 5).raw).toBe("Dear ,");
    });

    it("an edit spanning text and whole values removes them", () => {
        const raw = "A {{name}} B {{company}} C";
        expect(applyDraftEdit(raw, RAJESH, "A C", 2).raw).toBe("A C");
    });

    it("treats Windows line breaks in a saved template like the browser does", () => {
        const raw = "Dear {{name}},\r\nThanks";
        expect(layoutDraft(raw, RAJESH).display).toBe("Dear Rajesh,\nThanks");
        expect(applyDraftEdit(raw, RAJESH, "Dear Rajesh,\nThanks!", 20).raw).toBe("Dear {{name}},\nThanks!");
    });

    it("parses the same token grammar as the backend", () => {
        expect(parseDraft("{{ contactPerson }}{{x_1}}{{bad-name}}").map((s) => s.type))
            .toEqual(["field", "field", "text"]);
    });
});
