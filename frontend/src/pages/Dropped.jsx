import Leads from "./Leads";
import Opportunities from "./Opportunities";
import { getDroppedLeads } from "../services/leadService";
import { getDroppedOpportunities } from "../services/opportunityService";

export default function Dropped() {
    return (
        <>
            <Leads
                title="Dropped Leads"
                fetchLeads={getDroppedLeads}
            />

            <div className="mt-4">
                <Opportunities
                    title="Dropped Opportunities"
                    fetchOpportunities={getDroppedOpportunities}
                />
            </div>
        </>
    );
}
