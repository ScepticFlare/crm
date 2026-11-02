// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef, useState } from "react";

import MergeFieldPicker from "../MergeFieldPicker";
import { insertAt, mergeFieldsFor } from "../../../utils/mergeFields";

afterEach(cleanup);

function Harness({ target, initial = "" }) {
    const ref = useRef(null);
    const [value, setValue] = useState(initial);
    return (
        <>
            <textarea aria-label="body" ref={ref} value={value} onChange={(e) => setValue(e.target.value)} />
            <MergeFieldPicker target={target} inputRef={ref} value={value} onChange={setValue} label="Insert field" />
        </>
    );
}

describe("merge field picker", () => {

    it("inserts the chosen field at the cursor - nobody types {{...}} by hand", () => {
        vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => cb());

        render(<Harness initial="Dear , welcome" />);

        const body = screen.getByLabelText("body");
        body.setSelectionRange(5, 5);

        fireEvent.change(screen.getByLabelText("Insert field"), { target: { value: "contactPerson" } });

        expect(body.value).toBe("Dear {{contactPerson}}, welcome");
        // the menu resets so the same field can be inserted again
        expect(screen.getByLabelText("Insert field").value).toBe("");
    });

    it("offers product and battery for everyone, opportunity title only for opportunities", () => {
        const lead = mergeFieldsFor("LEAD").map((f) => f.key);
        const opportunity = mergeFieldsFor("OPPORTUNITY").map((f) => f.key);

        expect(lead).toEqual(expect.arrayContaining(["contactPerson", "companyName", "interestedProduct", "interestedBattery"]));
        expect(lead).not.toContain("opportunityTitle");
        expect(opportunity).toContain("opportunityTitle");
    });

    it("replaces a selection and clamps out-of-range cursors", () => {
        expect(insertAt("Hello NAME!", 6, 10, "{{name}}")).toEqual({ text: "Hello {{name}}!", caret: 14 });
        expect(insertAt("Hi", undefined, undefined, "X")).toEqual({ text: "HiX", caret: 3 });
        expect(insertAt(null, 5, 9, "X")).toEqual({ text: "X", caret: 1 });
    });
});
