// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import BritishDateInput, { DATE_FORMAT_MESSAGE } from "../BritishDateInput";
import BritishDateTimeInput, { TIME_FORMAT_MESSAGE } from "../BritishDateTimeInput";

// A controlled parent, like the CRM's forms: state holds the ISO value the API uses.
function DateForm({ initial = "", onValue, ...props }) {
    const [value, setValue] = useState(initial);
    return (
        <form>
            <BritishDateInput aria-label="Closing date" name="closingDate" value={value}
                onChange={(e) => { setValue(e.target.value); onValue?.(e.target); }} {...props} />
            <output data-testid="iso">{value}</output>
            <button type="button" onClick={() => setValue("2027-01-31")}>load</button>
        </form>
    );
}

function DateTimeForm({ initial = "", onValue, ...props }) {
    const [value, setValue] = useState(initial);
    return (
        <form>
            <BritishDateTimeInput aria-label="Follow-up date" name="scheduledDate" value={value}
                onChange={(e) => { setValue(e.target.value); onValue?.(e.target); }} {...props} />
            <output data-testid="iso">{value}</output>
        </form>
    );
}

const dateField = () => screen.getByLabelText("Closing date");
const iso = () => screen.getByTestId("iso").textContent;

// An American-English browser: native date inputs would show mm/dd/yyyy here.
beforeEach(() => {
    vi.spyOn(navigator, "language", "get").mockReturnValue("en-US");
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["en-US"]);
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("BritishDateInput", () => {

    it("shows an API date as DD/MM/YYYY even in an en-US browser, and is not a native date field", () => {
        render(<DateForm initial="2026-11-12" />);
        expect(dateField().value).toBe("12/11/2026");
        expect(dateField().type).toBe("text");
        expect(dateField().placeholder).toBe("DD/MM/YYYY");
    });

    it("sends what was typed day first, in the API's yyyy-MM-dd, with the field name", () => {
        const onValue = vi.fn();
        render(<DateForm onValue={onValue} />);
        fireEvent.change(dateField(), { target: { value: "03/04/2026" } });
        expect(iso()).toBe("2026-04-03");                                   // 3 April, not 4 March
        expect(onValue).toHaveBeenLastCalledWith(expect.objectContaining({ name: "closingDate", value: "2026-04-03" }));
    });

    it("never sends a half-typed or impossible date, and blocks the form's submit instead", () => {
        render(<DateForm initial="2026-11-12" />);

        fireEvent.change(dateField(), { target: { value: "31/02/2026" } });
        expect(iso()).toBe("");
        expect(dateField().value).toBe("31/02/2026");                       // the text is kept for correcting
        expect(dateField().validationMessage).toBe(DATE_FORMAT_MESSAGE);
        expect(dateField().checkValidity()).toBe(false);

        fireEvent.change(dateField(), { target: { value: "11/30/2026" } });   // American order
        expect(iso()).toBe("");
        expect(dateField().checkValidity()).toBe(false);

        fireEvent.change(dateField(), { target: { value: "12/1" } });       // still typing
        expect(dateField().value).toBe("12/1");                             // not wiped by the re-render
        fireEvent.change(dateField(), { target: { value: "12/11/2026" } });
        expect(iso()).toBe("2026-11-12");
        expect(dateField().checkValidity()).toBe(true);
    });

    it("tidies a short date on blur and clears to an empty value", () => {
        render(<DateForm />);
        fireEvent.change(dateField(), { target: { value: "1/2/2026" } });
        fireEvent.blur(dateField());
        expect(dateField().value).toBe("01/02/2026");
        expect(iso()).toBe("2026-02-01");

        fireEvent.change(dateField(), { target: { value: "" } });
        expect(iso()).toBe("");
        expect(dateField().checkValidity()).toBe(true);
    });

    it("follows a value the parent sets later (a loaded record or a reset)", () => {
        render(<DateForm initial="2026-11-12" />);
        fireEvent.click(screen.getByText("load"));
        expect(dateField().value).toBe("31/01/2027");
    });

    it("enforces min / max with a British message", () => {
        render(<DateForm min="2026-11-01" max="2026-11-30" />);
        fireEvent.change(dateField(), { target: { value: "31/10/2026" } });
        expect(iso()).toBe("");
        expect(dateField().validationMessage).toBe("The date must be on or after 01/11/2026.");
        fireEvent.change(dateField(), { target: { value: "01/12/2026" } });
        expect(dateField().validationMessage).toBe("The date must be on or before 30/11/2026.");
        fireEvent.change(dateField(), { target: { value: "15/11/2026" } });
        expect(iso()).toBe("2026-11-15");
    });

    it("keeps required working like a native field", () => {
        render(<DateForm required />);
        expect(dateField().required).toBe(true);
        expect(dateField().checkValidity()).toBe(false);
    });
});

describe("BritishDateTimeInput", () => {

    const timeField = () => screen.getByLabelText("Time (HH:MM, 24-hour)");

    it("shows an API timestamp as DD/MM/YYYY and HH:MM on a 24-hour clock", () => {
        render(<DateTimeForm initial="2026-11-12T14:30:00" />);
        expect(screen.getByLabelText("Follow-up date").value).toBe("12/11/2026");
        expect(timeField().value).toBe("14:30");
    });

    it("sends yyyy-MM-ddTHH:mm (what datetime-local sent) only once both parts are valid", () => {
        render(<DateTimeForm />);
        fireEvent.change(screen.getByLabelText("Follow-up date"), { target: { value: "04/05/2030" } });
        expect(iso()).toBe("");
        expect(timeField().checkValidity()).toBe(false);                    // date without a time
        fireEvent.change(timeField(), { target: { value: "2:30 PM" } });
        expect(iso()).toBe("");
        expect(timeField().validationMessage).toBe(TIME_FORMAT_MESSAGE);
        fireEvent.change(timeField(), { target: { value: "14:30" } });
        expect(iso()).toBe("2030-05-04T14:30");                             // 4 May, local wall-clock time
    });

    it("refuses a time before min", () => {
        render(<DateTimeForm min="2030-05-04T10:00" />);
        fireEvent.change(screen.getByLabelText("Follow-up date"), { target: { value: "04/05/2030" } });
        fireEvent.change(timeField(), { target: { value: "09:59" } });
        expect(iso()).toBe("");
        expect(timeField().validationMessage).toBe("Choose a time after 04/05/2030 10:00.");
        fireEvent.change(timeField(), { target: { value: "10:00" } });
        expect(iso()).toBe("2030-05-04T10:00");
    });
});
