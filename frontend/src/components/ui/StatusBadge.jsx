export default function StatusBadge({ status }) {

    function getColor() {

        switch (status) {

            case "NEW":
                return "secondary";

            case "CONTACTED":
                return "primary";

            case "QUOTATION_SENT":
                return "info";

            case "NEGOTIATION":
                return "warning";

            case "POSTPONED":
                return "dark";

            case "WON":
                return "success";

            case "LOST":
                return "danger";

            case "VALID":
                return "success";

            case "INVALID":
                return "danger";

            case "ACTIVE":
                return "success";

            case "INACTIVE":
                return "secondary";

            default:
                return "primary";

        }

    }

    return (

        <span className={`badge bg-${getColor()}`}>

            {status}

        </span>

    );

}