import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getPossibleDuplicates } from "../services/leadService";

// Non-blocking warning shown while a lead is being entered or edited: lists
// existing leads that share the phone, email or company. It never stops the
// save and never merges anything - it just lets the user review first. Leads
// outside the user's visibility are only counted (no details).
export default function DuplicateLeadWarning({ phone, email, company, excludeId }) {

    const [result, setResult] = useState(null);

    useEffect(() => {

        let cancelled = false;

        // Debounced: wait for the user to pause typing before asking.
        const timer = setTimeout(async () => {

            try {

                const data = await getPossibleDuplicates({
                    phone: phone || undefined,
                    email: email || undefined,
                    company: company || undefined,
                    excludeId: excludeId || undefined
                });

                if (!cancelled) setResult(data);

            } catch (err) {

                // A convenience only - never get in the way of entering a lead.
                console.error(err);
                if (!cancelled) setResult(null);

            }

        }, 600);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };

    }, [phone, email, company, excludeId]);

    if (!result || (result.matches.length === 0 && result.hiddenCount === 0)) {
        return null;
    }

    return (

        <div className="alert alert-warning">

            <div className="fw-semibold">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                Possible duplicate lead
            </div>

            <div className="small mb-1">
                An existing lead has the same phone, email or company. Please review before saving - you can
                still save this lead.
            </div>

            <ul className="mb-0 small">

                {result.matches.map((m) => (

                    <li key={m.id}>
                        <Link to={`/leads/${m.id}`} target="_blank" rel="noreferrer">{m.companyName}</Link>
                        {m.contactPerson ? ` - ${m.contactPerson}` : ""}
                        {m.phone ? `, ${m.phone}` : ""}
                        {" "}
                        <span className="text-muted">
                            (same {m.matchedOn.join(" / ")}; {m.status}{m.ownerName ? `; owner ${m.ownerName}` : ""})
                        </span>
                    </li>

                ))}

                {result.hiddenCount > 0 && (
                    <li className="text-muted">
                        {result.hiddenCount} more matching lead{result.hiddenCount > 1 ? "s" : ""} owned by
                        someone outside your view.
                    </li>
                )}

            </ul>

        </div>

    );

}
