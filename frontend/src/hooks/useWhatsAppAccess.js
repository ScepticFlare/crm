import { useEffect, useState } from "react";

import { getWhatsAppAccessCached } from "../services/bulkWhatsAppService";

// Whether the signed-in user's role grants WHATSAPP_SEND - read from the
// backend's permission model, like useEmailAccess. False until known (and on
// error): it only hides the action; every send is still authorized per record.
// Provider readiness is checked live inside the Bulk WhatsApp dialog.
export default function useWhatsAppAccess() {

    const [canSend, setCanSend] = useState(false);

    useEffect(() => {

        let live = true;

        getWhatsAppAccessCached()
            .then((access) => live && setCanSend(!!access?.canSend))
            .catch(() => live && setCanSend(false));

        return () => {
            live = false;
        };

    }, []);

    return canSend;
}
