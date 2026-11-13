import { useEffect, useState } from "react";

import SectionCard from "../ui/SectionCard";
import { getLeadWhatsAppConsent, recordLeadWhatsAppConsent } from "../../services/whatsappConsentService";
import { businessTodayIso, formatDate } from "../../utils/formatDate";
import BritishDateInput from "../inputs/BritishDateInput";

// The Indian calendar day - the UTC day (toISOString) is still yesterday before 05:30 IST.
function today() {
    return businessTodayIso();
}

// WhatsApp consent of the lead's phone number, on the lead details page.
// Consent belongs to the NUMBER: an opt-out recorded through any record sharing
// it applies here too. Whoever may edit the lead can record an opt-in (with
// source, date and evidence) or an opt-out; once a number has opted out only an
// administrator can record a new opt-in.
export default function WhatsAppConsentPanel({ leadId }) {

    const [consent, setConsent] = useState(null);
    const [loadError, setLoadError] = useState(null);
    const [mode, setMode] = useState(null); // null | "OPTED_IN" | "OPTED_OUT"
    const [source, setSource] = useState("");
    const [evidence, setEvidence] = useState("");
    const [date, setDate] = useState(today());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let live = true;
        getLeadWhatsAppConsent(leadId)
            .then((c) => live && setConsent(c))
            .catch(() => live && setLoadError("WhatsApp consent could not be loaded."));
        return () => { live = false; };
    }, [leadId]);

    async function save(e) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const updated = await recordLeadWhatsAppConsent(leadId, {
                status: mode,
                source: source || undefined,
                evidence: evidence || undefined,
                consentedAt: mode === "OPTED_IN" ? date : undefined,
            });
            setConsent(updated);
            setMode(null);
            setSource("");
            setEvidence("");
        } catch (err) {
            setError(err.response?.data?.message || "Could not record WhatsApp consent.");
        } finally {
            setSaving(false);
        }
    }

    if (loadError) {
        return <SectionCard title="WhatsApp consent"><div className="small text-muted">{loadError}</div></SectionCard>;
    }

    if (!consent) {
        return null;
    }

    const badge = !consent.validPhone
        ? <span className="badge bg-secondary">No WhatsApp mobile number</span>
        : consent.status === "OPTED_IN"
            ? <span className="badge bg-success">Opted in</span>
            : consent.status === "OPTED_OUT"
                ? <span className="badge bg-danger">Opted out</span>
                : <span className="badge bg-light text-dark border">No consent recorded</span>;

    return (
        <SectionCard title="WhatsApp consent">

            <div className="mb-2" data-testid="wa-consent-status">{badge}</div>

            {consent.validPhone && (
                <div className="small text-muted mb-2">
                    Number <code>{consent.phoneMasked}</code>
                    {consent.status && <> · {consent.source} · {formatDate(consent.consentedAt)}</>}
                    {consent.evidence && <div>Evidence: {consent.evidence}</div>}
                </div>
            )}

            {consent.status === "OPTED_OUT" && !consent.canRecordOptIn && (
                <div className="small text-muted mb-2">This number opted out. Only an administrator can record a new opt-in.</div>
            )}

            {error && <div className="alert alert-danger py-2 small">{error}</div>}

            {consent.validPhone && !mode && (
                <div className="d-flex gap-2">
                    {consent.canRecordOptIn && consent.status !== "OPTED_IN" && (
                        <button className="btn btn-sm btn-outline-success" onClick={() => setMode("OPTED_IN")}>Record opt-in</button>
                    )}
                    {consent.canRecordOptOut && consent.status !== "OPTED_OUT" && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => setMode("OPTED_OUT")}>Record opt-out</button>
                    )}
                </div>
            )}

            {mode && (
                <form onSubmit={save} className="mt-2">
                    {mode === "OPTED_IN" ? (
                        <>
                            <input className="form-control form-control-sm mb-2" placeholder="Source (e.g. Phone call)" aria-label="Source"
                                   value={source} onChange={(e) => setSource(e.target.value)} required />
                            <input className="form-control form-control-sm mb-2" placeholder="Evidence (call note, form id…)" aria-label="Evidence"
                                   value={evidence} onChange={(e) => setEvidence(e.target.value)} required />
                            <div className="mb-2"><BritishDateInput className="form-control form-control-sm" aria-label="Date consent was given"
                                   value={date} max={today()} onChange={(e) => setDate(e.target.value)} required /></div>
                        </>
                    ) : (
                        <input className="form-control form-control-sm mb-2" placeholder="Note (optional)" aria-label="Evidence"
                               value={evidence} onChange={(e) => setEvidence(e.target.value)} />
                    )}
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-success" disabled={saving}>
                            {saving ? "Saving…" : mode === "OPTED_IN" ? "Save opt-in" : "Save opt-out"}
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setMode(null)} disabled={saving}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}

        </SectionCard>
    );
}
