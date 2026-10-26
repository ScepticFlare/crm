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
                    exportParams={{ stageType: "LEGACY_UNRESPONSIVE" }}
                />
            </div>
        </>
    );
}
