// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../services/activityService", () => ({ logout: vi.fn(async () => ({})) }));

import TopNavbar from "../TopNavbar";

afterEach(() => {
    cleanup();
    localStorage.clear();
});

describe("logging out", () => {

    it("removes every session key, including employeeId, and keeps per-browser preferences", async () => {
        localStorage.setItem("token", "t");
        localStorage.setItem("role", "ADMIN");
        localStorage.setItem("employeeId", "7");
        localStorage.setItem("employeeName", "Rebecca");
        localStorage.setItem("crm.columns.leads", "[\"name\"]");

        render(<MemoryRouter><TopNavbar /></MemoryRouter>);
        fireEvent.click(screen.getByText(/logout/i));

        await waitFor(() => expect(localStorage.getItem("token")).toBeNull());
        expect(localStorage.getItem("role")).toBeNull();
        expect(localStorage.getItem("employeeId")).toBeNull();
        expect(localStorage.getItem("employeeName")).toBeNull();
        expect(localStorage.getItem("crm.columns.leads")).toBe("[\"name\"]");
    });
});
