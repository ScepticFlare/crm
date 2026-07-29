import Opportunities from "./Opportunities";
import { getPostponedOpportunities } from "../services/opportunityService";

export default function Postponed() {
    return (
        <Opportunities
            title="Postponed"
            fetchOpportunities={getPostponedOpportunities}
        />
    );
}