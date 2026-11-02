import { describe, it, expect } from "vitest";

import { formatDate, formatDateTime, toIsoDate } from "../formatDate";

describe("British date formatting", () => {

    it("shows 4 May 2026 as 04/05/2026 - day first, never the American 05/04/2026", () => {
        expect(formatDate("2026-05-04")).toBe("04/05/2026");
        expect(formatDate("2026-04-05")).toBe("05/04/2026");
    });

    it("keeps a date-only value on its calendar day (no timezone shift)", () => {
        expect(formatDate("2026-01-01")).toBe("01/01/2026");
        expect(formatDate("2026-12-31")).toBe("31/12/2026");
    });

    it("shows timestamps as dd/MM/yyyy HH:mm on a 24-hour clock", () => {
        expect(formatDateTime("2026-05-04T20:05:00")).toBe("04/05/2026 20:05");
        expect(formatDateTime("2026-05-04T08:00:00")).toBe("04/05/2026 08:00");
        // a timestamp's own date part, day first
        expect(formatDate("2026-05-04T23:30:00")).toBe("04/05/2026");
    });

    it("does not depend on the browser's language", () => {
        const date = new Date(2026, 4, 4, 9, 7);
        expect(formatDate(date)).toBe("04/05/2026");
        expect(formatDateTime(date)).toBe("04/05/2026 09:07");
    });

    it("shows a dash when there is no usable date", () => {
        for (const v of [null, undefined, "", "not a date"]) {
            expect(formatDate(v)).toBe("-");
            expect(formatDateTime(v)).toBe("-");
        }
    });

    it("sends the local calendar day to the API as ISO yyyy-MM-dd", () => {
        // local midnight - toISOString() would give the previous day east of UTC
        expect(toIsoDate(new Date(2026, 4, 4))).toBe("2026-05-04");
        expect(toIsoDate(new Date(2026, 0, 1, 0, 0))).toBe("2026-01-01");
    });
});
