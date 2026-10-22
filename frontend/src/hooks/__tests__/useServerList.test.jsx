// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, cleanup, render, renderHook, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";

import useServerList from "../useServerList";
import DetailHeader from "../../components/detail/DetailHeader";
import useListReturn from "../useListReturn";
import RecordLink from "../../components/list/RecordLink";

afterEach(cleanup);

const page = { content: [], totalPages: 1, totalElements: 0 };
const initialSort = { field: "createdDate", dir: "desc" };

function setup(url) {
    const fetchFn = vi.fn().mockResolvedValue(page);
    const wrapper = ({ children }) => <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>;
    const hook = renderHook(() => {
        const list = useServerList({ fetchFn, initialSort });
        return { list, location: useLocation() };
    }, { wrapper });
    return { fetchFn, ...hook };
}

describe("useServerList URL state", () => {

    it("starts from defaults with a bare URL", async () => {
        const { fetchFn } = setup("/leads");
        await waitFor(() => expect(fetchFn).toHaveBeenCalled());
        expect(fetchFn.mock.calls[0][0]).toMatchObject({ page: 0, size: 50, search: "", sort: initialSort, filters: {} });
    });

    it("restores search, filters, sort, page and size from the URL", async () => {
        const filters = encodeURIComponent(JSON.stringify({ city: "Pune" }));
        const { fetchFn } = setup(`/leads?q=acme&filters=${filters}&sort=company:asc&page=3&size=25`);
        await waitFor(() => expect(fetchFn).toHaveBeenCalled());
        expect(fetchFn.mock.calls[0][0]).toMatchObject({
            page: 2, size: 25, search: "acme", sort: { field: "company", dir: "asc" }, filters: { city: "Pune" },
        });
    });

    it("writes filters/page to the URL, resets page on filter change, and clears", async () => {
        const { result } = setup("/leads");
        act(() => result.current.list.setPage(2));
        expect(result.current.location.search).toBe("?page=3");

        act(() => result.current.list.setFilters({ city: "Pune" }));
        expect(result.current.location.search).not.toContain("page=");
        expect(result.current.list.filters).toEqual({ city: "Pune" });

        act(() => result.current.list.clearFilters());
        expect(result.current.location.search).toBe("");
        expect(result.current.list.filters).toEqual({});
    });

    it("keeps an explicitly cleared sort distinct from the default", async () => {
        const { result } = setup("/leads");
        act(() => result.current.list.setSort(null));
        expect(result.current.list.sort).toBeNull();
        expect(result.current.location.search).toBe("?sort=none");
    });
});

describe("list -> detail -> Back", () => {

    it("returns to the exact list URL including query", async () => {
        function List() {
            return <RecordLink to="/leads/7">open</RecordLink>;
        }
        function Detail() {
            return <DetailHeader backTo="/leads" title="Lead 7" />;
        }
        function Where() {
            const l = useLocation();
            return <div data-testid="where">{l.pathname + l.search}</div>;
        }

        render(
            <MemoryRouter initialEntries={["/leads?q=acme&page=2"]}>
                <Where />
                <Routes>
                    <Route path="/leads" element={<List />} />
                    <Route path="/leads/:id" element={<Detail />} />
                </Routes>
            </MemoryRouter>
        );

        act(() => screen.getByText("open").click());
        expect(screen.getByTestId("where").textContent).toBe("/leads/7");

        act(() => screen.getByText("Back").click());
        expect(screen.getByTestId("where").textContent).toBe("/leads?q=acme&page=2");
    });

    it("falls back to backTo when opened without list state", () => {
        render(
            <MemoryRouter initialEntries={["/leads/7"]}>
                <Routes>
                    <Route path="/leads/:id" element={<DetailHeader backTo="/leads" title="x" />} />
                    <Route path="/leads" element={<div>LIST</div>} />
                </Routes>
            </MemoryRouter>
        );
        act(() => screen.getByText("Back").click());
        expect(screen.getByText("LIST")).toBeTruthy();
    });
});

// A list -> detail -> edit -> save/delete flow built from the same pieces the
// real pages use (RecordLink, useListReturn, DetailHeader), with `base` as the
// list path so wrapper pages (/opportunities/in-progress, /inactive...) are
// exercised too.
function flow(listUrl, { openDirect = false } = {}) {

    const base = listUrl.split("?")[0];

    function Detail() {
        const navigate = useNavigate();
        const { returnTo, returnState } = useListReturn("/leads");
        return (
            <>
                <DetailHeader backTo="/leads" title="D" />
                <button onClick={() => navigate("/leads/edit/7", { state: returnState })}>edit</button>
                <button onClick={() => navigate(returnTo)}>delete</button>
            </>
        );
    }
    function Edit() {
        const navigate = useNavigate();
        const { returnTo } = useListReturn("/leads");
        return <button onClick={() => navigate(returnTo)}>save</button>;
    }
    function Where() {
        const l = useLocation();
        return <div data-testid="where">{l.pathname + l.search}</div>;
    }

    render(
        <MemoryRouter initialEntries={[openDirect ? "/leads/7" : listUrl]}>
            <Where />
            <Routes>
                <Route path={base} element={<RecordLink to="/leads/7">open</RecordLink>} />
                <Route path="/leads" element={<RecordLink to="/leads/7">open</RecordLink>} />
                <Route path="/leads/:id" element={<Detail />} />
                <Route path="/leads/edit/:id" element={<Edit />} />
            </Routes>
        </MemoryRouter>
    );

    return () => screen.getByTestId("where").textContent;

}

const click = (label) => act(() => screen.getByText(label).click());

describe("edit / save / delete return to the originating list", () => {

    it.each([
        "/leads?q=acme&page=2&size=25",
        "/opportunities/in-progress?filters=%7B%22city%22%3A%22Pune%22%7D&sort=company:asc",
        "/inactive?page=4",
    ])("edit -> save returns to %s", (url) => {
        const where = flow(url);
        click("open");
        click("edit");
        expect(where()).toBe("/leads/edit/7");
        click("save");
        expect(where()).toBe(url);
    });

    it("detail -> delete returns to the list URL", () => {
        const where = flow("/leads?q=acme&page=2");
        click("open");
        click("delete");
        expect(where()).toBe("/leads?q=acme&page=2");
    });

    it("falls back to the bare list when opened directly (no list state)", () => {
        const where = flow("/leads?q=x", { openDirect: true });
        click("edit");
        click("save");
        expect(where()).toBe("/leads");
    });

    it("history Back/Forward restore list query and the list's own state", () => {
        function Nav() {
            const navigate = useNavigate();
            return (
                <>
                    <button onClick={() => navigate(-1)}>hback</button>
                    <button onClick={() => navigate(1)}>hfwd</button>
                </>
            );
        }
        function Where() {
            const l = useLocation();
            return <div data-testid="where">{l.pathname + l.search}</div>;
        }
        render(
            <MemoryRouter initialEntries={["/leads?q=acme&page=2"]}>
                <Where /><Nav />
                <Routes>
                    <Route path="/leads" element={<RecordLink to="/leads/7">open</RecordLink>} />
                    <Route path="/leads/:id" element={<div>detail</div>} />
                </Routes>
            </MemoryRouter>
        );
        click("open");
        expect(screen.getByTestId("where").textContent).toBe("/leads/7");
        click("hback");
        expect(screen.getByTestId("where").textContent).toBe("/leads?q=acme&page=2");
        click("hfwd");
        expect(screen.getByTestId("where").textContent).toBe("/leads/7");
    });
});

describe("deleting the last row of the last page", () => {

    it("steps back to the last existing page", async () => {
        const fetchFn = vi.fn().mockResolvedValue({ content: [], totalPages: 2, totalElements: 50 });
        const wrapper = ({ children }) => <MemoryRouter initialEntries={["/leads?page=3"]}>{children}</MemoryRouter>;
        const { result } = renderHook(() => ({ list: useServerList({ fetchFn, initialSort }), location: useLocation() }), { wrapper });
        await waitFor(() => expect(result.current.location.search).toBe("?page=2"));
    });
});
