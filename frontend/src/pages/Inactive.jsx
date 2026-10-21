import Leads from "./Leads";
import { getInactiveLeads } from "../services/leadService";

// Leads only. Two kinds of rows appear here, and the status column tells
// them apart:
//  - leads that were stored as INACTIVE by the old nightly job (shown with a
//    "was INACTIVE" tag) - kept exactly as they were, history intact;
//  - leads that are merely STALE right now (6+ months with no edit or
//    follow-up, no opportunity; shown with a "stale 6+ months" tag). Nothing
//    is written for these - the nightly job that used to mark them INACTIVE
//    has been removed, so their status never changes by itself.
// There is no equivalent Opportunity/SalesStage concept, so this page has no
// Opportunities section.
export default function Inactive() {
    return (
        <Leads
            title="Inactive Leads"
            fetchLeads={getInactiveLeads}
            notice={(
                <div className="alert alert-info py-2">
                    <strong>Stale leads need attention, not automatic action.</strong>{" "}
                    Leads with no edit or follow-up for 6+ months are listed here as <em>stale</em>;
                    their status is never changed automatically. Older leads that were marked
                    INACTIVE by the previous automatic job are still listed (tagged "was INACTIVE").
                    Only a VALID lead can be converted - review a stale lead, set it VALID or INVALID
                    yourself, or schedule a follow-up to bring it back into play.
                </div>
            )}
        />
    );
}
