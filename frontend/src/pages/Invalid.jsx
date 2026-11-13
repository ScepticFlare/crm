import Leads from "./Leads";
import Opportunities from "./Opportunities";
import { getInvalidLeads } from "../services/leadService";
import { getInvalidOpportunities } from "../services/opportunityService";

export default function Invalid() {
    return (
        <>
            <Leads
                title="Invalid Leads"
                fetchLeads={getInvalidLeads}
                exportCategory="ALL"
                exportParams={{ status: "INVALID" }}
                addLeadPath="/leads/add?status=INVALID"
            />

            <div className="mt-4">
                <Opportunities
                    title="Invalid Opportunities"
                    fetchOpportunities={getInvalidOpportunities}
                    // Invalid was retired into Lost: the page (and its
                    // export) lists those still Invalid or moved to Lost
                    // from it.
                    exportParams={{ formerStageType: "LEGACY_INVALID" }}
                    // Own URL state: paging / searching this list never
                    // moves the leads list above it.
                    listParamPrefix="opp_"
                />
            </div>
        </>
    );
}
