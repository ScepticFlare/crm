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
            />

            <div className="mt-4">
                <Opportunities
                    title="Lost Opportunities"
                    fetchOpportunities={getLostOpportunities}
                />
            </div>
        </>
    );
}
