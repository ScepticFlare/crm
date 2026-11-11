import api from "./api";

// The signed-in employee's OWN sending mailbox (Gmail / Microsoft 365). Every
// CRM email is sent from it. The backend never returns tokens - only the
// connected address, the provider and the status.

export const getMyMailbox = async () => (await api.get("/email-accounts/me")).data;

// Starts the OAuth connection; the caller navigates the browser to the URL.
export const startMailboxConnection = async (provider) =>
    (await api.post(`/email-accounts/connect/${provider}`)).data.authorizationUrl;

export const disconnectMailbox = async () => (await api.delete("/email-accounts/me")).data;

// Fixed reason codes the backend appends after a connection attempt.
export const CONNECT_ERRORS = {
    // Also what Microsoft returns when the organisation requires an administrator
    // to approve the app and the user goes back without that approval.
    access_denied: "No permission was granted, so no mailbox was connected. If you did not decline it yourself, your organisation may require an administrator to approve the CRM app first.",
    consent_required: "Your organisation requires an administrator to approve the CRM app before you can connect your mailbox. Ask your Microsoft 365 administrator, then try again.",
    interaction_required: "Your organisation requires an extra sign-in step or an administrator's approval. Try again, or ask your Microsoft 365 administrator.",
    invalid_grant: "The sign-in could not be completed (it may have expired or been used already). Start again from this page.",
    invalid_request: "The sign-in request was not valid. Start again from this page.",
    invalid_scope: "The CRM's sign-in settings ask for a permission the provider rejected. Contact an administrator.",
    unauthorized_client: "The CRM app is not allowed to sign in this account type. Contact an administrator.",
    temporarily_unavailable: "The provider's sign-in service is temporarily unavailable. Try again in a moment.",
    server_error: "Something went wrong while connecting your mailbox. Try again in a moment.",
    token_invalid: "The provider returned an unusable response. Try again in a moment.",
    invalid_state: "This connection link was not valid or was already used. Start again from this page.",
    expired_state: "The connection took too long and expired. Start again from this page.",
    missing_send_permission: "Permission to send email was not granted. Connect again and allow sending email.",
    no_refresh_token: "The provider did not grant lasting access. Remove the CRM app from your account's connected apps, then connect again.",
    email_mismatch: "That mailbox is not your CRM login address. Sign in to the provider with your own work mailbox.",
    mailbox_in_use: "That mailbox is already connected to another CRM user.",
    no_mailbox: "That Microsoft account has no Exchange Online mailbox, so it cannot send email.",
    tenant_not_allowed: "That Microsoft account belongs to an organisation this CRM does not accept.",
    not_permitted: "Your account is not allowed to send CRM email.",
    not_configured: "This email provider is not set up on the server. Contact an administrator.",
    client_misconfigured: "The CRM's sign-in settings for this provider are not valid. Contact an administrator.",
    provider_unavailable: "The provider could not be reached. Try again in a moment.",
    profile_unavailable: "The provider did not return your mailbox address. Try again in a moment.",
    identity_invalid: "The sign-in response could not be verified. Start again from this page.",
};
