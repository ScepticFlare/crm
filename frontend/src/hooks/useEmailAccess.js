import { useEffect, useState } from "react";

import { getEmailAccess } from "../services/bulkEmailService";

// Whether the signed-in user's role grants EMAIL_SEND (normal and bulk email),
// read from the backend's permission model rather than a hard-coded list of
// role names - so e.g. a Marketing role granted EMAIL_SEND sees the email
// actions, and a role without it does not. False until known (and on error):
// it only hides the buttons; every send is still authorized per record.
export default function useEmailAccess() {

    const [canSend, setCanSend] = useState(false);

    useEffect(() => {

        let live = true;

        getEmailAccess()
            .then((access) => live && setCanSend(!!access?.canSend))
            .catch(() => live && setCanSend(false));

        return () => {
            live = false;
        };

    }, []);

    return canSend;
}
