import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { cwd } from "node:process";

// Guards against the two date bugs coming back:
//  - a native <input type="date"> / datetime-local shows the BROWSER's format
//    (mm/dd/yyyy on an American-English machine) - use BritishDateInput /
//    BritishDateTimeInput instead;
//  - new Date().toISOString().slice(0, 10) is the UTC day, i.e. "yesterday"
//    before 05:30 IST - use businessTodayIso() or toIsoDate() instead.
const SRC = join(cwd(), "src");
const ALLOWED = new Set([join("components", "inputs", "BritishDateInput.jsx")]);

// Code only: explanatory comments may name the forbidden patterns.
function code(path) {
    return readFileSync(path, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function sources(dir) {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) {
            return name === "__tests__" ? [] : sources(path);
        }
        return /\.(jsx?|tsx?)$/.test(name) ? [path] : [];
    });
}

describe("date inputs across the CRM", () => {

    const files = sources(SRC);

    it("finds the source files", () => {
        expect(files.length).toBeGreaterThan(50);
    });

    it("uses no browser-native date or date-time inputs outside the British components", () => {
        const offenders = files
            .filter((f) => !ALLOWED.has(relative(SRC, f)))
            .filter((f) => /type\s*=\s*["'](date|datetime-local)["']/.test(code(f)))
            .map((f) => relative(SRC, f).split(sep).join("/"));
        expect(offenders).toEqual([]);
    });

    it("never takes today's date from the UTC clock", () => {
        const offenders = files
            .filter((f) => /toISOString\(\)\s*\.slice\(0,\s*10\)/.test(code(f)))
            .map((f) => relative(SRC, f).split(sep).join("/"));
        expect(offenders).toEqual([]);
    });
});
