import MasterPage from "./MasterPage";

import {
    getAllLeadSources,
    createLeadSource,
    updateLeadSource,
    deleteLeadSource
} from "../services/leadSourceService";

export default function LeadSources() {

    return (
        <MasterPage
            title="Lead Sources"
            getAll={getAllLeadSources}
            create={createLeadSource}
            update={updateLeadSource}
            remove={deleteLeadSource}
        />
    );

}