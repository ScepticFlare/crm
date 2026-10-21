import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getWorkflowAlerts } from "../services/opportunityService";
import { formatDate } from "../utils/formatDate";

// Non-blocking Dashboard reminders for the Opportunity workflow:
//  - expected closing date has passed (stage is NOT changed automatically)
//  - active opportunity with no upcoming follow-up
//  - postponed opportunity whose review date has arrived (acknowledge /
//    return to In Progress is done on the opportunity's own page)
// Renders nothing when there is nothing to remind about, and fails quietly
// (it is a convenience, never a reason to break the Dashboard).
export default function OpportunityAlerts() {

    const [alerts, setAlerts] = useState(null);

    useEffect(() => {

        let cancelled = false;

        getWorkflowAlerts()
            .then((data) => {
                if (!cancelled) setAlerts(data);
            })
            .catch((err) => console.error(err));

        return () => {
            cancelled = true;
        };

    }, []);

    if (!alerts) {
        return null;
    }

    const sections = [
        {
            key: "postponed",
            count: alerts.postponedReminderCount,
            items: alerts.postponedReminders,
            icon: "bi-alarm",
            variant: "info",
            title: "Postponed opportunities to review",
            hint: "The review date has arrived. Open the opportunity to dismiss the reminder or return it to In Progress.",
            detail: (item) => `review date ${formatDate(item.postponedReviewDate)}`,
        },
        {
            key: "expired",
            count: alerts.expiredClosingDateCount,
            items: alerts.expiredClosingDate,
            icon: "bi-exclamation-triangle-fill",
            variant: "warning",
            title: "Expected closing date has passed",
            hint: "Review with the customer, update the date or stage (WON / LOST / POSTPONED), and schedule a follow-up if needed. Nothing is changed automatically.",
            detail: (item) => `was due ${formatDate(item.expectedClosingDate)}`,
        },
        {
            key: "nofollowup",
            count: alerts.noNextActionCount,
            items: alerts.noNextAction,
            icon: "bi-bell-slash",
            variant: "secondary",
            title: "Active opportunities missing a next action",
            hint: "These cannot be saved as active until a pending follow-up with a next action and a future date exists. Open the opportunity and schedule one (or close / postpone it).",
            detail: (item) => item.stage,
        },
    ].filter((s) => s.count > 0);

    if (sections.length === 0) {
        return null;
    }

    return (

        <div className="mb-4">

            {sections.map((section) => (

                <div key={section.key} className={`alert alert-${section.variant} mb-2`}>

                    <div className="fw-semibold">
                        <i className={`bi ${section.icon} me-2`}></i>
                        {section.title} ({section.count})
                    </div>

                    <div className="small mb-1">{section.hint}</div>

                    <ul className="mb-0 small">

                        {section.items.map((item) => (

                            <li key={item.id}>
                                <Link to={`/opportunities/${item.id}`}>{item.title}</Link>
                                {item.companyName ? ` - ${item.companyName}` : ""}
                                {" "}
                                <span className="text-muted">({section.detail(item)})</span>
                            </li>

                        ))}

                        {section.count > section.items.length && (
                            <li className="text-muted">
                                and {section.count - section.items.length} more
                                {" "}(see the Opportunities list - affected rows are marked with an icon)
                            </li>
                        )}

                    </ul>

                </div>

            ))}

        </div>

    );

}
