import Leads from "./Leads";
import Opportunities from "./Opportunities";
import { getUnresponsiveLeads } from "../services/leadService";
import { getUnresponsiveOpportunities } from "../services/opportunityService";

export default function Unresponsive() {
    return (
        <>
            <Leads
                title="Unresponsive Leads"
                fetchLeads={getUnresponsiveLeads}
                exportCategory="ALL"
                exportParams={{ status: "UNRESPONSIVE" }}
            />

            <div className="mt-4">
                <Opportunities
                    title="Unresponsive Opportunities"
                    fetchOpportunities={getUnresponsiveOpportunities}
                    // Unresponsive was retired into Dropped: the page (and
                    // its export) lists those still Unresponsive or moved to
                    // Dropped from it.
                    exportParams={{ formerStageType: "LEGACY_UNRESPONSIVE" }}
                    // Own URL state: paging / searching this list never
                    // moves the leads list above it.
                    listParamPrefix="opp_"
                />
            </div>
        </>
    );
}
