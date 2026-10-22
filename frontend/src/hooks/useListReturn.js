import { useLocation } from "react-router-dom";

// Detail/edit/convert pages are reached from a list page (or a wrapper
// page such as In Progress) that passes its exact URL - filters, search,
// sort, page - as `location.state.from`. This resolves where "done" should
// return to, and the state to hand on when moving to another page in the
// same flow (details -> edit). When the record was opened directly
// (dashboard, pasted URL) there is no `from`, so it falls back to the
// plain list path.
export default function useListReturn(fallback) {

    const location = useLocation();
    const returnTo = location.state?.from || fallback;

    return { returnTo, returnState: { from: returnTo } };

}
