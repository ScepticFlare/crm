import Leads from "./Leads";
import Opportunities from "./Opportunities";
import { getLostLeads } from "../services/leadService";
import { getLostOpportunities } from "../services/opportunityService";

export default function Lost() {
    return (
        <>
            <Leads
                title="Lost Leads"
                fetchLeads={getLostLeads}
                exportCategory="ALL"
                exportParams={{ status: "LOST" }}
            />

            <div className="mt-4">
                <Opportunities
                    title="Lost Opportunities"
                    fetchOpportunities={getLostOpportunities}
                    exportParams={{ stageType: "LOST" }}
                />
            </div>
        </>
    );
}
