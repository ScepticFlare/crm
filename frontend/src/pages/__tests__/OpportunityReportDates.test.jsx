// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";

// The page's data services are not under test - only its column renderers.
vi.mock("../../services/api", () => ({ default: { get: vi.fn(), post: vi.fn() }, toListParams: (x) => x }));

import { ALL_OPPORTUNITY_COLUMNS } from "../Opportunities";

// The Opportunities table is the In Progress / Postponed / Lost / ... report
// view (they all render it). 4 May / 7 June catch a US month/day swap.
const row = {
    expectedClosingDate: "2030-05-04",
    nextFollowUpDate: "2030-05-04T09:30:00",
    postponedReviewDate: "2030-06-07",
    createdAt: "2030-05-04T08:05:00",
    updatedAt: "2030-06-07T17:45:00",
};

const render = (key) => ALL_OPPORTUNITY_COLUMNS.find((c) => c.key === key).render(row);

describe("opportunity report dates", () => {

    it("shows every date column as dd/MM/yyyy", () => {
        expect(render("date")).toBe("04/05/2030");                  // Closing Date
        expect(render("postponedReviewDate")).toBe("07/06/2030");
        expect(render("createdAt")).toBe("04/05/2030");
        expect(render("updatedAt")).toBe("07/06/2030");
    });

    it("shows the next follow-up as dd/MM/yyyy HH:mm", () => {
        expect(render("nextFollowUp")).toBe("04/05/2030 09:30");
    });

    it("shows a missing date as '-', never a guess", () => {
        const empty = ALL_OPPORTUNITY_COLUMNS.find((c) => c.key === "nextFollowUp").render({});
        expect(empty).toBe("-");
    });

    it("covers every date column the table has", () => {
        const dateColumns = ALL_OPPORTUNITY_COLUMNS
            .filter((c) => /date|follow-up|created|modified/i.test(c.label))
            .map((c) => c.key);
        expect(dateColumns.sort()).toEqual(["createdAt", "date", "nextFollowUp", "postponedReviewDate", "updatedAt"].sort());
    });
});
