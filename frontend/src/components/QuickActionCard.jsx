export default function QuickActionCard({

    icon,
    title,
    onClick

}) {

    return (

        <div
            className="card border-0 shadow-sm h-100 hover-lift"
            role="button"
            onClick={onClick}
            style={{
                cursor: "pointer",
                borderRadius: "16px"
            }}
        >

            <div className="card-body text-center py-4">

                <div
                    className="mx-auto mb-3 d-flex justify-content-center align-items-center"
                    style={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        background: "#eff6ff"
                    }}
                >

                    <i
                        className={`bi ${icon}`}
                        style={{
                            fontSize: "1.7rem",
                            color: "#2563eb"
                        }}
                    />

                </div>

                <h6 className="fw-semibold mb-0">

                    {title}

                </h6>

            </div>

        </div>

    );

}