import { useEffect, useState } from "react";

import { getEmailTemplates } from "../../services/emailTemplateService";

// Plain <select> of active templates for one type - shared by the
// individual composer (EmailComposerModal) and the bulk composer
// (BulkKeepInTouchModal). Deliberately no "Add Template" affordance here -
// template management lives only in the admin pages/EmailTemplates.jsx page.
export default function TemplateSelect({ type, value, onChange, disabled = false }) {

    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        let cancelled = false;

        setLoading(true);

        getEmailTemplates(type)
            .then((data) => {
                if (!cancelled) {
                    setTemplates(data);
                }
            })
            .catch((err) => {
                console.error(err);
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };

    }, [type]);

    return (

        <select
            className="form-select"
            value={value || ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            disabled={disabled || loading}
        >

            <option value="">No template (write your own)</option>

            {templates.map((template) => (
                <option key={template.id} value={template.id}>
                    {template.name}{template.isDefault ? " (Default)" : ""}
                </option>
            ))}

        </select>

    );

}
