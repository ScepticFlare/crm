import MasterPage from "./MasterPage";

import {
    getAllIndustries,
    createIndustry,
    updateIndustry,
    deleteIndustry
} from "../services/industryService";

export default function Industries() {

    return (
        <MasterPage
            title="Industries"
            getAll={getAllIndustries}
            create={createIndustry}
            update={updateIndustry}
            remove={deleteIndustry}
        />
    );

}