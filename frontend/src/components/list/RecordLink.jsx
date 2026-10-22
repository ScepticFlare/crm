import { Link, useLocation } from "react-router-dom";

// Link from a list row to a record's detail page that remembers the exact
// list URL (filters, search, sort, page) so the detail page's Back button
// can return to it.
export default function RecordLink({ to, children, ...rest }) {

    const location = useLocation();

    return (
        <Link to={to} state={{ from: location.pathname + location.search }} {...rest}>
            {children}
        </Link>
    );

}
