import Leads from "./Leads";
import { getInactiveLeads } from "../services/leadService";

// Leads only - INACTIVE is a LeadStatus value set exclusively by
// scheduler.StaleLeadScheduler (6+ months with no meaningful activity).
// There is no equivalent Opportunity/SalesStage concept (unlike Invalid,
// which also has an "INVALID" sales stage), so this page doesn't render an
// Opportunities section the way Dropped/Lost/Unresponsive/Invalid do.
export default function Inactive() {
    return (
        <Leads
            title="Inactive Leads"
            fetchLeads={getInactiveLeads}
        />
    );
}
