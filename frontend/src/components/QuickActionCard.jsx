export default function QuickActionCard({

    icon,
    title,
    onClick

}) {

    return (

        <div
            className="card border-0 shadow-sm h-100"
            role="button"
            onClick={onClick}
            style={{
                cursor: "pointer",
                borderRadius: "16px",
                transition: ".25s"
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                    "0 12px 24px rgba(0,0,0,.12)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0px)";
                e.currentTarget.style.boxShadow = "";
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