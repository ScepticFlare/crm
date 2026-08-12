export default function StatCard({

    title,
    value,
    icon,
    color

}) {

    return (

        <div
            className="card border-0 shadow-sm h-100 hover-lift"
            style={{
                borderRadius: "16px"
            }}
        >

            <div className="card-body">

                <div className="d-flex justify-content-between align-items-start">

                    <div>

                        <p
                            className="text-muted mb-2"
                            style={{
                                fontSize: ".9rem",
                                fontWeight: 500
                            }}
                        >

                            {title}

                        </p>

                        <h2
                            className="fw-bold mb-1"
                            style={{
                                fontSize: "2rem"
                            }}
                        >

                            {value}

                        </h2>

                        <small className="text-muted">

                            Total {title}

                        </small>

                    </div>

                    <div
                        className="d-flex justify-content-center align-items-center"
                        style={{
                            width: 60,
                            height: 60,
                            borderRadius: "14px",
                            background: `${color}20`
                        }}
                    >

                        <i
                            className={`bi ${icon}`}
                            style={{
                                fontSize: "1.6rem",
                                color
                            }}
                        />

                    </div>

                </div>

            </div>

        </div>

    );

}