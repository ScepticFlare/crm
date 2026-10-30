// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const leadService = vi.hoisted(() => ({
    createLead: vi.fn(),
    getPossibleDuplicates: vi.fn(),
}));

vi.mock("../../services/leadService", () => leadService);
vi.mock("../../services/employeeService", () => ({ getAllEmployees: vi.fn().mockResolvedValue([]) }));
vi.mock("../../services/industryService", () => ({
    getAllIndustries: vi.fn().mockResolvedValue([]), getAllIndustriesAdmin: vi.fn(),
    createIndustry: vi.fn(), deleteIndustry: vi.fn(), activateIndustry: vi.fn(),
}));
vi.mock("../../services/leadSourceService", () => ({
    getAllLeadSources: vi.fn().mockResolvedValue([]), getAllLeadSourcesAdmin: vi.fn(),
    createLeadSource: vi.fn(), deleteLeadSource: vi.fn(), activateLeadSource: vi.fn(),
}));
vi.mock("../../services/productService", () => ({
    getAllProducts: vi.fn().mockResolvedValue([{ id: 1, name: "Online UPS" }]), getAllProductsAdmin: vi.fn(),
    createProduct: vi.fn(), deleteProduct: vi.fn(), activateProduct: vi.fn(),
}));
vi.mock("../../services/batteryService", () => ({
    getAllBatteries: vi.fn().mockResolvedValue([{ id: 2, name: "SMF 12V" }]), getAllBatteriesAdmin: vi.fn(),
    createBattery: vi.fn(), deleteBattery: vi.fn(), activateBattery: vi.fn(),
}));

import AddLead from "../AddLead";

beforeEach(() => {
    localStorage.setItem("role", "EMPLOYEE");
    localStorage.setItem("employeeId", "3");
    leadService.createLead.mockReset();
    leadService.getPossibleDuplicates.mockResolvedValue({ matches: [], hiddenCount: 0 });
    vi.spyOn(window, "alert").mockImplementation(() => {});
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
});

function submit() {
    fireEvent.submit(document.querySelector("form"));
}

describe("Add Lead: Product and Battery are mandatory", () => {

    it("marks both fields as required", async () => {
        render(<MemoryRouter><AddLead /></MemoryRouter>);

        expect(await screen.findByText("Products *")).toBeTruthy();
        expect(screen.getByText("Battery *")).toBeTruthy();
    });

    it("does not save without a Product or a Battery, and says which is missing", async () => {
        render(<MemoryRouter><AddLead /></MemoryRouter>);
        await screen.findByText("Products *");

        submit();

        expect(await screen.findByText("Please select at least one Product.")).toBeTruthy();
        expect(screen.getByText("Please select at least one Battery.")).toBeTruthy();
        expect(leadService.createLead).not.toHaveBeenCalled();
    });

    it("saves once both are picked, sending them to the backend", async () => {
        leadService.createLead.mockResolvedValue({ id: 10 });
        render(<MemoryRouter><AddLead /></MemoryRouter>);
        await screen.findByText("Products *");

        const [productSelect, batterySelect] = await waitFor(() => {
            const selects = Array.from(document.querySelectorAll("select[name='itemId']"));
            const ready = selects.filter((s) => s.options.length > 1);
            if (ready.length < 2) throw new Error("options not loaded yet");
            return ready;
        });

        fireEvent.change(productSelect, { target: { name: "itemId", value: "1" } });
        fireEvent.change(batterySelect, { target: { name: "itemId", value: "2" } });

        submit();

        await waitFor(() => expect(leadService.createLead).toHaveBeenCalled());
        const sent = leadService.createLead.mock.calls[0][0];
        expect(sent.products).toEqual([{ productId: 1, quantity: 1 }]);
        expect(sent.batteries).toEqual([{ batteryId: 2, quantity: 1 }]);
        expect(screen.queryByText("Please select at least one Product.")).toBeNull();
    });
});
