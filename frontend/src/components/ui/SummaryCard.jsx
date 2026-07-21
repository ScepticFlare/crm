export default function SummaryCard({

    title,
    value,
    subtitle

}) {

    return (

        <div className="card border-0 shadow-sm h-100">

            <div className="card-body">

                <small className="text-muted">

                    {title}

                </small>

                <h4 className="fw-bold mt-2 mb-1">

                    {value}

                </h4>

                {subtitle && (

                    <small className="text-muted">

                        {subtitle}

                    </small>

                )}

            </div>

        </div>

    );

}