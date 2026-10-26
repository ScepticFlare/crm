import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Leads from "./Leads";
import { getLeadsByCategory, getLeadCategoryCounts } from "../services/leadService";
import { LEAD_CATEGORY_TABS, LEAD_CATEGORY_VALUES } from "../utils/leadCategories";

export default function LeadCategories() {

    const [searchParams, setSearchParams] = useSearchParams();

    const requested = searchParams.get("category");
    const category = LEAD_CATEGORY_VALUES.includes(requested) ? requested : "ALL";

    const [counts, setCounts] = useState(null);
    const [countsError, setCountsError] = useState(null);

    useEffect(() => {

        let cancelled = false;

        getLeadCategoryCounts()
            .then((data) => { if (!cancelled) setCounts(data); })
            .catch((error) => {
                if (!cancelled) {
                    setCountsError(error.response?.status === 403
                        ? "You do not have permission to view lead reports."
                        : "Unable to load the lead counts.");
                }
            });

        return () => { cancelled = true; };

    }, []);

    // A stable fetch function per category (the list hook refetches when it changes).
    const fetchLeads = useMemo(() => getLeadsByCategory(category), [category]);

    const active = LEAD_CATEGORY_TABS.find((t) => t.value === category);

    function selectCategory(value) {
        // A new category starts from a clean list: search, filters, sort and page are dropped.
        setSearchParams(value === "ALL" ? {} : { category: value }, { replace: false });
    }

    return (

        <>

            <div className="row g-3 mb-3">

                {LEAD_CATEGORY_TABS.map((tab) => (

                    <div className="col-md col-6" key={tab.value}>

                        <button
                            type="button"
                            className={`card border-0 shadow-sm w-100 text-start ${category === tab.value ? "border border-primary border-2" : ""}`}
                            style={category === tab.value ? { outline: "2px solid #2563eb" } : undefined}
                            onClick={() => selectCategory(tab.value)}
                            aria-pressed={category === tab.value}
                        >

                            <div className="card-body py-3">

                                <div className="text-muted small">{tab.label}</div>

                                <div className="fs-4 fw-semibold">
                                    {counts ? (counts[tab.countKey] ?? 0) : "-"}
                                </div>

                                <div className="text-muted" style={{ fontSize: ".75rem" }}>{tab.hint}</div>

                            </div>

                        </button>

                    </div>

                ))}

            </div>

            {countsError && (
                <div className="alert alert-warning py-2">{countsError}</div>
            )}

            <Leads
                key={category}
                title={`Lead Categories - ${active.label}`}
                fetchLeads={fetchLeads}
                exportCategory={category}
                showAddLead={false}
                notice={(
                    <div className="alert alert-info py-2">
                        The normal <strong>Leads</strong> page shows only <em>New</em> leads and
                        <em> Valid</em> leads that have not been converted yet. Invalid leads and leads
                        already converted into an opportunity are kept here for reporting and history.
                        Export downloads the category selected above, for the leads you have access to.
                    </div>
                )}
            />

        </>

    );

}
