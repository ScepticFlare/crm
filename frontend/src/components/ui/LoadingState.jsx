export default function LoadingState({
    message = "",
    className = "text-center py-5",
    size = null
}) {

    return (

        <div className={className}>

            <div
                className="spinner-border text-primary"
                role="status"
                style={size ? { width: size, height: size } : undefined}
            >
                <span className="visually-hidden">Loading...</span>
            </div>

            {message && (
                <p className="mt-3 text-muted">{message}</p>
            )}

        </div>

    );

}
