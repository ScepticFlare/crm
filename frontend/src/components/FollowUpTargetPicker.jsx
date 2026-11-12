import { useCallback, useRef } from "react";
import AsyncSelect from "react-select/async";

import { getFollowUpTargets } from "../services/followupService";
import { groupTargets, targetDetails, targetKey, targetTitle } from "../utils/followUpRelated";

// Searchable "Related record" picker for a follow-up: unconverted leads and
// opportunities (a converted lead appears as its opportunity, with the lead's
// company), each shown with company, opportunity, stage, contact, owner and id
// so records with the same name can be told apart. The list comes from the
// backend (GET /api/followups/targets), already limited to what the user may
// schedule follow-ups for; saving re-checks it.
function OptionLabel(t) {
    return (
        <div>
            <div>{targetTitle(t)}</div>
            <div className="small text-muted">{targetDetails(t)}</div>
        </div>
    );
}

export default function FollowUpTargetPicker({ value, onChange, inputId, isDisabled = false, debounceMs = 250 }) {

    const timer = useRef(null);

    const loadOptions = useCallback((input) => new Promise((resolve) => {
        clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
            try {
                resolve(groupTargets(await getFollowUpTargets({ search: input })));
            } catch (err) {
                console.error("Failed to load records for the follow-up", err);
                resolve([]);
            }
        }, input ? debounceMs : 0);
    }), [debounceMs]);

    return (
        <AsyncSelect
            inputId={inputId}
            aria-label="Related record"
            cacheOptions
            defaultOptions
            isClearable
            isDisabled={isDisabled}
            loadOptions={loadOptions}
            value={value}
            onChange={(t) => onChange(t || null)}
            getOptionValue={targetKey}
            getOptionLabel={targetTitle}
            formatOptionLabel={OptionLabel}
            placeholder="Search company, contact or opportunity..."
            noOptionsMessage={({ inputValue }) => inputValue ? "No matching lead or opportunity" : "No records available"}
            loadingMessage={() => "Searching..."}
            classNamePrefix="followup-target"
        />
    );
}
