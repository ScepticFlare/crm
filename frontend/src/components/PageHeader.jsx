export default function PageHeader({
    title,
    subtitle,
    buttonText,
    onButtonClick,
}) {
    return (
        <div className="page-header">

            <div>

                <h1 className="page-title">
                    {title}
                </h1>

                <p className="page-subtitle">
                    {subtitle}
                </p>

            </div>

            {buttonText && (
                <button
                    className="btn btn-primary"
                    onClick={onButtonClick}
                >
                    <i className="bi bi-plus-lg me-2"></i>

                    {buttonText}
                </button>
            )}

        </div>
    );
}