// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const api = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn() }));

vi.mock("../../services/api", () => ({ default: api }));

import EmailAccount from "../EmailAccount";

const NOT_CONNECTED = {
    configured: true, providers: { google: true, microsoft: true }, canConnect: true,
    connected: false, needsReconnect: false,
};

const CONNECTED = {
    configured: true, providers: { google: true, microsoft: true }, canConnect: true,
    connected: true, provider: "google", emailAddress: "asha@company.test", status: "CONNECTED",
    needsReconnect: false, connectedAt: "2026-11-11T10:00:00", lastUsedAt: null,
};

let assign;

beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState(null, "", "/email-account");
    assign = vi.fn();
    Object.defineProperty(window, "location", {
        configurable: true,
        value: { ...window.location, assign, search: "", pathname: "/email-account" },
    });
});

afterEach(cleanup);

describe("Email Account page", () => {

    it("offers Google and Microsoft when nothing is connected, and starts the OAuth flow", async () => {
        api.get.mockResolvedValue({ data: NOT_CONNECTED });
        api.post.mockResolvedValue({ data: { authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth?x=1" } });

        render(<EmailAccount />);

        fireEvent.click(await screen.findByRole("button", { name: /Connect Google/ }));

        await waitFor(() => expect(assign).toHaveBeenCalledWith("https://accounts.google.com/o/oauth2/v2/auth?x=1"));
        expect(api.post).toHaveBeenCalledWith("/email-accounts/connect/google");
        expect(screen.getByRole("button", { name: /Connect Microsoft/ })).toBeTruthy();
    });

    it("disables a provider the server is not set up for", async () => {
        api.get.mockResolvedValue({ data: { ...NOT_CONNECTED, providers: { google: true, microsoft: false } } });

        render(<EmailAccount />);

        expect((await screen.findByRole("button", { name: /Connect Microsoft/ })).disabled).toBe(true);
        expect(screen.getByRole("button", { name: /Connect Google/ }).disabled).toBe(false);
    });

    it("shows the connected address and provider, and disconnects after confirmation", async () => {
        api.get.mockResolvedValue({ data: CONNECTED });
        api.delete.mockResolvedValue({ data: { ...NOT_CONNECTED, providerRevoked: true } });

        render(<EmailAccount />);

        expect(await screen.findByText("asha@company.test")).toBeTruthy();
        expect(screen.getByText("Gmail")).toBeTruthy();
        expect(screen.getByText("Connected", { selector: ".badge" })).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
        expect(api.delete).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: "Yes, disconnect" }));

        await waitFor(() => expect(api.delete).toHaveBeenCalledWith("/email-accounts/me"));
        expect(await screen.findByText(/access was revoked/)).toBeTruthy();
        expect(screen.getByRole("button", { name: /Connect Google/ })).toBeTruthy();
    });

    it("asks to reconnect when the provider revoked the connection", async () => {
        api.get.mockResolvedValue({
            data: { ...CONNECTED, status: "NEEDS_REAUTH", needsReconnect: true, statusDetail: "Google no longer accepts this mailbox connection." },
        });

        render(<EmailAccount />);

        expect(await screen.findByText(/Google no longer accepts this mailbox connection/)).toBeTruthy();
        expect(screen.getByRole("button", { name: "Reconnect Gmail" })).toBeTruthy();
    });

    it("explains a failed connection from the result code only", async () => {
        window.location.search = "?result=error&reason=email_mismatch&provider=google";
        api.get.mockResolvedValue({ data: NOT_CONNECTED });

        render(<EmailAccount />);

        expect(await screen.findByText(/not your CRM login address/)).toBeTruthy();
    });

    it("explains Microsoft's admin-approval outcomes instead of blaming the user", async () => {
        api.get.mockResolvedValue({ data: NOT_CONNECTED });

        window.location.search = "?result=error&reason=consent_required&provider=microsoft";
        render(<EmailAccount />);
        expect(await screen.findByText(/requires an administrator to approve the CRM app/)).toBeTruthy();
        cleanup();

        window.location.search = "?result=error&reason=access_denied&provider=microsoft";
        render(<EmailAccount />);
        expect(await screen.findByText(/may require an administrator to approve/)).toBeTruthy();
    });

    it("never offers a connection to a role without email sending", async () => {
        api.get.mockResolvedValue({ data: { ...NOT_CONNECTED, canConnect: false } });

        render(<EmailAccount />);

        expect(await screen.findByText(/does not include sending CRM email/)).toBeTruthy();
        expect(screen.queryByRole("button", { name: /Connect/ })).toBeNull();
    });
});
