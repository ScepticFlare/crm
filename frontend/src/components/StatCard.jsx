export default function StatCard({
    title,
    value,
    icon,
    color,
}) {
    return (
        <div className="card h-100">

            <div className="card-body">

                <div className="d-flex justify-content-between align-items-center">

                    <div>

                        <small
                            className="text-uppercase text-muted"
                            style={{
                                letterSpacing: "1px",
                                fontWeight: 600
                            }}
                        >
                            {title}
                        </small>

                        <h1
                            className="fw-bold mt-3 mb-0"
                            style={{ fontSize: "2.2rem" }}
                        >
                            {value}
                        </h1>

                    </div>

                    <div
                        style={{
                            width: "70px",
                            height: "70px",
                            borderRadius: "50%",
                            background: color,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            color: "white",
                            fontSize: "30px"
                        }}
                    >
                        <i className={`bi ${icon}`}></i>
                    </div>

                </div>

            </div>

        </div>
    );
}