import MasterPage from "./MasterPage";

import {
    getAllLostReasons,
    createLostReason,
    updateLostReason,
    deleteLostReason
} from "../services/lostReasonService";

export default function LostReasons() {

    return (
        <MasterPage
            title="Lost Reasons"
            getAll={getAllLostReasons}
            create={createLostReason}
            update={updateLostReason}
            remove={deleteLostReason}
        />
    );

}