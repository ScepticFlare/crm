import Opportunities from "./Opportunities";
import { getInProgressOpportunities } from "../services/opportunityService";

export default function InProgress() {
    return (
        <Opportunities
            title="In Progress"
            fetchOpportunities={getInProgressOpportunities}
        />
    );
}