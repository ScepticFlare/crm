export default function PipelineWidget({ opportunities = [] }) {

    const stages = {};

    opportunities.forEach((opp) => {
        const stage = opp.salesStage || "UNKNOWN";
        stages[stage] = (stages[stage] || 0) + 1;
    });

    const colors = {
        NEW: "primary",
        QUOTATION_SENT: "info",
        NEGOTIATION: "warning",
        POSTPONED: "secondary",
        WON: "success",
        LOST: "danger"
    };

    return (
        <div className="card dashboard-widget h-100">
            <div className="card-body">

                <h5 className="widget-title">
                    Opportunity Pipeline
                </h5>

                {Object.keys(stages).length === 0 ? (
                    <div className="text-center text-muted py-4">
                        No opportunities
                    </div>
                ) : (
                    Object.entries(stages).map(([stage, count]) => (
                        <div
                            key={stage}
                            className="d-flex justify-content-between align-items-center mb-3"
                        >
                            <span
                                className={`badge bg-${colors[stage] || "dark"} px-3 py-2`}
                            >
                                {stage.replaceAll("_", " ")}
                            </span>

                            <strong>{count}</strong>
                        </div>
                    ))
                )}

            </div>
        </div>
    );
}