// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cwd } from "node:process";

import Sidebar from "../Sidebar";

// Every employee - whatever role, existing or newly created - links their OWN
// mailbox on the Email Account page. It must never depend on the role string.
afterEach(() => {
    cleanup();
    localStorage.clear();
});

function renderAs(role) {
    if (role === null) {
        localStorage.removeItem("role");
    } else {
        localStorage.setItem("role", role);
    }
    render(<MemoryRouter><Sidebar /></MemoryRouter>);
}

describe("Email Account in the sidebar", () => {

    for (const role of ["ADMIN", "MANAGER", "EMPLOYEE", "admin", "SOMETHING_NEW", "", null]) {
        it(`is shown for role ${JSON.stringify(role)}`, () => {
            renderAs(role);
            const link = screen.getByRole("link", { name: /Email Account/ });
            expect(link.getAttribute("href")).toBe("/email-account");
        });
    }

    it("keeps the admin-only items admin-only", () => {
        renderAs("EMPLOYEE");
        expect(screen.queryByRole("link", { name: /Employees/ })).toBeNull();
        expect(screen.queryByRole("link", { name: /Backups/ })).toBeNull();
        cleanup();
        renderAs("ADMIN");
        expect(screen.getByRole("link", { name: /Employees/ })).toBeTruthy();
        expect(screen.getByRole("link", { name: /Backups/ })).toBeTruthy();
    });

    it("is routed for everyone - the /email-account route has no role guard", () => {
        const app = readFileSync(resolve(cwd(), "src/App.jsx"), "utf8");
        const route = /path="\/email-account"\s*element=\{([^}]*)\}/.exec(app);
        expect(route).not.toBeNull();
        expect(route[1].trim()).toBe("<EmailAccount />");
    });
});
