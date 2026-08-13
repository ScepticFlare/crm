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
            />

            <div className="mt-4">
                <Opportunities
                    title="Invalid Opportunities"
                    fetchOpportunities={getInvalidOpportunities}
                />
            </div>
        </>
    );
}
