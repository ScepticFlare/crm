import { describe, it, expect } from "vitest";

import { businessTodayIso, formatDate, formatDateTime, isoToBritish, parseBritishDate, parseTime24, toIsoDate } from "../formatDate";

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

describe("typed British dates - strictly day first, never guessed", () => {

    it("reads 03/04/2026 as 3 April 2026, never as 4 March", () => {
        expect(parseBritishDate("03/04/2026")).toBe("2026-04-03");
        expect(parseBritishDate("04/03/2026")).toBe("2026-03-04");
        expect(parseBritishDate("12/11/2026")).toBe("2026-11-12");
    });

    it("accepts single digits, '.' or '-' separators and 8 digits, all day first", () => {
        expect(parseBritishDate("1/2/2026")).toBe("2026-02-01");
        expect(parseBritishDate("01.02.2026")).toBe("2026-02-01");
        expect(parseBritishDate("01-02-2026")).toBe("2026-02-01");
        expect(parseBritishDate("01022026")).toBe("2026-02-01");
        expect(parseBritishDate("  12/11/2026 ")).toBe("2026-11-12");
    });

    it("rejects anything that is not a real calendar date instead of reinterpreting it", () => {
        for (const bad of ["31/02/2026", "29/02/2025", "13/13/2026", "00/01/2026", "32/01/2026",
            "2026-04-03", "04/03/26", "12/11", "abc", "", "12/11/2026x", null, undefined]) {
            expect(parseBritishDate(bad)).toBeNull();
        }
        expect(parseBritishDate("29/02/2028")).toBe("2028-02-29");      // a real leap day
        // a month-first American date with a day over 12 is not silently swapped
        expect(parseBritishDate("11/30/2026")).toBeNull();
    });

    it("round-trips every day of a year: ISO -> DD/MM/YYYY -> the same ISO", () => {
        const day = new Date(2026, 0, 1);
        while (day.getFullYear() === 2026) {
            const iso = toIsoDate(day);
            const shown = isoToBritish(iso);
            expect(shown).toBe(formatDate(iso));
            expect(parseBritishDate(shown)).toBe(iso);
            day.setDate(day.getDate() + 1);
        }
    });

    it("shows the date part of an API value without any time-zone shift", () => {
        expect(isoToBritish("2026-11-12")).toBe("12/11/2026");
        expect(isoToBritish("2026-01-01T00:30:00")).toBe("01/01/2026");
        expect(isoToBritish("")).toBe("");
        expect(isoToBritish("2026-02-30")).toBe("");
        expect(isoToBritish(null)).toBe("");
    });

    it("reads times on a 24-hour clock only", () => {
        expect(parseTime24("14:30")).toBe("14:30");
        expect(parseTime24("9:05")).toBe("09:05");
        expect(parseTime24("09.05")).toBe("09:05");
        expect(parseTime24("0905")).toBe("09:05");
        expect(parseTime24("00:00")).toBe("00:00");
        for (const bad of ["24:00", "12:60", "2:30 PM", "230", "", null]) {
            expect(parseTime24(bad)).toBeNull();
        }
    });
});

describe("today in India, whatever the computer's clock zone", () => {

    it("is already the new day between 00:00 and 05:30 IST, when the UTC day is still yesterday", () => {
        const halfPastMidnightIst = new Date("2026-11-11T19:00:00Z");    // 12 Nov 00:30 IST
        expect(halfPastMidnightIst.toISOString().slice(0, 10)).toBe("2026-11-11");   // the old, wrong answer
        expect(businessTodayIso(halfPastMidnightIst)).toBe("2026-11-12");
        expect(businessTodayIso(new Date("2026-11-11T23:59:59Z"))).toBe("2026-11-12");  // 05:29 IST
    });

    it("changes exactly at midnight IST (18:30 UTC)", () => {
        expect(businessTodayIso(new Date("2026-11-12T18:29:59Z"))).toBe("2026-11-12");
        expect(businessTodayIso(new Date("2026-11-12T18:30:00Z"))).toBe("2026-11-13");
        expect(businessTodayIso(new Date("2026-12-31T18:30:00Z"))).toBe("2027-01-01");
    });

    it("is a valid API date that shows as DD/MM/YYYY", () => {
        const today = businessTodayIso(new Date("2026-11-11T19:00:00Z"));
        expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(isoToBritish(today)).toBe("12/11/2026");
    });
});
