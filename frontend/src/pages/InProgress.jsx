import Opportunities from "./Opportunities";
import { getInProgressOpportunities } from "../services/opportunityService";

export default function InProgress() {
    return (
        <Opportunities
            title="In Progress"
            fetchOpportunities={getInProgressOpportunities}
            // The list only shows stages still being worked; without this
            // the export would also contain Won / Lost / Postponed ones.
            exportParams={{ activeOnly: true }}
        />
    );
}